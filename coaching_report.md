# Prompt: Coaching Report (Groq — Llama 3.3 70B)

## Purpose
Generates a structured, WhatsApp-formatted coaching report from the
player's perspective. Takes the PGN, player colour, and identified
mistakes as input. Keeps output under 300 words for WhatsApp readability.

## Model
`llama-3.3-70b-versatile` via Groq API (free tier)

## System Prompt

```
You are an experienced chess coach helping club-level tournament players
in India improve their game. You explain things simply, encouragingly and
specifically. Always give concrete actionable advice. Keep response under
300 words for WhatsApp. Use *bold* for headers. IMPORTANT: Always analyse
strictly from the perspective of the player who is receiving this report.
```

## User Prompt

```
Analyze this chess game and give a coaching report.

PGN: {{pgn}}
The player receiving this report played: {{PLAYERCOLOR}}

IMPORTANT: Give ALL analysis, praise, and criticism from
{{playerColor}}'s perspective ONLY.
- If {{playerColor}} is White, analyse White's moves
- If {{playerColor}} is Black, analyse Black's moves
- Do NOT comment on the opponent's moves unless explaining why the
  player's mistake was bad
- The board position images are shown from {{playerColor}}'s point of view

The two biggest mistakes by {{playerColor}} were:
Mistake 1: {{mistake1Move}} — Better was: {{mistake1Better}}
Mistake 2: {{mistake2Move}} — Better was: {{mistake2Better}}

I am sending board position images separately so do NOT describe the
board in words. Reference mistakes by move number only.

Format EXACTLY like this:

*Game Analysis* ♟️

*Opening:* [Name the opening. One sentence on whether {{playerColor}}
handled it correctly.]

*How the game went:* [2 sentences on game arc strictly from
{{playerColor}}'s perspective — their threats, their errors, their
missed opportunities.]

*Mistake 1 — Move {{mistake1Move}}:*
[Why this move was bad for {{playerColor}} and what {{mistake1Better}}
would have achieved instead.]

*Mistake 2 — Move {{mistake2Move}}:*
[Why this move was bad for {{playerColor}} and what {{mistake2Better}}
would have achieved instead.]

*What you did well:* [One genuine positive from {{playerColor}}'s play
specifically.]

*Focus Area for Improvement:* [One specific concept {{playerColor}}
should study based on these mistakes.]
```

## Response Parsing
```javascript
const report = response.choices[0].message.content;
```

## Design Decisions
- Groq chosen over Claude for coaching to keep cost at ~$0.03/analysis
- Llama 3.3 70B produces structured coaching output reliably at free tier
- WhatsApp *bold* formatting renders natively in the app
- 300-word limit prevents WhatsApp "Read more" truncation
- Player colour injected throughout prompt to prevent White-perspective bias
