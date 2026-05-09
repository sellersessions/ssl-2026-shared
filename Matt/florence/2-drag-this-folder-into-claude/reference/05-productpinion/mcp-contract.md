# ProductPinion MCP Contract

Documented as of 2026-05-05. Tool surface evolves — always check the
runtime manifest before assuming a tool exists.

## Authentication

- **Single shared Client ID for all users:** `B5f2zdcwuw2tEsKZZrwWvEcXF1R94l9y`
- **MCP server URL:** `https://lnkd.in/eW-mAKUZ`
- **Setup:** Claude Settings → Custom Connector → paste URL + Client ID. ~30 seconds.
- Each seller connects their own ProductPinion account. **No shared
  credit pool** — sellers pay for their own polls.

## Full tool list (18 tools)

### Polls — Create & Manage
| Tool | Purpose |
|---|---|
| `create_poll` | Draft a new poll. Types: Headlines, BulletPoints, BrandNames, Custom, Amazon, Image, Ranked, etc. |
| `update_poll` | Edit a draft's goal, instructions, pinion count, public-sharing setting |
| `launch_poll` | Make a draft live (charges credits) |
| `duplicate_poll` | Clone an existing poll as a new draft. Critical for iteration — duplicate baseline, swap the image, rerun with fresh respondents |
| `cancel_poll` | Cancel an in-progress poll, recoup unused credits |

### Polls — Results & Analysis
| Tool | Purpose |
|---|---|
| `get_poll` | Full poll details |
| `get_poll_stats` | Win rates, vote proportions, statistical confidence per option |
| `get_poll_submissions` | Individual qualitative responses (the "why"), filterable by option or keyword |
| `list_polls` | Browse poll library, filter by status (Draft, InProgress, Completed, etc.) |

### Videos
| Tool | Purpose |
|---|---|
| `get_video` | Full video test details |
| `get_video_stats` | Completion rates, transcription status |
| `get_video_submissions` | Individual responses with transcriptions and demographics |
| `list_videos` | Browse video tests |

### Images
| Tool | Purpose |
|---|---|
| `upload_image` | Upload an image by URL so it can be used as a poll option |
| `get_image` | Retrieve metadata/URL for an uploaded image by ID |

### Custom Audiences
| Tool | Purpose |
|---|---|
| `create_custom_audience` | Build a screened audience with qualifying questions |
| `get_audience_details` | Get full details on an audience segment |
| `list_custom_audiences` | Browse available audience segments |

## Latency expectations

| Audience type | Time to first results | Time to complete |
|---|---|---|
| Broad / open audience | ~5 minutes | ~15 minutes |
| Narrow / specific audience | ~5 minutes | up to ~1 hour |

**Recommended pattern:** polling. Use `get_poll_stats` on demand. When
the seller asks "what's the status of my last poll?", Florence checks
live with `get_poll_stats`. Webhooks/callbacks not confirmed available
— treat as polling-based.

## Lifecycle of a typical poll

1. `upload_image` for each option (if applicable)
2. `create_poll` with type, options, audience, sample size, question
3. (Optional) `update_poll` to refine before launch
4. `launch_poll` — credits charged at this point
5. Poll for status with `get_poll_stats` until confidence threshold met
6. `get_poll_submissions` to read qualitative responses
7. If needed: `duplicate_poll` to iterate

## Iteration pattern (the exclusive feature)

ProductPinion lets Florence:

- Add respondents to a *live* test instead of relaunching (top-up
  rather than restart)
- Exclude previous respondents on a duplicated test (fresh eyes for
  CTR retest in the Main Image Sequencer)

These two features make the Main Image Sequencer workflow
(`knowledge/cro/03-testing-methodology/workflows.md`) practical at
seller-scale cost.

## Error states

To be documented in a future update. For now, Florence surfaces raw
errors to the seller gracefully when they occur.

## Workshop-specific notes

- Pre-launched polls Tuesday/Wednesday before the workshop serve as
  reference data — the live demo doesn't depend on poll latency
- Demo ASINs: `B07HB8FNXV` (Dr. Doug's Magnesium Muscle Relief),
  `B0FVFTY4CG` (SPOTMINDERS GPS Tracker)
