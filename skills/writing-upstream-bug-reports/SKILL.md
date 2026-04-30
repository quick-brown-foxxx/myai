---
name: writing-upstream-bug-reports
description: Use when investigating a software bug in third-party libraries, systems, packages and so on; linux/system/environment issue, crashes, or regressions and need to produce a structured bug report ready for submission for maintainers into issue trackers
---

# Writing Bug Reports

## Overview

A bug report is a **self-contained folder** with a structured issue description, submission instructions, and supporting evidence — ready to paste into any tracker. Lead with symptoms, prove with evidence, make it easy to triage.

## When to Use

- User encounters a bug, regression, crash, or unexpected behavior
- User asks to "prepare a bug report", "file an issue", or "document this bug"
- System investigation reveals a reportable defect

**Not for:** 
- internal TODOs
- feature requests
- or project-specific issues that are tracked in team-level internal trackers
- known limitations that do not require submiting a bug report to upstream

## Deliverable: Folder Structure

```
bug-report-name/
  ISSUE.md                    # Main report — paste into tracker
  SUBMISSION-INSTRUCTIONS.md  # Where & how to file
  attachments/                # Logs, configs, screenshots, raw data
  README.md                   # (optional) Overview for complex multi-file reports
```

## ISSUE.md Sections

### 1. Title (as H1)
Concise, symptom-focused, grep-friendly. State what breaks, not your theory.
- Good: `Waydroid container gets IP but no default route`
- Bad: `Network broken` or `Possible dnsmasq misconfiguration`

### 2. Component
```markdown
- Project: <upstream project name>
- Package: <distro package name>
- Distro: <OS and variant>
```

### 3. Summary
2-3 sentences: what happens, what should happen, the key insight. **Bold the critical finding.** This is what a triager reads to decide priority.

### 4. Environment
OS, versions, hardware. Keep brief — reference `attachments/` for full details.

### 5. Steps to Reproduce
Numbered list. Concrete commands, not vague descriptions.
```markdown
1. Install X from Y repositories
2. Run `exact-command --with-flags`
3. Observe output of `diagnostic-command`
```

### 6. Expected Result
Bullet list of what should happen.

### 7. Actual Result
Bullet list with **exact output** inline (code blocks). Bold the anomaly. Show both host-side and component-side state when relevant.

If a manual fix confirms the root cause, show it:
```markdown
If I manually run `fix-command`, then it works. This confirms [specific conclusion].
```

### 8. Workarounds
Numbered, with full code blocks. Label each as "manual each boot" vs "persistent" vs "partial fix". Make clear these are workarounds, not solutions.

### 9. Root Cause Analysis (if investigation was done)
State what IS the cause (with evidence) and what ISN'T (ruling out alternatives):
```markdown
This appears to be [X], rather than:
- A firewall issue (waydroid0 is in trusted zone)
- A VPN issue (reproduces with VPN disabled)
```

### 10. Logs and Attachments
List every file in `attachments/` with a one-line description.

### 11. Questions for Maintainers (optional)
Specific, actionable questions — not "why is this broken?" but "Should dnsmasq be configured to provide router option, or should Android-side logic add the default route?"

### 12. Related Issues (optional)
Comparison table when similar bugs exist:
```markdown
| Previous Bug | This Bug |
|---|---|
| Gets IP, missing route | Gets no IP at all |
| Fix: add route | Fix: add IP and route |
```

## SUBMISSION-INSTRUCTIONS.md Sections

### 1. Where to File
List upstream (GitHub/GitLab) and downstream (distro Bugzilla) with direct URLs. Recommend filing upstream first.

### 2. Filing Steps per Tracker
Step-by-step for each: what to paste, what to attach, suggested title, which fields to fill.

### 3. What to Attach
Minimum set of files and the full set. Prioritize: config, main log, reproduction evidence.

### 4. How to Regenerate Attachments
Shell commands to re-collect all evidence. User should be able to copy-paste the whole block to refresh stale logs.

### 5. Follow-up Guidance
What to monitor after filing: developer questions, patch testing requests, upstream vs downstream responsibility.

## Evidence Collection

Collect raw output files, not paraphrased summaries. Common categories:

| Category | Examples |
|---|---|
| **Service logs** | `journalctl -b -u service.service`, application logs |
| **System logs** | `dmesg`, `journalctl -b -p err` |
| **Config files** | App configs, systemd units, runtime properties |
| **System state** | `ip addr`, `ip route`, `nft list ruleset`, `free -h` |
| **Hardware info** | `lscpu`, `smartctl`, `uname -a` |
| **Application output** | `logcat`, debug output, crash traces |

**Rules:**
- Gather evidence **during reproduction**, not after reboot
- Timestamp file names when multiple snapshots exist
- Prefer full output redirected to file over cherry-picked snippets
- Include the commands used to generate each file (in SUBMISSION-INSTRUCTIONS.md)

## Writing Style

- **Lead with symptoms**, not theories — let maintainers draw conclusions
- **Exact commands, exact output** — copy-paste, never paraphrase
- **Bold the key anomaly** in Summary and Actual Result
- **Self-contained ISSUE.md** — readable without opening attachments
- **Comparison tables** when distinguishing from similar bugs
- Write for a maintainer who has 30 seconds to triage

## Common Mistakes

| Mistake | Fix |
|---|---|
| Burying the symptom in paragraph 5 | Put it in Summary, first sentence |
| "It doesn't work" | Specify expected vs actual with exact output |
| Missing repro steps | Numbered commands someone else can run |
| Attaching logs without referencing them | List each file in ISSUE.md with description |
| Mixing upstream and downstream concerns | Separate trackers, link between them |
| Theorizing without evidence | State observations, mark theories as "appears to be" |
| Omitting environment details | Always include OS, package version, hardware |
