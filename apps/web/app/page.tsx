import { Footer } from "@/components/app/Footer";
import LandingKanbanBoard from "@/components/landing/kanban/LandingKanbanBoard";
import { NavBar } from "@/components/nav/Navbar";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col bg-snow pt-14">
            <NavBar />
            <LandingKanbanBoard />
            <Footer />
        </main>
    );
}
