import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY || !process.env.ASSISTANT_ID) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const { message, threadId } = await req.json();

    const thread = threadId 
      ? await openai.beta.threads.retrieve(threadId)
      : await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message
    });
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: process.env.ASSISTANT_ID
    });

    let runStatus;
    do {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    } while (runStatus.status === 'queued' || runStatus.status === 'in_progress');

    const messages = await openai.beta.threads.messages.list(thread.id, {
      limit: 1,
      order: 'desc'
    });

    return NextResponse.json({
      message: messages.data[0]?.content[0]?.text?.value || "No response",
      threadId: thread.id
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
    console.error(error);
  }
}