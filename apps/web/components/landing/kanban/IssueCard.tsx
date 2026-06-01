"use client";

import { motion } from "motion/react";
import { MdChatBubble } from "react-icons/md";
import type { Issue } from "./types";
import { PRIORITY_DOT } from "./data";
import { AgentChip } from "./AgentChip";
import { IssueStatus } from "./IssueStatus";

export function IssueCard({ issue, dark = false }: { issue: Issue; dark?: boolean }) {
	const isDone = issue.state === "done";
	const priorityDot = dark ? PRIORITY_DOT.dark : PRIORITY_DOT.light;

	return (
		<motion.div
			whileHover={{ y: -2 }}
			transition={{ type: "spring", stiffness: 400, damping: 30 }}
			className={`rounded-xl border p-3.5 shadow-sm transition-shadow hover:shadow-md ${
				dark ? "border-neutral-700/40 bg-neutral-800" : "border-black/5 bg-white"
			} ${isDone ? "opacity-90" : ""}`}
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1.5">
					<span className={`h-1.5 w-1.5 rounded-full ${priorityDot[issue.priority]}`} />
					<span
						className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
							dark ? "bg-neutral-700 text-neutral-300" : issue.label.className
						}`}
					>
						{issue.label.name}
					</span>
				</div>
				<span
					className={`text-[11px] font-medium ${dark ? "text-neutral-500" : "text-neutral-300"}`}
				>
					{issue.number}
				</span>
			</div>

			<p
				className={`mt-2 text-[13px] font-medium leading-snug ${
					dark ? "text-neutral-100" : "text-neutral-800"
				}`}
			>
				{issue.title}
			</p>

			<IssueStatus issue={issue} dark={dark} />

			<div
				className={`mt-3 flex items-center justify-between border-t pt-2.5 ${
					dark ? "border-neutral-700" : "border-neutral-100"
				}`}
			>
				<span
					className={`flex items-center gap-1 text-[11px] ${
						dark ? "text-neutral-500" : "text-neutral-400"
					}`}
				>
					<MdChatBubble className="h-3 w-3" />
					{issue.comments}
				</span>
				<AgentChip name={issue.agent} />
			</div>
		</motion.div>
	);
}
