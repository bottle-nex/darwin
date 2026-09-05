import { cn } from "../lib/cn";

const PROSE_CLASS = [
    "text-[17px] leading-[1.8] text-mist/65",
    "[&>*+*]:mt-6",
    "[&_h2]:mt-14 [&_h2]:text-[1.55rem] [&_h2]:font-medium [&_h2]:leading-snug [&_h2]:tracking-tight [&_h2]:text-snow",
    "[&_h3]:mt-10 [&_h3]:text-[1.15rem] [&_h3]:font-medium [&_h3]:text-snow",
    "[&_h2+*]:mt-4 [&_h3+*]:mt-3",
    "[&_strong]:font-medium [&_strong]:text-snow",
    "[&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/30 [&_a]:underline-offset-4 [&_a:hover]:decoration-primary",
    "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
    "[&_li]:mt-2.5 [&_li]:pl-1 [&_li]:marker:text-mist/25",
    "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0",
    "[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2.5",
    "[&_code]:rounded [&_code]:bg-white/6 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[14px] [&_code]:text-mist",
    "[&_pre]:mt-8 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-graphite [&_pre]:bg-charcoal [&_pre]:p-5 [&_pre]:text-[14px] [&_pre]:leading-[1.7]",
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
    "[&_blockquote]:my-10 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-5 [&_blockquote]:text-[1.05rem] [&_blockquote]:text-mist/50 [&_blockquote]:italic",
    "[&_hr]:my-14 [&_hr]:border-graphite",
    "[&_img]:my-10 [&_img]:w-full [&_img]:rounded-xl [&_img]:border [&_img]:border-graphite",
].join(" ");

type ProseProps = {
    html: string;
    className?: string;
};

export function Prose({ html, className }: ProseProps) {
    return (
        <div
            className={cn("tiptap", PROSE_CLASS, className)}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
