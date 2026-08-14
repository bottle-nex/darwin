import Image from "next/image";
import { Button } from "../ui/button";
import { MdChevronRight } from "react-icons/md";
import { cn } from "@/lib/utils";
import { landingContainer } from "./LandingSection";

export default function RevampHero() {
    return (
        <main className="relative min-h-screen w-screen bg-ink pb-20">
            <section className={cn(landingContainer, "mt-68 h-fit space-y-6")}>
                <div className="text-snow text-5xl w-[70%]">
                    Lorem ipsum dolor, sit amet consectetur adipisicing elit. Sequi
                </div>
                <div className="flex w-full items-center">
                    <div className="text-snow/70 text-lg w-[60%]">
                        Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto corporis
                        provident sit cumque deleniti qui dignissimos ex in placeat, similique
                        aspernatur voluptatibus illo?
                    </div>
                    <span className="flex-1 flex justify-end">
                        <Button variant={"tertiary"} className="text-graphite rounded-full bg-snow">
                            Get started
                            <MdChevronRight className="text-background!" />
                        </Button>
                    </span>
                </div>
            </section>
            <section className={cn(landingContainer, "mt-16")}>
                <div className="relative h-[80vh]">
                    <Image
                        src={"/landing/hero.jpg"}
                        alt="something"
                        fill
                        className="object-cover rounded-[10px]"
                    />
                </div>
            </section>
        </main>
    );
}
