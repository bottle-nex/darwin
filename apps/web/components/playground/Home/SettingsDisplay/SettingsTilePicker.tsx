import { cn } from "@/lib/utils";

export type TileOption<T extends string> = {
    id: T;
    label: string;
    description: string;
    preview?: () => React.ReactElement;
};

export default function SettingsTilePicker<T extends string>({
    name,
    options,
    value,
    onChange,
    columns = 2,
}: {
    name: string;
    options: TileOption<T>[];
    value: T;
    onChange: (next: T) => void;
    columns?: 2 | 3;
}) {
    return (
        <div className={cn("grid gap-2", columns === 3 ? "grid-cols-3" : "grid-cols-2")}>
            {options.map((option) => (
                <label
                    key={option.id}
                    className="group cursor-pointer rounded-[12px] bg-snow/3 p-3 transition-colors hover:bg-snow/6 has-checked:bg-primary/10"
                >
                    <input
                        type="radio"
                        name={name}
                        className="sr-only"
                        value={option.id}
                        checked={value === option.id}
                        onChange={() => onChange(option.id)}
                    />
                    {option.preview && <option.preview />}
                    <div className={cn("flex items-center gap-1.5 px-1", option.preview && "mt-2")}>
                        <span className="text-[12px] font-medium text-neutral-300 transition-colors group-has-checked:text-neutral-100">
                            {option.label}
                        </span>
                    </div>
                    <p className="mt-1 px-1 text-[11px] text-neutral-500">{option.description}</p>
                </label>
            ))}
        </div>
    );
}
