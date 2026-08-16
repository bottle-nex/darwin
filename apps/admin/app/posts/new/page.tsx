import AdminShell from "@/components/admin/AdminShell";
import { getAdminEmail } from "@/lib/session.server";
import PostEditorForm from "@/components/admin/PostEditorForm";

export default async function NewPostPage() {
    const email = await getAdminEmail();

    return (
        <AdminShell email={email}>
            <PostEditorForm />
        </AdminShell>
    );
}
