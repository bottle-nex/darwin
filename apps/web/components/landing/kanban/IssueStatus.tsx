"use client";

import { motion } from "motion/react";
import { MdAccessTimeFilled, MdAutorenew, MdCallSplit, MdCheckCircle } from "react-icons/md";
import type { Issue } from "./types";
import { ordinal } from "./data";

export function IssueStatus({ issue, dark }: { issue: Issue; dark: boolean }) {
	if (issue.state === "queued") {
		return (
			<div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-neutral-400">
				<MdAccessTimeFilled className="h-3 w-3" />
				<span>Queued</span>
				{issue.queuePosition ? (
					<>
						<span className="text-neutral-300">·</span>
						<span>{ordinal(issue.queuePosition)} in line</span>
					</>
				) : null}
			</div>
		);
	}

	if (issue.state === "processing") {
		return (
			<div className="mt-2.5">
				<div
					className={`flex items-center gap-1.5 text-[11px] font-semibold ${
						dark ? "text-neutral-100" : "text-neutral-900"
					}`}
				>
					<MdAutorenew className="h-3 w-3 animate-spin" />
					<span>Resolving</span>
					<span className={dark ? "text-neutral-600" : "text-neutral-300"}>·</span>
					<span
						className={`font-medium ${dark ? "text-neutral-400" : "text-neutral-500"}`}
					>
						{issue.step}
					</span>
				</div>
				<div
					className={`relative mt-2 h-1 overflow-hidden rounded-full ${
						dark ? "bg-neutral-700" : "bg-neutral-200"
					}`}
				>
					<motion.div
						className={`absolute inset-y-0 w-1/3 rounded-full ${
							dark ? "bg-neutral-100" : "bg-neutral-900"
						}`}
						animate={{ x: ["-110%", "330%"] }}
						transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
					/>
				</div>
			</div>
		);
	}

	if (issue.state === "review") {
		return (
			<div className="mt-2.5 flex items-center gap-2 text-[11px]">
				<span className="inline-flex items-center gap-1 font-semibold text-violet-600">
					<MdCallSplit className="h-3 w-3" />
					{issue.pr}
				</span>
				{issue.diff ? (
					<span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
						<span className="text-emerald-600">+{issue.diff.added}</span>
						<span className="text-rose-500">−{issue.diff.removed}</span>
					</span>
				) : null}
			</div>
		);
	}

	return (
		<div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
			<MdCheckCircle className="h-3 w-3" />
			<span>Resolved</span>
			{issue.duration ? (
				<>
					<span className="text-emerald-300">·</span>
					<span className="text-neutral-400">{issue.duration}</span>
				</>
			) : null}
		</div>
	);
}
