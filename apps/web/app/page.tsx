import { Footer } from "@/components/app/Footer";
import LandingKanbanBoard from "@/components/landing/kanban/LandingKanbanBoard";
import LandingHero from "@/components/landing/LandingHero";
import { NavBar } from "@/components/nav/Navbar";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col bg-snow pt-14">
            <NavBar />
            <LandingHero />
            <LandingKanbanBoard />
            <Footer />
        </main>
    );
}
