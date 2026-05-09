// See all configuration options: https://remotion.dev/docs/config
// Each option also is available as a CLI flag: https://remotion.dev/docs/cli

// Note: When using the Node.JS APIs, the config file doesn't apply. Instead, pass options directly to the APIs

import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// CRF is not valid for wav/mp3/aac codecs — skip when AUDIO_ONLY=1 is set
// for audio-only renders (e.g. WAV exports for external mastering).
if (!process.env.AUDIO_ONLY) {
  Config.setCrf(23);
}
