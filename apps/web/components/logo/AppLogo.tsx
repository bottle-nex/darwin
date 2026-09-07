import type { SVGProps } from "react";

export const APP_LOGO_SIZE = { width: 66, height: 49 };

export const APP_LOGO_PATH =
    "M22.5 48a17.5 17.5 0 1 0 35 0a17.5 17.5 0 1 0 -35 0M29.5 48a10.5 10.5 0 1 1 21 0a10.5 10.5 0 1 1 -21 0M39.5 48a22.5 22.5 0 1 0 45 0a22.5 22.5 0 1 0 -45 0M46.5 48a15.5 15.5 0 1 1 31 0a15.5 15.5 0 1 1 -31 0";

export function AppLogo(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            fill="currentColor"
            fillRule="evenodd"
            viewBox={`20.5 23.5 ${APP_LOGO_SIZE.width} ${APP_LOGO_SIZE.height}`}
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...props}
        >
            <path d={APP_LOGO_PATH} fillRule="evenodd" />
        </svg>
    );
}
