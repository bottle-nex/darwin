"use client";
import type { CapsuleControl } from "@trymatcha/types";

import { Input } from "@/components/ui/input";
import SelectField from "@/components/ui/SelectField";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export default function CapsuleControls({
    controls,
    values,
    onChange,
}: {
    controls: CapsuleControl[];
    values: Record<string, string>;
    onChange: (name: string, value: string) => void;
}) {
    return (
        <div className="flex flex-col gap-2">
            {controls.map((control) => (
                <Field
                    key={control.name}
                    control={control}
                    value={values[control.name] ?? ""}
                    onChange={(next) => onChange(control.name, next)}
                />
            ))}
        </div>
    );
}

function Field({
    control,
    value,
    onChange,
}: {
    control: CapsuleControl;
    value: string;
    onChange: (value: string) => void;
}) {
    if (control.kind === "enum") {
        return (
            <SelectField
                size="sm"
                className="w-full"
                aria-label={control.name}
                value={value}
                onChange={onChange}
                placeholder={control.name}
                options={(control.options ?? []).map((option) => ({
                    value: option,
                    label: option,
                }))}
            />
        );
    }

    if (control.kind === "boolean") {
        const checked = (value === "" ? String(control.default) : value) === "true";
        return (
            <label className="flex h-8 items-center justify-between gap-4 px-2">
                <span className="min-w-0 truncate font-headline text-[12.5px] text-neutral-400">
                    {control.name}
                </span>
                <Switch checked={checked} onCheckedChange={(next) => onChange(String(next))} />
            </label>
        );
    }

    return (
        <Input
            type={control.kind === "number" ? "number" : "text"}
            value={value}
            placeholder={control.name}
            onChange={(event) => onChange(event.target.value)}
            className={cn(
                "h-8 w-full rounded-lg px-2 text-[13px]",
                control.kind === "number" &&
                    "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
            )}
        />
    );
}
