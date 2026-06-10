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
export const DASHBOARD_URL = (orgSlug: string) => `${PLAYGROUND_URL}/dashboard/${orgSlug}`;

export const CREATE_PROJECT = API_URL + "/project/create";
export const GET_PROJECT = (projectId: string) => `${API_URL}/project/${projectId}`;

export const CREATE_TEAM = API_URL + "/teams/create";
export const GET_TEAM_MEMBERS = (teamId: string) => `${API_URL}/teams/${teamId}/members`;
export const DELETE_TEAM = (teamId: string) => `${API_URL}/teams/${teamId}`;
export const CHANGE_MEMBER_AUTHORITY = API_URL + "/teams/change-authority";
export const REMOVE_MEMBERS = API_URL + "/teams/remove-members";

export const GITHUB_URL = API_URL + "/github";
export const GITHUB_CONNECT_START = GITHUB_URL + "/connect/start";
export const GITHUB_CONNECT_COMPLETE = GITHUB_URL + "/connect/complete";
export const GITHUB_DISCONNECT = (orgId: string) => `${GITHUB_URL}/connect/${orgId}`;
export const GITHUB_REPOS = (orgId: string) => `${GITHUB_URL}/installations/${orgId}/repos`;

// <----------------- INVITATION ROUTES ----------------->
export const INVITATIONS_URL = API_URL + "/invitations";
export const LIST_INVITES_URL = INVITATIONS_URL;
export const ACCEPT_INVITE_URL = INVITATIONS_URL + "/accept";
export const REJECT_INVITE_URL = INVITATIONS_URL + "/reject";
export const INVITE_MEMBER_URL = INVITATIONS_URL + "/invite";
export const INVITES_PREVIEW_URL = (token: string) => `${INVITATIONS_URL}/${token}`;
