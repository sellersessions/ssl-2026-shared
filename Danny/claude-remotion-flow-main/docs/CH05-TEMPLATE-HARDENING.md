# Template Hardening — Path to a One-Shot Chapter Pipeline

> Briefing for Session 16 (post ch03 polish). Pulls together every friction, misdiagnosis, and rough edge from Sessions 7–15 and proposes the gates we need before WorkshopIntroCh05 ships.
>
> Goal: get `WorkshopIntroCh05` to **95% lights-out** in a single end-to-end run. Editor's job becomes one watch-through to nudge any rounding errors — not a rebuild.

---

## 1. Failings catalogue (ch01–ch03 + StackExplainer + TreatmentExplainer)

Ranked by time-cost / risk-on-rerun.

| #  | Friction | Where it bit | Cost / status |
|----|----------|--------------|---------------|
| 1  | **Music ducking caused most audio bugs.** `void musicDuck;` in factory, prop kept "for API parity" — gain changes silently no-op. | S12–S15. | Decommissioned. Prop is still a liar — sets you up to think ducking is happening. **Kill the prop.** |
| 2  | **Live mixer took 3 sessions to "work."** zod schema → InputDragger reality → `multipleOf` → VO-length cache → step 0.05. | S12, S13. | ~6h total on slider UX. Perplexity gave wrong intel mid-S13. |
| 3  | **Studio preview ≠ MP4 render.** Studio sums >1.0 with 3 sources; final-render limiter handles peaks differently. | S15. | Hours chased clicks that almost certainly wouldn't survive a render. |
| 4  | **Source MP4 had embedded audio bleeding through `<OffthreadVideo muted>`.** | S15. | `muted` prop doesn't strip — needs `ffmpeg -an`. Hidden bug, found by zooming Studio waveform. |
| 5  | **ElevenLabs swallows leading `<break>` tag** → no lead-in card / scene-1 starts at 0.000s. | S14. | Still unresolved on ch03. Decision pending: ship without first card vs `BREAK_LEAD_SEC=1.5` re-render (~1k credits). |
| 6  | **Per-scene TTS produced different "rooms" between scenes.** | Pre-S14. | Fixed by single-stem chapter mode (`generate-vo.ts --mode chapter`). |
| 7  | **Visual timeline drifted from audio** (fixed scene durations vs variable VO). | S14 round 1. | Fixed by reading `timings.json` and rendering each scene as an absolute-positioned `<Sequence>`. |
| 8  | **Hot-reload trap** — `defaultProps` / `sourceMp4` changes don't always pick up via HMR. | S15 (twice). | Pattern: kill PIDs + `npm run dev` fresh, not refresh. Tab-close + Studio restart. |
| 9  | **Misdiagnosis cycles** — break-tag joins, outro-boom timing — chased before checking source-of-truth. | S15. | Symptom-chasing burned ~2h before finding the real causes (mp4 audio + void-musicDuck). |
| 10 | **Naming drift** — `IntroCh03Composition` vs `StackExplainer` vs `WorkshopIntroCh03`. | S14. | ch03 cleaned. Stack/Treatment/Format still on old convention. Migrator deferred to post-SSL. |
| 11 | **Phoneme overrides** — Typora → "typraa". No SSML phoneme map / brand-name dictionary. | S15. | Dropped on ch03. Will recur on every brand mention without a fix. |
| 12 | **ElevenLabs cost on retake** ≈ 1k credits per chapter regen. | Throughout. | Drove the ch03 first-card decision. Need a dry-run / fixture to avoid burning credits on regressions. |
| 13 | **Reverb is opt-in, not baked in.** | post-process.py. | Manual flag — easy to forget on a new chapter. Should be ON by default. |
| 14 | **"Studio auto-saved defaultProps" mystery edits.** StackExplainer `musicHigh 1 → 0.6`, `musicDuck 0.06 → 0.1`. | S13. | Edits Danny didn't recall making. Need lockdown once tuned. |
| 15 | **`DEFAULT_MIXER` declared-but-unused** in `Root.tsx`. | S14 leftover. | TS strict noise. Never cleaned. |
| 16 | **2 lint warnings** — `@remotion/non-pure-animation` at StackExplainer:894 + TreatmentExplainer:470. | Pre-S12. | Render-farm flicker risk; live render plays fine. Low priority. |
| 17 | **No fixture / golden test** before VO generation. | All sessions. | Every retake costs real ElevenLabs credits. No dry-run path exists. |
| 18 | **No clip-fit gate at script-generate time.** Clamp exists at render but you don't know until Studio shows the warning. | S14. | VO can be written that overshoots `clipDurationSeconds`. Discoverable too late in the flow. |

---

## 2. What an editor does in seconds that we currently can't

These are the ceiling — Claude/Remotion will not match a human editor on these, and we should stop trying:

- Frame-accurate audio surgery on a single click, ear-by-eye.
- Drawing volume automation curves between cues.
- Real-time A/B mix-bus EQ.
- Re-linking assets / nudging waveforms by 1–2 frames.
- Visual click-removal at arbitrary points (RX-style).

**Conclusion:** Aim for **95% lights-out**, not 100%. The editor's job for the 18-clip batch is: watch each MP4 once, fix any glaring rounding error, ship. That's where the diminishing-returns wall lives — anything past ~95% costs more than handing it to an editor.

---

## 3. Template-stage gates (G1–G12)

Build these into the factory + scripts before running ch05.

| Gate | What it does | Solves which failings |
|------|--------------|------------------------|
| **G1 — Source-clip prep automated** | `ffmpeg -an` strip + symlink on ingest. No "did I strip audio?" guesswork. | #4 |
| **G2 — Config schema validation** | Zod-validate the chapter JSON. Missing `clipDurationSeconds` = fail loud at config-load, not at render time. | #18 |
| **G3 — Pre-flight clip-fit gate** | Estimate VO seconds per scene from script char count BEFORE calling ElevenLabs. Fail if any scene > clip + 0.5s. | #12, #18 |
| **G4 — Audio polish ON by default** | Reverb + limiter + loudnorm + surgical fades baked in. Flag to disable, never to enable. | #13 |
| **G5 — Music bed auto-pick** | Choose from a 5-track curated library by chapter-duration match. Manual override allowed. | (new) |
| **G6 — Drop the `musicDuck` prop entirely** | One volume = `musicVolume`. Ducker comes back later as a real feature, or never. Stop the lie. | #1 |
| **G7 — Phoneme dictionary** | `data/phonemes.json` — `{Typora: "tai-POR-uh", Anthropic: ..., ...}`. Pre-processor injects SSML `<phoneme>` tags. | #11 |
| **G8 — One-command ship** | `npm run chapter:ship workshop-intro-ch05` runs: validate → script-fit → ElevenLabs → post-process → Studio smoke (HTTP 200 + tsc) → MP4 render. Stop on first failure. | #2, #9, #17 |
| **G9 — MP4 is the verify artefact, not Studio** | Studio scrubbing for creative review only. Document Studio-preview clicks/peaks as known noise. | #3 |
| **G10 — Naming convention enforced** | `WorkshopIntroChNN` everywhere. Migrator script for Stack/Treatment/Format (post-SSL). | #10 |
| **G11 — Golden chapter fixture** | 10s known-good chapter renders in <30s before any real chapter render. Catches factory regressions without burning credits. | #12, #17 |
| **G12 — Hot-reload protocol documented** | When you change `defaultProps` / `sourceMp4`, kill + restart `npm run dev`. Add to `docs/CONVENTIONS.md`. Lock down `defaultProps` once tuned to stop Studio auto-save mystery edits. | #8, #14 |

---

## 4. Recommended path before we touch ch05

Three approaches, ranked.

### (A) Verify ch03 first, THEN harden the template

Render `WorkshopIntroCh03.mp4` (~5 min). Watch end-to-end. Decide: ship as-is or one more pass. Then build G1–G12 into the factory before running ch05.

- **Pro:** Hardening on a verified baseline. We know what "good enough" sounds like before codifying it.
- **Con:** Slower start.

### (B) Skip ch03 verify, jump to ch05 template build

- **Pro:** Faster on paper.
- **Con:** If ch05 hits a failure mode ch03 had already taught us, we re-learn it. Wasted credits.

### (C) Parallel — kick ch03 MP4 render in the background while drafting the gate spec

Bash `run_in_background` supports this. Render bakes; spec gets drafted on first principles. Both land together.

- **Pro:** Best of both — evidence + design progress in the same window.
- **Con:** Mild context-switching.

**My pick: (C).** Kick the render, draft the spec at `docs/CH05-TEMPLATE-HARDENING-SPEC.md`, decide ch05 next moves once both land.

---

## 5. Two questions for you before I move

1. **Does the gate list (G1–G12) match what you'd want?** Anything missing — reverb settings, brand-name dictionary format, music library size, anything else from the 18-chapter pipeline you can already see coming?
2. **One-command `chapter:ship` — render or no render?** Should it include the MP4 render at the end (burns ~5 min compute every run) or stop at "Studio smoke clean" so you can scrub Studio first before committing to the render?

Reply: **1 / 2 / change spec** — or just say **"kick (C)"** and I'll start the ch03 render + draft the implementation spec.

---

## Appendix — File pointers

- Factory: `src/explainer-shared/intro-chapter.tsx`
- Metadata + cache: `src/explainer-shared/metadata.ts`
- Constants: `src/explainer-shared/constants.ts`
- Voice pipeline: `scripts/voice/generate-vo.ts`, `scripts/voice/post-process.py`
- ch03 config: `scripts/voice/workshop-intro-ch03.config.json`
- ch05 skeleton (needs rename): `scripts/voice/intro-ch05.config.json`
- Conventions: `docs/CONVENTIONS.md`
- Master log: `MASTER-LOG.md`
