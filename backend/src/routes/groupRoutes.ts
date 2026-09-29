import { Router, Request, Response } from 'express';
import ChatGroup from '../models/ChatGroup';
import Message from '../models/Message';

const router = Router();

// POST /api/groups - Create a new group
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, adminId, members } = req.body;
    if (!name || !adminId || !members || !members.length) {
      return res.status(400).json({ success: false, message: 'Name, adminId, and members are required.' });
    }

    // Include admin in members if not already
    const groupMembers = Array.from(new Set([...members, adminId]));

    const group = new ChatGroup({
      name,
      adminId,
      members: groupMembers
    });

    await group.save();
    res.status(201).json({ success: true, data: group });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/groups/:userId - Get all groups for a user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const groups = await ChatGroup.find({ members: userId }).lean();
    res.json({ success: true, data: groups });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
