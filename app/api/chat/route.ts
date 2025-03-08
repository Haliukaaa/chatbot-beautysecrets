import OpenAI from "openai";
import { NextResponse } from "next/server";

export const maxDuration = 30;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const ASSISTANT_ID = process.env.ASSISTANT_ID!;

async function waitForRunCompletion(threadId: string, runId: string) {
  let attempts = 20;
  let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);

  while (attempts > 0 && ["queued", "in_progress"].includes(runStatus.status)) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    attempts--;

    if (["failed", "cancelled"].includes(runStatus.status)) {
      throw new Error(`Run ended with status: ${runStatus.status}`);
    }
  }

  if (attempts === 0) {
    throw new Error("Run timed out");
  }

  return runStatus;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, threadId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY || !process.env.ASSISTANT_ID) {
      return NextResponse.json(
        { error: "OpenAI API key or Assistant ID not configured" },
        { status: 500 }
      );
    }

    let thread = null;

    if (threadId) {
      try {
        thread = await openai.beta.threads.retrieve(threadId);
      } catch (error) {
        console.warn(
          "⚠️ Failed to retrieve thread. Creating a new one.",
          error
        );
      }
    }

    if (!thread) {
      thread = await openai.beta.threads.create();
    }

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
      instructions: `Follow the assistant’s profile settings strictly. Always provide structured, well-formatted answers based on provided files and reliable sources. If no information is found, return the default response.`,
    });

    await waitForRunCompletion(thread.id, run.id);

    const messages = await openai.beta.threads.messages.list(thread.id, {
      limit: 1,
      order: "desc",
    });
    const lastMessage = messages.data[0];

    if (!lastMessage || lastMessage.content.length === 0) {
      throw new Error("No response received from Assistant");
    }

    const messageContent = lastMessage.content[0];
    let responseText = "No response";

    if ("text" in messageContent) {
      responseText = messageContent.text.value;
    }

    return NextResponse.json({ message: responseText, threadId: thread.id });
  } catch (error) {
    console.error("🚨 OpenAI API Error:", error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : error,
      },
      { status: 500 }
    );
  }
}
