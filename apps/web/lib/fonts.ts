import { Azeret_Mono, Source_Serif_4 } from "next/font/google";

/** Display serif for the landing hero and the panels inside it. */
export const sourceSerif4 = Source_Serif_4({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
});

export const azeretMono = Azeret_Mono({
    subsets: ["latin"],
    weight: ["300", "400", "600", "700"],
    display: "swap",
});
