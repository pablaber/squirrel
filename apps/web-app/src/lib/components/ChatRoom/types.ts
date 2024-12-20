import type { types } from '@squirrel/db';
import { type WsMessageType } from '@squirrel/core/messages';

export type RoomMessage = Pick<
	types.Message,
	'id' | 'sender' | 'content' | 'ts'
> & {
	type: WsMessageType;
};
