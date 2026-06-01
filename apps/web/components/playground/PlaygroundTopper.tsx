import { Button } from "../ui/button";
import { RiExpandLeftRightFill } from "react-icons/ri";
import { PiBuildingOfficeFill } from "react-icons/pi";
import IconWrapper from "../ui/IconWrapper";

export default function PlaygroundTopper() {
    return (
        <main className="w-full h-12 flex items-center">
            <Button
                variant="ghost"
                size="sm"
                className="ml-14 text-neutral-300 hover:bg-transparent rounded-sm"
            >
                <IconWrapper
                    icon={<PiBuildingOfficeFill />}
                    stroke_color="text-indigo-200"
                    bg_color="bg-indigo-700"
                />
                All Project
                <RiExpandLeftRightFill className="rotate-90" />
            </Button>
        </main>
    );
}
