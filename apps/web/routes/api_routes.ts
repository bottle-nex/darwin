const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const API_URL = BACKEND_URL + "/api/v1";
export const AUTH_URL = API_URL + "/auth";

export const SIGNIN_URL = AUTH_URL + "/sign-in";
export const REQUEST_OTP_URL = AUTH_URL + "/otp/request";
export const VERIFY_OTP_URL = AUTH_URL + "/otp/verify";
