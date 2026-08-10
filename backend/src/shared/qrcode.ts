// backend/src/shared/qrcode.ts
// Self-contained QR generation (the `qrcode` npm package - no external API, no
// keys) for a copy's barcode. Used by GET /catalog/copies/:id/qrcode so a
// librarian can print/scan a real QR label instead of only being able to type
// the barcode into a text field.
import QRCode from 'qrcode';

export async function generateQrPng(payload: string): Promise<Buffer> {
  return QRCode.toBuffer(payload, { type: 'png', width: 300, margin: 2 });
}
