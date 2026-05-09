"""vef -- Claude Video Editing Flow bridge.

Two surfaces, one contract:
- terminal stays the conversation channel (Claude + Danny chat)
- browser UI is the rails for structured stages (presets, candidates, gates, render, verdict)
- state.json + events.jsonl in the per-clip edit/.vef/ folder is the contract
"""

__all__ = ["state"]
