# Goal prompt: Rabbit Hole archive backfill (for helper agents)

Paste everything below the line into a Claude Code session opened in
`~/Projects/mindpattern-v3`. One helper session at a time.

---

/goal Convert the Rabbit Hole story archive to harness-written copy by
running the backfill in safe batches until no targets remain.

Context:
- `orchestrator/site_backfill.py` rewrites newsletter-excerpt stories into
  voice-clean site stories through a writer -> critic -> revision harness
  (rules: `docs/specs/site-writer-rules.md`, voice: data/ramsay/mindpattern/voice.md).
- It is resumable by construction: a story is done iff
  `reports/ramsay/site-stories/{date}/{slug}.json` exists with
  `provenance.writer == "claude-cli"`; finished stories are skipped, so you
  only ever continue. Batch logs append to `~/.cache/rabbit-hole-backfill.log`.
- The writer calls run on the owner's Claude subscription. Quota is shared
  with the daily newsletter pipeline, which always has priority.

Your loop, repeated until done:
1. Preconditions (skip the batch and wait if any fail):
   - `pgrep -f site_backfill` is empty (no batch already running).
   - `/tmp/mindpattern-ran-$(date +%F)` AND `/tmp/mindpattern-synced-$(date +%F)`
     exist (today's newsletter delivered and synced).
   - Local time is after 13:00.
   - `claude -p "reply ok" --max-turns 8 --output-format text` returns "ok".
2. `.venv/bin/python -m orchestrator.site_backfill --dry-run --limit 4000 | head -1`
   -> if "targets: 0", the goal is complete: write a final report and stop.
3. Run one batch (2-4 hours, foreground):
   `MP_SITE_STORY_WRITER=claude .venv/bin/python -m orchestrator.site_backfill --limit 150 --workers 2`
4. Report after every batch: the final outcomes JSON (written/failed/skipped),
   up to 3 sample WARNING lines if there were failures, and the new remaining
   target count.
5. If the run printed ABORTED (usage limit or failure streak): stop for the
   day. Do not retry, do not restart. Resume at the next day's window.
6. At most 2 batches per day, at least 2 hours apart.

Hard rules:
- You are an operator, not a developer. Never edit, write, or delete any file
  in mindpattern-v3 or mindpattern-rabbit-hole. Never git commit or push.
  Never kill or restart processes you did not start. Never run `run.py`,
  never deploy to Fly or Vercel, never touch `reports/ramsay/*.md` or
  anything under `data/`.
- Never raise --workers above 2 or --limit above 150. Never change the model
  unless the owner explicitly gives you a model override
  (`MP_SITE_STORY_WRITER_MODEL=...`).
- `failed:writer` outcomes are normal: the critic refusing unpublishable
  copy. Those stories keep their sourced excerpts and are retried in later
  batches automatically. Do not "fix" them.
- If anything looks structurally wrong (every story failing instantly,
  errors you don't understand), stop and report instead of experimenting.

Definition of done: `--dry-run` reports `targets: 0`. Final report: total
written across your batches, total still failing with sample reasons, and
confirmation you changed no files.
