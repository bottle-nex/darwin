import Image from "next/image";

import { cn } from "@/lib/utils";

type StackCard = {
    title: string;
    author: string;
    cover: string;
    ink: string;
    transform: string;
    z: number;
    image?: string;
};

const CARDS: StackCard[] = [
    {
        title: "The Art of Doing Science and Engineering",
        author: "Richard Hamming",
        cover: "bg-[#1e2b20]",
        ink: "text-[#f1e8d5]",
        transform: "translate(0px, 26px) rotate(-15deg)",
        z: 1,
    },
    {
        title: "Build a Large Language Model",
        author: "Sebastian Raschka",
        cover: "bg-[#5d1b1b]",
        ink: "text-[#f6e2d7]",
        transform: "translate(52px, 0px) rotate(-5deg)",
        z: 3,
        image: "/landing/travel-image.jpg",
    },
    {
        title: "Why Machines Learn",
        author: "Anil Ananthaswamy",
        cover: "bg-[#f3efe6]",
        ink: "text-[#2a2a2e]",
        transform: "translate(104px, 32px) rotate(6deg)",
        z: 2,
    },
];

export default function HeroCardStack({ className }: { className?: string }) {
    return (
        <div className={cn("relative h-[19rem] w-[18rem]", className)}>
            {CARDS.map((card) => (
                <div
                    key={card.title}
                    style={{ transform: card.transform, zIndex: card.z }}
                    className={cn(
                        "absolute top-0 left-0 flex h-60 w-42 flex-col justify-between overflow-hidden rounded-xl ring-2 ring-edge p-4 shadow-[0_18px_36px_-18px_rgba(24,24,27,0.45)]",
                        card.cover,
                        card.ink,
                    )}
                >
                    {card.image && (
                        <>
                            <Image
                                src={card.image}
                                alt=""
                                fill
                                sizes="176px"
                                className="object-cover"
                            />
                            <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/10 to-black/65" />
                        </>
                    )}
                    <span className="relative text-[13px] leading-snug font-medium">
                        {card.title}
                    </span>
                    <span className="relative text-[10px] tracking-[0.14em] uppercase opacity-70">
                        {card.author}
                    </span>
                </div>
            ))}
        </div>
    );
}
