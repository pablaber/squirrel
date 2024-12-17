export const WsMessageErrorCodes = {
  MALFORMED_MESSAGE: "MALFORMED_MESSAGE",
  INVALID_MESSAGE_SCHEMA: "INVALID_MESSAGE_SCHEMA",
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
};

type WsMessageErrorCodeValue =
  (typeof WsMessageErrorCodes)[keyof typeof WsMessageErrorCodes];

export class WsMessageError extends Error {
  code: WsMessageErrorCodeValue;
  context: Record<string, unknown> | undefined;

  constructor(
    message: string,
    code: WsMessageErrorCodeValue,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "WsMessageError";
    this.code = code;
    this.context = context;
  }

  toJSON() {
    return {
      error: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
    };
  }
}
