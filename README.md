<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="assets/logo-light.svg">
  <img alt="Seller Sessions Live 2026 - Workshop Materials" src="assets/logo-dark.svg" width="700">
</picture>

<br/>

![Event](https://img.shields.io/badge/Event-Sat_9_May_2026-4A9BD9?style=for-the-badge)
![Speakers](https://img.shields.io/badge/3-Speakers-6C5CE7?style=for-the-badge)
![Format](https://img.shields.io/badge/Format-Take--home_repos-E74C3C?style=for-the-badge)
![Access](https://img.shields.io/badge/No_git-Required-00B894?style=for-the-badge)

**Workshop materials from every SSL 2026 speaker, in one place.**
**Grab what you need after the event. No git knowledge required.**

> [!NOTE]
> **TL;DR.** One folder per speaker. Open the folder, follow the `README.md` inside it. Each speaker brings their own setup steps.

---

## How it's organised

```mermaid
%%{init: {'theme': 'dark', 'themeVariables': {'nodeTextColor': '#e8e8e8', 'primaryTextColor': '#e8e8e8', 'clusterBkg': 'transparent', 'clusterBorder': '#8b949e'}}}%%
graph TD
    REPO["ssl-2026-shared<br/>(this repo)"] --> MATT["Matt/<br/>Matt Kostan"]
    REPO --> SHUB["Shubhash/<br/>Shubhash Sharma"]
    REPO --> DAN["Danny/<br/>Danny McMillan"]
    MATT --> MATT_P["2 projects<br/>Florence + Seller Sessions"]
    SHUB --> SHUB_P["3 projects<br/>Stack / Datacore / Brain"]
    DAN --> DAN_P["3 projects<br/>UI / Remotion / Video Editing"]

    style REPO fill:none,stroke:#6C5CE7,stroke-width:1px,color:#e8e8e8
    style MATT fill:none,stroke:#4A9BD9,stroke-width:1px,color:#e8e8e8
    style SHUB fill:none,stroke:#14B8A6,stroke-width:1px,color:#e8e8e8
    style DAN fill:none,stroke:#EC4899,stroke-width:1px,color:#e8e8e8
    style MATT_P fill:none,stroke:#8b949e,stroke-width:1px,color:#cccccc
    style SHUB_P fill:none,stroke:#8b949e,stroke-width:1px,color:#cccccc
    style DAN_P fill:none,stroke:#8b949e,stroke-width:1px,color:#cccccc
```

---

## The speakers

| Folder | Speaker | Session |
|---|---|---|
| [`Matt/`](./Matt) | Matt Kostan | Florence : AI Chief Data Analyst for Amazon |
| [`Shubhash/`](./Shubhash) | Shubhash Sharma | Architecting the Amazon Operator's Stack |
| [`Danny/`](./Danny) | Danny McMillan | Human in the Loop, Creative Suite |

More speakers will be added here as their materials land.

---

## How to use this

You don't need to be technical, and you don't need git.

1. Click the green **`<> Code`** button at the top of this page.
2. Choose **Download ZIP**.
3. Unzip on your laptop.
4. Open the speaker's folder you care about, and follow the `README.md` inside it. Each speaker has their own setup steps.

If you only want one speaker's material, you can also open their folder here on GitHub and download files individually.

---

## Questions

If something in a speaker's folder doesn't work or is missing, ask in the SSL 2026 attendee channel and we'll route it to the right speaker.
