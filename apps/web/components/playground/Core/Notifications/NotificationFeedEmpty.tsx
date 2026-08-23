"use client";
import { HiOutlineBell } from "react-icons/hi2";

export default function NotificationFeedEmpty({
    title,
    subtitle,
}: {
    title: string;
    subtitle: string;
}) {
    return (
        <div className="flex flex-col items-center px-6 py-10 text-center">
            <span
                className="flex size-11 items-center justify-center rounded-xl bg-white/4 text-neutral-400 ring-1 ring-white/8"
                aria-hidden
            >
                <HiOutlineBell className="size-5" />
            </span>
            <p className="mt-3 text-[13px] font-medium text-neutral-300">{title}</p>
            <p className="mt-1 text-[12px] text-neutral-400">{subtitle}</p>
        </div>
    );
}
