"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HiBars3, HiChevronRight, HiXMark } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { azeretMono, Button } from "@/components/ui/button";
import AppLogo from "@/components/app/Applogo";

const NAV_ITEMS = [
	{ label: "Features", href: "/#features" },
	{ label: "Pricing", href: "/#pricing" },
	{ label: "About", href: "/#about" },
];
export function NavBar() {
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);
	const headerRef = useRef<HTMLElement>(null);

	useEffect(() => {
		function onScroll() {
			const scrollY = window.scrollY;
			setScrolled(scrollY > 10);
		}

		document.addEventListener("scroll", onScroll);
		return () => document.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<header
			ref={headerRef}
			className={cn(
				"fixed top-0 left-0 right-0 z-50",
				"transition-[height,border-color] duration-300 ease-out",
				scrolled ? "border-b border-neutral-200 h-15" : "border-b border-transparent h-17",
			)}
		>
			<div className="mx-auto max-w-7xl flex h-full items-center justify-between px-4">
				<div className="flex items-center gap-8 justify-between">
					<Link href="/" aria-label="try matcha home">
						<AppLogo />
					</Link>
				</div>
				<nav className={cn("hidden md:flex items-center uppercase", azeretMono.className)}>
					{NAV_ITEMS.map((item, i) => (
						<div key={item.label} className="flex items-center">
							{i > 0 && <span className="h-2.5 w-px bg-neutral-700" />}
							<Link
								href={item.href}
								className="flex items-center px-4 text-[13px] font-medium text-foreground transition-colors duration-200 hover:text-foreground/70"
							>
								{item.label}
							</Link>
						</div>
					))}
				</nav>{" "}
				<div className="flex items-center gap-2">
					<Button variant={"secondary"} className="flex items-center justify-center">
						Sign in
						<HiChevronRight className="h-3 w-3" />
					</Button>
					<Button className="flex items-center justify-center">
						Get Started
						<HiChevronRight className="h-3 w-3" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label={menuOpen ? "Close menu" : "Open menu"}
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen((open) => !open)}
						className="md:hidden text-foreground/70"
					>
						{menuOpen ? <HiXMark className="size-5" /> : <HiBars3 className="size-5" />}
					</Button>
				</div>
			</div>
		</header>
	);
}
