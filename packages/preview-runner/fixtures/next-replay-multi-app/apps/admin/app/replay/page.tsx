"use client";

import { useState } from "react";

export default function ReplayPage() {
    const [active, setActive] = useState(false);

    return (
        <main className="surface">
            <h1>Admin replay</h1>
            <button type="button" onClick={() => setActive(true)}>
                Activate admin
            </button>
            {active ? <p data-testid="admin-changed">Admin active</p> : null}
        </main>
    );
}
