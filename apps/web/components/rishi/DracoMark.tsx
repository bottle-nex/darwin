import type { SVGProps } from "react";

export const DRACO_MARK_PATH =
    "M105.4 0L452.7 0A21.5 21.5 0 0 1 455.9 38L336.8 205.7A129 129 0 0 1 231.6 260L80.6 260L107.8 221.8L217.5 221.8L334.7 56.6A11.8 11.8 0 0 0 325.1 38L78.5 38ZM58.6 66L203.7 66A7.6 7.6 0 0 1 209.9 78L107.8 221.8L0 221.8L87.1 99.1L35.1 99.1Z";

export function DracoMark(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            fill="currentColor"
            viewBox="0 0 466 260"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            {...props}
        >
            <path d={DRACO_MARK_PATH} />
        </svg>
    );
}
