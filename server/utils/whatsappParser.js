import path from 'path';
import fs from 'fs/promises';

/**
 * Supported WhatsApp _chat.txt export formats (locale / version dependent):
 *
 * Bracketed (older / European):
 *   [DD/MM/YYYY, HH:MM:SS] Sender: Message
 *   [DD.MM.YYYY, HH:MM:SS] Sender: Message
 *   [YYYY-MM-DD, HH:MM:SS] Sender: Message
 *   [M/D/YY, H:MM:SS AM/PM] Sender: Message
 *
 * Unbracketed dash (newer iOS / Android):
 *   M/D/YY, H:MM AM/PM - Sender: Message
 *   DD/MM/YYYY, HH:MM - Sender: Message
 *   DD.MM.YYYY, HH:MM - Sender: Message
 */

const MESSAGE_PATTERNS = [
  {
    id: 'iso_bracketed',
    regex: /^\[(\d{4}-\d{2}-\d{2}),\s(\d{1,2}:\d{2}(?::\d{2})?)\s*(am|pm)?\]\s([^:]+):\s(.*)$/i,
    dateOrder: 'ymd',
    separator: '-'
  },
  {
    id: 'dot_bracketed',
    regex: /^\[(\d{1,2}\.\d{1,2}\.\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?)\s*(am|pm)?\]\s([^:]+):\s(.*)$/i,
    dateOrder: 'dmy',
    separator: '.'
  },
  {
    id: 'slash_bracketed',
    regex: /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?)\s*(am|pm)?\]\s([^:]+):\s(.*)$/i,
    dateOrder: 'auto_bracketed',
    separator: '/'
  },
  {
    id: 'dot_dash',
    regex: /^(\d{1,2}\.\d{1,2}\.\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?)\s*(am|pm)?\s*-\s([^:]+):\s(.*)$/i,
    dateOrder: 'dmy',
    separator: '.'
  },
  {
    id: 'slash_dash',
    regex: /^(\d{1,2}\/\d{1,2}\/\d{2,4}),\s(\d{1,2}:\d{2}(?::\d{2})?)\s*(am|pm)?\s*-\s([^:]+):\s(.*)$/i,
    dateOrder: 'auto_dash',
    separator: '/'
  }
];

const MEDIA_INDICATORS = [
  /<media omitted>/i,
  /\(file attached\)/i,
  /<attached:\s*[^>]+>/i,
  /image omitted/i,
  /video omitted/i,
  /audio omitted/i,
  /voice message/i,
  /document omitted/i,
  /sticker omitted/i,
  /gif omitted/i,
  /<(image|video|audio|document|sticker) omitted>/i
];

const ATTACHED_FILE_REGEX = /<attached:\s*([^>]+)>/gi;

const SYSTEM_LINE_MARKERS = [
  'end-to-end encrypted',
  'created group',
  'changed the subject',
  'changed this group',
  'changed the group description',
  'changed the group icon',
  'You were added',
  'You created group',
  'joined using this group\'s invite link',
  'security code changed',
  'Missed voice call',
  'Missed video call',
  'This message was deleted',
  'Waiting for this message'
];

export function normalizeLine(line) {
  return line
    .replace(/^\uFEFF/, '')
    .replace(/[\u200e\u200f\u202a\u202b\u202c\u202d\u202e]/g, '')
    .replace(/\u202f/g, ' ')
    .trim();
}

export function isSystemLine(line) {
  const lower = line.toLowerCase();
  return SYSTEM_LINE_MARKERS.some((marker) => lower.includes(marker.toLowerCase()));
}

function resolveDateParts(dateStr, separator, orderHint) {
  const parts = dateStr.split(separator).map((p) => parseInt(p, 10));

  if (orderHint === 'ymd') {
    return { year: parts[0], month: parts[1], day: parts[2] };
  }

  if (orderHint === 'dmy') {
    return { day: parts[0], month: parts[1], year: parts[2] };
  }

  const [a, b, c] = parts;

  if (orderHint === 'auto_bracketed') {
    if (a > 12) return { day: a, month: b, year: c };
    if (b > 12) return { month: a, day: b, year: c };
    return { day: a, month: b, year: c };
  }

  // auto_dash — newer exports tend to use US M/D/Y when ambiguous
  if (a > 12) return { day: a, month: b, year: c };
  if (b > 12) return { month: a, day: b, year: c };
  return { month: a, day: b, year: c };
}

export function parseTimestamp(dateStr, timeStr, ampm, separator = '/', orderHint = 'auto_dash') {
  const { day, month, year: rawYear } = resolveDateParts(dateStr, separator, orderHint);
  let year = rawYear;
  if (String(rawYear).length === 2 || rawYear < 100) {
    year = 2000 + rawYear;
  }

  const timeParts = timeStr.split(':');
  let hour = parseInt(timeParts[0], 10);
  const minute = parseInt(timeParts[1], 10);
  const second = timeParts[2] ? parseInt(timeParts[2], 10) : 0;

  if (ampm) {
    const period = ampm.toLowerCase();
    if (period === 'pm' && hour !== 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
  }

  return new Date(year, month - 1, day, hour, minute, second);
}

function tryParseMessageLine(line) {
  for (const pattern of MESSAGE_PATTERNS) {
    const match = line.match(pattern.regex);
    if (!match) continue;

    const [, dateStr, timeStr, ampm, sender, messageContent] = match;
    return {
      patternId: pattern.id,
      timestamp: parseTimestamp(dateStr, timeStr, ampm, pattern.separator, pattern.dateOrder),
      sender: sender.trim(),
      content: messageContent
    };
  }
  return null;
}

function isMediaContent(content) {
  return MEDIA_INDICATORS.some((re) => re.test(content));
}

export function extractAttachedFilenames(content) {
  const names = [];
  const regex = new RegExp(ATTACHED_FILE_REGEX.source, 'gi');
  let match;
  while ((match = regex.exec(content)) !== null) {
    names.push(match[1].trim());
  }
  return names;
}

function cleanMessageContent(content) {
  return content
    .replace(/<media omitted>/gi, '')
    .replace(/<attached:\s*[^>]+>/gi, '')
    .replace(/<This message was edited>/gi, '')
    .replace(/<[^>]+ omitted>/gi, '')
    .replace(/\(file attached\)/gi, '')
    .replace(/\(voice message\)/gi, '')
    .replace(/image omitted/gi, '')
    .replace(/video omitted/gi, '')
    .replace(/audio omitted/gi, '')
    .replace(/document omitted/gi, '')
    .replace(/sticker omitted/gi, '')
    .replace(/gif omitted/gi, '')
    .replace(/[\u200e\u200f\u202a\u202b\u202c\u202d\u202e]/g, '')
    .replace(/\u202f/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || null;
}

function findMediaFileForMessage(content, mediaFiles) {
  for (const attachedName of extractAttachedFilenames(content)) {
    const byAttachedName = mediaFiles.find(
      (file) => path.basename(file.filename) === attachedName
    );
    if (byAttachedName) return byAttachedName;
  }

  const referencedName = content
    .replace(/<attached:\s*[^>]+>/gi, '')
    .replace(/\(file attached\)/gi, '')
    .replace(/\(voice message\)/gi, '')
    .trim();

  const byExactName = mediaFiles.find((file) => path.basename(file.filename) === referencedName);
  if (byExactName) return byExactName;

  return mediaFiles.find((file) => {
    const basename = path.basename(file.filename);
    return content.includes(basename);
  });
}

function getMediaType(filename) {
  const ext = path.extname(filename).toLowerCase();

  if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return 'image';
  if (['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) return 'video';
  if (['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.opus'].includes(ext)) return 'audio';
  return 'document';
}

function attachMedia(content, mediaFiles) {
  if (!isMediaContent(content)) {
    return { messageType: 'text', mediaFilename: null, mediaPath: null, mediaSize: null };
  }

  const mediaFile = findMediaFileForMessage(content, mediaFiles);
  if (!mediaFile) {
    return { messageType: 'text', mediaFilename: null, mediaPath: null, mediaSize: null };
  }

  return {
    messageType: getMediaType(mediaFile.filename),
    mediaFilename: path.basename(mediaFile.filename),
    mediaPath: mediaFile.path,
    mediaSize: mediaFile.size
  };
}

export async function parseChatFile(chatFilePath, mediaFiles) {
  const rawContent = await fs.readFile(chatFilePath, 'utf8');
  const content = rawContent.replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  const messages = [];
  const participantStats = new Map();
  let chatName = 'WhatsApp Chat';
  let startDate = null;
  let endDate = null;
  let detectedFormat = null;

  for (let i = 0; i < lines.length; i++) {
    const line = normalizeLine(lines[i]);
    if (!line) continue;
    if (isSystemLine(line)) continue;

    const parsed = tryParseMessageLine(line);
    if (parsed) {
      if (!detectedFormat) detectedFormat = parsed.patternId;

      const { timestamp, sender, content: messageContent } = parsed;

      if (!startDate || timestamp < startDate) startDate = timestamp;
      if (!endDate || timestamp > endDate) endDate = timestamp;

      if (!participantStats.has(sender)) {
        participantStats.set(sender, {
          name: sender,
          messageCount: 0,
          firstMessage: timestamp,
          lastMessage: timestamp
        });
      }

      const stats = participantStats.get(sender);
      stats.messageCount++;
      if (timestamp < stats.firstMessage) stats.firstMessage = timestamp;
      if (timestamp > stats.lastMessage) stats.lastMessage = timestamp;

      const { messageType, mediaFilename, mediaPath, mediaSize } = attachMedia(messageContent, mediaFiles);

      messages.push({
        sender,
        content: cleanMessageContent(messageContent),
        timestamp,
        type: messageType,
        mediaFilename,
        mediaPath,
        mediaSize
      });
    } else if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      lastMessage.content = [lastMessage.content, line].filter(Boolean).join('\n');
    }
  }

  const participants = Array.from(participantStats.values());
  if (participants.length === 2) {
    chatName = participants.map((p) => p.name).join(' & ');
  } else if (participants.length > 2) {
    chatName = `Group Chat (${participants.length} participants)`;
  } else if (participants.length === 1) {
    chatName = participants[0].name;
  }

  return {
    name: chatName,
    messages,
    participants,
    startDate,
    endDate,
    detectedFormat
  };
}
