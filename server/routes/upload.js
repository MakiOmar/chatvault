import express from 'express';
import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { parseChatFile } from '../utils/whatsappParser.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload and process WhatsApp chat ZIP
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (!req.files || !req.files.chatZip) {
      return res.status(400).json({ error: 'No ZIP file uploaded' });
    }

    const zipFile = req.files.chatZip;
    const userId = req.userId;
    
    // Validate file type
    if (!zipFile.name.toLowerCase().endsWith('.zip')) {
      return res.status(400).json({ error: 'Only ZIP files are allowed' });
    }

    // Create user directory
    const userDir = path.join(__dirname, '../uploads', `user_${userId}`);
    await fs.mkdir(userDir, { recursive: true });

    // Generate unique chat directory
    const chatId = Date.now().toString();
    const chatDir = path.join(userDir, `chat_${chatId}`);
    await fs.mkdir(chatDir, { recursive: true });

    // Extract ZIP file (useTempFiles stores on disk; .data is empty)
    const zipSource = zipFile.tempFilePath || zipFile.data;
    const zip = new AdmZip(zipSource);
    const zipEntries = zip.getEntries();
    
    let chatTextFile = null;
    const mediaFiles = [];

    // Extract all files
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;
      
      const fileName = entry.entryName;
      const filePath = path.join(chatDir, fileName);
      
      // Create directory if needed
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      
      // Write file
      await fs.writeFile(filePath, entry.getData());
      
      // Identify chat text file
      if (fileName.toLowerCase().endsWith('.txt')) {
        chatTextFile = filePath;
      } else {
        // It's a media file
        mediaFiles.push({
          filename: fileName,
          path: filePath,
          size: entry.header.size
        });
      }
    }

    if (!chatTextFile) {
      return res.status(400).json({ error: 'No chat text file found in ZIP' });
    }

    // Parse chat file
    const chatData = await parseChatFile(chatTextFile, mediaFiles);
    
    // Save to database
    const chatResult = await query(
      `INSERT INTO chats (user_id, name, original_filename, file_path, participant_count, message_count, start_date, end_date, file_size) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        chatData.name,
        zipFile.name,
        chatDir,
        chatData.participants.length,
        chatData.messages.length,
        chatData.startDate,
        chatData.endDate,
        zipFile.size
      ]
    );

    const dbChatId = chatResult.insertId;

    // Save participants
    for (const participant of chatData.participants) {
      await query(
        `INSERT INTO chat_participants (chat_id, name, message_count, first_message_at, last_message_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [dbChatId, participant.name, participant.messageCount, participant.firstMessage, participant.lastMessage]
      );
    }

    // Save messages
    for (const message of chatData.messages) {
      await query(
        `INSERT INTO messages (chat_id, sender, content, timestamp, message_type, media_filename, media_path, media_size) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dbChatId,
          message.sender,
          message.content,
          message.timestamp,
          message.type,
          message.mediaFilename,
          message.mediaPath,
          message.mediaSize
        ]
      );
    }

    res.json({
      message: 'Chat uploaded and processed successfully',
      chatId: dbChatId,
      stats: {
        messages: chatData.messages.length,
        participants: chatData.participants.length,
        mediaFiles: mediaFiles.length
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to process chat file' });
  }
});

export default router;
