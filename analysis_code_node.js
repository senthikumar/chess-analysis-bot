/**
 * Chess Analysis Bot — Main Analysis Code Node
 * n8n Code Node (JavaScript / Node.js)
 *
 * Receives validated PGN from Claude Vision node.
 * Calls Claude Sonnet for FEN extraction and mistake identification.
 * Calls Groq Llama for coaching report generation.
 * Returns report text and board image URLs for Twilio delivery.
 *
 * Prerequisites:
 *   - ANTHROPIC_API_KEY set in n8n credentials
 *   - GROQ_API_KEY set in n8n credentials
 *   - Previous node: Claude Vision (returns content[0].text = PGN)
 *   - Previous node: cleanedImage (returns fromNumber, playerColor)
 */

const pgn         = $input.first().json.content[0].text.trim();
const fromNumber  = $('cleanedImage').first().json.fromNumber;
const playerColor = $('cleanedImage').first().json.playerColor || 'white';

// ─── Guard: unreadable scoresheet ────────────────────────────────────────────
if (pgn.startsWith('PARSE_ERROR')) {
  return [{
    json: {
      report: "Sorry, I couldn't read your scoresheet clearly. Please retake the photo in good lighting with the sheet flat on a surface.",
      fromNumber,
      boardImageUrl1: null,
      boardImageUrl2: null,
      mistake1Move: null,
      mistake2Move: null
    }
  }];
}

// ─── Step 1: Claude Sonnet — identify mistakes and extract FEN positions ─────
const fenResponse = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://api.anthropic.com/v1/messages',
  headers: {
    'x-api-key': 'YOUR_ANTHROPIC_API_KEY',
    'anthropic-version': '2023-06-01',
    'Content-Type': 'application/json'
  },
  body: {
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `You are a chess engine. Given this PGN, identify the two moves where the biggest mistakes occurred. The player played ${playerColor}. Focus on mistakes made by ${playerColor} only — not the opponent.

PGN: ${pgn}

Rules:
- Only identify mistakes made by ${playerColor}
- Mistake 1 must be from the first half of the game
- Mistake 2 must be from the second half of the game
- Each FEN must be the complete board position AFTER the mistake move was played
- A valid FEN has exactly 6 parts separated by spaces
- If the game was clean with no clear mistakes, still identify the two most suboptimal moves by ${playerColor}

Respond in this EXACT format and nothing else:
MISTAKE1_MOVE: [move number and move e.g. 12. Nxd5]
MISTAKE1_FEN: [full FEN string]
MISTAKE1_BETTER: [what should have been played instead]
MISTAKE2_MOVE: [move number and move]
MISTAKE2_FEN: [full FEN string]
MISTAKE2_BETTER: [what should have been played instead]`
    }]
  },
  json: true
});

// ─── Step 2: Parse FEN and mistake data from Claude response ─────────────────
const fenText = fenResponse.content[0].text.trim();

const mistake1Move   = (fenText.match(/MISTAKE1_MOVE:\s*(.+)/)   || [])[1]?.trim() || 'Unknown';
const mistake1Fen    = (fenText.match(/MISTAKE1_FEN:\s*(.+)/)    || [])[1]?.trim() || '';
const mistake1Better = (fenText.match(/MISTAKE1_BETTER:\s*(.+)/) || [])[1]?.trim() || '';
const mistake2Move   = (fenText.match(/MISTAKE2_MOVE:\s*(.+)/)   || [])[1]?.trim() || 'Unknown';
const mistake2Fen    = (fenText.match(/MISTAKE2_FEN:\s*(.+)/)    || [])[1]?.trim() || '';
const mistake2Better = (fenText.match(/MISTAKE2_BETTER:\s*(.+)/) || [])[1]?.trim() || '';

// ─── Step 3: Build board image URLs from FEN ─────────────────────────────────
// chessvision.ai renders clean PNG board images from FEN (free, no API key)
// pov parameter orients board from the player's perspective
const boardOnly1 = mistake1Fen ? encodeURIComponent(mistake1Fen.split(' ')[0]) : '';
const boardOnly2 = mistake2Fen ? encodeURIComponent(mistake2Fen.split(' ')[0]) : '';

const boardImageUrl1 = boardOnly1
  ? `https://fen2image.chessvision.ai/${boardOnly1}?pov=${playerColor}`
  : null;

const boardImageUrl2 = boardOnly2
  ? `https://fen2image.chessvision.ai/${boardOnly2}?pov=${playerColor}`
  : null;

// ─── Step 4: Groq Llama — generate coaching report ───────────────────────────
// Groq free tier used here to keep cost at ~$0.03/analysis
// Llama 3.3 70B produces reliable structured coaching output
const groqResponse = await this.helpers.httpRequest({
  method: 'POST',
  url: 'https://api.groq.com/openai/v1/chat/completions',
  headers: {
    'Authorization': 'Bearer YOUR_GROQ_API_KEY',
    'Content-Type': 'application/json'
  },
  body: {
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    max_tokens: 600,
    messages: [
      {
        role: 'system',
        content: `You are an experienced chess coach helping club-level tournament players in India improve their game. You explain things simply, encouragingly and specifically. Always give concrete actionable advice. Keep response under 300 words for WhatsApp. Use *bold* for headers. IMPORTANT: Always analyse strictly from the perspective of the player who is receiving this report.`
      },
      {
        role: 'user',
        content: `Analyze this chess game and give a coaching report.

PGN: ${pgn}
The player receiving this report played: ${playerColor.toUpperCase()}

IMPORTANT: Give ALL analysis, praise, and criticism from ${playerColor}'s perspective ONLY.
- If ${playerColor} is White, analyse White's moves
- If ${playerColor} is Black, analyse Black's moves
- Do NOT comment on the opponent's moves unless explaining why the player's mistake was bad
- The board position images are shown from ${playerColor}'s point of view

The two biggest mistakes by ${playerColor} were:
Mistake 1: ${mistake1Move} — Better was: ${mistake1Better}
Mistake 2: ${mistake2Move} — Better was: ${mistake2Better}

I am sending board position images separately so do NOT describe the board in words. Reference mistakes by move number only.

Format EXACTLY like this:

*Game Analysis* ♟️

*Opening:* [Name the opening. One sentence on whether ${playerColor} handled it correctly.]

*How the game went:* [2 sentences on game arc strictly from ${playerColor}'s perspective — their threats, their errors, their missed opportunities.]

*Mistake 1 — Move ${mistake1Move}:*
[Why this move was bad for ${playerColor} and what ${mistake1Better} would have achieved instead.]

*Mistake 2 — Move ${mistake2Move}:*
[Why this move was bad for ${playerColor} and what ${mistake2Better} would have achieved instead.]

*What you did well:* [One genuine positive from ${playerColor}'s play specifically.]

*Focus Area for Improvement:* [One specific concept ${playerColor} should study based on these mistakes.]`
      }
    ]
  },
  json: true
});

const report = groqResponse.choices[0].message.content;

// ─── Return ───────────────────────────────────────────────────────────────────
return [{
  json: {
    report,
    boardImageUrl1,
    boardImageUrl2,
    mistake1Move,
    mistake2Move,
    fromNumber,
    playerColor
  }
}];
