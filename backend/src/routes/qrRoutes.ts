import express from 'express';
import QRCode from '../models/QRCode';

const router = express.Router();

// GET all QR Codes
router.get('/', async (req, res) => {
  try {
    const qrcodes = await QRCode.find().sort({ createdAt: -1 });
    res.json(qrcodes);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new QR Code
router.post('/', async (req, res) => {
  try {
    const { title, image, category } = req.body;
    const newQR = new QRCode({ title, image, category });
    const savedQR = await newQR.save();
    res.status(201).json(savedQR);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a QR Code
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await QRCode.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'QR Code not found' });
    res.json({ message: 'QR Code deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
