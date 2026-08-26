"use client";

import { useState } from "react";

export default function ReplayPage() {
    const [active, setActive] = useState(false);

    return (
        <main className="surface">
            <h1>Web replay</h1>
            <button type="button" onClick={() => setActive(true)}>
                Activate web
            </button>
            {active ? <p data-testid="web-changed">Web active</p> : null}
        </main>
    );
}
