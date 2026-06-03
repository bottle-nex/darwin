const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const API_URL = BACKEND_URL + "/api/v1";
export const AUTH_URL = API_URL + "/auth";

export const SIGNIN_URL = AUTH_URL + "/sign-in";
export const REQUEST_OTP_URL = AUTH_URL + "/otp/request";
export const VERIFY_OTP_URL = AUTH_URL + "/otp/verify";

export const LIST_ORG = API_URL + "/org";
export const CREATE_ORG = API_URL + "/org/create";
export const PLAYGROUND_URL = API_URL + "/playground";
export const PRELOAD_URL = PLAYGROUND_URL + "/preload";
