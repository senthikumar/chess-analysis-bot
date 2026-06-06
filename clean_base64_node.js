/**
 * Chess Analysis Bot — Clean Base64 Code Node
 * n8n Code Node (JavaScript / Node.js)
 *
 * n8n Cloud stores large binary files on its filesystem rather than
 * in memory. The standard binary.data property returns an internal
 * reference string like "=filesystem-v2:abc123" instead of actual
 * base64 image data. This node uses getBinaryDataBuffer() to fetch
 * the actual image bytes and convert them to clean base64.
 *
 * Also carries playerColor and fromNumber forward from the Extract
 * Color node so downstream nodes have access to both.
 *
 * Prerequisites:
 *   - Previous node: Edit Image (resize to 1000px)
 *   - Previous node: Extract Color (provides playerColor, fromNumber)
 */

const item               = $input.first();
const binaryPropertyName = Object.keys(item.binary)[0];

// getBinaryDataBuffer fetches actual bytes from n8n filesystem storage
// This is required on n8n Cloud — binary.data alone returns a reference string
const buffer     = await this.helpers.getBinaryDataBuffer(0, binaryPropertyName);
const base64     = buffer.toString('base64');
const mimeType   = item.binary[binaryPropertyName].mimeType || 'image/jpeg';

return [{
  json: {
    base64Image: base64,
    mimeType:    mimeType,
    fromNumber:  $('Extract Color').first().json.fromNumber,
    playerColor: $('Extract Color').first().json.playerColor
  }
}];
