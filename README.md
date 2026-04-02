# WUBSTATION 9000 v6

A full-featured bass synthesizer that runs entirely in your browser. No installation. No accounts. No backend.

**[Try it live](https://barthbuilds.github.io/wubstation/)**

## Features

- **3 oscillator types** with sub-oscillator, FM synthesis, noise generator, and 7-voice unison
- **Step sequencer** — 64 steps, swing, velocity, probability, parameter locks, 8 pattern banks
- **Full effects chain** — bitcrusher (AudioWorklet), phaser, chorus, delay, reverb, vowel filter, ring modulator, comb filter, stutter, glide
- **Filter envelope** with dedicated ADSR
- **MIDI input** with learn mode
- **Preset system** — factory presets + save/load custom presets (.wub format)
- **WAV export** — bounce patterns to audio files
- **Oscilloscope** — real-time waveform display
- **PWA** — installable, works offline

## Tech

Built with vanilla JavaScript and the Web Audio API. No frameworks, no build tools, no dependencies.

- Fully static audio graph — zero `disconnect()` calls during playback
- AudioWorklet-based bitcrusher for sample-rate-accurate crushing
- Pop-free parameter changes via cancel-anchor-ramp pattern
- Curve swaps (distortion, reverb) use gain-duck crossfade

## Run locally

Open `index.html` in Chrome or Edge, or serve it:

```
npx serve -p 3000
```

## License

Copyright Bill Barth. All rights reserved.
