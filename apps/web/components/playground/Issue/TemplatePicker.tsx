"use client";

import { useState } from "react";
import { FaLongArrowAltRight } from "react-icons/fa";
import { MdStar } from "react-icons/md";
import { TbTemplateFilled } from "react-icons/tb";

import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { IconPickGlyph } from "@/components/ui/IconPicker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TooltipComponent } from "@/components/ui/tooltip-component";
import { useListTemplates } from "@/hooks/templates/useListTemplates";
import { BUILTIN_ISSUE_TEMPLATES } from "@/lib/templates/builtinTemplates";
import type { PickableTemplate } from "@/types/issueTemplate";

import { CapsuleTrigger } from "./Capsule";

interface TemplatePickerProps {
    projectId: string | undefined;
    onPick: (template: PickableTemplate) => void;
}

export default function TemplatePicker({ projectId, onPick }: TemplatePickerProps) {
    const [open, setOpen] = useState(false);
    const { data: saved } = useListTemplates(projectId);

    const projectTemplates = saved ?? [];
    const defaultId = projectTemplates.find((template) => template.isDefault)?.id;

    function handlePick(template: PickableTemplate) {
        setOpen(false);
        onPick(template);
    }

    function row(template: PickableTemplate) {
        return (
            <CommandItem
                key={template.id}
                value={template.name}
                onSelect={() => handlePick(template)}
            >
                {template.icon ? (
                    <IconPickGlyph pick={template.icon} className="size-3.5 shrink-0" />
                ) : (
                    <FaLongArrowAltRight className="size-3.5 shrink-0 text-white/30" aria-hidden />
                )}
                <span className="min-w-0 flex-1 truncate">{template.name}</span>
                {template.id === defaultId && (
                    <MdStar className="size-3.5 shrink-0 text-matcha" aria-label="Default" />
                )}
            </CommandItem>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <TooltipComponent side="bottom" content="Start from a template">
                <PopoverTrigger asChild>
                    <CapsuleTrigger
                        aria-label="Start from a template"
                        className="size-7 shrink-0 justify-center rounded-full p-0 hover:text-white/80"
                    >
                        <TbTemplateFilled className="size-3.5 text-white/60" />
                    </CapsuleTrigger>
                </PopoverTrigger>
            </TooltipComponent>
            <PopoverContent align="end" className="w-44 p-0">
                <Command>
                    <CommandList
                        data-lenis-prevent
                        className="no-scrollbar max-h-40 overflow-y-auto"
                    >
                        <CommandGroup>
                            {[...projectTemplates, ...BUILTIN_ISSUE_TEMPLATES].map(row)}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
