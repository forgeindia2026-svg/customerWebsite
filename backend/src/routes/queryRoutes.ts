import express, { Request, Response } from 'express';
import Query from '../models/Query';
import { broadcastEvent, emitToRole } from '../socket';

const router = express.Router();

// Seed initial representative queries if collection is empty
const seedInitialQueries = async () => {
  const count = await Query.countDocuments();
  if (count > 0) return;

  const sampleQueries = [
    {
      ticketId: 'TKT-1042',
      type: 'Customer',
      raisedBy: 'Karthik',
      phone: '8861384719',
      email: 'karthikeyanb25@gmail.com',
      subject: 'Mobile App Live View streaming latency',
      category: 'Mobile App & DVR Support',
      priority: 'High',
      status: 'In Progress',
      description: 'The mobile app takes about 10-15 seconds to load the 4-channel live stream feed over 4G data. Please check port forwarding or cloud P2P bandwidth.',
      messages: [
        {
          sender: 'Karthik',
          role: 'CUSTOMER',
          time: 'Yesterday at 04:30 PM',
          text: 'Hi team, live view streaming has high latency on 4G network. Can you optimize the sub-stream settings?'
        },
        {
          sender: 'Admin Support',
          role: 'ADMIN',
          time: 'Yesterday at 05:15 PM',
          text: 'Hello Karthik, our networking specialist has adjusted the sub-stream bitrate on your DVR. Please test again and let us know.'
        }
      ]
    },
    {
      ticketId: 'TKT-1088',
      type: 'Customer',
      raisedBy: 'saran',
      phone: '9600975483',
      email: 'sarankumar5483@gmail.com',
      subject: 'Night Vision IR LED clarification for outdoor driveway',
      category: 'Hardware & Configuration',
      priority: 'Medium',
      status: 'Open',
      description: 'Want to confirm if the CP Plus 4MP Dual Light bullet camera automatically switches between Warm Light and IR at 7:00 PM.',
      messages: [
        {
          sender: 'saran',
          role: 'CUSTOMER',
          time: 'Today at 09:10 AM',
          text: 'Does the dual-light camera stay full-color all night or switch to infrared when ambient street light dims?'
        }
      ]
    },
    {
      ticketId: 'TKT-2051',
      type: 'Technician',
      raisedBy: 'Siva (Senior Tech)',
      phone: '9840123456',
      email: 'siva.tech@sktechnology.com',
      subject: 'Request 30m extra Cat6 Solid Copper spool for Anna Nagar site',
      category: 'Materials & Inventory',
      priority: 'High',
      status: 'In Progress',
      description: 'The site required external conduit routing around the rear terrace boundary wall. Extra 30m cable needed to finish weather-proof termination.',
      messages: [
        {
          sender: 'Siva (Senior Tech)',
          role: 'TECHNICIAN',
          time: 'Today at 08:45 AM',
          text: 'Need dispatch approval for 30m D-Link Cat6 spool from central store for job #SK-ORD-11425.'
        },
        {
          sender: 'Admin',
          role: 'ADMIN',
          time: 'Today at 09:00 AM',
          text: 'Approved from Main Warehouse stock. Delivery dispatched via courier partner.'
        }
      ]
    },
    {
      ticketId: 'TKT-2094',
      type: 'Technician',
      raisedBy: 'Manoj (Installation Tech)',
      phone: '9840987654',
      email: 'manoj.tech@sktechnology.com',
      subject: 'PoE Switch 8-Port handshake issue on Hikvision NVR',
      category: 'Technical Troubleshooting',
      priority: 'Medium',
      status: 'Open',
      description: 'Channels 3 and 4 dropping packets periodically during continuous 4K recording. May require firmware patch.',
      messages: [
        {
          sender: 'Manoj (Installation Tech)',
          role: 'TECHNICIAN',
          time: 'Today at 10:05 AM',
          text: 'Hikvision NVR firmware v4.1.2 seems incompatible with the green PoE switch. Can we flash firmware v4.2?'
        }
      ]
    }
  ];

  await Query.insertMany(sampleQueries);
};

// GET all queries
router.get('/', async (req: Request, res: Response) => {
  try {
    await seedInitialQueries();

    const { type, status, raisedById, search } = req.query;
    const filter: any = {};

    if (type && type !== 'All') {
      filter.type = type;
    }
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (raisedById) {
      filter.raisedById = raisedById;
    }
    if (search && typeof search === 'string') {
      filter.$or = [
        { ticketId: { $regex: search, $options: 'i' } },
        { raisedBy: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const queries = await Query.find(filter).sort({ updatedAt: -1, createdAt: -1 });
    
    // Map to standard frontend UI format
    const formatted = queries.map(q => ({
      id: q.ticketId,
      _id: q._id,
      ticketId: q.ticketId,
      type: q.type,
      raisedBy: q.raisedBy,
      raisedById: q.raisedById,
      phone: q.phone,
      email: q.email,
      subject: q.subject,
      category: q.category,
      priority: q.priority,
      status: q.status,
      description: q.description,
      date: q.createdAt ? new Date(q.createdAt).toISOString().split('T')[0] : '2026-08-25',
      time: q.createdAt ? new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 AM',
      messages: q.messages || []
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Error fetching queries:', error);
    res.status(500).json({ message: 'Server error fetching queries' });
  }
});

// POST Create new query
router.post('/', async (req: Request, res: Response) => {
  try {
    const { type, raisedBy, raisedById, phone, email, subject, category, priority, description, message } = req.body;
    
    if (!raisedBy || !subject) {
      return res.status(400).json({ message: 'raisedBy and subject are required' });
    }

    const count = await Query.countDocuments();
    const ticketId = `TKT-${1000 + count + Math.floor(Math.random() * 900)}`;

    const initialMessages = [];
    if (description || message) {
      initialMessages.push({
        sender: raisedBy,
        role: type === 'Technician' ? 'TECHNICIAN' : 'CUSTOMER',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: message || description
      });
    }

    const newQuery = new Query({
      ticketId,
      type: type === 'Technician' ? 'Technician' : 'Customer',
      raisedBy,
      raisedById: raisedById || null,
      phone: phone || '',
      email: email || '',
      subject,
      category: category || 'General Support',
      priority: priority || 'Medium',
      status: 'Open',
      description: description || message || '',
      messages: initialMessages
    });

    await newQuery.save();

    const formatted = {
      id: newQuery.ticketId,
      _id: newQuery._id,
      ticketId: newQuery.ticketId,
      type: newQuery.type,
      raisedBy: newQuery.raisedBy,
      raisedById: newQuery.raisedById,
      phone: newQuery.phone,
      email: newQuery.email,
      subject: newQuery.subject,
      category: newQuery.category,
      priority: newQuery.priority,
      status: newQuery.status,
      description: newQuery.description,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messages: newQuery.messages
    };

    broadcastEvent('query:created', formatted);
    emitToRole('admin', 'query:new_ticket', formatted);

    res.status(201).json({ success: true, data: formatted });
  } catch (error: any) {
    console.error('Error creating query:', error);
    res.status(500).json({ message: 'Server error creating query' });
  }
});

// PUT Update query status (Open, In Progress, Resolved)
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const queryId = String(req.params.id || '');
    const { status } = req.body;

    if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(queryId);
    const query = await Query.findOne({ $or: [{ ticketId: queryId }, ...(isMongoId ? [{ _id: queryId }] : [])] });
    if (!query) {
      return res.status(404).json({ message: 'Query ticket not found' });
    }

    query.status = status as any;
    await query.save();

    broadcastEvent('query:status_updated', { ticketId: query.ticketId, status: query.status });

    res.json({ success: true, message: `Status updated to ${status}`, query });
  } catch (error: any) {
    console.error('Error updating query status:', error);
    res.status(500).json({ message: 'Server error updating query status' });
  }
});

// POST Add response/reply message to a query
router.post('/:id/reply', async (req: Request, res: Response) => {
  try {
    const queryId = String(req.params.id || '');
    const { sender, role, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Reply text is required' });
    }

    const isMongoId = /^[0-9a-fA-F]{24}$/.test(queryId);
    const query = await Query.findOne({ $or: [{ ticketId: queryId }, ...(isMongoId ? [{ _id: queryId }] : [])] });
    if (!query) {
      return res.status(404).json({ message: 'Query ticket not found' });
    }

    const newMessage = {
      sender: sender || 'Support Staff',
      role: role || 'ADMIN',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: text.trim(),
      createdAt: new Date()
    };

    query.messages.push(newMessage as any);
    await query.save();

    broadcastEvent('query:replied', { ticketId: query.ticketId, message: newMessage });

    res.json({ success: true, message: 'Reply posted successfully', newMessage, query });
  } catch (error: any) {
    console.error('Error posting reply:', error);
    res.status(500).json({ message: 'Server error posting reply' });
  }
});

export default router;
