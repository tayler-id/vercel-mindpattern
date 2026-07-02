# Dirty state snapshot — 2026-07-01 22:31

## rabbit-hole (d0ec665 on feature/rabbit-hole-public-intelligence-site)
 M src/components/wire/wire-row.tsx
?? docs/handoff/
?? docs/specs/2026-06-26-backend-plan-tasks.md
?? docs/specs/2026-06-26-backend-spec.md

diff --git a/src/components/wire/wire-row.tsx b/src/components/wire/wire-row.tsx
index 04ba03c..7e164c7 100644
--- a/src/components/wire/wire-row.tsx
+++ b/src/components/wire/wire-row.tsx
@@ -1,6 +1,6 @@
 import Link from 'next/link'
 import type { Finding } from '@/lib/types'
-import { sectionLabel, leaderFrom } from '@/lib/sections'
+import { sectionLabel, leaderFrom, sourceLabel } from '@/lib/sections'
 import { SourceFavicon } from './source-favicon'
 import { ViaAvatar } from './via-avatar'
 
@@ -31,7 +31,7 @@ export function WireRow({ finding, rank }: { finding: Finding; rank: number }) {
         <div className="mt-[9px] flex flex-wrap items-center gap-x-3 gap-y-1.5 font-mono text-[0.65625rem] text-ink-faint">
           <span className="inline-flex min-w-0 items-center gap-1.5">
             <SourceFavicon url={finding.source_url} name={finding.source_name} />
-            <span className="truncate">{finding.source_name ?? 'web'}</span>
+            <span className="truncate">{sourceLabel(finding.source_name, finding.source_url)}</span>
           </span>
           {leader && <ViaAvatar name={leader.name} avatar={leader.avatar} />}
         </div>

## v3 (7f114ed on feature/rabbit-hole-public-intelligence-site)
 M dashboard/routes/api.py
 M data/ramsay/learnings.md
 M data/ramsay/mindpattern/daily/_index.md
 M data/ramsay/mindpattern/decisions.md
 M data/ramsay/mindpattern/people/_index.md
 M data/ramsay/mindpattern/social/_index.md
 M data/ramsay/mindpattern/soul.md
 M data/ramsay/mindpattern/sources/_index.md
 M data/ramsay/mindpattern/topics/_index.md
 M data/ramsay/mindpattern/user.md
 M data/social-drafts/eic-topic.json
 M orchestrator/site_content.py
 M run-launchd.sh
 M tests/test_launchd_wrapper.py

 dashboard/routes/api.py                   | 102 ++++++++++++++++++++++----
 data/ramsay/learnings.md                  |  51 ++++++-------
 data/ramsay/mindpattern/daily/_index.md   |   7 +-
 data/ramsay/mindpattern/decisions.md      |  88 +++++++++++++++++++++++
 data/ramsay/mindpattern/people/_index.md  |   2 +-
 data/ramsay/mindpattern/social/_index.md  |   2 +-
 data/ramsay/mindpattern/soul.md           |  25 ++++---
 data/ramsay/mindpattern/sources/_index.md |  24 ++++++-
 data/ramsay/mindpattern/topics/_index.md  |   2 +-
 data/ramsay/mindpattern/user.md           |  25 +++----
 data/social-drafts/eic-topic.json         | 114 ++++++++++++++++++------------
 orchestrator/site_content.py              |   4 ++
 run-launchd.sh                            |   7 +-
 tests/test_launchd_wrapper.py             |   9 +++
 14 files changed, 346 insertions(+), 116 deletions(-)
