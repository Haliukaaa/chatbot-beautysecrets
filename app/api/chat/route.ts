import OpenAI from 'openai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const ASSISTANT_ID = process.env.ASSISTANT_ID!;

async function waitForRunCompletion(threadId: string, runId: string) {
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
  let attempts = 300;
  
  while (attempts > 0 && (runStatus.status === 'queued' || runStatus.status === 'in_progress')) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    attempts--;

    if (runStatus.status === 'failed' || runStatus.status === 'cancelled') {
      throw new Error(`Run ended with status: ${runStatus.status}`);
    }
  }

  if (attempts === 0) {
    throw new Error('Run timed out');
  }

  return runStatus;
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY || !process.env.ASSISTANT_ID) {
    return NextResponse.json(
      { error: 'OpenAI API key or Assistant ID not configured' },
      { status: 500 }
    );
  }

  try {
    const { message, threadId } = await req.json();

    const thread = threadId 
      ? await openai.beta.threads.retrieve(threadId)
      : await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: message,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    await waitForRunCompletion(thread.id, run.id);

    const messages = await openai.beta.threads.messages.list(thread.id, {
      limit: 1,
      order: 'desc',
    });

    const lastMessage = messages.data[0];
    
    if (!lastMessage || lastMessage.content.length === 0) {
      throw new Error('No response received');
    }

    const messageContent = lastMessage.content[0];
    let responseText = 'No response';

    if (messageContent.type === 'text') {
      responseText = messageContent.text.value;
    }

    return NextResponse.json({ 
      message: responseText,
      threadId: thread.id
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'There was an error processing your request' },
      { status: 500 }
    );
  }
}