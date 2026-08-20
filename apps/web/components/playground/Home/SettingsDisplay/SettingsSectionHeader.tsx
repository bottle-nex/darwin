export default function SettingsSectionHeader({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div>
            <h2 className="text-[13px] font-semibold text-neutral-100">{title}</h2>
            <p className="mt-1 text-[12px] text-neutral-500">{description}</p>
        </div>
    );
}
