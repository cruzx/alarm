# Motion Forge Editor

AI-assisted motion editor for Figma-to-animation workflows. It includes Figma import, grouped layers, direct canvas dragging, timeline keyframes, undo/redo, motion-engine presets, Three.js preview, MP4 export, and Lottie companion export.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Export

```bash
npm run export:mp4
npm run export:lottie
```

MP4 is the faithful export path for real Three.js rendering. Lottie is a simplified vector-safe companion export.

## Install As A Codex Plugin

Download `motion-forge-codex-plugin.zip`, unzip it, then run:

```bash
cd motion-forge-codex-plugin
./install.sh
```

This registers the bundled local marketplace and installs `motion-forge@motion-forge-local`.
