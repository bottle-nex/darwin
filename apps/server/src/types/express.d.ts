export interface AuthUser {
    id: string;
    name: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            user: AuthUser;
            admin_email?: string;
            sandbox_session_id?: string;
            worker_id?: string;
        }
    }
}
