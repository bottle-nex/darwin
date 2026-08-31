import { createIcon } from "./createIcon";
import clsx from "clsx";
import { useId } from "react";
import type { ReactNode } from "react";
import type { IconBaseProps } from "react-icons";
import { BsExclamationSquareFill } from "react-icons/bs";
import { GoCheck, GoComment, GoXCircle } from "react-icons/go";
import {
    HiBell,
    HiCheckCircle,
    HiExclamationTriangle,
    HiInformationCircle,
    HiOutlineBell,
    HiOutlineExclamationTriangle,
    HiOutlineQuestionMarkCircle,
    HiXCircle,
} from "react-icons/hi2";
import { LuChartNoAxesColumnIncreasing, LuCircleDashed, LuInfo } from "react-icons/lu";
import { PiExclamationMarkBold } from "react-icons/pi";

export const CancelledStatusIcon = createIcon(CancelledGlyph);

export const DoneStatusIcon = createIcon(DoneGlyph);

export const ErrorCircleIcon = createIcon(HiXCircle);

export const FailedStatusIcon = createIcon(FailedGlyph);

export const HelpIcon = createIcon(HiOutlineQuestionMarkCircle);

export const InProgressStatusIcon = createIcon(InProgressGlyph);

export const InReviewStatusIcon = createIcon(InReviewGlyph);

export const InlineHintIcon = createIcon(LuInfo);

export const MergeToneWarningIcon = createIcon(HiExclamationTriangle);

export const NoPriorityIcon = createIcon(PiExclamationMarkBold);

export const NotificationsBellIcon = createIcon(HiOutlineBell);

export const OffBoardStatusIcon = createIcon(OffBoardGlyph);

export const PriorityFieldIcon = createIcon(LuChartNoAxesColumnIncreasing);

export function HighPriorityIcon({ className }: IconBaseProps) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
            focusable="false"
            className={clsx("size-4 text-snow", className)}
        >
            <rect x="1.5" y="8" width="3" height="6" rx="1" />
            <rect x="6.5" y="5" width="3" height="9" rx="1" />
            <rect x="11.5" y="2" width="3" height="12" rx="1" />
        </svg>
    );
}

export function MediumPriorityIcon({ className }: IconBaseProps) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
            focusable="false"
            className={clsx("size-4 text-snow", className)}
        >
            <rect x="1.5" y="8" width="3" height="6" rx="1" />
            <rect x="6.5" y="5" width="3" height="9" rx="1" />
            <rect x="11.5" y="2" width="3" height="12" rx="1" fillOpacity="0.4" />
        </svg>
    );
}

export function LowPriorityIcon({ className }: IconBaseProps) {
    return (
        <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden
            focusable="false"
            className={clsx("size-4 text-snow", className)}
        >
            <rect x="1.5" y="8" width="3" height="6" rx="1" />
            <rect x="6.5" y="5" width="3" height="9" rx="1" fillOpacity="0.4" />
            <rect x="11.5" y="2" width="3" height="12" rx="1" fillOpacity="0.4" />
        </svg>
    );
}

export const QueuedStatusIcon = createIcon(QueuedGlyph);

export const ReviewVerdictApprovedIcon = createIcon(GoCheck);

export const ReviewVerdictCommentIcon = createIcon(GoComment);

export const ReviewVerdictRejectedIcon = createIcon(GoXCircle);

export const StatusChangedActivityIcon = createIcon(QueuedGlyph);

const STROKE = 1.5;

const token = {
    x: 2.75,
    y: 2.75,
    width: 10.5,
    height: 10.5,
    rx: 2,
    stroke: "currentColor",
    strokeWidth: STROKE,
} as const;

const solidToken = {
    x: 2.25,
    y: 2.25,
    width: 11.5,
    height: 11.5,
    rx: 2.5,
    fill: "currentColor",
} as const;

const mark = {
    stroke: "currentColor",
    strokeWidth: STROKE,
    strokeLinecap: "round",
    strokeLinejoin: "round",
} as const;

const CHECK = "M5.75 8.25 L7.2 9.65 L10.3 6.25";
const CROSS = "M6 6 L10 10 M10 6 L6 10";
const SLASH = "M6 6 L10 10";
const HOLD = "M6.6 5.8 L6.6 10.2 M9.4 5.8 L9.4 10.2";
const CHANGESET = "M5.8 6.7 H10.2 M5.8 9.3 H8.9";

function StatusGlyph({
    size,
    color,
    title,
    children,
    ...props
}: IconBaseProps & { children: ReactNode }) {
    return (
        <svg
            viewBox="0 0 16 16"
            width={size ?? "1em"}
            height={size ?? "1em"}
            fill="none"
            color={color}
            focusable="false"
            aria-hidden={title ? undefined : true}
            {...props}
        >
            {title ? <title>{title}</title> : null}
            {children}
        </svg>
    );
}

export function TodoGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <rect {...token} />
        </StatusGlyph>
    );
}

export function QueuedGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <rect {...token} strokeDasharray="2 1.214" />
        </StatusGlyph>
    );
}

export function InProgressGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <rect {...token} />
            <rect x={6} y={6} width={4} height={4} rx={1} fill="currentColor" />
        </StatusGlyph>
    );
}

export function InReviewGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <rect {...token} />
            <path d={CHANGESET} {...mark} />
        </StatusGlyph>
    );
}

export function DoneGlyph(props: IconBaseProps) {
    const knockout = useId();
    return (
        <StatusGlyph {...props}>
            <mask id={knockout}>
                <rect {...solidToken} fill="white" />
                <path d={CHECK} {...mark} stroke="black" />
            </mask>
            <rect {...solidToken} mask={`url(#${knockout})`} />
        </StatusGlyph>
    );
}

export function FailedGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <rect {...token} />
            <path d={CROSS} {...mark} />
        </StatusGlyph>
    );
}

export function CancelledGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <rect {...token} />
            <path d={SLASH} {...mark} />
        </StatusGlyph>
    );
}

export function OffBoardGlyph(props: IconBaseProps) {
    return (
        <StatusGlyph {...props}>
            <rect {...token} />
            <path d={HOLD} {...mark} />
        </StatusGlyph>
    );
}

export const StatusFieldIcon = createIcon(LuCircleDashed);

export const StatusInfoIcon = createIcon(HiInformationCircle);

export const SuccessCircleIcon = createIcon(HiCheckCircle);

export const ToastDefaultIcon = createIcon(HiBell);

export const ToastWarningIcon = createIcon(HiExclamationTriangle);

export const TodoStatusIcon = createIcon(TodoGlyph);

export const UnknownStatusIcon = createIcon(QueuedGlyph);

export const UrgentPriorityIcon = createIcon(BsExclamationSquareFill);

export const WarningTriangleIcon = createIcon(HiOutlineExclamationTriangle);
