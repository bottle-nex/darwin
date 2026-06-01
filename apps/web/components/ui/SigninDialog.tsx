import { JSX } from "react";
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";

export default function SigninDialog(): JSX.Element {
    const setOpen = useUserSessionStore((s) => s.setOpenSigninModal);
    const open = useUserSessionStore((s) => s.openSigninModal);
    return (
        <Dialog open={open} onOpenChange={() => setOpen(!open)}  >

        </Dialog>
    )
}
