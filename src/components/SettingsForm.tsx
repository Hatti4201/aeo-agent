"use client";
import { useEffect, useState } from "react";
import type { AgentConfig } from "@/lib/types";

const STORAGE_KEY = "aeo-agent-config";

const DEFAULT: AgentConfig = {
  llmProvider: "openai",
  llmApiKey: "",
  llmModel: "gpt-4o-mini",
  tinyfishApiKey: "",
  tinyfishEndpoint: "https://api.tinyfish.io",
  wundergraphEndpoint: "http://localhost:3000/api",
  ghostAdminUrl: "",
  ghostAdminKey: "",
  databaseUrl: "",
};

export default function SettingsForm() {
  const [cfg, setCfg] = useState<AgentConfig>(DEFAULT);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [validation, setValidation] = useState<{ level: "ok" | "warn" | "err"; msg: string }[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setCfg({ ...DEFAULT, ...JSON.parse(raw) });
      } catch {}
    }
  }, []);

  function update<K extends keyof AgentConfig>(key: K, value: AgentConfig[K]) {
    setCfg((c) => ({ ...c, [key]: value }));
  }

  function validate(c: AgentConfig) {
    const out: { level: "ok" | "warn" | "err"; msg: string }[] = [];
    if (!c.llmApiKey) out.push({ level: "err", msg: "LLM API key is required." });
    if (!c.llmModel) out.push({ level: "err", msg: "LLM model is required." });
    if (!c.tinyfishApiKey)
      out.push({
        level: "warn",
        msg: "TinyFish API key missing — the agent will fall back to the built-in fetcher for the demo.",
      });
    if (c.ghostAdminKey && !c.ghostAdminKey.includes(":"))
      out.push({ level: "err", msg: "Ghost Admin Key must be in id:secret form." });
    if (c.llmApiKey && c.tinyfishApiKey && out.every((v) => v.level !== "err"))
      out.push({ level: "ok", msg: "Ready to run." });
    return out;
  }

  function save() {
    setValidation(validate(cfg));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    setSavedAt(new Date().toLocaleTimeString());
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    setCfg(DEFAULT);
    setSavedAt(null);
    setValidation([]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          All keys stay in your browser (localStorage). They're attached to each
          pipeline run as a request header and never persisted server-side.
        </p>
      </div>

      <Section title="LLM">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Provider">
            <select
              className="input"
              value={cfg.llmProvider}
              onChange={(e) =>
                update("llmProvider", e.target.value as AgentConfig["llmProvider"])
              }
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </Field>
          <Field label="Model" hint="e.g. gpt-4o-mini, claude-sonnet-4-5">
            <input
              className="input"
              value={cfg.llmModel}
              onChange={(e) => update("llmModel", e.target.value)}
            />
          </Field>
          <Field label="API key" hint="Required">
            <input
              className="input"
              type="password"
              placeholder="sk-..."
              value={cfg.llmApiKey}
              onChange={(e) => update("llmApiKey", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="TinyFish" badge="required">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="API key">
            <input
              className="input"
              type="password"
              value={cfg.tinyfishApiKey || ""}
              onChange={(e) => update("tinyfishApiKey", e.target.value)}
            />
          </Field>
          <Field label="Endpoint" hint="Default https://api.tinyfish.io">
            <input
              className="input"
              value={cfg.tinyfishEndpoint || ""}
              onChange={(e) => update("tinyfishEndpoint", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="WunderGraph" badge="required">
        <Field label="Endpoint" hint="Base URL for the orchestration layer">
          <input
            className="input"
            value={cfg.wundergraphEndpoint || ""}
            onChange={(e) => update("wundergraphEndpoint", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Ghost" badge="optional">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Admin URL">
            <input
              className="input"
              placeholder="https://yoursite.ghost.io"
              value={cfg.ghostAdminUrl || ""}
              onChange={(e) => update("ghostAdminUrl", e.target.value)}
            />
          </Field>
          <Field label="Admin API key" hint="Format id:secret">
            <input
              className="input"
              type="password"
              value={cfg.ghostAdminKey || ""}
              onChange={(e) => update("ghostAdminKey", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="Database" badge="optional">
        <Field label="DATABASE_URL" hint="Leave empty to use the in-memory job store">
          <input
            className="input"
            value={cfg.databaseUrl || ""}
            onChange={(e) => update("databaseUrl", e.target.value)}
          />
        </Field>
      </Section>

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
        >
          Save settings
        </button>
        <button
          onClick={clear}
          className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Clear
        </button>
        {savedAt && (
          <span className="text-xs text-emerald-400">Saved at {savedAt}</span>
        )}
      </div>

      {validation.length > 0 && (
        <ul className="space-y-1 rounded-md border border-slate-800 bg-slate-900/60 p-4 text-sm">
          {validation.map((v, i) => (
            <li
              key={i}
              className={
                v.level === "err"
                  ? "text-red-300"
                  : v.level === "warn"
                  ? "text-amber-300"
                  : "text-emerald-300"
              }
            >
              • {v.msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          {title}
        </h2>
        {badge && (
          <span className="rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-300">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs text-slate-500">{hint}</span>
      )}
    </label>
  );
}
