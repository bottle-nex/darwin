import type { IconBaseProps, IconType } from "react-icons";
import type { ReactNode } from "react";

import { IconTooltip } from "./IconTooltip";

type IconProps = IconBaseProps & {
    children?: ReactNode;
};

export function createIcon(Glyph: IconType) {
    return function Icon({ children, ...props }: IconProps) {
        if (!children) return <Glyph {...props} />;
        return (
            <IconTooltip content={children}>
                <Glyph {...props} />
            </IconTooltip>
        );
    };
}
