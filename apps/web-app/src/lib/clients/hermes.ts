import { clientConfig } from '$lib/config/client-config';
import { ids } from '@squirrel/core';
import { WsMessage, WsMessageError } from '@squirrel/core/messages';

type HermesOptions = {
	roomId: string;
	fingerprint: string;
};

export class Hermes {
	private socket?: WebSocket;
	private roomId: string;
	private fingerprint: string;

	public connected: boolean;

	constructor(options: HermesOptions) {
		this.roomId = options.roomId;
		this.fingerprint = options.fingerprint;
		this.connected = false;
	}

	/**
	 * Connects to the web socket for the room
	 */
	connect() {
		return new Promise((resolve, reject) => {
			const roomSocketUrl = `${clientConfig.messageServiceUrlBase}/ws/room/${this.roomId}?fingerprint=${this.fingerprint}`;
			this.socket = new WebSocket(roomSocketUrl);

			this.socket.addEventListener('open', () => {
				this.connected = true;
				resolve(true);
			});
			this.socket.addEventListener('error', (error) => {
				this.connected = false;
				reject(error);
			});
		});
	}

	/**
	 * Sends a message to the room
	 */
	sendMessage(message: string) {
		verifySocket(this.socket);
		const messageId = ids.generateMessageId();
		const messageData = {
			id: messageId,
			content: message,
			ts: new Date().valueOf()
		};
		this.socket.send(JSON.stringify(messageData));
	}

	/**
	 * Listens for messages from the room and invokes the callback with the message or error
	 */
	onMessage(callback: (message: WsMessage | null, error: WsMessageError | null) => void) {
		verifySocket(this.socket);
		this.socket.addEventListener('message', (event) => {
			const [error, message] = WsMessage.fromWebSocketString(event.data);
			return callback(message, error);
		});
	}
}

/**
 * Verifies the given socket exists
 */
function verifySocket(socket: WebSocket | undefined): asserts socket is WebSocket {
	if (!socket) {
		throw new Error('Socket not connected. Call connect() first.');
	}
}
