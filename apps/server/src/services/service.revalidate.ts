import { ENV } from "../configs/env";

export default class RevalidateService {
    static content(): void {
        if (!ENV.REVALIDATE_SECRET) return;

        void fetch(`${ENV.SERVER_WEB_URL}/api/revalidate`, {
            method: "POST",
            headers: { "x-revalidate-secret": ENV.REVALIDATE_SECRET },
        })
            .then((response) => {
                if (!response.ok) {
                    console.error("[revalidate] web responded", response.status);
                }
            })
            .catch((err) => {
                console.error("[revalidate] failed", err);
            });
    }
}
