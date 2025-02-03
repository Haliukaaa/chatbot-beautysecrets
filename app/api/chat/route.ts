import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const ASSISTANT_ID = process.env.ASSISTANT_ID!;

/**
 * Waits for the OpenAI Assistant run to complete.
 * Handles timeouts and errors gracefully.
 */
async function waitForRunCompletion(threadId: string, runId: string) {
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
  const startTime = Date.now();

  // Allow up to 9 seconds (leaving 1s buffer for Vercel's 10s timeout)
  while (Date.now() - startTime < 9000 && 
         (runStatus.status === 'queued' || runStatus.status === 'in_progress')) {
    await new Promise(resolve => setTimeout(resolve, 1200)); // Increase delay between checks
    runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);

    if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
      console.error('Run failed:', runStatus.last_error);
      throw new Error(`Run failed: ${runStatus.last_error?.message}`);
    }
  }

  if (runStatus.status !== 'completed') {
    throw new Error(`Run timed out after ${Date.now() - startTime}ms`);
  }

  return runStatus;
}

export async function POST(req: Request) {
  // Validate environment variables
  if (!process.env.OPENAI_API_KEY || !process.env.ASSISTANT_ID) {
    return NextResponse.json(
      { error: 'OpenAI API key or Assistant ID not configured' },
      { status: 500 }
    );
  }

  // Add AbortController for timeout handling
  const timeoutDuration = 9000; // 9 seconds
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

  try {
    // Parse request body
    const { message, threadId } = await req.json();

    // Retrieve or create a thread
    const thread = threadId
      ? await openai.beta.threads.retrieve(threadId, { signal: controller.signal })
      : await openai.beta.threads.create(undefined, { signal: controller.signal });

    // Add user message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message,
    }, { signal: controller.signal });

    // Start a run with the Assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    }, { signal: controller.signal });

    // Wait for the run to complete
    await waitForRunCompletion(thread.id, run.id);

    // Retrieve the latest message from the thread
    const messages = await openai.beta.threads.messages.list(thread.id, {
      limit: 1,
      order: 'desc',
    }, { signal: controller.signal });

    const lastMessage = messages.data[0];

    if (!lastMessage || lastMessage.content.length === 0) {
      throw new Error('No response received from the Assistant');
    }

    // Extract the response text
    const messageContent = lastMessage.content[0];
    let responseText = 'No response';

    if (messageContent.type === 'text') {
      responseText = messageContent.text.value;
    } else {
      console.warn('Non-text response received:', messageContent.type);
    }

    // Return the response
    return NextResponse.json({
      message: responseText,
      threadId: thread.id,
    });
  } catch (error: unknown) {
    // Handle errors
    let errorMessage = 'There was an error processing your request';

    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('OpenAI API error:', error.message, error.stack);
    } else if (typeof error === 'string') {
      errorMessage = error;
      console.error('OpenAI API error:', error);
    } else {
      console.error('Unexpected error type:', error);
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  } finally {
    // Clear the timeout
    clearTimeout(timeoutId);
  }
}