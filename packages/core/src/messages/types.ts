export type MessageType = "message" | "error" | "activity";

export type MessageBase = {
  type: MessageType;
  roomId: string;
  sender: string;
  ts: Date;
};

export type MessageMessage = MessageBase & {
  type: "message";
  content: string;
};

export type ActivityMessage = MessageBase & {
  type: "activity";
  action: "join" | "leave";
};
