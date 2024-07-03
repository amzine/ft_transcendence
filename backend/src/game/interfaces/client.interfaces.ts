import { Socket } from 'socket.io';

export interface Client extends Socket {
	data: { username: string };
}
