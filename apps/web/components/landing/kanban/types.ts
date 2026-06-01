import type { IconType } from "react-icons";

export type IssueState = "queued" | "processing" | "review" | "done";

export type Priority = "urgent" | "high" | "normal";

export type Label = {
	name: string;
	className: string;
};

export type Diff = {
	added: number;
	removed: number;
};

export type Issue = {
	number: string;
	title: string;
	label: Label;
	priority: Priority;
	agent: string;
	comments: number;
	state: IssueState;
	queuePosition?: number;
	step?: string;
	pr?: string;
	diff?: Diff;
	duration?: string;
};

export type ColumnTheme = {
	surface: string;
	headerText: string;
	badge: string;
	menu: string;
};

export type Column = {
	status: string;
	icon: IconType;
	theme: ColumnTheme;
	dark: boolean;
	issues: Issue[];
};
