"use client";

import { useState } from "react";

import { useFixtureContext } from "../../app/providers";

export default function ProviderCard() {
    const provider = useFixtureContext();
    const [active, setActive] = useState(false);

    return (
        <section className="provider-card">
            <p data-testid={`${provider}-layout`}>{provider}</p>
            <button type="button" onClick={() => setActive(true)}>
                Activate {provider}
            </button>
            {active ? <p data-testid={`${provider}-changed`}>{provider} active</p> : null}
        </section>
    );
}
