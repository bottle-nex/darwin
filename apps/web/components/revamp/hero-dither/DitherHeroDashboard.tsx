import type { ReactNode } from "react";
import {
    RiAddLine,
    RiApps2Line,
    RiArrowDownSLine,
    RiArrowLeftRightLine,
    RiBarChartLine,
    RiCalendarLine,
    RiChat1Line,
    RiCheckboxBlankFill,
    RiEqualizerLine,
    RiFileCopy2Line,
    RiFlashlightFill,
    RiFolder2Line,
    RiFolder3Fill,
    RiGlobalLine,
    RiHistoryLine,
    RiInboxLine,
    RiMore2Fill,
    RiNotification3Line,
    RiRobot2Line,
    RiSave3Line,
    RiSettings3Line,
    RiSparkling2Fill,
    RiSubtractLine,
} from "react-icons/ri";

/** Static product mock — the dark workflow-builder screenshot in the hero. */

const SIDEBAR_ITEMS = [
    { icon: RiInboxLine, label: "Inbox" },
    { icon: RiBarChartLine, label: "Analytics" },
    { icon: RiFolder2Line, label: "Collections" },
    { icon: RiApps2Line, label: "Integrations" },
    { icon: RiFileCopy2Line, label: "Templates" },
    { icon: RiSettings3Line, label: "Settings" },
];

const SIDEBAR_APPS = ["Chief", "Docs", "Accounting"];

function SectionHeading({ label, action }: { label: string; action?: ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-white/70">{label} —</span>
            {action}
        </div>
    );
}

function DarkInput({ value, placeholder }: { value?: string; placeholder?: string }) {
    return (
        <div className="rounded-md border border-white/8 bg-white/4 px-2.5 py-1.5 text-[10px]">
            {value ? (
                <span className="text-white/80">{value}</span>
            ) : (
                <span className="text-white/30">{placeholder ?? " "}</span>
            )}
        </div>
    );
}

function ActionRow({
    icon,
    label,
    chip,
    chipIcon,
    tag,
}: {
    icon: ReactNode;
    label: string;
    chip: string;
    chipIcon: ReactNode;
    tag: string;
}) {
    return (
        <div>
            <div className="flex items-center gap-2 rounded-md border border-white/8 bg-white/4 px-2.5 py-1.5">
                <span className="text-white/60">{icon}</span>
                <span className="text-[10px] text-white/80">{label}</span>
                <span className="ml-auto flex items-center gap-1.5 rounded-sm bg-white/6 px-1.5 py-0.5 text-[9px] text-white/70">
                    {chipIcon}
                    {chip}
                </span>
                <RiMore2Fill className="size-3 text-white/30" />
            </div>
            <div className="mt-1 mb-2 ml-3 flex items-center gap-1 text-[9px] text-white/35">
                <RiArrowDownSLine className="size-2.5" />
                <span className="rounded-sm bg-white/5 px-1.5 py-px">{tag}</span>
            </div>
        </div>
    );
}

function ConfigRow({ label, control }: { label: string; control: ReactNode }) {
    return (
        <div className="space-y-1">
            <div className="text-[9px] text-white/45">{label}</div>
            {control}
        </div>
    );
}

function Stepper({ value }: { value: string }) {
    return (
        <div className="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/4 px-2.5 py-1.5 text-[10px]">
            <span className="text-white/80">{value}</span>
            <span className="ml-auto flex items-center gap-1">
                <span className="grid size-4 place-items-center rounded-sm bg-white/6">
                    <RiSubtractLine className="size-2.5 text-white/50" />
                </span>
                <span className="grid size-4 place-items-center rounded-sm bg-white/6">
                    <RiAddLine className="size-2.5 text-white/50" />
                </span>
            </span>
        </div>
    );
}

function Select({ value, icon }: { value: string; icon?: ReactNode }) {
    return (
        <div className="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/4 px-2.5 py-1.5 text-[10px]">
            {icon}
            <span className="text-white/80">{value}</span>
            <RiArrowDownSLine className="ml-auto size-3 text-white/40" />
        </div>
    );
}

export default function DitherHeroDashboard({ className }: { className?: string }) {
    return (
        <div
            className={`flex overflow-hidden rounded-t-lg border border-b-0 border-white/10 bg-[#111113] text-white shadow-2xl ${className ?? ""}`}
        >
            {/* Sidebar */}
            <aside className="flex w-[19%] shrink-0 flex-col border-r border-white/6 bg-[#151517] px-3 py-3">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[10px] font-medium text-white/85">
                        <span className="size-2 rounded-full bg-white/80" /> Acme
                    </span>
                    <RiSparkling2Fill className="size-3 text-white/50" />
                </div>
                <nav className="mt-4 space-y-0.5">
                    {SIDEBAR_ITEMS.map(({ icon: Icon, label }) => (
                        <div
                            key={label}
                            className="flex items-center gap-2 rounded-md px-2 py-1 text-[10px] text-white/55"
                        >
                            <Icon className="size-3" /> {label}
                        </div>
                    ))}
                </nav>
                <div className="mt-5 flex items-center justify-between px-2 text-[9px] text-white/35">
                    Apps <RiAddLine className="size-3" />
                </div>
                <div className="mt-1 space-y-0.5">
                    <div className="flex items-center gap-2 rounded-md bg-white/8 px-2 py-1 text-[10px] text-white/90">
                        <RiRobot2Line className="size-3" /> Statisbot
                    </div>
                    {SIDEBAR_APPS.map((app) => (
                        <div
                            key={app}
                            className="flex items-center gap-2 rounded-md px-2 py-1 text-[10px] text-white/55"
                        >
                            <RiCheckboxBlankFill className="size-2.5" /> {app}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Workspace */}
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center justify-between border-b border-white/6 px-4 py-2">
                    <span className="flex items-center gap-1.5 text-[10px] text-white/75">
                        <RiRobot2Line className="size-3" /> Statisbot
                        <span className="text-white/30">—</span>
                    </span>
                    <span className="flex items-center gap-2.5 text-white/40">
                        <RiChat1Line className="size-3" />
                        <RiNotification3Line className="size-3" />
                        <RiHistoryLine className="size-3" />
                        <RiCalendarLine className="size-3" />
                        <RiSettings3Line className="size-3" />
                    </span>
                </header>

                <div className="flex min-h-0 flex-1">
                    {/* Inputs + actions */}
                    <div className="min-w-0 flex-1 space-y-3 border-r border-white/6 px-4 py-3">
                        <SectionHeading
                            label="Inputs"
                            action={<RiAddLine className="size-3 text-white/40" />}
                        />
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-[9px]">
                                <span className="text-white/60">User Name</span>
                                <span className="text-amber-300/70">@ user_name</span>
                            </div>
                            <DarkInput />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-[9px]">
                                <span className="text-white/60">Profile</span>
                                <span className="text-white/35">≡ profile</span>
                            </div>
                            <div className="h-14 rounded-md border border-white/8 bg-white/4" />
                        </div>
                        <div className="flex items-center justify-end gap-2 text-[9px] text-white/60">
                            <span className="rounded-sm bg-white/6 px-2 py-1">Run ▷</span>
                            <span className="rounded-sm bg-white/6 px-2 py-1">Clear & Run</span>
                            <span className="rounded-sm bg-white/6 px-1.5 py-1">↵</span>
                        </div>
                        <SectionHeading
                            label="Actions"
                            action={<RiAddLine className="size-3 text-white/40" />}
                        />
                        <div className="pl-3">
                            <ActionRow
                                icon={<RiGlobalLine className="size-3" />}
                                label="Get Context From Website"
                                chip="Website"
                                chipIcon={<RiFolder3Fill className="size-2.5 text-amber-400" />}
                                tag="website"
                            />
                            <ActionRow
                                icon={<RiSave3Line className="size-3" />}
                                label="Save"
                                chip="Cache"
                                chipIcon={<RiFolder3Fill className="size-2.5 text-amber-400" />}
                                tag="save"
                            />
                            <ActionRow
                                icon={<RiSparkling2Fill className="size-3" />}
                                label="Generate Response"
                                chip="GPT-4 Turbo"
                                chipIcon={<RiSparkling2Fill className="size-2.5 text-white/60" />}
                                tag="output"
                            />
                        </div>
                    </div>

                    {/* Node config */}
                    <div className="w-[42%] shrink-0 space-y-2.5 px-4 py-3">
                        <div className="space-y-2 rounded-lg border border-white/8 bg-white/3 p-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                                <RiFlashlightFill className="size-3" /> Generate Response
                                <span className="ml-auto rounded-sm bg-white/8 px-1.5 py-px text-[8px] text-white/60">
                                    output
                                </span>
                                <RiArrowDownSLine className="size-3 text-white/40" />
                            </div>
                            <ConfigRow label="Slug" control={<DarkInput value="output" />} />
                            <ConfigRow
                                label="Message"
                                control={
                                    <DarkInput placeholder="Add an optional display message" />
                                }
                            />
                        </div>
                        <div className="space-y-2 rounded-lg border border-white/8 bg-white/3 p-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                                <RiArrowLeftRightLine className="size-3" /> Conditions
                                <RiArrowDownSLine className="ml-auto size-3 text-white/40" />
                            </div>
                            <div className="rounded-md border border-white/8 bg-white/4 px-2.5 py-1.5 text-[10px] text-white/60">
                                if <span className="text-violet-400">@inputs.input()</span> is True
                            </div>
                        </div>
                        <div className="space-y-2 rounded-lg border border-white/8 bg-white/3 p-2.5">
                            <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                                <RiEqualizerLine className="size-3" /> Configuration
                                <RiArrowDownSLine className="ml-auto size-3 text-white/40" />
                            </div>
                            <ConfigRow
                                label="Model"
                                control={
                                    <Select
                                        value="GPT-4 Turbo"
                                        icon={
                                            <RiSparkling2Fill className="size-2.5 text-white/60" />
                                        }
                                    />
                                }
                            />
                            <ConfigRow label="Temperature" control={<Stepper value="0.7" />} />
                            <ConfigRow label="Max Tokens" control={<Stepper value="400" />} />
                            <ConfigRow label="Response Type" control={<Select value="Text" />} />
                            <div className="text-[9px] text-white/45">Prompt</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
