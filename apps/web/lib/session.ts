import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { Session } from "next-auth";

export default class SessionServices {
    static get_session(): Session | null {
        return useUserSessionStore.getState().session;
    }

    static get_token(): string | undefined | null {
        return useUserSessionStore.getState().session?.user?.token;
    }

    static get_image(): string | undefined | null {
        return useUserSessionStore.getState().session?.user?.image;
    }

    static is_authenticated(): boolean {
        return Boolean(SessionServices.get_token());
    }

    static get_user() {
        return useUserSessionStore.getState().session?.user;
    }
}
