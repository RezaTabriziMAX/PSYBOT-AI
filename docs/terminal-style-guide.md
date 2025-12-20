# Nuttoo — Terminal Style Guide

This document defines the visual, interaction, and writing style for Nuttoo’s terminal-first interface.

Nuttoo intentionally adopts a **retro terminal aesthetic**, inspired by Fallout-style terminals and early UNIX systems.  
This style is not cosmetic. It reinforces Nuttoo’s philosophy: minimalism, clarity, and systems that feel *alive* rather than polished.

---

## Design Goals

The terminal style exists to achieve the following goals:

- Reduce visual noise
- Emphasize information density
- Encourage focus on systems, not decoration
- Make Nuttoo feel like an operating organism, not a product UI
- Remain usable over SSH, low-bandwidth, and remote environments

---

## Core Visual Principles

### Monospace Only

- Use a single monospace font family everywhere
- No proportional fonts
- No font mixing

Recommended fonts:
- IBM Plex Mono
- JetBrains Mono
- Fira Code (ligatures optional)
- Source Code Pro

---

### Color Palette

Primary palette:

- Foreground: `#00ff66`
- Background: `#0b0f0c`
- Dim text: `#5cff9a`
- Error: `#ff5555`
- Warning: `#ffaa00`
- Info: `#66ccff`

Rules:
- Dark background is mandatory
- Green is the dominant informational color
- Avoid gradients
- Avoid transparency unless required for glow effects

---

### Contrast and Readability

- High contrast is required
- Text must remain readable on low-quality displays
- Avoid subtle color differences
- Never rely on color alone to convey meaning

---

## Typography Rules

### Text Weight

- Normal weight by default
- Bold is allowed only for section headers
- Italics should be avoided

### Text Size

- Base font size: 14–16px equivalent
- Headers scale minimally
- No oversized hero text

---

## Layout and Spacing

### Alignment

- Left-aligned text only
- No centered content
- No justified text

### Spacing

- One blank line between logical blocks
- Avoid excessive vertical spacing
- Dense but readable

---

## UI Elements

### Headers

Headers should look like terminal sections, not marketing copy.

Example:

```
== SYSTEM STATUS ==
```

Rules:
- Uppercase
- Surrounded by symbols
- No emojis
- No icons

---

### Lists

Use simple ASCII lists.

Preferred:

```
- module loaded
- dependency resolved
- worker online
```

Avoid:
- numbered lists unless order matters
- decorative bullets

---

### Tables

Use ASCII-style tables when possible.

Example:

```
+----------+----------+
| MODULE   | STATUS   |
+----------+----------+
| core     | active   |
| runtime  | forked   |
+----------+----------+
```

---

### Progress Indicators

Use text-based indicators.

Examples:

```
[####......] 40%
processing...
waiting for confirmation...
```

Avoid spinners that rely on Unicode characters.

---

## Messaging and Tone

### Voice

Nuttoo speaks like a system, not a product.

Preferred tone:
- calm
- factual
- minimal
- slightly mechanical

Avoid:
- hype language
- marketing phrases
- emojis
- exclamation marks

---

### System Messages

Good examples:

```
module registered
worker idle
indexer synced
fork created
```

Bad examples:

```
🎉 Success! Your module is live!
Awesome job!
```

---

### Errors

Errors must be explicit and actionable.

Format:

```
ERROR: unable to connect to database
CAUSE: connection refused
ACTION: verify DATABASE_URL
```

Rules:
- Always include a cause when possible
- Suggest a next step
- Do not blame the user

---

### Warnings

Warnings should not be noisy.

Example:

```
WARNING: high worker latency detected
```

---

## Command Output Style

### Deterministic Output

- Same input should produce the same output
- Avoid timestamps unless necessary
- Avoid random ordering

---

### Minimal Noise

- Do not print banners repeatedly
- Avoid redundant status messages
- Prefer summary over verbose output

---

## Animation and Effects

### Cursor Effects

Allowed:
- subtle blinking cursor
- slow caret pulse

Avoid:
- fast blinking
- shaking text
- glitch spam

---

### Glow Effects

If used:
- extremely subtle
- applied only to primary green text
- must not reduce readability

---

## Accessibility

- All interactions must be keyboard-only
- No mouse-only interactions
- No reliance on sound
- No reliance on color alone

---

## Writing Rules

- Short sentences
- One idea per line when possible
- Avoid long paragraphs
- Prefer clarity over personality

---

## Do and Do Not Summary

### Do

- use monospace fonts
- keep output predictable
- favor text over graphics
- treat UI as a system console
- make errors explicit

### Do Not

- add marketing language
- use emojis
- center content
- use excessive color
- hide errors

---

## Example Screen

```
NUTTOO :: SYSTEM ONLINE

modules loaded: 12
active forks: 4
worker status: running
solana rpc: reachable

awaiting input...
```

---

## Final Principle

Nuttoo’s terminal is not a theme.

It is an interface to a living system.

If it feels too polished, it is wrong.
