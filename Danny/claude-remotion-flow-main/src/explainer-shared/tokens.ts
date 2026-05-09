import { Easing } from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

// SSL design tokens — matches the TreatmentExplainer palette so every
// explainer reads as part of the same set.

const { fontFamily: INTER } = loadFont();

export const BG = "linear-gradient(140deg, #0C0322, #1a1a2e, #461499)";
export const ACCENT = "#753EF7";
export const ACCENT_2 = "#FBBF24";
export const ACCENT_3 = "#22d3ee";
export const TEXT = "#ffffff";
export const TEXT_DIM = "#a0a0b0";
export const FONT = `${INTER}, system-ui, sans-serif`;
export const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const TRANS_EASE = Easing.bezier(0.4, 0, 0.2, 1);

// Safe-area margins — keep content inside these bounds at 1920×1080. Danny's
// rule (Session 11 Loom): fill the full canvas, don't top-align. Allow a
// little AI drift over these edges — SAFE is the target, not a hard stop.
// Scene bodies should stretch content to near SAFE_INSET on all sides.
export const SAFE_INSET_X = 120; // 6.25% of 1920
export const SAFE_INSET_Y = 80;  // 7.4% of 1080
export const CANVAS_W = 1920;
export const CANVAS_H = 1080;

// Subtle film grain overlay — burned-in once as a data URL so the
// composition has no external asset dependency.
export const GRAIN_SVG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";
