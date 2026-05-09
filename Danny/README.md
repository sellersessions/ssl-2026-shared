<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/logo-light.svg">
  <img alt="Human in the Loop, Creative Suite" src="assets/logo-dark.svg" width="700">
</picture>

<br/>

![Speaker](https://img.shields.io/badge/Speaker-Danny_McMillan-4A9BD9?style=for-the-badge)
![Tools](https://img.shields.io/badge/3-Tools-6C5CE7?style=for-the-badge)
![Hub](https://img.shields.io/badge/Hub-pipeline--proof-E74C3C?style=for-the-badge)
![Date](https://img.shields.io/badge/Sat_9_May-SSL_2026-00B894?style=for-the-badge)

**Audio and visuals without the slop, for smart entrepreneurs.**
**You're the alchemist. Claude's the engineer.**

> [!NOTE]
> **TL;DR.** Three Claude Code tools, one philosophy. You stay in the seat for every creative call. Claude does the engineering labour you don't want to do. Block C1 = design, Block C2 = video, Block C3 = post.

[![Hub](https://img.shields.io/badge/▶-Pipeline--proof_hub-FBBF24?style=for-the-badge&labelColor=1a1625)](https://pipeline-proof.netlify.app/)
[![Explainers](https://img.shields.io/badge/🎬-Explainer_videos-22d3ee?style=for-the-badge&labelColor=1a1625)](https://pipeline-proof.netlify.app/explainers.html)
[![Walkthroughs](https://img.shields.io/badge/🛠-Walkthroughs-753EF7?style=for-the-badge&labelColor=1a1625)](https://pipeline-proof.netlify.app/walkthroughs.html)

---

## Start here: the pipeline-proof hub

If you've never seen Claude Code before, watch the explainers first. The repos in this folder are the deeper-dive material once you've got the lay of the land.

**Front door for everything in this folder:**

**[pipeline-proof.netlify.app](https://pipeline-proof.netlify.app/)**

---

## Why this exists

The slop problem: anyone can spin up generic AI content. What's rare is taste. What's missing in 90% of AI workflows is the human in the loop, making the creative calls that actually matter.

These three tools split the work where it should split. Humans on judgement, taste, and direction. Claude on transcription, scoring, rendering, and the boring craft. You stay in the seat. Claude does the labour.

The result: audio and visuals that don't look or sound like AI made them.

---

## The Suite at a glance

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'nodeTextColor': '#e8e8e8', 'primaryTextColor': '#e8e8e8', 'secondaryTextColor': '#cccccc', 'tertiaryTextColor': '#cccccc', 'clusterBkg': 'transparent', 'clusterBorder': '#8b949e'}}}%%
graph TD
    YOU["You<br/>the Alchemist"] --> SUITE["Human in the Loop<br/>Creative Suite"]
    SUITE --> C1["Block C1<br/>UI Workflow<br/>(design)"]
    SUITE --> C2["Block C2<br/>Remotion Flow<br/>(video)"]
    SUITE --> C3["Block C3<br/>Video Editing Flow<br/>(post)"]
    C1 --> HUB["pipeline-proof<br/>(the hub)"]
    C2 --> HUB
    C3 --> HUB

    style YOU fill:none,stroke:#4A9BD9,stroke-width:1px,color:#e8e8e8
    style SUITE fill:none,stroke:#6C5CE7,stroke-width:1px,color:#e8e8e8
    style C1 fill:none,stroke:#14B8A6,stroke-width:1px,color:#e8e8e8
    style C2 fill:none,stroke:#8B5CF6,stroke-width:1px,color:#e8e8e8
    style C3 fill:none,stroke:#EC4899,stroke-width:1px,color:#e8e8e8
    style HUB fill:none,stroke:#F59E0B,stroke-width:1px,color:#e8e8e8
```

---

## The three tools

| Block | Folder | What goes in | What comes out | Canonical repo |
|---|---|---|---|---|
| **C1** | `claude-ui-workflow-main/` | A brand URL | A locked Stitch design brief, ready to paste | [sellersessions/claude-ui-workflow](https://github.com/sellersessions/claude-ui-workflow) |
| **C2** | `claude-remotion-flow-main/` | A treatment markdown | A rendered MP4, beat-synced, voice-cloned | [sellersessions/claude-remotion-flow](https://github.com/sellersessions/claude-remotion-flow) |
| **C3** | `claude-video-editing-flow-main/` | A raw `.mp4` | A short-form cut, picked from a tickable terminal table | [sellersessions/claude-video-editing-flow](https://github.com/sellersessions/claude-video-editing-flow) |

Each folder has a `README.md` (full overview) and a `STAGE-CMD.md` (the exact commands run on stage).

---

## Block C1: Claude UI Workflow

Brand brief in, production UI out. 10 stages, 165+ design rules across 15 databases. Working examples in `brands/` (retechuk, databrill).

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'nodeTextColor': '#e8e8e8', 'primaryTextColor': '#e8e8e8', 'clusterBkg': 'transparent', 'clusterBorder': '#8b949e'}}}%%
flowchart LR
    URL["URL"] --> EXTRACT["Extract<br/>brand DNA"]
    EXTRACT --> LOCK["Lock<br/>foundation"]
    LOCK --> BRIEF["Stitch<br/>brief"]
    BRIEF --> UI["Production<br/>UI"]

    style URL fill:none,stroke:#14B8A6,stroke-width:1px,color:#fff
    style EXTRACT fill:none,stroke:#14B8A6,stroke-width:1px,color:#fff
    style LOCK fill:none,stroke:#14B8A6,stroke-width:1px,color:#fff
    style BRIEF fill:none,stroke:#8B5CF6,stroke-width:1px,color:#fff
    style UI fill:none,stroke:#EC4899,stroke-width:1px,color:#fff
```

→ [Open the full README](./claude-ui-workflow-main/README.md)

---

## Block C2: Claude Remotion Flow

Treatment-driven video factory. Write a treatment doc, Claude generates Remotion code, scrub in Studio, render MP4. No timeline. No keyframes. No After Effects.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'nodeTextColor': '#e8e8e8', 'primaryTextColor': '#e8e8e8', 'clusterBkg': 'transparent', 'clusterBorder': '#8b949e'}}}%%
flowchart LR
    TREAT["Treatment<br/>markdown"] --> CODE["Remotion<br/>TSX"]
    CODE --> SCRUB["Studio<br/>scrub"]
    SCRUB --> CODE
    SCRUB --> RENDER["Render<br/>MP4"]

    style TREAT fill:none,stroke:#8B5CF6,stroke-width:1px,color:#fff
    style CODE fill:none,stroke:#8B5CF6,stroke-width:1px,color:#fff
    style SCRUB fill:none,stroke:#4A9BD9,stroke-width:1px,color:#fff
    style RENDER fill:none,stroke:#EC4899,stroke-width:1px,color:#fff
```

→ [Open the full README](./claude-remotion-flow-main/README.md)

---

## Block C3: Claude Video Editing Flow

Drop any video. Claude transcribes, scores and ranks every quotable segment. You tick the candidates. Claude renders. Selection is human, correction is Claude.

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'nodeTextColor': '#e8e8e8', 'primaryTextColor': '#e8e8e8', 'clusterBkg': 'transparent', 'clusterBorder': '#8b949e'}}}%%
flowchart LR
    RAW["Raw<br/>.mp4"] --> SCRIBE["Scribe<br/>transcript"]
    SCRIBE --> SCORE["Claude<br/>scores"]
    SCORE --> PICK["You tick<br/>candidates"]
    PICK --> CUT["Render<br/>short cut"]

    style RAW fill:none,stroke:#EC4899,stroke-width:1px,color:#fff
    style SCRIBE fill:none,stroke:#EC4899,stroke-width:1px,color:#fff
    style SCORE fill:none,stroke:#8B5CF6,stroke-width:1px,color:#fff
    style PICK fill:none,stroke:#4A9BD9,stroke-width:1px,color:#fff
    style CUT fill:none,stroke:#F59E0B,stroke-width:1px,color:#fff
```

→ [Open the full README](./claude-video-editing-flow-main/README.md)

---

## What's NOT in here (and where to get it)

The repos gitignore heavyweight media (mp4, wav, render output) so the download stays fast. To get those:

| You want | Where to get it |
|---|---|
| Walkthrough videos | [pipeline-proof.netlify.app/explainers.html](https://pipeline-proof.netlify.app/explainers.html) |
| Demo media bundles | GitHub Releases on each canonical repo (e.g. video-editing-flow `v0.1-demo`) |
| Remotion source clips | Recoverable via the project's `MANIFEST.json` + scraper scripts |

---

## How to follow along

1. Open the **[pipeline-proof hub](https://pipeline-proof.netlify.app/)** in a browser. Watch the explainers.
2. Pick the tool you want to try first (UI Workflow, Remotion Flow, or Video Editing Flow).
3. Open that folder's `README.md` for the overview, then `STAGE-CMD.md` for the exact demo flow.

## Questions

If something's broken or missing, ping the SSL 2026 attendee channel.
