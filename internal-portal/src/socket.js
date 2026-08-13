import { io } from 'socket.io-client';
import { getApiUrl } from './utils/config';

const SOCKET_URL = getApiUrl();

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
