#!/usr/bin/env node
// CI helper used by the hub workflows. Zero deps, Node 18+.
// Uses local LM Studio when HUB_LOCAL_URL is reachable (self-hosted runner on your PC),
// otherwise Perplexity Agent API (GitHub-hosted runners).
//   node hub-ai.mjs review <diff-file>   > comment.md
//   node hub-ai.mjs build  <log-file>    > comment.md
import { readFileSync } from "node:fs";

const [mode, file] = process.argv.slice(2);
const input = readFileSync(file, "utf8");
const clip = (s, n) => (s.length > n ? s.slice(0, n) + `\n...[truncated ${s.length - n} chars]` : s);

const SYS = {
  review: "You are a senior code reviewer. Review this PR diff for bugs, security issues (leaked secrets, injection, authz), breaking changes, performance and missing tests. Markdown: '### Summary', '### Issues' (severity high|med|low, file, problem, fix), '### Suggestions'. Be concise; skip trivia. Flag anything resembling an API key as HIGH.",
  build: "You are a CI failure analyst. From these logs: identify the root cause, the failing step, and a concrete fix (commands/code). If the failure relates to a recent dependency/tool change, say so and cite sources.",
};
const user = mode === "build" ? `CI log tail:\n${clip(input.split("\n").slice(-500).join("\n"), 60000)}` : `Diff:\n${clip(input, 80000)}`;

async function local() {
  const base = process.env.HUB_LOCAL_URL;
  if (!base) return null;
  try {
    const r = await fetch(`${base}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.HUB_LOCAL_MODEL || "auto", temperature: 0.2, messages: [{ role: "system", content: SYS[mode] }, { role: "user", content: user }] }),
      signal: AbortSignal.timeout(600000),
    });
    if (!r.ok) return null;
    const j = await r.json();
    return { text: j.choices[0].message.content, via: `local (${j.model})`, citations: j.citations || [] };
  } catch { return null; }
}

async function perplexity() {
  const key = process.env.PERPLEXITY_API_KEY;
  if (!key) throw new Error("No reachable HUB_LOCAL_URL and PERPLEXITY_API_KEY secret is missing.");
  const r = await fetch("https://api.perplexity.ai/v1/agent", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ preset: process.env.HUB_PPLX_PRESET || "low", instructions: SYS[mode], input: user }),
  });
  if (!r.ok) throw new Error(`Perplexity ${r.status}: ${await r.text()}`);
  const j = await r.json();
  let text = j.output_text || "";
  const cites = new Set();
  for (const o of j.output || []) for (const c of o.content || []) {
    if (!j.output_text && c.text) text += c.text;
    for (const a of c.annotations || []) if (a.url) cites.add(a.url);
  }
  return { text, via: `Perplexity (${j.model || "preset"})`, citations: [...cites] };
}

let out = await local();
if (!out && !process.env.PERPLEXITY_API_KEY) {
  // Not configured yet: don't fail the build, just warn.
  console.error("::warning::Hub AI skipped - add the PERPLEXITY_API_KEY repo secret (or set HUB_LOCAL_URL for a self-hosted runner).");
  process.exit(0);
}
out = out || (await perplexity());
const title = mode === "build" ? "AI Build Doctor" : "AI Code Review";
let md = `## ${title}\n\n${out.text}\n`;
if (out.citations.length) md += `\n**Sources**\n${out.citations.map((u, i) => `${i + 1}. ${u}`).join("\n")}\n`;
md += `\n<sub>via ${out.via} - LM Studio + Perplexity Hub</sub>\n`;
process.stdout.write(md);
