const PUFFS = [
    { size: 5, delay: "0s", bottom: 1 },
    { size: 3, delay: "0.1s", bottom: 4 },
    { size: 4, delay: "0.22s", bottom: 0 },
    { size: 3, delay: "0.34s", bottom: 6 },
    { size: 4, delay: "0.45s", bottom: 2 },
];

export default function DustTrail() {
    return (
        <div aria-hidden className="absolute bottom-0 -left-2">
            {PUFFS.map((puff, i) => (
                <span
                    key={i}
                    className="cb-dust absolute bg-[#4A4456]"
                    style={{
                        width: puff.size,
                        height: puff.size,
                        bottom: puff.bottom,
                        animationDelay: puff.delay,
                    }}
                />
            ))}
        </div>
    );
}
