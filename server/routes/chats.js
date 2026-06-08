import express from 'express';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../config/database.js';

const router = express.Router();

// Get all chats for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const chats = await query(`
      SELECT c.*, 
             COUNT(DISTINCT cp.id) as participant_count,
             COUNT(DISTINCT m.id) as message_count
      FROM chats c
      LEFT JOIN chat_participants cp ON c.id = cp.chat_id
      LEFT JOIN messages m ON c.id = m.chat_id
      WHERE c.user_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [req.userId]);

    res.json({ chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get specific chat details
router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Verify chat belongs to user
    const chats = await query('SELECT * FROM chats WHERE id = ? AND user_id = ?', [chatId, req.userId]);
    if (chats.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const chat = chats[0];
    
    // Get participants
    const participants = await query('SELECT * FROM chat_participants WHERE chat_id = ? ORDER BY message_count DESC', [chatId]);
    
    res.json({ 
      chat: {
        ...chat,
        participants
      }
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Get messages for a chat
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50, search } = req.query;
    
    // Verify chat belongs to user
    const chats = await query('SELECT id FROM chats WHERE id = ? AND user_id = ?', [chatId, req.userId]);
    if (chats.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE chat_id = ?';
    let params = [chatId];
    
    if (search) {
      whereClause += ' AND (content LIKE ? OR sender LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    const messages = await query(`
      SELECT * FROM messages 
      ${whereClause}
      ORDER BY timestamp ASC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    // Get total count
    const totalResult = await query(`
      SELECT COUNT(*) as total FROM messages ${whereClause}
    `, params);
    
    const total = totalResult[0].total;
    
    res.json({ 
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Delete chat
router.delete('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Verify chat belongs to user
    const chats = await query('SELECT file_path FROM chats WHERE id = ? AND user_id = ?', [chatId, req.userId]);
    if (chats.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }
    
    // Delete from database (cascade will handle related tables)
    await query('DELETE FROM chats WHERE id = ?', [chatId]);
    
    // TODO: Delete files from filesystem
    // const filePath = chats[0].file_path;
    // await fs.rmdir(filePath, { recursive: true });
    
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

// Search messages across all chats
router.get('/search/messages', authenticateToken, async (req, res) => {
  try {
    const { q, chatId } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }
    
    let whereClause = `WHERE c.user_id = ? AND (m.content LIKE ? OR m.sender LIKE ?)`;
    let params = [req.userId, `%${q}%`, `%${q}%`];
    
    if (chatId) {
      whereClause += ' AND c.id = ?';
      params.push(chatId);
    }
    
    const results = await query(`
      SELECT m.*, c.name as chat_name, c.id as chat_id
      FROM messages m
      JOIN chats c ON m.chat_id = c.id
      ${whereClause}
      ORDER BY m.timestamp DESC
      LIMIT 100
    `, params);
    
    res.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
