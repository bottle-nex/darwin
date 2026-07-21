export default function Eyebrow({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-2 w-4 bg-[#bcafff]" />
            <div className="text-neutral-400 font-medium">{text}</div>
        </div>
    );
}
