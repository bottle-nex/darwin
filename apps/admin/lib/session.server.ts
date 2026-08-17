import { cookies } from "next/headers";
import { EMAIL_COOKIE } from "./session";

export async function getAdminEmail(): Promise<string | null> {
    return (await cookies()).get(EMAIL_COOKIE)?.value ?? null;
}
