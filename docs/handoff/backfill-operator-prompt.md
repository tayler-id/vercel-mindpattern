# Operator prompt: Rabbit Hole archive backfill

Paste everything below into a Claude Code session in
`~/Projects/mindpattern-v3` to run one backfill batch.

---

Run one batch of the Rabbit Hole story backfill and report results. Context:
`orchestrator/site_backfill.py` rewrites archived newsletter-excerpt stories
into voice-clean site stories through a writer -> critic -> revision harness
(rules in `docs/specs/site-writer-rules.md`). It is resumable: finished
stories are skipped automatically, so you only ever continue.

Steps:
1. Preconditions, in order. Skip the run and say why if any fail:
   - `ls /tmp/mindpattern-ran-$(date +%F)` exists (today's newsletter delivered)
   - `ls /tmp/mindpattern-synced-$(date +%F)` exists (today's Fly sync done)
   - It is after 13:00 local time.
   - `claude -p "reply ok" --max-turns 8 --output-format text` returns "ok"
     (quota available).
2. Check remaining work:
   `.venv/bin/python -m orchestrator.site_backfill --dry-run --limit 4000 | head -1`
3. Run the batch (foreground, takes ~2-4 hours):
   `MP_SITE_STORY_WRITER=claude .venv/bin/python -m orchestrator.site_backfill --limit 150 --workers 2`
4. Report: the final outcomes JSON line (written/failed/skipped), plus the
   first 3 WARNING lines if any failures, plus remaining target count from
   another --dry-run.

Hard rules:
- Never raise --workers above 2 or --limit above 150.
- If the run prints ABORTED (usage limit or failure streak), stop for the
  day. Do NOT retry or restart. Report the abort reason.
- Never run the newsletter pipeline (`run.py`), never deploy, never touch
  `reports/ramsay/*.md`, never commit.
- failed:writer outcomes are normal (the critic refusing unpublishable
  copy); they stay as sourced excerpts and get retried in later batches.

Done-tracking (source of truth): a story is finished iff
`reports/ramsay/site-stories/{date}/{slug}.json` exists with
`provenance.writer == "claude-cli"`. The dry-run target count is the live
remaining-work number. The batch log appends to
`~/.cache/rabbit-hole-backfill.log`.
