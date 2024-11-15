import { Server as ServerIO } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/lib/socket';

export default function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO,
) {
  if (!res.socket.server.io) {
    const io = new ServerIO(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      socket.on('donation-created', (donation) => {
        socket.broadcast.emit('new-donation', donation);
      });

      socket.on('donation-claimed', (donation) => {
        socket.broadcast.emit('donation-updated', donation);
      });

      socket.on('donation-completed', (donation) => {
        socket.broadcast.emit('donation-updated', donation);
      });
    });
  }

  res.end();
}