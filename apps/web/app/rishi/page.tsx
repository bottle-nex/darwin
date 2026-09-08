import { DracoMark } from "@/components/rishi/DracoMark";
import { GlassDIcon } from "@/components/rishi/GlassDIcon";
import ParticleSphere from "@/components/rishi/ParticleSphere";

export default function RishiPage() {
    return (
        <main className="relative h-screen w-screen bg-black">
            <ParticleSphere />
            <GlassDIcon className="absolute top-10 left-1/2 size-40 -translate-x-1/2" />
            <DracoMark className="absolute bottom-10 left-1/2 h-14 w-auto -translate-x-1/2 text-white" />
        </main>
    );
}
