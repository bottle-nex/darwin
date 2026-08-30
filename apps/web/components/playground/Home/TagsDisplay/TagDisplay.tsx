import Pill from "@/components/ui/Pill";

interface TagDisplayProps {
    name: string;
    color: string;
    className?: string;
}

export default function TagDisplay({ name, color, className }: TagDisplayProps) {
    return (
        <Pill dotColor={color} className={className}>
            <span className="truncate">{name}</span>
        </Pill>
    );
}
