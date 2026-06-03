"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/format";
import type { Organization } from "@/types/organization";

const FIELD =
    "mt-1.5 border-white/10 bg-white/5 text-neutral-200 placeholder:text-neutral-500 focus-visible:border-[#9bc24f] focus-visible:ring-[#9bc24f]/30";

export default function CreateOrganizationModal({
    open,
    onOpenChange,
    onCreate,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (organization: Organization) => void;
}) {
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [slugEdited, setSlugEdited] = useState(false);
    const [description, setDescription] = useState("");

    function reset() {
        setName("");
        setSlug("");
        setSlugEdited(false);
        setDescription("");
    }

    function handleOpenChange(next: boolean) {
        onOpenChange(next);
        if (!next) reset();
    }

    function handleNameChange(value: string) {
        setName(value);
        if (!slugEdited) setSlug(slugify(value));
    }

    function handleCreate() {
        const trimmed = name.trim();
        if (!trimmed) return;

        onCreate({
            id: crypto.randomUUID(),
            name: trimmed,
            slug: slug.trim() || slugify(trimmed),
            description: description.trim() || null,
            createdAt: new Date().toISOString(),
            memberCount: 1,
            projectCount: 0,
            role: "Owner",
        });

        handleOpenChange(false);
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="border-white/10 bg-charcoal sm:max-w-105">
                <DialogHeader>
                    <DialogTitle className="text-neutral-100">Create organization</DialogTitle>
                    <DialogDescription className="text-neutral-500">
                        Organizations group your projects, teams, and the issues your agents pick up.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                    <div>
                        <Label htmlFor="org-name" className="text-neutral-300">
                            Name
                        </Label>
                        <Input
                            id="org-name"
                            value={name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            placeholder="Acme Labs"
                            autoFocus
                            className={FIELD}
                        />
                    </div>

                    <div>
                        <Label htmlFor="org-slug" className="text-neutral-300">
                            Slug
                        </Label>
                        <div className="relative">
                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-neutral-600">
                                @
                            </span>
                            <Input
                                id="org-slug"
                                value={slug}
                                onChange={(e) => {
                                    setSlugEdited(true);
                                    setSlug(slugify(e.target.value));
                                }}
                                placeholder="acme-labs"
                                className={`${FIELD} pl-7 font-mono`}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="org-description" className="text-neutral-300">
                            Description
                            <span className="ml-1 text-neutral-600">(optional)</span>
                        </Label>
                        <textarea
                            id="org-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does this organization work on?"
                            rows={3}
                            className="mt-1.5 w-full resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-neutral-200 placeholder:text-neutral-500 outline-none focus-visible:border-[#9bc24f] focus-visible:ring-[3px] focus-visible:ring-[#9bc24f]/30"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={!name.trim()}>
                        Create organization
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
