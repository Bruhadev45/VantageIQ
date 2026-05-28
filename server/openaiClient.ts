import OpenAI from "openai";
import type { AgentRunResult, MarketRequest } from "../src/shared/contracts";
import { runDemoStrategyAgents } from "./agents/strategyAgent";

export async function runOpenAIStrategyAgents(request: MarketRequest): Promise<AgentRunResult> {
  if (!process.env.OPENAI_API_KEY) {
    return runDemoStrategyAgents(request);
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const demo = await runDemoStrategyAgents(request);

  try {
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5",
      input: [
        {
          role: "system",
          content:
            "You are a senior AI business analyst. Produce concise, board-ready competitive intelligence using the supplied agent findings. Return practical sales, marketing, growth, and customer success actions.",
        },
        {
          role: "user",
          content: JSON.stringify({ request, baselineAgentFindings: demo }, null, 2),
        },
      ],
    });

    return {
      ...demo,
      mode: "live-openai",
      executiveSummary: response.output_text || demo.executiveSummary,
    };
  } catch (error) {
    console.error("OpenAI strategy generation failed; falling back to demo agents.", error);
    return demo;
  }
}
