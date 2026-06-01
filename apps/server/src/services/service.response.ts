import { type Response } from "express";

/**
 * Standard JSON envelope returned by every endpoint.
 *
 * Keeping a single shape means clients can branch on `success` and read
 * `error.code` without knowing which route they hit. `meta.timestamp` is
 * always present; `data`, `error`, and `url` are populated per-helper.
 *
 * @typeParam T - Shape of the `data` payload for success responses.
 */
export interface CustomResponse<T = unknown> {
	/** `true` for success helpers, `false` for error helpers. */
	success?: boolean;
	/** Payload returned on success. Omitted on errors. */
	data?: T;
	/** Human-readable summary, safe to surface in the UI. */
	message?: string;
	/** Machine-readable failure detail. Present only on error responses. */
	error?: {
		/** Stable, uppercase identifier clients can switch on (e.g. `NOT_FOUND`). */
		code: string;
		/** Optional extra context for debugging; not guaranteed to be user-safe. */
		details?: string;
	};
	/** Target location for redirect responses. */
	url?: string;
	/** Envelope metadata. `timestamp` is always set; extra keys are allowed. */
	meta: {
		/** ISO-8601 time the response was built. */
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
	 *
	 * @param res - Express response object.
	 * @param payload - Object holding the payload under `data`.
	 * @param message - Human-readable summary.
	 * @param status_code - HTTP status (default `200`).
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

	/**
	 * Standard success response carrying a bare payload.
	 *
	 * @param res - Express response object.
	 * @param data - Payload to return under `data`.
	 * @param message - Human-readable summary.
	 * @param status_code - HTTP status (default `200`).
	 */
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
	 *
	 * @param res - Express response object.
	 * @param code - Stable error code for clients to branch on.
	 * @param message - Human-readable summary.
	 * @param details - Optional debugging context.
	 * @param status_code - HTTP status (default `500`).
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
	 * @param res - Express response object.
	 * @param url - Destination URL.
	 * @param message - Human-readable summary.
	 * @param status_code - HTTP status (default `302`).
	 */
	static redirect(
		res: Response,
		url: string,
		message: string = "redirecting",
		status_code: number = 302,
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

	/**
	 * `401 Unauthorized` with code `NOT_AUTHORIZED`. Use for missing or
	 * invalid credentials.
	 *
	 * @param res - Express response object.
	 * @param message - Human-readable summary.
	 * @param status_code - HTTP status (default `401`).
	 */
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

	/**
	 * `201 Created` success response for newly created resources.
	 *
	 * @param res - Express response object.
	 * @param data - The created resource.
	 * @param message - Human-readable summary.
	 * @param status_code - HTTP status (default `201`).
	 */
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
	 * `Retry-After` header when a finite retry window is supplied.
	 *
	 * @param res - Express response object.
	 * @param message - Human-readable summary.
	 * @param retry_after_seconds - Seconds until the caller may retry; written
	 * to the `Retry-After` header (rounded up) when finite.
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

	/**
	 * `404 Not Found` with code `NOT_FOUND`.
	 *
	 * @param res - Express response object.
	 * @param messaage - Human-readable summary.
	 */
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
	 * `500 Internal Server Error` with code `INTERNAL_SERVER_ERROR`. The
	 * fixed catch-all for unexpected failures — no caller-supplied detail is
	 * leaked to the client.
	 *
	 * @param res - Express response object.
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
	 *
	 * @param res - Express response object.
	 * @param message - Human-readable summary.
	 * @param status_code - HTTP status (default `400`).
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
	 *
	 * @param res - Express response object.
	 * @param success - Whether this represents a success or failure.
	 * @param code - Stable error/outcome code.
	 * @param message - Human-readable summary.
	 * @param status_code - HTTP status.
	 * @param data - Optional payload.
	 * @param details - Optional debugging context.
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
	 *
	 * @param res - Express response object.
	 * @param response - Pre-built response envelope.
	 * @param status_code - HTTP status to send.
	 */
	static send_response<T>(res: Response, response: CustomResponse<T>, status_code: number) {
		res.status(status_code).json(response);
	}
}
