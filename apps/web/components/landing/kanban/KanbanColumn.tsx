"use client";

import { motion, useTransform, type MotionValue } from "motion/react";
import type { Column } from "./types";
import { IssueCard } from "./IssueCard";

export function KanbanColumn({
	progress,
	index,
	total,
	column,
}: {
	progress: MotionValue<number>;
	index: number;
	total: number;
	column: Column;
}) {
	const start = (index / total) * 0.75;
	const end = start + 0.4;
	const y = useTransform(progress, [start, end], ["100%", "0%"]);

	const { theme, icon: Icon } = column;

	return (
		<div className="flex-1 overflow-hidden rounded-2xl">
			<motion.div
				style={{ y }}
				className={`flex h-full w-full flex-col rounded-2xl p-3 ${theme.surface} ${theme.headerText}`}
			>
				<div className="mb-3 flex items-center justify-between px-1">
					<div className="flex items-center gap-2">
						<Icon className="h-4 w-4 opacity-90" />
						<span className="text-sm font-semibold tracking-tight">
							{column.status}
						</span>
						<span
							className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${theme.badge}`}
						>
							{column.issues.length}
						</span>
					</div>
					<span className={`text-lg leading-none ${theme.menu}`}>⋯</span>
				</div>
				<div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
					{column.issues.map((issue) => (
						<IssueCard key={issue.number} issue={issue} dark={column.dark} />
					))}
				</div>
			</motion.div>
		</div>
	);
}
