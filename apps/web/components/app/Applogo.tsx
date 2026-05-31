import { GiAbstract042 } from "react-icons/gi";

interface AppLogoProps {
	iconOnly?: boolean;
	className?: string;
}

export default function AppLogo({ iconOnly = false, className = "" }: AppLogoProps) {
	return (
		<div className={`flex items-center gap-2 ${className}`}>
			<GiAbstract042 className="h-6 w-6 text-foreground" aria-hidden />
			{!iconOnly && (
				<span className="text-lg font-semibold tracking-tight text-foreground">
					{/* try matcha */}
				</span>
			)}
		</div>
	);
}
