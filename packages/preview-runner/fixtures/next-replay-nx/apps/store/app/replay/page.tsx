"use client";

import { useState } from "react";

export default function ReplayPage() {
    const [served, setServed] = useState(false);

    return (
        <main className="nx-card">
            <h1>Nx replay</h1>
            <button type="button" onClick={() => setServed(true)}>
                Activate Nx target
            </button>
            {served ? <p data-testid="nx-changed">Nx target active</p> : null}
        </main>
    );
}
