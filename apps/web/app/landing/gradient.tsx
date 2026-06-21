export default function Gradient() {
    return (
        <div
            className="absolute inset-0 z-40"
            style={{
                background: `
                    radial-gradient(ellipse at 0% 136%,
                        rgba(54, 72, 108, 0.92) 0%,
                        rgba(105, 115, 148, 0.75) 24%,
                        rgba(160, 161, 191, 0.50) 46%,
                        rgba(214, 214, 226, 0.25) 72%,
                        rgba(250, 250, 250, 0.05) 100%
                    )
                `,
            }}
        />
    );
}
