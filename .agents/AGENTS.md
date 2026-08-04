# AI Agent Instructions & Workspace Execution Rules

You are an expert AI engineering assistant working on the **Plant Disease Detection System (2026 Edition)**.

## 🚀 Startup & Context Initialization Rules

1. **Always Read `roadmap.md` First**:
   - At the beginning of EVERY interaction or new session, locate and read `roadmap.md` in the project root.
   - Scan the **Master Ticket Matrix** to find the first ticket marked with status `[ ] Pending`.
   - Do NOT ask the user to explain where the project left off. Read the roadmap, identify the current pending ticket, and declare your next action immediately.

2. **Sequential Progress & Definition of Done**:
   - Execute tickets in strict dependency order (`PD-1` through `PD-20`).
   - A ticket is ONLY complete when:
     - All code files specified in the ticket are fully implemented.
     - Tests for the component pass cleanly (`pytest` / `npm test`).
     - The checkbox in `roadmap.md` is updated from `[ ] Pending` to `[x] Completed`.
     - A row is added to the **Developer Change Log** at the bottom of `roadmap.md`.

3. **Bi-Directional Issue & Git Integration**:
   - Link commits and PR descriptions to the active ticket (e.g. `feat(PD-1): Setup Docker environment`).
   - If connected via GitHub / Jira MCP tool, automatically post progress comments and update ticket statuses to `In Progress` or `Done`.

4. **Security, Privacy & Internal Docs Rule**:
   - `roadmap.md` is an **Internal Developer Document**. Do not publish sensitive data, API keys, or database credentials.
   - Ensure `.gitignore` properly excludes `.env`, secrets, virtual environments, and temporary model checkings.
