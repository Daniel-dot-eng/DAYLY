# START HERE (Codex)

This is your run sheet. Read AGENTS.md first, then this file, then docs/STATE.md.

## How you work

You build MVP-0 in batches. A batch is a run of tasks you complete without waiting for the PM. You stop at the end of each batch (a checkpoint) or earlier if you hit a blocker.

| Batch | Tasks | Checkpoint |
|---|---|---|
| A (Day 1) | K0, M1-01, M1-02, M1-03, M1-04, M1-05 | C1: demo steps 1 to 3 work locally, leak script passes, deploy workflow exists |
| B (Day 2) | M2-01, M2-02, M2-03, M2-04, M2-05 | C2: full demo script works locally, backups and hardening done, PR ready to merge |

Task details and acceptance criteria are in docs/CODEX_PROMPTS.md.

## K0 (first thing, no code)

1. Read every document listed in AGENTS.md.
2. Commit locally on `mvp0` and never push. Lack of push access is expected and is not a blocker; the PM pushes with GitHub Desktop and opens the pull request at each checkpoint.
3. Write a short plan and your assumptions into the "Build plan" section of docs/STATE.md. Add any contradictions or gaps you found to docs/QUESTIONS.md with a default assumption.
4. Continue straight into M1-01 unless a gap makes the work impossible.

## Rules for running a batch

- Create branch `mvp0` from `main` if it does not exist.
- After each task: run the checks from AGENTS.md, commit locally on `mvp0` with the task ID and update docs/STATE.md (status, date, notes, deviations). Never push; lack of push access is expected and is not a blocker.
- If a task is blocked, mark it Blocked in STATE.md with the reason, skip to the next task that does not depend on it, and say so in the report.
- If you are behind, apply the cut rules: drop dropdown detail fields (text only) on Day 1, drop the submissions filters on Day 2. Never expand scope to catch up.
- At each checkpoint: prepare the pull request title "MVP-0 checkpoint C1" or "C2" and report for the PM to paste, update STATE.md, then stop and wait for the PM to say "continue". The PM pushes with GitHub Desktop and opens or updates the pull request into `main`.

## The messages the PM will send you

1. First message (starts Batch A): the text under "Start message" below.
2. After the PM reviews C1: "Continue with Batch B."
3. Any time: "Status" means reply with the STATE.md summary only.

## Start message (the PM pastes this once)

```
You are the builder for DAYLY. Read AGENTS.md, then docs/START_HERE.md, and follow it exactly. Start Batch A on branch mvp0 and stop at checkpoint C1 with the report.
```
