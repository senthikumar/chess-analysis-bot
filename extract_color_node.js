/**
 * Chess Analysis Bot — Extract Color Code Node
 * n8n Code Node (JavaScript / Node.js)
 *
 * Reads the WhatsApp photo caption to determine which colour the player
 * used. Player sends scoresheet photo with caption "W" or "B".
 * Defaults to white if caption is missing or unrecognised.
 *
 * Also flags missingCaption so downstream IF node can send a reminder
 * asking the player to resend with a W or B caption.
 *
 * Prerequisites:
 *   - Previous node: Switch (Output 1 — NumMedia = 1)
 *   - Twilio webhook payload in $json.body
 */

const fromNumber = $json.body.From;
const mediaUrl   = $json.body.MediaUrl0;
const caption    = ($json.body.Body || '').trim().toUpperCase();

let playerColor    = 'white';
let missingCaption = false;

if (caption === 'B' || caption === 'BLACK') {
  playerColor = 'black';
} else if (caption === 'W' || caption === 'WHITE') {
  playerColor = 'white';
} else {
  // Photo sent without a valid colour caption
  missingCaption = true;
}

return [{
  json: {
    fromNumber,
    mediaUrl,
    playerColor,
    missingCaption
  }
}];
