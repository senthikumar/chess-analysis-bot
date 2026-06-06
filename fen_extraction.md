# Prompt: FEN Extraction and Mistake Identification (Claude Sonnet 4.6)

## Purpose
Given a validated PGN and the player's colour, identifies the two biggest
mistakes made by that player and returns the board position (FEN) after
each mistake — enabling board image generation and targeted coaching.

## Model
`claude-sonnet-4-6`

## Prompt Text

```
You are a chess engine. Given this PGN, identify the two moves where the
biggest mistakes occurred. The player played {{playerColor}}. Focus on
mistakes made by {{playerColor}} only — not the opponent.

PGN: {{pgn}}

Rules:
- Only identify mistakes made by {{playerColor}}
- Mistake 1 must be from the first half of the game
- Mistake 2 must be from the second half of the game
- Each FEN must be the complete board position AFTER the mistake move
  was played
- A valid FEN has exactly 6 parts separated by spaces
- If the game was clean with no clear mistakes, still identify the two
  most suboptimal moves by {{playerColor}}

Respond in this EXACT format and nothing else:
MISTAKE1_MOVE: [move number and move e.g. 12. Nxd5]
MISTAKE1_FEN: [full FEN string]
MISTAKE1_BETTER: [what should have been played instead]
MISTAKE2_MOVE: [move number and move]
MISTAKE2_FEN: [full FEN string]
MISTAKE2_BETTER: [what should have been played instead]
```

## Response Parsing
```javascript
const text = response.content[0].text.trim();

const mistake1Move   = (text.match(/MISTAKE1_MOVE:\s*(.+)/)   || [])[1]?.trim() || 'Unknown';
const mistake1Fen    = (text.match(/MISTAKE1_FEN:\s*(.+)/)    || [])[1]?.trim() || '';
const mistake1Better = (text.match(/MISTAKE1_BETTER:\s*(.+)/) || [])[1]?.trim() || '';
const mistake2Move   = (text.match(/MISTAKE2_MOVE:\s*(.+)/)   || [])[1]?.trim() || 'Unknown';
const mistake2Fen    = (text.match(/MISTAKE2_FEN:\s*(.+)/)    || [])[1]?.trim() || '';
const mistake2Better = (text.match(/MISTAKE2_BETTER:\s*(.+)/) || [])[1]?.trim() || '';
```

## Board Image Generation
FEN is passed to chessvision.ai to render a board image from the correct
player's perspective:
```javascript
const boardOnly = encodeURIComponent(fen.split(' ')[0]);
const imageUrl  = `https://fen2image.chessvision.ai/${boardOnly}?pov=${playerColor}`;
```
