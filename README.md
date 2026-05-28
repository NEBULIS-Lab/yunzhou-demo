# Yunzhou USV Manipulation Demo

Static Three.js web demo for an ocean-surface unmanned surface vessel carrying a deck-mounted robotic arm and a three-drone support team.

This version keeps the detailed Ocean demo environment and adds a Yunzhou-style surface vehicle integration layer.

The scene demonstrates:

- The original Ocean scene detail: terrain, wave surface, underwater lighting, particles, fish schools, targets, labels, import/export, and snapshot UI.
- A procedural open-deck USV on the animated ocean surface.
- A deck robotic arm adapted from `IacopomC__robot_arm_three_js/regular/assets/js/robot.js`.
- Three quadrotors adapted from `MSubham06__Drone_Simulator/index.html`.
- A floating work platform with sample bottles and a sensor module.
- A simple deck-task sequence for scan, sample recovery, sensor deployment, and verification.

## Run Locally

Open `index.html` directly in a browser, or serve the folder with any static file server:

```bash
python3 -m http.server 8080
```

Then visit:

```text
http://127.0.0.1:8080/
```

## Deployment

This repository is intended to be served directly by GitHub Pages. No build step is required.
