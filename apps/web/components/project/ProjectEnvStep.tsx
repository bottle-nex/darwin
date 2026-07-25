"use client";
import { useRef, type Dispatch, type SetStateAction } from "react";
import { FaPlus, FaXmark, FaFileArrowUp, FaEye, FaEyeSlash } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import parse_env from "@/lib/env_parser";

export type EnvRow = { key: string; value: string };

const FIELD =
    "border-white/10 bg-white/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-[#9bc24f] focus-visible:ring-[#9bc24f]/30";

const SURFACE = "rounded-lg bg-white/5 shadow-[inset_0_1px_0_0_#262626]";

export default function ProjectEnvStep({
    rows,
    setRows,
    reveal,
    setReveal,
}: {
    rows: EnvRow[];
    setRows: Dispatch<SetStateAction<EnvRow[]>>;
    reveal: boolean;
    setReveal: Dispatch<SetStateAction<boolean>>;
}) {
    const fileRef = useRef<HTMLInputElement>(null);

    function setRow(index: number, patch: Partial<EnvRow>) {
        setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    }

    function addRow() {
        setRows((current) => [...current, { key: "", value: "" }]);
    }

    function removeRow(index: number) {
        setRows((current) => {
            const next = current.filter((_, i) => i !== index);
            return next.length ? next : [{ key: "", value: "" }];
        });
    }

    // Merge parsed pairs into the editable rows so the user reviews before saving;
    // drop the trailing empty placeholder row if it's still untouched.
    function merge(parsed: EnvRow[]) {
        if (!parsed.length) return;
        setRows((current) => {
            const kept = current.filter((row) => row.key.trim() || row.value.trim());
            return [...kept, ...parsed];
        });
    }

    async function onFile(file: File) {
        merge(parse_env(await file.text()));
    }

    return (
        <div className="flex h-96 flex-col gap-3 px-5 py-5">
            <div className="flex items-center justify-between">
                <Label className="text-neutral-300">
                    Environment variables
                    <span className="ml-1 text-neutral-600">(optional)</span>
                </Label>
                <div className="flex items-center gap-2">
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() => setReveal((value) => !value)}
                        className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-neutral-300 cursor-pointer"
                    >
                        {reveal ? (
                            <FaEyeSlash className="size-3" aria-hidden />
                        ) : (
                            <FaEye className="size-3" aria-hidden />
                        )}
                        {reveal ? "Hide values" : "Show values"}
                    </Button>
                    <Button
                        variant="unstyled"
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-neutral-300 cursor-pointer"
                    >
                        <FaFileArrowUp className="size-3" aria-hidden />
                        Import .env
                    </Button>
                    <input
                        ref={fileRef}
                        type="file"
                        accept=".env,.txt,text/plain"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void onFile(file);
                            e.target.value = "";
                        }}
                    />
                </div>
            </div>

            <div
                data-lenis-prevent
                className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2", SURFACE)}
            >
                {rows.map((row, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            value={row.key}
                            onChange={(e) =>
                                setRow(index, { key: e.target.value.replace(/\s/g, "") })
                            }
                            onPaste={(e) => {
                                const text = e.clipboardData.getData("text");
                                if (text.includes("\n") || text.includes("=")) {
                                    e.preventDefault();
                                    merge(parse_env(text));
                                }
                            }}
                            placeholder="KEY"
                            autoComplete="off"
                            data-1p-ignore
                            data-lpignore="true"
                            spellCheck={false}
                            className={cn(FIELD, "flex-1 font-mono")}
                        />
                        <Input
                            value={row.value}
                            onChange={(e) => setRow(index, { value: e.target.value })}
                            type="text"
                            placeholder="value"
                            autoComplete="off"
                            data-1p-ignore
                            data-lpignore="true"
                            spellCheck={false}
                            className={cn(
                                FIELD,
                                "flex-1 font-mono",
                                !reveal && "[-webkit-text-security:disc]",
                            )}
                        />
                        <Button
                            type="button"
                            variant="tertiary"
                            size="icon"
                            className="shrink-0"
                            onClick={() => removeRow(index)}
                            aria-label="Remove variable"
                        >
                            <FaXmark className="size-3.5" aria-hidden />
                        </Button>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between">
                <Button type="button" variant="tertiary" size="sm" onClick={addRow}>
                    <FaPlus className="size-3" aria-hidden />
                    Add variable
                </Button>
                <p className="text-[11px] text-neutral-600">
                    Encrypted at rest. You can add or change these later.
                </p>
            </div>
        </div>
    );
}
