const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4402";

export const API_URL = `${BACKEND_URL}/api/v1`;

export const ADMIN_URL = `${API_URL}/admin`;

export const REQUEST_ADMIN_OTP_URL = `${ADMIN_URL}/auth/otp/request`;
export const VERIFY_ADMIN_OTP_URL = `${ADMIN_URL}/auth/otp/verify`;

export const POSTS_URL = `${ADMIN_URL}/posts`;
export const post_url = (id: string) => `${POSTS_URL}/${id}`;
export const SIGNED_UPLOAD_URL = `${ADMIN_URL}/uploads/signed-url`;
