import { MdOutlineCorporateFare } from "react-icons/md";
import NoResource from "@/components/utility/NoResource";

export default function NoOrganization({ onCreateOrg }: { onCreateOrg: () => void }) {
    return (
        <NoResource
            className="pl-[8%] sm:pl-[14%] lg:pl-[20%] mt-12"
            icon={
                <span className="flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <MdOutlineCorporateFare className="size-8 text-neutral-500" />
                </span>
            }
            title="Organizations"
            description="An organization groups the projects and teams your agents work on. Create one to start filing issues onto a shared board."
            action={{
                label: "Create organization",
                onClick: onCreateOrg,
            }}
        />
    );
}
