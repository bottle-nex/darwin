import { Reveal } from "./Reveal";

type EditorialHeroProps = {
    title: string;
    titleContinued: string;
    description: string;
};

export function EditorialHero({ title, titleContinued, description }: EditorialHeroProps) {
    return (
        <div className="flex flex-col items-start">
            <Reveal>
                <h1 className="max-w-4xl text-[2.5rem] leading-tight tracking-tight">
                    <span className="text-snow">{title} </span>
                    <span className="text-neutral-500">{titleContinued}</span>
                </h1>
            </Reveal>
            <Reveal delay={0.1}>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-neutral-500 md:text-lg">
                    {description}
                </p>
            </Reveal>
        </div>
    );
}
