import { clientConfig } from '$lib/config/client-config';
import { z } from 'zod';
import { generalUtils } from '$lib/utils';

type HermesOptions = {
	roomId: string;
	fingerprint: string;
};

const messageSchema = z.object({
	success: z.literal(true),
	message: z.object({
		id: z.string(),
		roomId: z.string(),
		sender: z.string(),
		content: z.string(),
		ts: z.string()
	})
});

const errorSchema = z.object({
	success: z.literal(false),
	error: z.object({
		code: z.string(),
		message: z.string(),
		ts: z.string()
	})
});

type ParsedMessage = z.infer<typeof messageSchema>;
type ParsedError = z.infer<typeof errorSchema>;

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

	sendMessage(message: string) {
		verifySocket(this.socket);
		const messageId = generalUtils.generateMessageId();
		const messageData = {
			id: messageId,
			content: message,
			ts: new Date()
		};
		this.socket.send(JSON.stringify(messageData));
	}

	onMessage(callback: (message: ParsedMessage | null, error?: ParsedError) => void) {
		verifySocket(this.socket);
		this.socket.addEventListener('message', (event) => {
			let jsonMessage;
			try {
				jsonMessage = JSON.parse(event.data) as ParsedMessage;
			} catch {
				return callback(null, {
					success: false,
					error: {
						code: 'E_PARSE_JSON',
						message: 'Error parsing message as JSON',
						ts: new Date().toISOString()
					}
				});
			}

			// Verify the message is valid
			const { success: isSuccessMessage, data: successMessage } =
				messageSchema.safeParse(jsonMessage);
			if (isSuccessMessage) {
				return callback(successMessage);
			}

			const { success: isErrorMessage, data: errorMessage } = errorSchema.safeParse(jsonMessage);
			if (isErrorMessage) {
				return callback(null, errorMessage);
			}

			// If we reach this point, the message is invalid
			console.log(jsonMessage);
			return callback(null, {
				success: false,
				error: {
					code: 'E_INVALID_MESSAGE',
					message: 'Invalid message format',
					ts: new Date().toISOString()
				}
			});
		});
	}
}

function verifySocket(socket: WebSocket | undefined): asserts socket is WebSocket {
	if (!socket) {
		throw new Error('Socket not connected. Call connect() first.');
	}
}
