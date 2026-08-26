"use client";

import { useState } from "react";

export default function ReplayPage() {
    const [active, setActive] = useState(false);

    return (
        <main className="replay-shell">
            <section className="replay-pulse">
                <h1>Standalone replay</h1>
                <button type="button" onClick={() => setActive(true)}>
                    Activate standalone
                </button>
                {active ? <p data-testid="standalone-changed">Standalone active</p> : null}
            </section>
        </main>
    );
}
