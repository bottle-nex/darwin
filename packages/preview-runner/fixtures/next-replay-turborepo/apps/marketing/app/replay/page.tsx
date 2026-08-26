"use client";

import { SharedBanner } from "@matcha-fixture/replay-ui";
import { useState } from "react";

export default function ReplayPage() {
    const [shared, setShared] = useState(false);

    return (
        <SharedBanner>
            <h1>Turborepo replay</h1>
            <button type="button" onClick={() => setShared(true)}>
                Activate shared UI
            </button>
            {shared ? <p data-testid="turbo-changed">Shared package active</p> : null}
        </SharedBanner>
    );
}
