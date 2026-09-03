import type { SVGProps } from "react";

export const MATCHA_LOGO_SIZE = { width: 792, height: 460 };

export const MATCHA_LOGO_PATH =
    "M626.9 24.4L657 40.8L657 215.5L759.9 147L792 164.5L792 438.5L657 438.5L657 214.6L328.7 447.2L328.7 227.2L0 460.1L0 235.9L297.9 37.4L328.7 54.2L328.7 223Z";

export function MatchaLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            fill="currentColor"
            fillRule="evenodd"
            viewBox={`0 0 ${MATCHA_LOGO_SIZE.width} ${MATCHA_LOGO_SIZE.height}`}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...props}
        >
            <path d={MATCHA_LOGO_PATH} />
        </svg>
    );
}
