import type { AgentConfig, RawPage } from "../types";

export interface FetchOptions {
  renderJs?: boolean;
  waitMs?: number;
}

/**
 * TinyFish is the primary browsing/scraping channel for the agent. When a
 * TinyFish key is configured we hit their dynamic-rendering endpoint. If the
 * call fails (or no key is configured), we degrade gracefully to a plain
 * fetch so the demo still works offline.
 */
export async function fetchWithTinyFish(
  url: string,
  config: AgentConfig,
  opts: FetchOptions = {}
): Promise<RawPage> {
  if (!config.tinyfishApiKey) {
    return fetchWithBuiltInBrowser(url);
  }

  const endpoint =
    (config.tinyfishEndpoint || "https://api.tinyfish.io").replace(/\/$/, "");

  try {
    const res = await fetch(`${endpoint}/v1/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.tinyfishApiKey}`,
      },
      body: JSON.stringify({
        url,
        render_js: opts.renderJs ?? true,
        wait_ms: opts.waitMs ?? 1500,
        format: "html",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`TinyFish ${res.status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      html?: string;
      content?: string;
      body?: string;
      status?: number;
    };

    const html = data.html || data.content || data.body || "";
    return {
      url,
      html,
      status: data.status ?? res.status,
      fetchedBy: "tinyfish",
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(
      `[TinyFish] ${url} failed, falling back: ${(err as Error).message}`
    );
    return fetchWithBuiltInBrowser(url);
  }
}

async function fetchWithBuiltInBrowser(url: string): Promise<RawPage> {
  const res = await fetch(url, {
    redirect: "follow",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (AEO-Agent/1.0 +https://github.com/aeo-agent) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,*/*;q=0.8",
    },
  });
  const html = await res.text();
  return {
    url,
    html,
    status: res.status,
    fetchedBy: "fetch",
    fetchedAt: new Date().toISOString(),
  };
}
