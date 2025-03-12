import OpenAI from "openai";
import { searchProducts } from "./search-products";
import { beautyboxProducts } from "./beautybox-products";

export async function waitForRunCompletion(threadId: string, runId: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  let runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
  let attempts = 40;

  while (attempts > 0) {
    console.log("Run status:", runStatus.status);

    if (runStatus.status === "requires_action") {
      console.log("Function calling required");
      const requiredAction = runStatus.required_action;

      if (requiredAction && requiredAction.type === "submit_tool_outputs") {
        const toolCalls = requiredAction.submit_tool_outputs.tool_calls;
        console.log("Tool calls received:", toolCalls.length);

        const toolOutputs = await Promise.all(
          toolCalls.map(async (toolCall) => {
            const function_name = toolCall.function.name;
            const function_args = JSON.parse(toolCall.function.arguments);

            console.log(
              `Executing function: ${function_name} with args:`,
              function_args
            );

            let function_response;

            if (function_name === "search_products") {
              function_response = await searchProducts(
                function_args.query,
                function_args.limit || 10
              );
            } else if (function_name === "get_beautybox_products") {
              function_response = await beautyboxProducts();
            } else {
              function_response = {
                error: `Unknown function: ${function_name}`,
              };
            }

            console.log(`Function response received for ${function_name}`);

            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify(function_response),
            };
          })
        );

        console.log("Submitting tool outputs back to OpenAI");
        runStatus = await openai.beta.threads.runs.submitToolOutputs(
          threadId,
          runId,
          { tool_outputs: toolOutputs }
        );

        await new Promise((resolve) => setTimeout(resolve, 1500));
        runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
        continue;
      }
    }

    if (runStatus.status === "completed") {
      console.log("Run completed successfully");
      break;
    }

    if (
      runStatus.status === "failed" ||
      runStatus.status === "cancelled" ||
      runStatus.status === "expired"
    ) {
      console.error(`Run ended with status: ${runStatus.status}`);
      throw new Error(`Run ended with status: ${runStatus.status}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
    runStatus = await openai.beta.threads.runs.retrieve(threadId, runId);
    attempts--;
  }

  if (attempts === 0) {
    console.error("Run timed out");
    throw new Error("Run timed out");
  }

  return runStatus;
}