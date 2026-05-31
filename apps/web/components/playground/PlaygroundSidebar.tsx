'use client';
import {
    RiLayoutColumnFill,
    RiCodeSSlashFill,
    RiListSettingsFill,
    RiFlashlightFill,
    RiSettingsFill,
} from 'react-icons/ri';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    PlayGroundSidebarProps,
    usePlaygroundRenderer,
} from '@/store/playground/usePlaygroundRenderer';
import { cn } from '@/lib/utils';

type RendererMeta = {
    icon: React.ElementType;
    label: string;
};

const RENDERER_META: Record<PlayGroundSidebarProps, RendererMeta> = {
    [PlayGroundSidebarProps.KANBAN]: { icon: RiLayoutColumnFill, label: 'Kanban' },
    [PlayGroundSidebarProps.CODE]: { icon: RiCodeSSlashFill, label: 'Code' },
    [PlayGroundSidebarProps.PROPS]: { icon: RiListSettingsFill, label: 'Props' },
    [PlayGroundSidebarProps.EVENTS]: { icon: RiFlashlightFill, label: 'Events' },
    [PlayGroundSidebarProps.MANAGE]: { icon: RiSettingsFill, label: 'Manage' },
};

const RENDERERS = Object.values(PlayGroundSidebarProps);

export default function PlaygroundSidebar() {
    const renderer = usePlaygroundRenderer((s) => s.renderer);
    const setRenderer = usePlaygroundRenderer((s) => s.setRenderer);

    return (
        <aside className="flex h-full w-14 shrink-0 flex-col items-center gap-1 bg-[#141414] py-3">
            <nav className="flex flex-col items-center gap-1" aria-label="Playground views">
                {RENDERERS.map((key) => {
                    const { icon: Icon, label } = RENDERER_META[key];
                    const active = renderer === key;

                    return (
                        <Tooltip key={key}>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    onClick={() => setRenderer(key)}
                                    aria-label={label}
                                    aria-current={active ? 'true' : undefined}
                                    className={cn(
                                        'group relative flex size-10 items-center justify-center rounded-md outline-none transition-all duration-200 ease-out cursor-pointer',
                                        'focus-visible:ring-2 focus-visible:ring-[#9bc24f]/40',
                                        active
                                            ? 'bg-[#9bc24f]/10 text-[#bcdb6f]'
                                            : 'text-neutral-500 hover:bg-neutral-800/60 hover:text-neutral-200',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'absolute left-0 h-5 w-0.5 rounded-full bg-[#9bc24f] transition-all duration-200 ease-out',
                                            active ? 'opacity-100' : 'opacity-0 -translate-x-1',
                                        )}
                                        aria-hidden
                                    />
                                    <Icon
                                        className={cn(
                                            'size-4.5 transition-transform duration-200 ease-out',
                                            !active && 'group-hover:scale-110',
                                        )}
                                        aria-hidden
                                    />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">{label}</TooltipContent>
                        </Tooltip>
                    );
                })}
            </nav>
        </aside>
    );
}
