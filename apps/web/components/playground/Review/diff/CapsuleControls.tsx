"use client";
import type { CapsuleControl } from "@trymatcha/types";

import { MICRO_LABEL } from "@/components/playground/Core/components/paneBar";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function CapsuleControls({
    controls,
    values,
    onChange,
}: {
    controls: CapsuleControl[];
    values: Record<string, string>;
    onChange: (name: string, value: string) => void;
}) {
    if (controls.length === 0) return null;

    return (
        <section className="flex flex-col gap-2">
            <span className={MICRO_LABEL}>Props</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                {controls.map((control) => (
                    <label key={control.name} className="flex items-center gap-2">
                        <span className="text-[12px] text-neutral-400">{control.name}</span>
                        <Field
                            control={control}
                            value={values[control.name] ?? String(control.default)}
                            onChange={(next) => onChange(control.name, next)}
                        />
                    </label>
                ))}
            </div>
        </section>
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
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger size="sm" className="max-w-44 text-[13px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {(control.options ?? []).map((option) => (
                        <SelectItem key={option} value={option}>
                            {option}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    if (control.kind === "boolean") {
        return (
            <Switch
                checked={value === "true"}
                onCheckedChange={(checked) => onChange(String(checked))}
            />
        );
    }

    return (
        <Input
            type={control.kind === "number" ? "number" : "text"}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-7 max-w-56 text-[13px]"
        />
    );
}
