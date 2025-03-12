import OpenAI from "openai";
import { NextResponse } from "next/server";
import { waitForRunCompletion } from "./wait-for-run-completion";

export const maxDuration = 120;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const ASSISTANT_ID = process.env.ASSISTANT_ID!;

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch (parseError) {
    console.error("JSON parsing error:", parseError);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!process.env.OPENAI_API_KEY || !process.env.ASSISTANT_ID) {
    return NextResponse.json(
      { error: "OpenAI API key or Assistant ID not configured" },
      { status: 500 }
    );
  }

  try {
    const { message, threadId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    let thread;
    try {
      thread = threadId
        ? await openai.beta.threads.retrieve(threadId).catch(() => null)
        : null;
    } catch (retrieveError) {
      console.error("Thread retrieval error:", retrieveError);
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
    });

    await waitForRunCompletion(thread.id, run.id);

    const messages = await openai.beta.threads.messages.list(thread.id, {
      limit: 1,
      order: "desc",
    });
    const lastMessage = messages.data[0];

    if (!lastMessage || lastMessage.content.length === 0) {
      throw new Error("No response received");
    }

    const messageContent = lastMessage.content[0];
    let responseText = "No response";

    if ("text" in messageContent) {
      responseText = messageContent.text.value;
    }

    return NextResponse.json({ message: responseText, threadId: thread.id });
  } catch (error) {
    console.error("Full OpenAI API error:", error);
    return NextResponse.json(
      { error: "There was an error processing your request" },
      { status: 500 }
    );
  }
}
