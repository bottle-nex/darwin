import { Button } from "../ui/button";
import { RiExpandLeftRightFill } from "react-icons/ri";

export default function PlaygroundTopper() {
    return (
        <main className="w-full h-12 flex items-center">
            <Button
                variant="ghost"
                size="sm"
                className="ml-12 text-neutral-300 hover:bg-transparent"
            >
                All Project
                <RiExpandLeftRightFill className="rotate-90" />
            </Button>
        </main>
    );
}
