import AdminShell from "@/components/admin/AdminShell";
import { getAdminEmail } from "@/lib/session.server";
import PostEditorForm from "@/components/admin/PostEditorForm";

type EditPostPageProps = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: EditPostPageProps) {
    const { id } = await params;
    const email = await getAdminEmail();

    return (
        <AdminShell email={email}>
            <PostEditorForm id={id} />
        </AdminShell>
    );
}
