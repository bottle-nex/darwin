import Image from "next/image";
import { Button } from "../ui/button";
import { FaChevronRight } from "react-icons/fa6";

export default function RevampHero() {
    return (
        <main className="relative min-h-screen w-screen bg-ink">
            <section className="mx-auto w-full max-w-7xl mt-68 h-fit space-y-6">
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
                            <FaChevronRight />
                        </Button>
                    </span>
                </div>
            </section>
            <section className="mx-auto w-full max-w-7xl relative h-[80vh] mt-12">
                <Image
                    src={"/landing/hero.jpg"}
                    alt="something"
                    fill
                    className="object-cover rounded-[10px]"
                />
            </section>
        </main>
    );
}
