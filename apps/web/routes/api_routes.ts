const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
export const API_URL = BACKEND_URL + "/api/v1";

// <--------------------- AUTH ROUTES --------------------->
export const AUTH_URL = API_URL + "/auth";
export const SIGNIN_URL = AUTH_URL + "/sign-in";
export const REQUEST_OTP_URL = AUTH_URL + "/otp/request";
export const VERIFY_OTP_URL = AUTH_URL + "/otp/verify";

// <--------------------- ORG ROUTES --------------------->
export const LIST_ORG = API_URL + "/org";
export const CREATE_ORG = API_URL + "/org/create";
export const PLAYGROUND_URL = API_URL + "/playground";
export const PRELOAD_URL = PLAYGROUND_URL + "/preload";
export const DASHBOARD_URL = (orgSlug: string) => `${PLAYGROUND_URL}/dashboard/${orgSlug}`;

// <--------------------- PROJECT ROUTES --------------------->
export const PROJECT_URL = API_URL + "/project";
export const CREATE_PROJECT = PROJECT_URL + "/create";
export const GET_PROJECT = (projectId: string) => `${PROJECT_URL}/${projectId}`;
export const UPDATE_PROJECT_URL = PROJECT_URL + "/update";
export const DELETE_PROJECT_URL = PROJECT_URL + "/delete";
export const LIST_PROJECT_MEMBERS_URL = (project_id: string) =>
    `${PROJECT_URL}/${project_id}/members`;
export const SET_PROJECT_SECRET = (project_id: string) => `${PROJECT_URL}/${project_id}/secrets`;
export const LIST_PROJECT_SECRETS_URL = (project_id: string) =>
    `${PROJECT_URL}/${project_id}/secrets`;
export const DELETE_PROJECT_SECRET_URL = (project_id: string, key: string) =>
    `${PROJECT_URL}/${project_id}/secrets/${encodeURIComponent(key)}`;

// <--------------------- TAG ROUTES --------------------->
export const LIST_TAGS_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/tags`;
export const CREATE_TAG_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/tags`;
export const UPDATE_TAG_URL = (project_id: string, tagId: string) =>
    `${PROJECT_URL}/${project_id}/tags/${tagId}`;
export const DELETE_TAG_URL = (project_id: string, tagId: string) =>
    `${PROJECT_URL}/${project_id}/tags/${tagId}`;

// <--------------------- ISSUE TEMPLATE ROUTES --------------------->
export const LIST_TEMPLATES_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/templates`;
export const CREATE_TEMPLATE_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/templates`;
export const UPDATE_TEMPLATE_URL = (project_id: string, templateId: string) =>
    `${PROJECT_URL}/${project_id}/templates/${templateId}`;
export const DELETE_TEMPLATE_URL = (project_id: string, templateId: string) =>
    `${PROJECT_URL}/${project_id}/templates/${templateId}`;

// <--------------------- TEAM ROUTES --------------------->
export const CREATE_TEAM = API_URL + "/teams/create";
export const GET_TEAM_MEMBERS = (teamId: string) => `${API_URL}/teams/${teamId}/members`;
export const DELETE_TEAM = (teamId: string) => `${API_URL}/teams/${teamId}`;
export const CHANGE_MEMBER_AUTHORITY = API_URL + "/teams/change-authority";
export const REMOVE_MEMBERS = API_URL + "/teams/remove-members";

// <--------------------- GITHUB ROUTES --------------------->
export const GITHUB_URL = API_URL + "/github";
export const GITHUB_CONNECT_START = GITHUB_URL + "/connect/start";
export const GITHUB_CONNECT_COMPLETE = GITHUB_URL + "/connect/complete";
export const GITHUB_DISCONNECT = (orgId: string) => `${GITHUB_URL}/connect/${orgId}`;
export const GITHUB_REPOS = (orgId: string) => `${GITHUB_URL}/installations/${orgId}/repos`;

// <--------------------- ISSUE ROUTES --------------------->
export const ISSUES_URL = API_URL + "/issues";
export const CREATE_ISSUE_URL = ISSUES_URL + "/create";
export const CREATE_COLUMN_URL = ISSUES_URL + "/columns";
export const BOARD_URL = (project_id: string) => `${ISSUES_URL}/board/${project_id}`;
export const ISSUE_URL = (id: string) => `${ISSUES_URL}/${id}`;
export const COLUMN_URL = (id: string) => `${ISSUES_URL}/columns/${id}`;
export const REORDER_COLUMNS_URL = ISSUES_URL + "/columns/reorder";
export const ASSIGN_ISSUE_URL = (id: string) => `${ISSUES_URL}/${id}/assignees`;
export const UNASSIGN_ISSUE_URL = (id: string, userId: string) =>
    `${ISSUES_URL}/${id}/assignees/${userId}`;

// <--------------------- INVITATAION ROUTES --------------------->
export const INVITATIONS_URL = API_URL + "/invitations";
export const LIST_INVITES_URL = INVITATIONS_URL;
export const ACCEPT_INVITE_URL = INVITATIONS_URL + "/accept";
export const REJECT_INVITE_URL = INVITATIONS_URL + "/reject";
export const REVOKE_INVITE_URL = INVITATIONS_URL + "/revoke";
export const INVITE_MEMBER_URL = INVITATIONS_URL + "/invite";
export const INVITES_PREVIEW_URL = (token: string) => `${INVITATIONS_URL}/${token}`;

// <--------------------- CHAT ROUTES --------------------->
export const CHATS_URL = API_URL + "/chats";
export const CHAT_URL = (issue_id: string) => `${CHATS_URL}/${issue_id}`;
