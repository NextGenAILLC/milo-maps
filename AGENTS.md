# AGENTS.md - instructions for every AI agent working in this repo
(Perplexity Computer, Claude Code, Cursor, Continue, LM Studio agents)

## AI stack
- Local model: LM Studio via the hub at `http://127.0.0.1:4000/v1` (model `auto`, `local`, `pplx/<preset>`).
- Web-grounded answers, current docs, CVEs, release notes: Perplexity (`pplx/low`, `pplx/high`) or the `perplexity` MCP tools.
- GitHub: `github` MCP server or `gh` CLI. Open PRs; never push directly to the default branch.

## Rules
- Never commit secrets. Keys live in user env vars (PERPLEXITY_API_KEY, GITHUB_PAT) or GitHub Actions secrets.
- Conventional Commits (`feat:`, `fix:`, `ci:` ...). The local hook drafts them: `git commit` with no `-m`.
- Before opening a PR: `ai review` and make the build pass locally. If it fails: `<build cmd> 2>&1 | ai build`.
- Keep projects isolated: one repo per product, no cross-repo imports without a published package.
- Deploy target: Vercel unless the repo says otherwise.
