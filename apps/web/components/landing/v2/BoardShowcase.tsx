import Image from "next/image";

export default function BoardShowcase() {
    return (
        <main className="relative z-40 mx-6 mb-8 mt-[-25vh]">
            <section className="relative z-10 w-full pb-20 sm:pb-28 mx-auto max-w-332 scroll-mt-20 pt-2">
                <div className="rounded-xl px-6">
                    <div className="overflow-hidden rounded-sm ring-2 ring-white/5 ">
                        <Image
                            src="/images/matcha-pg.png"
                            alt="matcha playground board"
                            width={3024}
                            height={1964}
                            priority
                            className="w-full"
                        />
                    </div>
                </div>
            </section>
        </main>
    );
}
