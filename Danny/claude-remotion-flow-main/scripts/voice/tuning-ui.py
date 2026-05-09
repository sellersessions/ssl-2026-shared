#!/usr/bin/env python3
"""Voice cloning tuning UI v3 — two-stage with in-memory real-time FX."""

import subprocess
import sys
import time
from pathlib import Path

import gradio as gr
import numpy as np
import soundfile as sf

SCRIPT_DIR = Path(__file__).parent
REF_AUDIO_SRC = "/tmp/danny-loom-raw.wav"
REAL_VOICE_SAMPLE = "/tmp/danny-loom-realvoice.wav"

_tts = None


def get_tts():
    global _tts
    if _tts is None:
        import torch
        from f5_tts.api import F5TTS
        device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading F5-TTS on {device}...", file=sys.stderr)
        _tts = F5TTS(model="F5TTS_v1_Base", device=device)
    return _tts


def extract_reference(offset: float, duration: float) -> str:
    ref_path = str(SCRIPT_DIR / "reference" / "danny-ref-tuning.wav")
    subprocess.run(
        ["ffmpeg", "-y", "-i", REF_AUDIO_SRC,
         "-ss", str(offset), "-t", str(duration),
         "-ar", "24000", "-ac", "1", "-acodec", "pcm_s16le", "-af", "loudnorm",
         ref_path],
        capture_output=True,
    )
    return ref_path


# ── IN-MEMORY AUDIO FX (instant, no ffmpeg) ─────────────────────────────

def apply_fx_inmemory(audio_path: str, pitch_semi: float, speed: float,
                      treble_db: float, bass_cut_hz: float, mid_scoop_db: float,
                      presence_db: float, warmth_db: float, deess_db: float,
                      reverb_wet: float, loudnorm: bool) -> str:
    """Apply all FX in-memory using pedalboard + scipy. Returns new file path."""
    from pedalboard import (
        Pedalboard, PitchShift, Gain, HighpassFilter, LowShelfFilter,
        HighShelfFilter, PeakFilter, Reverb, Compressor, Limiter,
    )
    import pyloudnorm as pyln

    audio, sr = sf.read(audio_path)
    if audio.ndim == 1:
        audio = audio[:, np.newaxis]  # pedalboard expects (samples, channels)

    effects = []

    # Pitch shift
    if abs(pitch_semi) > 0.05:
        effects.append(PitchShift(semitones=pitch_semi))

    # Bass cut (highpass)
    if bass_cut_hz > 50:
        effects.append(HighpassFilter(cutoff_frequency_hz=bass_cut_hz))

    # Warmth (low shelf at 250Hz)
    if abs(warmth_db) > 0.1:
        effects.append(LowShelfFilter(cutoff_frequency_hz=250, gain_db=warmth_db))

    # Mid scoop (peak at 2.5kHz — reduces nasal quality)
    if abs(mid_scoop_db) > 0.1:
        effects.append(PeakFilter(cutoff_frequency_hz=2500, gain_db=mid_scoop_db, q=1.5))

    # Presence (peak at 4.5kHz — clarity and forward projection)
    if abs(presence_db) > 0.1:
        effects.append(PeakFilter(cutoff_frequency_hz=4500, gain_db=presence_db, q=1.2))

    # De-ess (peak cut at 7kHz)
    if deess_db < -0.1:
        effects.append(PeakFilter(cutoff_frequency_hz=7000, gain_db=deess_db, q=2.0))

    # Treble / air (high shelf at 8kHz)
    if abs(treble_db) > 0.1:
        effects.append(HighShelfFilter(cutoff_frequency_hz=8000, gain_db=treble_db))

    # Reverb
    if reverb_wet > 0.01:
        effects.append(Reverb(
            room_size=0.3,
            damping=0.7,
            wet_level=reverb_wet,
            dry_level=1.0 - reverb_wet * 0.3,
        ))

    # Limiter (always, prevents clipping)
    effects.append(Limiter(threshold_db=-1.0))

    if effects:
        board = Pedalboard(effects)
        audio = board(audio, sr)

    # Speed adjustment (simple resampling)
    if abs(speed - 1.0) > 0.02:
        import librosa
        audio_mono = audio[:, 0] if audio.ndim == 2 else audio
        audio_mono = librosa.effects.time_stretch(audio_mono, rate=speed)
        audio = audio_mono[:, np.newaxis]

    # Loudness normalise to -14 LUFS
    if loudnorm:
        audio_for_meter = audio[:, 0] if audio.ndim == 2 else audio
        meter = pyln.Meter(sr)
        current_loudness = meter.integrated_loudness(audio_for_meter)
        if not np.isinf(current_loudness):
            audio_for_meter = pyln.normalize.loudness(audio_for_meter, current_loudness, -14.0)
            audio = audio_for_meter[:, np.newaxis]

    # Write output
    output_path = audio_path.rsplit(".", 1)[0] + "-tuned.wav"
    audio_out = audio[:, 0] if audio.ndim == 2 else audio
    sf.write(output_path, audio_out, sr)
    return output_path


# ── SIMILARITY METRICS ───────────────────────────────────────────────────

def run_comparison(generated_path: str) -> str:
    try:
        from resemblyzer import VoiceEncoder, preprocess_wav
        import librosa

        encoder = VoiceEncoder()
        real = preprocess_wav(Path(REAL_VOICE_SAMPLE))
        gen = preprocess_wav(Path(generated_path))
        emb_real = encoder.embed_utterance(real)
        emb_gen = encoder.embed_utterance(gen)
        sim = float(np.dot(emb_real, emb_gen) / (np.linalg.norm(emb_real) * np.linalg.norm(emb_gen)))

        y_real, sr = librosa.load(REAL_VOICE_SAMPLE, sr=None)
        y_gen, sr2 = librosa.load(generated_path, sr=None)
        f0_real, _, _ = librosa.pyin(y_real, fmin=50, fmax=400, sr=sr)
        f0_gen, _, _ = librosa.pyin(y_gen, fmin=50, fmax=400, sr=sr2)
        f0_real = f0_real[~np.isnan(f0_real)]
        f0_gen = f0_gen[~np.isnan(f0_gen)]

        return (
            f"Similarity: {sim:.3f} (target: >0.95)\n"
            f"Pitch — Real: {np.mean(f0_real):.0f} Hz (±{np.std(f0_real):.0f}) | "
            f"Gen: {np.mean(f0_gen):.0f} Hz (±{np.std(f0_gen):.0f})\n"
            f"Gap: {np.mean(f0_gen) - np.mean(f0_real):+.0f} Hz pitch, "
            f"{np.std(f0_gen) - np.std(f0_real):+.0f} variation"
        )
    except Exception as e:
        return f"Comparison error: {e}"


# ── STAGE 1: Generate raw clone ─────────────────────────────────────────

def generate_raw(text: str, ref_offset: float, ref_duration: float):
    if not text.strip():
        return None, "Enter some text first.", None

    try:
        tts = get_tts()
        ref_path = extract_reference(ref_offset, ref_duration)
        raw_output = f"/tmp/vo-raw-{int(time.time())}.wav"

        print(f"[Stage 1] Generating {len(text)} chars → {raw_output}", file=sys.stderr)
        tts.infer(ref_file=ref_path, ref_text="", gen_text=text, file_wave=raw_output)

        if not Path(raw_output).exists():
            return None, "Generation failed: output file not created.", None

        size_kb = Path(raw_output).stat().st_size // 1024
        print(f"[Stage 1] Done: {raw_output} ({size_kb}KB)", file=sys.stderr)

        metrics = run_comparison(raw_output)
        return raw_output, f"Stage 1 complete ({size_kb}KB).\n{metrics}", raw_output

    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        return None, f"Generation error: {e}", None


# ── STAGE 2: Real-time tuning ───────────────────────────────────────────

def tune(raw_path, pitch_semi, speed, treble_db, bass_cut_hz, mid_scoop_db,
         presence_db, warmth_db, deess_db, reverb_wet, loudnorm):
    if raw_path is None or not Path(str(raw_path)).exists():
        return None, "Generate a raw clip first (Stage 1)."

    try:
        t0 = time.time()
        result = apply_fx_inmemory(
            str(raw_path), pitch_semi, speed, treble_db, bass_cut_hz,
            mid_scoop_db, presence_db, warmth_db, deess_db, reverb_wet, loudnorm,
        )
        elapsed = time.time() - t0
        metrics = run_comparison(result)
        return result, f"Tuned in {elapsed:.1f}s\n{metrics}"

    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        return None, f"Tuning error: {e}"


# ── DEFAULT TEXT ─────────────────────────────────────────────────────────

DEFAULT_TEXT = (
    "Welcome back to Seller Sessions. Last year we were at the American Square "
    "Conference Centre. This year we're in this beautiful venue. This is much more "
    "intimate, and we're able to continue on the vision that started in May 2025. "
    "When we did the AI workshop on December 1st, that was phase two, and hopefully "
    "today we can deliver on the final vision. I've always been about pushing the "
    "needle, and I think we've made a lot of sacrifices, turned down lots of "
    "opportunities, but for sure we deliver on our experiences."
)


# ── UI ───────────────────────────────────────────────────────────────────

with gr.Blocks(title="Danny Voice Tuning") as app:
    gr.Markdown(
        "# Danny Voice Tuning\n"
        "**Stage 1:** Generate raw clone (~60s). "
        "**Stage 2:** Tune pitch/EQ/FX instantly."
    )

    # State: holds the raw file path between stages
    raw_state = gr.State(value=None)

    with gr.Row():
        # ── LEFT: Controls ──
        with gr.Column(scale=2):

            # Stage 1
            gr.Markdown("## Stage 1 — Generate raw clone")
            text_input = gr.Textbox(label="Text to generate", value=DEFAULT_TEXT, lines=4)
            with gr.Row():
                ref_offset = gr.Slider(0, 150, value=30, step=5,
                                       label="Reference offset (s into Loom)")
                ref_duration = gr.Slider(10, 30, value=25, step=1,
                                         label="Reference duration (s)")
            generate_btn = gr.Button("Generate Raw Clone", variant="primary", size="lg")

            gr.Markdown("---")

            # Stage 2
            gr.Markdown("## Stage 2 — Real-time tuning")
            gr.Markdown("*Adjust sliders → click Apply Tuning → instant result.*")

            gr.Markdown("#### Pitch & Speed")
            with gr.Row():
                pitch_semi = gr.Slider(-3, 3, value=0, step=0.1,
                                       label="Pitch (semitones)")
                speed = gr.Slider(0.8, 1.3, value=1.0, step=0.05,
                                  label="Speed")

            gr.Markdown("#### EQ")
            with gr.Row():
                warmth_db = gr.Slider(-4, 4, value=0, step=0.5,
                                      label="Warmth (250Hz)")
                mid_scoop_db = gr.Slider(-6, 3, value=0, step=0.5,
                                         label="Mid scoop (2.5kHz, - = less nasal)")

            with gr.Row():
                presence_db = gr.Slider(-3, 6, value=0, step=0.5,
                                        label="Presence (4.5kHz)")
                treble_db = gr.Slider(-3, 6, value=0, step=0.5,
                                      label="Treble / Air (8kHz)")

            gr.Markdown("#### FX")
            with gr.Row():
                deess_db = gr.Slider(-10, 0, value=0, step=0.5,
                                     label="De-ess (7kHz cut)")
                bass_cut_hz = gr.Slider(0, 200, value=0, step=10,
                                        label="Bass cut (Hz highpass)")

            with gr.Row():
                reverb_wet = gr.Slider(0, 0.3, value=0, step=0.01,
                                       label="Reverb (wet %)")
                loudnorm = gr.Checkbox(label="Loudness normalise (-14 LUFS)", value=False)

            tune_btn = gr.Button("Apply Tuning", variant="secondary", size="lg")

        # ── RIGHT: Audio players ──
        with gr.Column(scale=1):
            gr.Markdown("### Your real voice")
            real_audio = gr.Audio(value=REAL_VOICE_SAMPLE, label="Danny — Loom",
                                 interactive=False)

            gr.Markdown("### Raw clone (Stage 1)")
            raw_audio = gr.Audio(label="Raw F5-TTS output", interactive=False)

            gr.Markdown("### Tuned output (Stage 2)")
            tuned_audio = gr.Audio(label="After tuning", interactive=False)

            metrics_box = gr.Textbox(label="Similarity metrics", lines=4,
                                     interactive=False)

    # ── WIRING ───────────────────────────────────────────────────────────

    # Stage 1: generate → raw_audio + metrics + raw_state
    generate_btn.click(
        fn=generate_raw,
        inputs=[text_input, ref_offset, ref_duration],
        outputs=[raw_audio, metrics_box, raw_state],
    )

    # Stage 2: tune raw_state → tuned_audio + metrics
    tune_btn.click(
        fn=tune,
        inputs=[raw_state, pitch_semi, speed, treble_db, bass_cut_hz,
                mid_scoop_db, presence_db, warmth_db, deess_db,
                reverb_wet, loudnorm],
        outputs=[tuned_audio, metrics_box],
    )


if __name__ == "__main__":
    app.queue(default_concurrency_limit=1)
    app.launch(server_port=7860, share=False)
