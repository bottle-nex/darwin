import { Footer } from "@/components/app/Footer";
import { NavBar } from "@/components/nav/Navbar";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col bg-snow pt-14">
			<NavBar />
			<main className="h-screen"></main>
			<Footer />
		</main>
	);
}
