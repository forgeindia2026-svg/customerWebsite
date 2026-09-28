import { Router, Request, Response } from 'express';
import User from '../models/User';
import Message from '../models/Message';
import { emitToUser, getIO } from '../socket';

const router = Router();

// Helper: create stable room id (sorted so both directions produce same id)
const makeRoomId = (a: string, b: string) => [a, b].sort().join('_');

// GET /api/users?role=TECHNICIAN,ADMIN,HR   — list employees (for contacts list)
router.get('/', async (req: Request, res: Response) => {
  try {
    const rolesParam = req.query.roles as string;
    const roles = rolesParam 
      ? rolesParam.split(',').map(r => r.trim().toUpperCase())
      : ['TECHNICIAN', 'ADMIN', 'HR'];
    
    const users = await User.find({ role: { $in: roles }, isActive: { $ne: false } } as any)
      .select('name email phone role avatar isAvailable rating')
      .sort({ role: 1, name: 1 })
      .lean();

    res.json({ success: true, data: users });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/messages/:roomId  — fetch chat history between 2 users
router.get('/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const myId = req.query.myId as string;
    const messages = await Message.find({ roomId }).sort({ createdAt: 1 }).lean();

    // Mark all messages in this room as read by me
    if (myId) {
      await Message.updateMany(
        { roomId, readBy: { $ne: myId } },
        { $push: { readBy: myId } }
      );
    }

    res.json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/messages   — send a new message
router.post('/', async (req: Request, res: Response) => {
  try {
    const { senderId, senderName, senderRole, recipientId, recipientName, text } = req.body;
    if (!senderId || !recipientId || !text?.trim()) {
      return res.status(400).json({ success: false, message: 'senderId, recipientId, and text required.' });
    }

    const roomId = makeRoomId(senderId, recipientId);
    const message = new Message({
      senderId,
      senderName,
      senderRole: senderRole || 'TECHNICIAN',
      recipientId,
      recipientName,
      roomId,
      text: text.trim(),
      readBy: [senderId]
    });
    await message.save();

    // Real-time push to recipient's socket room
    try {
      const io = getIO();
      io.to(`user:${recipientId}`).emit('message:new', {
        ...message.toObject(),
        roomId
      });
    } catch (_) {}

    res.status(201).json({ success: true, data: message });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/messages/unread-counts/:userId — unread counts per room for a user
router.get('/unread-counts/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    // All messages NOT read by this user, sent TO this user
    const unread = await Message.aggregate([
      { $match: { recipientId: userId, readBy: { $ne: userId } } },
      { $group: { _id: '$roomId', count: { $sum: 1 } } }
    ]);
    const counts: Record<string, number> = {};
    unread.forEach((u: any) => { counts[u._id] = u.count; });
    res.json({ success: true, data: counts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
