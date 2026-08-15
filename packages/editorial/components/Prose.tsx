import { cn } from "../lib/cn";

const PROSE_CLASS = [
    "max-w-[680px] text-[15px] leading-[1.75] text-mist/70",
    "[&>*+*]:mt-4",
    "[&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:tracking-tight [&_h2]:text-snow",
    "[&_h3]:mt-8 [&_h3]:text-[15px] [&_h3]:font-medium [&_h3]:text-snow",
    "[&_strong]:font-medium [&_strong]:text-snow",
    "[&_a]:text-primary [&_a]:underline [&_a]:decoration-primary/30 [&_a]:underline-offset-4 [&_a:hover]:decoration-primary",
    "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
    "[&_li]:mt-1.5 [&_li]:marker:text-mist/25",
    "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-1",
    "[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2",
    "[&_code]:rounded [&_code]:bg-white/6 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-mist",
    "[&_pre]:mt-5 [&_pre]:overflow-x-auto [&_pre]:rounded-[10px] [&_pre]:border [&_pre]:border-graphite [&_pre]:bg-charcoal [&_pre]:p-4",
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[13px]",
    "[&_blockquote]:border-l [&_blockquote]:border-graphite [&_blockquote]:pl-4 [&_blockquote]:text-mist/50",
    "[&_hr]:my-10 [&_hr]:border-graphite",
    "[&_img]:my-5 [&_img]:rounded-[10px] [&_img]:border [&_img]:border-graphite",
    "[&_table]:w-full [&_table]:text-left",
    "[&_th]:border-b [&_th]:border-graphite [&_th]:pb-2 [&_th]:font-medium [&_th]:text-snow",
    "[&_td]:border-b [&_td]:border-graphite/60 [&_td]:py-2",
].join(" ");

type ProseProps = {
    /** Sanitized HTML from the server. Sanitization happens on write, never here. */
    html: string;
    className?: string;
};

export function Prose({ html, className }: ProseProps) {
    return (
        <div className={cn(PROSE_CLASS, className)} dangerouslySetInnerHTML={{ __html: html }} />
    );
}
