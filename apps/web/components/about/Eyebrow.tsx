export default function Eyebrow({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <div className="h-2 w-4 bg-[#AB9FF2]" />
            <div className="text-neutral-500 font-medium">{text}</div>
        </div>
    );
}
