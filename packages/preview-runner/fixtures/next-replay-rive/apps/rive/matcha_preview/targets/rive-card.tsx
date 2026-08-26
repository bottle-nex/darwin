"use client";

import { RuntimeLoader } from "@rive-app/canvas";
import { useEffect, useState } from "react";

export default function RiveCard() {
    const [runtimeReady, setRuntimeReady] = useState(false);
    const [active, setActive] = useState(false);

    useEffect(() => {
        let mounted = true;
        RuntimeLoader.awaitInstance().then(() => {
            if (mounted) setRuntimeReady(true);
        });
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <section>
            <div
                className={runtimeReady ? "rive-orbit" : undefined}
                data-testid={runtimeReady ? "rive-runtime-ready" : "rive-runtime-loading"}
            />
            <button type="button" disabled={!runtimeReady} onClick={() => setActive(true)}>
                Activate Rive
            </button>
            {active ? <p data-testid="rive-changed">Rive active</p> : null}
        </section>
    );
}
