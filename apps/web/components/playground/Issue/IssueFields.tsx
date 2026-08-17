"use client";
import { HiCalendar } from "react-icons/hi2";
import Capsule from "./Capsule";
import MembersCapsule from "./MembersCapsule";
import TagsCapsule from "./TagsCapsule";
import PriorityCapsule from "./PriorityCapsule";
import { DATE_ICON_COLOR } from "./issueHelpers";
import type { IssueFormState } from "./useIssueForm";

/**
 * Sidebar capsules drop their pill surface so the column reads as rows, not buttons.
 * `variant="unstyled"` applies no disabled styling and CSS :hover still fires on a
 * disabled button, so read-only rows have to mute themselves explicitly.
 */
const STACKED_CAPSULE =
    "w-full rounded-md bg-transparent px-1.5 py-1.5 text-[13.5px] text-neutral-200 ring-0 [&_svg]:size-[18px] hover:bg-white/5 disabled:cursor-default disabled:text-neutral-400 disabled:hover:bg-transparent";

export default function IssueFields({
    form,
    layout,
}: {
    form: IssueFormState;
    layout: "row" | "stacked" | "tags";
}) {
    const { fields, projectId, readOnly } = form;
    const inSidebar = layout !== "row";
    const capsuleClass = inSidebar ? STACKED_CAPSULE : undefined;

    const tags = (
        <TagsCapsule
            projectId={projectId}
            defaultValue={fields.tagIds}
            onChange={fields.setTagIds}
            className={capsuleClass}
            placeholder={inSidebar ? "Add tag" : undefined}
        />
    );

    if (layout === "tags") return tags;

    const priority = (
        <PriorityCapsule
            defaultValue={fields.priority}
            onChange={fields.setPriority}
            className={capsuleClass}
        />
    );
    const members = (
        <MembersCapsule
            projectId={projectId}
            defaultValue={fields.memberIds}
            onChange={fields.setMemberIds}
            disabled={readOnly}
            open={fields.membersOpen}
            onOpenChange={fields.setMembersOpen}
            className={capsuleClass}
            placeholder={inSidebar ? "Unassigned" : undefined}
            tooltip={!inSidebar}
        />
    );
    const startDate = (
        <Capsule
            type="calendar"
            placeholder="Start date"
            defaultValue={fields.startDate}
            onChange={fields.setStartDate}
            className={capsuleClass}
            icon={HiCalendar}
            iconClassName={DATE_ICON_COLOR.start}
        />
    );
    const targetDate = (
        <Capsule
            type="calendar"
            placeholder="Target date"
            defaultValue={fields.targetDate}
            onChange={fields.setTargetDate}
            className={capsuleClass}
            icon={HiCalendar}
            iconClassName={DATE_ICON_COLOR.target}
        />
    );

    if (layout === "row") {
        return (
            <div className="flex items-center gap-x-2.5">
                {priority}
                {tags}
                {members}
                {startDate}
                {targetDate}
            </div>
        );
    }

    return (
        <>
            {priority}
            {members}
            {startDate}
            {targetDate}
        </>
    );
}
