import { type Response } from "express";

/**
 * Standard JSON envelope returned by every endpoint.
 *
 * Keeping a single shape means clients can branch on `success` and read
 * `error.code` without knowing which route they hit. `meta.timestamp` is
 * always present; `data`, `error`, and `url` are populated per-helper.
 */
export interface CustomResponse<T = unknown> {
    success?: boolean;
    data?: T;
    message?: string;
    error?: {
        code: string;
        details?: string;
    };
    url?: string;
    meta: {
        timestamp: string;
        [key: string]: unknown;
    };
}

/**
 * Thin helper layer over Express `res` that writes the {@link CustomResponse}
 * envelope with the correct status code. Controllers should return through
 * these helpers instead of calling `res.json` / `res.status` directly so the
 * response shape stays uniform across the API.
 */
export default class ResponseWriter {
    /**
     * Success response whose payload is pre-wrapped as `{ data }`.
     *
     * Use when the caller already holds a `{ data: T }` object; prefer
     * {@link ResponseWriter.success} when you have the bare value.
     */
    static secure_success<T>(
        res: Response,
        payload: { data: T },
        message: string = "Request successfull",
        status_code: number = 200,
    ) {
        const response: CustomResponse<T> = {
            success: true,
            data: payload.data,
            message,
            meta: { timestamp: new Date().toISOString() },
        };

        this.send_response(res, response, status_code);
    }

    static success<T>(
        res: Response,
        data: T,
        message: string = "Request successfull",
        status_code: number = 200,
    ) {
        const response: CustomResponse<T> = {
            success: true,
            data,
            message,
            meta: { timestamp: new Date().toISOString() },
        };

        this.send_response(res, response, status_code);
    }

    /**
     * Generic error response. Reach for a specific helper
     * ({@link ResponseWriter.not_found}, {@link ResponseWriter.invalid_data},
     * etc.) when one fits; use this for ad-hoc codes.
     */
    static error(
        res: Response,
        code: string,
        message: string = "An error occurred",
        details?: string,
        status_code: number = 500,
    ) {
        const response: CustomResponse = {
            success: false,
            message,
            error: {
                code,
                details,
            },
            meta: { timestamp: new Date().toISOString() },
        };
        this.send_response(res, response, status_code);
    }

    /**
     * Redirect envelope. Returns the target in `url` rather than issuing an
     * HTTP `Location` redirect, so SPA clients can decide how to navigate.
     *
     * Responds `200`, NOT a 3xx: the body is meant to be read by JS (e.g. axios
     * `fetch`), and 3xx statuses are rejected by axios's default `validateStatus`
     * (resolve only 2xx), which would surface as an error and skip the client's
     * success handler. A real HTTP redirect would need a `Location` header, which
     * this helper intentionally does not set.
     */
    static redirect(
        res: Response,
        url: string,
        message: string = "redirecting",
        status_code: number = 200,
    ) {
        const response: CustomResponse = {
            success: true,
            message,
            url,
            meta: {
                timestamp: new Date().toISOString(),
            },
        };
        this.send_response(res, response, status_code);
    }

    /** `401 Unauthorized` with code `NOT_AUTHORIZED`. Use for missing or invalid credentials. */
    static not_authorized(
        res: Response,
        message: string = "Not authorized",
        status_code: number = 401,
    ) {
        const response: CustomResponse = {
            success: false,
            message,
            error: {
                code: "NOT_AUTHORIZED",
            },
            meta: { timestamp: new Date().toISOString() },
        };
        this.send_response(res, response, status_code);
    }

    /** `201 Created` success response for newly created resources. */
    static created<T>(
        res: Response,
        data: T,
        message: string = "Resource created successfully",
        status_code: number = 201,
    ): void {
        const response: CustomResponse<T> = {
            success: true,
            data,
            message,
            meta: { timestamp: new Date().toISOString() },
        };
        this.send_response(res, response, status_code);
    }

    /**
     * `429 Too Many Requests` with code `RATE_LIMIT_EXCEEDED`. Sets the
     * `Retry-After` header (rounded up) when a finite `retry_after_seconds` is supplied.
     */
    static too_many_requests(
        res: Response,
        message: string = "Rate limit exceeded. Please slow down.",
        retry_after_seconds?: number,
    ) {
        if (typeof retry_after_seconds === "number" && Number.isFinite(retry_after_seconds)) {
            res.setHeader("Retry-After", Math.ceil(retry_after_seconds).toString());
        }
        const response: CustomResponse = {
            success: false,
            message,
            error: {
                code: "RATE_LIMIT_EXCEEDED",
            },
            meta: { timestamp: new Date().toISOString() },
        };
        this.send_response(res, response, 429);
    }

    /** `404 Not Found` with code `NOT_FOUND`. */
    static not_found(res: Response, messaage: string = "Resource not found") {
        const response: CustomResponse = {
            success: false,
            message: messaage,
            error: {
                code: "NOT_FOUND",
            },
            meta: { timestamp: new Date().toISOString() },
        };
        this.send_response(res, response, 404);
    }

    /**
     * `500 Internal Server Error` with code `INTERNAL_SERVER_ERROR`. The fixed
     * catch-all for unexpected failures — no caller-supplied detail is leaked to the client.
     */
    static system_error(res: Response) {
        const response: CustomResponse = {
            success: false,
            message: "Internal server error",
            error: {
                code: "INTERNAL_SERVER_ERROR",
            },
            meta: { timestamp: new Date().toISOString() },
        };
        this.send_response(res, response, 500);
    }

    /**
     * `400`-class validation failure with code `INVALID_DATA`. Use after a
     * failed schema parse on the request body/params.
     */
    static invalid_data(
        res: Response,
        message: string = "Invalid or Incomplete data provided",
        status_code: number = 400,
    ) {
        const response: CustomResponse = {
            success: false,
            message,
            error: {
                code: "INVALID_DATA",
            },
            meta: { timestamp: new Date().toISOString() },
        };
        this.send_response(res, response, status_code);
    }

    /**
     * Fully caller-controlled response — set `success`, `code`, `message`,
     * status, and optional `data`/`details` explicitly. Use for domain
     * outcomes that don't map onto the named helpers (e.g. `OTP_COOLDOWN`,
     * `OTP_EXPIRED`).
     */
    static custom<T>(
        res: Response,
        success: boolean,
        code: string,
        message: string,
        status_code: number,
        data?: T,
        details?: string,
    ) {
        const response: CustomResponse = {
            success,
            data,
            message,
            error: {
                code,
                details,
            },
            meta: { timestamp: new Date().toISOString() },
        };
        this.send_response(res, response, status_code);
    }

    /**
     * Low-level writer that serializes the envelope and sets the status.
     * Every other helper funnels through here; call directly only if you've
     * already built a {@link CustomResponse}.
     */
    static send_response<T>(res: Response, response: CustomResponse<T>, status_code: number) {
        res.status(status_code).json(response);
    }
}
