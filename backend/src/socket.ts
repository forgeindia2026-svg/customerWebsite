import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Register user to personal room
    socket.on('join_user', (userId: string) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`👤 Socket ${socket.id} joined user room: user:${userId}`);
      }
    });

    // Register user to role room (admin / technician / customer)
    socket.on('join_role', (role: string) => {
      if (role) {
        socket.join(`role:${role.toLowerCase()}`);
        console.log(`🛡️ Socket ${socket.id} joined role room: role:${role.toLowerCase()}`);
      }
    });

    // Join specific job room for live technician tracking
    socket.on('join_job', (jobId: string) => {
      if (jobId) {
        socket.join(`job:${jobId}`);
        console.log(`📍 Socket ${socket.id} joined job room: job:${jobId}`);
      }
    });

    // Leave job room
    socket.on('leave_job', (jobId: string) => {
      if (jobId) {
        socket.leave(`job:${jobId}`);
      }
    });

    // Handle technician live GPS location update event directly via socket
    socket.on('technician_location_update', (data: { jobId: string; technicianId: string; lat: number; lng: number; updatedAt?: string }) => {
      if (data.jobId && io) {
        io.to(`job:${data.jobId}`).emit('job:location_updated', data);
        io.to('role:admin').emit('job:location_updated', data);
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToRole = (role: string, event: string, data: any) => {
  if (io) {
    io.to(`role:${role.toLowerCase()}`).emit(event, data);
  }
};

export const emitToJob = (jobId: string, event: string, data: any) => {
  if (io) {
    io.to(`job:${jobId}`).emit(event, data);
  }
};

export const broadcastEvent = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};
