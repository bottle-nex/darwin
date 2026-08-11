import { cn } from "@/lib/utils";

interface DottedArrowRightProps {
    size?: number;
    color?: string;
    className?: string;
}

export const DottedArrowRight = ({
    size = 30,
    color = "#ffffff",
    className,
}: DottedArrowRightProps) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 30 30"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(className)}
        >
            <g clipPath="url(#clip0_1208_4920)">
                <circle cx="13.5" cy="9" r="1.5" fill={color} />
                <circle cx="10.5" cy="6" r="1.5" fill={color} />
                <circle cx="19.5" cy="15" r="1.5" fill={color} />
                <circle cx="16.5" cy="18" r="1.5" fill={color} />
                <circle cx="13.5" cy="21" r="1.5" fill={color} />
                <circle cx="10.5" cy="24" r="1.5" fill={color} />
                <circle cx="16.5" cy="12" r="1.5" fill={color} />
            </g>

            <defs>
                <clipPath id="clip0_1208_4920">
                    <rect width="30" height="30" fill="white" />
                </clipPath>
            </defs>
        </svg>
    );
};
