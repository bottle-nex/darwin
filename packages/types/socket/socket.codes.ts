// Standard WebSocket close codes (RFC 6455)
export enum StandardSocketCloseCode {
    NORMAL_CLOSURE = 1000,
    GOING_AWAY = 1001,
    PROTOCOL_ERROR = 1002,
    UNSUPPORTED_DATA = 1003,
    NO_STATUS_RECEIVED = 1005,
    ABNORMAL_CLOSURE = 1006,
    INVALID_PAYLOAD = 1007,
    POLICY_VIOLATION = 1008,
    MESSAGE_TOO_BIG = 1009,
    MANDATORY_EXTENSION = 1010,
    INTERNAL_ERROR = 1011,
    SERVICE_RESTART = 1012,
    TRY_AGAIN_LATER = 1013,
}

// Custom application-level close codes (must be in 4000–4999 range)
export enum AppSocketCloseCode {
    UNAUTHORIZED = 4000,
    INVALID_PROJECT = 4001,
    TOKEN_EXPIRED = 4002,
}

export const INTENTIONAL_CLOSE_CODES = new Set<number>([
    StandardSocketCloseCode.NORMAL_CLOSURE,
    StandardSocketCloseCode.GOING_AWAY,
]);

export function is_intentional_closure(code: number): boolean {
    return INTENTIONAL_CLOSE_CODES.has(code);
}
