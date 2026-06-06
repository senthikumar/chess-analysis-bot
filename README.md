# Chess Analysis Bot

A WhatsApp bot that reads handwritten chess tournament scoresheets and returns a personalised coaching report in under 30 seconds.

Player sends a photo of their scoresheet with caption `W` or `B` (the colour they played). The bot responds with an opening assessment, two key mistakes with board position images, and a specific improvement drill.

---

## Demo

**Player sends:** Scoresheet photo + caption `W`

**Bot replies (3 messages):**
1. "Got your scoresheet! Analysing your game now..."
2. Coaching report — opening, mistakes, what to study
3. Board position images showing the two key mistake positions

---

## How It Works

```
Player sends photo + caption (W or B)
          ↓
Twilio WhatsApp API → n8n Webhook
          ↓
Switch node — routes by message type
  ├── Photo received → extract colour from caption
  ├── Join keyword   → welcome message
  └── Anything else  → help instructions
          ↓
Download image from Twilio (Basic Auth)
Resize to 1000px (prevents memory errors on n8n Cloud)
Extract binary from n8n filesystem storage
          ↓
Claude Sonnet 4.6 Vision
  Reads scoresheet image
  Validates every move against the board position
  Corrects handwriting errors using future move context
  Returns clean PGN
          ↓
Claude Sonnet 4.6 Analysis
  Identifies the two biggest mistakes by the player's colour
  Returns FEN position after each mistake
          ↓
chessvision.ai
  Renders board PNG from FEN oriented to player's perspective
          ↓
Groq — Llama 3.3 70B
  Writes coaching report from the player's perspective
          ↓
Twilio sends 3 WhatsApp messages:
  1. Text coaching report
  2. Board image — Mistake 1
  3. Board image — Mistake 2
```

## OCR Accuracy

Tested on handwritten Indian tournament scoresheets (26-move game, 51 half-moves):

| Metric | Result |
|--------|--------|
| True position accuracy | ~94% |
| Including notation-only issues (missing `x`) | ~86% |
| Genuine misreads per game | 2–3 |
| Common error types | `b` vs `g` knight files · digit `5` vs `7` · column swaps |

Ambiguous moves (where two legal moves look visually identical) are flagged with `(?)` rather than silently guessing wrong.
