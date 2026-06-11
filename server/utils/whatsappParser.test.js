import assert from 'assert';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  parseTimestamp,
  normalizeLine,
  extractAttachedFilenames,
  parseChatFile
} from './whatsappParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// New iOS/Android dash format (US locale)
const dash = normalizeLine('3/21/26, 6:51 pm - Mohamed Omar: Hello');
assert.ok(dash.includes('Mohamed Omar'));

const dashTs = parseTimestamp('3/21/26', '6:51', 'pm', '/', 'auto_dash');
assert.strictEqual(dashTs.getMonth(), 2);
assert.strictEqual(dashTs.getDate(), 21);

// Old bracketed European DD/MM/YYYY
const euTs = parseTimestamp('21/03/2026', '18:51:00', null, '/', 'auto_bracketed');
assert.strictEqual(euTs.getDate(), 21);
assert.strictEqual(euTs.getMonth(), 2);

// German dot format
const deTs = parseTimestamp('21.03.2026', '18:51', null, '.', 'dmy');
assert.strictEqual(deTs.getDate(), 21);

// ISO format
const isoTs = parseTimestamp('2026-03-21', '18:51:00', null, '-', 'ymd');
assert.strictEqual(isoTs.getFullYear(), 2026);
assert.strictEqual(isoTs.getMonth(), 2);

// Newer export: bracketed US date with <attached: filename>
const attachedLine = normalizeLine(
  '\u200e[2/17/25, 4:31:18\u202fPM] Ahmed Matter: \u200e<attached: 00000027-PHOTO-2025-02-17-16-31-17.jpg>'
);
assert.ok(attachedLine.includes('<attached: 00000027-PHOTO-2025-02-17-16-31-17.jpg>'));
assert.deepStrictEqual(extractAttachedFilenames(attachedLine), [
  '00000027-PHOTO-2025-02-17-16-31-17.jpg'
]);

const attachedExportPath = path.join(__dirname, 'fixtures/attached-export-sample.txt');

const attachedData = await parseChatFile(attachedExportPath, [
  {
    filename: '00000027-PHOTO-2025-02-17-16-31-17.jpg',
    path: '/tmp/00000027-PHOTO-2025-02-17-16-31-17.jpg',
    size: 1200
  },
  {
    filename: '00000004-TRANSACTION_2025-01-25-17-01-66.pdf',
    path: '/tmp/00000004-TRANSACTION_2025-01-25-17-01-66.pdf',
    size: 3400
  },
  {
    filename: '00000074-PHOTO-2025-02-22-15-35-00.jpg',
    path: '/tmp/00000074-PHOTO-2025-02-22-15-35-00.jpg',
    size: 900
  }
]);

assert.strictEqual(attachedData.detectedFormat, 'slash_bracketed');
assert.strictEqual(attachedData.participants.length, 2);

const photoMessage = attachedData.messages.find((m) => m.mediaFilename?.includes('PHOTO-2025-02-17-16-31-17'));
assert.ok(photoMessage, 'expected attached photo message');
assert.strictEqual(photoMessage.type, 'image');

const pdfMessage = attachedData.messages.find((m) => m.mediaFilename?.includes('TRANSACTION_2025-01-25'));
assert.ok(pdfMessage, 'expected attached pdf message');
assert.strictEqual(pdfMessage.type, 'document');
assert.ok(pdfMessage.content?.includes('TRANSACTION_2025-01-25-17-01-66.pdf'));

const editedMessage = attachedData.messages.find((m) => m.content?.includes('تم دفع 100 الف جنيه'));
assert.ok(editedMessage, 'expected edited text message');
assert.ok(!editedMessage.content.includes('This message was edited'));

const mixedMessage = attachedData.messages.find((m) =>
  m.content?.includes('أنا عملت الميل ده') && m.mediaFilename?.includes('PHOTO-2025-02-22-15-35-00')
);
assert.ok(mixedMessage, 'expected text + attached image message');

console.log('All parser format tests passed.');
