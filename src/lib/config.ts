import type { AgentConfig } from "./types";

/**
 * Settings flow:
 *   1. User saves config via /settings page → localStorage
 *   2. Client attaches `x-aeo-config: <json>` header to each API call
 *   3. This helper merges that header with server-side env fallbacks
 */
export function readConfigFromHeaders(headers: Headers): AgentConfig {
  const fallback = fromEnv();
  const raw = headers.get("x-aeo-config");
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<AgentConfig>;
    return { ...fallback, ...stripEmpty(parsed) };
  } catch {
    return fallback;
  }
}

export function fromEnv(): AgentConfig {
  return {
    llmProvider: (process.env.LLM_PROVIDER as "openai" | "anthropic") || "openai",
    llmApiKey: process.env.LLM_API_KEY || "",
    llmModel: process.env.LLM_MODEL || "gpt-4o-mini",
    tinyfishApiKey: process.env.TINYFISH_API_KEY || "",
    tinyfishEndpoint:
      process.env.TINYFISH_ENDPOINT || "https://api.fetch.tinyfish.ai",
    tinyfishAgentEndpoint:
      process.env.TINYFISH_AGENT_ENDPOINT ||
      "https://agent.tinyfish.ai/v1/automation",
    wundergraphEndpoint: process.env.WUNDERGRAPH_ENDPOINT || "/api",
    ghostAdminUrl: process.env.GHOST_ADMIN_URL || "",
    ghostAdminKey: process.env.GHOST_ADMIN_KEY || "",
    substackPublicationUrl: process.env.SUBSTACK_PUBLICATION_URL || "",
    substackEmail: process.env.SUBSTACK_EMAIL || "",
    substackPassword: process.env.SUBSTACK_PASSWORD || "",
    substackPublishMode:
      (process.env.SUBSTACK_PUBLISH_MODE as "draft" | "publish") || "draft",
    substackSendEmail: process.env.SUBSTACK_SEND_EMAIL === "true",
    substackAudience:
      (process.env.SUBSTACK_AUDIENCE as
        | "everyone"
        | "free"
        | "paid"
        | "founding") || "everyone",
    databaseUrl: process.env.DATABASE_URL || "",
  };
}

function stripEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string" && v.trim() === "") continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}
