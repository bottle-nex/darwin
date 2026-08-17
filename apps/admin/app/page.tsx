import AdminShell from "@/components/admin/AdminShell";
import { getAdminEmail } from "@/lib/session.server";
import PostList from "@/components/admin/PostList";

export default async function AdminHomePage() {
    const email = await getAdminEmail();

    return (
        <AdminShell email={email}>
            <PostList />
        </AdminShell>
    );
}
