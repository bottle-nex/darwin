"use client";
import { CalendarIcon } from "@trymatcha/ui/icons";

import Capsule from "./Capsule";
import { DATE_ICON_COLOR, STACKED_CAPSULE } from "./issueHelpers";
import MembersCapsule from "./MembersCapsule";
import PriorityCapsule from "./PriorityCapsule";
import TagsCapsule from "./TagsCapsule";
import type { IssueFormState } from "./useIssueForm";

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
            value={fields.tagIds}
            onChange={fields.setTagIds}
            className={capsuleClass}
            placeholder={inSidebar ? "Add tag" : undefined}
        />
    );

    if (layout === "tags") return tags;

    const priority = (
        <PriorityCapsule
            value={fields.priority}
            onChange={fields.setPriority}
            className={capsuleClass}
        />
    );
    const members = (
        <MembersCapsule
            projectId={projectId}
            value={fields.memberIds}
            onChange={fields.setMemberIds}
            disabled={readOnly}
            open={fields.membersOpen}
            onOpenChange={fields.setMembersOpen}
            className={capsuleClass}
            placeholder={inSidebar ? "Unassigned" : undefined}
            tooltip={!inSidebar}
        />
    );
    const dateRange = { from: fields.startDate, to: fields.targetDate };
    const startDate = (
        <Capsule
            type="calendar"
            placeholder="Start date"
            value={fields.startDate}
            onChange={fields.setStartDate}
            className={capsuleClass}
            icon={CalendarIcon}
            iconClassName={DATE_ICON_COLOR.start}
            range={dateRange}
            latest={fields.targetDate}
        />
    );
    const targetDate = (
        <Capsule
            type="calendar"
            placeholder="End date"
            value={fields.targetDate}
            onChange={fields.setTargetDate}
            className={capsuleClass}
            icon={CalendarIcon}
            iconClassName={DATE_ICON_COLOR.target}
            range={dateRange}
            earliest={fields.startDate}
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
