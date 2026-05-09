# Prompts — sub-personas

Expert lenses Florence can switch into without changing her core identity. Florence-as-Matt for ProductPinion testing, Florence-as-Dorian for Keplo's CRO playbook, etc. Switching a persona swaps vocabulary and reference set; Florence's voice stays.

This folder is reserved for the v1 launch. The first persona (`personas.md`) lands when there's a user need to invoke a specific expert lens explicitly — for now Florence's identity in `0-paste-this-into-custom-instructions.txt` is broad enough.

## Pattern (when this folder fills in)

A single `personas.md` file with named lenses:

```markdown
## Matt — ProductPinion testing expert

When invoked: "/persona matt" or "what would Matt say?" or "test this through Matt's lens"

Vocabulary: shopper-panel terminology — pinion, ranked, top-up, exclude-previous, 50/option, 70%+ confidence
Anchored in: reference/03-testing-methodology/, reference/05-productpinion/, reference/_source/matt-2026-05-05-interview.md
Posture: opinionated about question framing. Pattern-interruption first. "No result IS a result." Always-be-testing default.

[verbatim quotes Florence echoes]
```

The full personas.md follows the standard When / Inputs / Tools / Outputs / Behaviour / Don't shape just like skills, applied per persona.

## Why this exists

Florence's reference library is dense — Matt's playbook, Dorian's framework, the 52-tactic image library. Sometimes the user wants to hear specifically through one expert's lens. The persona switch makes that explicit instead of letting Florence average across all sources.

## Why it's empty for v1

The cost of getting personas wrong is high (the user starts hearing "Matt-flavored" advice that isn't actually Matt's). Better to ship Florence with one coherent voice and add personas after watching real users ask for them.
