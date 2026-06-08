import assert from 'assert';
import { parseTimestamp, normalizeLine } from './whatsappParser.js';

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

console.log('All parser format tests passed.');
