"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { AgentConfig, AnalysisJob } from "@/lib/types";
import ResultsView from "./ResultsView";

const STORAGE_KEY = "aeo-agent-config";

const DEFAULT_URLS = [
  "https://ghost.org",
  "https://ghost.org/docs/",
  "https://ghost.org/pricing/",
].join("\n");

export default function Dashboard() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [company, setCompany] = useState("Ghost");
  const [urlsText, setUrlsText] = useState(DEFAULT_URLS);
  const [publishGhost, setPublishGhost] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<AnalysisJob | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setConfig(JSON.parse(raw));
      } catch {}
    }
  }, []);

  // Small ticking indicator while the backend processes
  useEffect(() => {
    if (!loading) return;
    const t = setInterval(() => setTick((n) => (n + 1) % 4), 500);
    return () => clearInterval(t);
  }, [loading]);

  async function run() {
    setError(null);
    if (!config?.llmApiKey) {
      setError("Configure your LLM API key in Settings first.");
      return;
    }
    const urls = urlsText
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length === 0) {
      setError("Add at least one URL.");
      return;
    }
    setLoading(true);
    setJob(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-aeo-config": JSON.stringify(config),
        },
        body: JSON.stringify({ company, urls, publishGhost }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Pipeline failed");
      setJob(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const needsConfig = !config?.llmApiKey;
  const hasTinyFish = Boolean(config?.tinyfishApiKey);
  const hasGhost = Boolean(config?.ghostAdminKey && config?.ghostAdminUrl);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Autonomous AEO Agent
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Give a company and a few URLs. The agent crawls via TinyFish,
            synthesizes a company profile, and ships AEO answers, a blog draft,
            a podcast script, and outreach DMs.
          </p>
        </div>
        <div className="flex gap-2 text-xs text-slate-400">
          <Badge on={!needsConfig} label="LLM" />
          <Badge on={hasTinyFish} label="TinyFish" />
          <Badge on={hasGhost} label="Ghost" />
        </div>
      </div>

      {needsConfig && (
        <div className="rounded-md border border-amber-500/40 bg-amber-900/20 p-4 text-sm text-amber-200">
          No LLM key found.{" "}
          <Link className="underline" href="/settings">
            Open Settings
          </Link>{" "}
          and paste your keys.
        </div>
      )}

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_2fr]">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-300">
              Company name
            </span>
            <input
              className="input"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g. Ghost"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-slate-300">
              URLs (one per line)
            </span>
            <textarea
              className="input min-h-[110px] font-mono"
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
            />
          </label>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={publishGhost}
              onChange={(e) => setPublishGhost(e.target.checked)}
              disabled={!hasGhost}
            />
            Publish blog draft to Ghost
            {!hasGhost && (
              <span className="text-xs text-slate-500">(not configured)</span>
            )}
          </label>
          <button
            onClick={run}
            disabled={loading || needsConfig}
            className="ml-auto rounded-md bg-gradient-to-r from-cyan-500 to-indigo-500 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? `Running agent${".".repeat(tick)}` : "Run Agent"}
          </button>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </section>

      {job && <ResultsView job={job} />}
    </div>
  );
}

function Badge({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider ${
        on
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
          : "border-slate-700 bg-slate-800/40 text-slate-500"
      }`}
    >
      {label} {on ? "on" : "off"}
    </span>
  );
}
