import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Image from "next/image";

interface ProfileCardProps {
    name: string;
    role: string;
    profilimage: string;
    banner?: string;
    issues?: {
        created?: number,
        fixed?: number,
        notAnswered?: number,
    }
}

export default function ProfileCard({
    name,
    role,
    profilimage,
    banner,
    issues,
}: ProfileCardProps) {
    return (
        <div
            className={cn(
                "relative",
                "h-74 w-66 bg-charcoal ring ring-white/5 rounded-xl p-2",
                "flex flex-col justify-between items-center"
            )}
        >
            <div className="relative h-28 w-full rounded-md overflow-hidden">
                <Image
                    src={banner ?? "/images/ui/bugatti.png"}
                    fill
                    alt="banner"
                    className="object-cover"
                />
            </div>
            <div className="absolute top-23 left-5 bg-red size-14 bg-red-300 rounded-full ring-2 ring-charcoal overflow-hidden ">
                <Image
                    src={profilimage}
                    alt={name}
                    fill
                    className="object-cover"
                />
            </div>
            <div className="w-full flex flex-col justify-between gap-y-2 ">
                <div className="w-full flex flex-col leading-tight">
                    <div>
                        {name}
                    </div>
                    <div className="text-white/40 text-xs ">
                        {role}
                    </div>
                </div>
                <div className="flex h-11 w-full overflow-hidden rounded-md border border-white/5 bg-neutral-800/30">
                    <div className="flex flex-1 flex-col items-center justify-center">
                        <span className="text-[10px] text-neutral-500">Created</span>
                        <span className="text-xs font-medium text-white">{issues?.created || 0}</span>
                    </div>

                    <div className="w-px bg-white/5" />

                    <div className="flex flex-1 flex-col items-center justify-center">
                        <span className="text-[10px] text-neutral-500">Fixed</span>
                        <span className="text-xs font-medium text-white">{issues?.fixed || 0}</span>
                    </div>

                    <div className="w-px bg-white/5" />

                    <div className="flex flex-1 flex-col items-center justify-center">
                        <span className="text-[10px] text-neutral-500">Not Answered</span>
                        <span className="text-xs font-medium text-white">{issues?.notAnswered || 0}</span>
                    </div>
                </div>
                <Button
                    variant={"tertiary"}
                    type="button"
                    size={"default"}
                // loading={connect.isPending}
                // onClick={() => connect.mutate(org.id)}
                // disabled={connect.isPending}
                >
                    Message
                </Button>
                {/* <DropdownMenu.Separator className="h-0.5 bg-[#0F0F0F] shadow-xs shadow-white/4" /> */}
            </div>
        </div>
    );
}