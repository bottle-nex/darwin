const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
export const API_URL = BACKEND_URL + "/api/v1";

export const AUTH_URL = API_URL + "/auth";
export const SIGNIN_URL = AUTH_URL + "/sign-in";
export const REQUEST_OTP_URL = AUTH_URL + "/otp/request";
export const VERIFY_OTP_URL = AUTH_URL + "/otp/verify";

export const LIST_ORG = API_URL + "/org";
export const CREATE_ORG = API_URL + "/org/create";

export const LAST_VISITED_URL = API_URL + "/user/last-visited";
export const SIDEBAR_THEME_URL = API_URL + "/user/sidebar-theme";
export const USER_CONFIG_URL = API_URL + "/user/config";
export const PLAYGROUND_URL = API_URL + "/playground";
export const PRELOAD_URL = PLAYGROUND_URL + "/preload";
export const DASHBOARD_URL = (orgSlug: string) => `${PLAYGROUND_URL}/dashboard/${orgSlug}`;

export const PROJECT_URL = API_URL + "/project";
export const CREATE_PROJECT = PROJECT_URL + "/create";
export const GET_PROJECT = (projectId: string) => `${PROJECT_URL}/${projectId}`;
export const START_PROJECT_SETUP_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/setup`;
export const UPDATE_PROJECT_URL = PROJECT_URL + "/update";
export const DELETE_PROJECT_URL = PROJECT_URL + "/delete";
export const LIST_PROJECT_MEMBERS_URL = (project_id: string, query?: string) =>
    `${PROJECT_URL}/${project_id}/members${query !== undefined ? `?q=${encodeURIComponent(query)}` : ""}`;
export const PROJECT_PRESENCE_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/presence`;
export const SET_PROJECT_SECRET = (project_id: string) => `${PROJECT_URL}/${project_id}/secrets`;
export const LIST_PROJECT_SECRETS_URL = (project_id: string) =>
    `${PROJECT_URL}/${project_id}/secrets`;
export const DELETE_PROJECT_SECRET_URL = (project_id: string, key: string) =>
    `${PROJECT_URL}/${project_id}/secrets/${encodeURIComponent(key)}`;
export const GET_PROJECT_CONFIG_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/config`;
export const UPDATE_PROJECT_CONFIG_URL = (project_id: string) =>
    `${PROJECT_URL}/${project_id}/config`;
export const PRODUCT_DIFFS_URL = (project_id: string) =>
    `${PROJECT_URL}/${project_id}/product-diffs`;
export const PRODUCT_DIFF_URL = (project_id: string, product_diff_id: string) =>
    `${PRODUCT_DIFFS_URL(project_id)}/${product_diff_id}`;
export const REGENERATE_PRODUCT_DIFF_URL = (project_id: string, issue_id: string) =>
    `${PRODUCT_DIFFS_URL(project_id)}/${issue_id}/regenerate`;
export const PRODUCT_DIFF_ARTIFACT_URLS_URL = (project_id: string, product_diff_id: string) =>
    `${PRODUCT_DIFFS_URL(project_id)}/${product_diff_id}/artifact-urls`;

export const REVIEW_URL = (project_id: string, pull_number: number) =>
    `${PROJECT_URL}/${project_id}/review/${pull_number}`;
export const REVIEW_FILES_URL = (project_id: string, pull_number: number) =>
    `${REVIEW_URL(project_id, pull_number)}/files`;
export const REVIEW_COMMENTS_URL = (project_id: string, pull_number: number) =>
    `${REVIEW_URL(project_id, pull_number)}/comments`;
export const REVIEW_COMMENT_URL = (project_id: string, pull_number: number, comment_id: string) =>
    `${REVIEW_COMMENTS_URL(project_id, pull_number)}/${encodeURIComponent(comment_id)}`;
export const REVIEW_FILE_SOURCE_URL = (project_id: string, pull_number: number) =>
    `${REVIEW_URL(project_id, pull_number)}/file`;
export const REVIEW_MERGE_URL = (project_id: string, pull_number: number) =>
    `${REVIEW_URL(project_id, pull_number)}/merge`;
export const REVIEW_CLOSE_URL = (project_id: string, pull_number: number) =>
    `${REVIEW_URL(project_id, pull_number)}/close`;

export const LIST_TAGS_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/tags`;
export const ISSUE_IMPORT_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/issue-import`;
export const CREATE_TAG_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/tags`;
export const UPDATE_TAG_URL = (project_id: string, tagId: string) =>
    `${PROJECT_URL}/${project_id}/tags/${tagId}`;
export const DELETE_TAG_URL = (project_id: string, tagId: string) =>
    `${PROJECT_URL}/${project_id}/tags/${tagId}`;

export const LIST_TEMPLATES_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/templates`;
export const CREATE_TEMPLATE_URL = (project_id: string) => `${PROJECT_URL}/${project_id}/templates`;
export const UPDATE_TEMPLATE_URL = (project_id: string, templateId: string) =>
    `${PROJECT_URL}/${project_id}/templates/${templateId}`;
export const DELETE_TEMPLATE_URL = (project_id: string, templateId: string) =>
    `${PROJECT_URL}/${project_id}/templates/${templateId}`;

export const CREATE_TEAM = API_URL + "/teams/create";
export const GET_TEAM_MEMBERS = (teamId: string) => `${API_URL}/teams/${teamId}/members`;
export const DELETE_TEAM = (teamId: string) => `${API_URL}/teams/${teamId}`;
export const CHANGE_MEMBER_AUTHORITY = API_URL + "/teams/change-authority";
export const REMOVE_MEMBERS = API_URL + "/teams/remove-members";

export const GITHUB_URL = API_URL + "/github";
export const GITHUB_CONNECT_START = GITHUB_URL + "/connect/start";
export const GITHUB_CONNECT_COMPLETE = GITHUB_URL + "/connect/complete";
export const GITHUB_DISCONNECT = (orgId: string) => `${GITHUB_URL}/connect/${orgId}`;
export const GITHUB_LINK = GITHUB_URL + "/link";
export const GITHUB_LINK_START = GITHUB_LINK + "/start";
export const GITHUB_LINK_COMPLETE = GITHUB_LINK + "/complete";
export const GITHUB_REPOS = (orgId: string) => `${GITHUB_URL}/installations/${orgId}/repos`;
export const GITHUB_REPO_BRANCHES = (orgId: string, owner: string, repo: string) =>
    `${GITHUB_URL}/installations/${orgId}/repos/${owner}/${repo}/branches`;

export const ISSUES_URL = API_URL + "/issues";
export const CREATE_ISSUE_URL = ISSUES_URL + "/create";
export const CREATE_COLUMN_URL = ISSUES_URL + "/columns";
export const BOARD_URL = (project_id: string) => `${ISSUES_URL}/board/${project_id}`;
export const BOARD_COLUMNS_URL = (project_id: string) => `${BOARD_URL(project_id)}/columns`;
export const BOARD_SEARCH_URL = (project_id: string) => `${BOARD_URL(project_id)}/search`;
export const MY_ISSUES_URL = (project_id: string) => `${BOARD_URL(project_id)}/my`;
export const ISSUE_URL = (id: string) => `${ISSUES_URL}/${id}`;
export const BULK_UPDATE_ISSUES_URL = ISSUES_URL + "/bulk";
export const BULK_DELETE_ISSUES_URL = ISSUES_URL + "/bulk/delete";
export const SEARCH_ISSUES_URL = (project_id: string, query: string) =>
    `${ISSUES_URL}/search/${project_id}?q=${encodeURIComponent(query)}`;
export const ISSUE_CONFIG_URL = (id: string) => `${ISSUES_URL}/${id}/config`;
export const ISSUE_REFERENCES_URL = (id: string) => `${ISSUES_URL}/${id}/references`;
export const ISSUE_ACTIVITY_URL = (id: string) => `${ISSUES_URL}/${id}/activity`;
export const COLUMN_URL = (id: string) => `${ISSUES_URL}/columns/${id}`;
export const REORDER_COLUMNS_URL = ISSUES_URL + "/columns/reorder";
export const CREATE_CHAPTER_URL = ISSUES_URL + "/chapters";
export const CHAPTER_URL = (id: string) => `${ISSUES_URL}/chapters/${id}`;
export const ASSIGN_ISSUE_URL = (id: string) => `${ISSUES_URL}/${id}/assignees`;
export const UNASSIGN_ISSUE_URL = (id: string, userId: string) =>
    `${ISSUES_URL}/${id}/assignees/${userId}`;

export const INVITATIONS_URL = API_URL + "/invitations";
export const LIST_INVITES_URL = INVITATIONS_URL;
export const ACCEPT_INVITE_URL = INVITATIONS_URL + "/accept";
export const REJECT_INVITE_URL = INVITATIONS_URL + "/reject";
export const REVOKE_INVITE_URL = INVITATIONS_URL + "/revoke";
export const INVITE_MEMBER_URL = INVITATIONS_URL + "/invite";
export const INVITES_PREVIEW_URL = (token: string) => `${INVITATIONS_URL}/${token}`;

export const CHATS_URL = API_URL + "/chats";
const HISTORY_QUERY = (cursor: string | null, limit: number) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return params.toString();
};
export const CHAT_URL = (issue_id: string, cursor: string | null, limit: number) =>
    `${CHATS_URL}/${issue_id}?${HISTORY_QUERY(cursor, limit)}`;

export const PROJECT_CHATS_URL = API_URL + "/project-chats";
export const CHAT_CONVERSATION_PREVIEWS_URL = (project_id: string) =>
    `${PROJECT_CHATS_URL}/conversations/${project_id}`;
export const PROJECT_CHAT_URL = (project_id: string, cursor: string | null, limit: number) =>
    `${PROJECT_CHATS_URL}/${project_id}?${HISTORY_QUERY(cursor, limit)}`;
export const TEAM_CHAT_URL = (team_id: string, cursor: string | null, limit: number) =>
    `${PROJECT_CHATS_URL}/team/${team_id}?${HISTORY_QUERY(cursor, limit)}`;

export const NOTIFICATIONS_URL = API_URL + "/notifications";
export const NOTIFICATIONS_READ_URL = NOTIFICATIONS_URL + "/read";
export const MEMBER_NOTIFICATIONS_URL = (cursor: string | null, limit: number) =>
    `${NOTIFICATIONS_URL}?${HISTORY_QUERY(cursor, limit)}`;
export const PROJECT_NOTIFICATIONS_URL = (
    project_id: string,
    cursor: string | null,
    limit: number,
) => `${NOTIFICATIONS_URL}/project/${project_id}?${HISTORY_QUERY(cursor, limit)}`;

export const GLOBAL_SEARCH_URL = (project_id: string) => `${API_URL}/search/${project_id}`;

export const API_KEYS_URL = API_URL + "/claude-mcp/api-keys";
export const REVOKE_API_KEY_URL = (id: string) => `${API_KEYS_URL}/${id}`;
export const CLAUDE_MCP_URL = API_URL + "/claude-mcp/mcp";
export const CLAUDE_MCP_CONNECTOR_URL = (key: string) => `${CLAUDE_MCP_URL}/${key}`;
