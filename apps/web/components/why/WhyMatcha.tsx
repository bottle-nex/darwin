export default function WhyMatcha() {
    return (
        <div className="min-h-screen h-full w-screen max-w-[1352px] mx-auto ring-1 ring-snow/10 rounded-lg flex flex-col">
            <div
                style={{
                    perspective: "1000px",
                    width: "600px",
                    height: "400px",
                    margin: "400px auto",
                    rotate: "130deg",
                }}
            >
                <div
                    style={{
                        position: "relative",
                        width: "300px",
                        height: "200px",
                        margin: "0 auto",
                        transformStyle: "preserve-3d",
                        transform: "rotateX(-45deg) rotateY(-40deg)",
                    }}
                >
                    {/* Back Card */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            border: "2px solid #ef4444",
                            background: "rgba(239, 68, 68, 0.15)",
                            borderRadius: "16px",
                            transform: "translateX(-10px) translateY(20px) translateZ(-120px)",
                        }}
                    />

                    {/* Middle Card */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            border: "2px solid #f59e0b",
                            background: "rgba(245, 158, 11, 0.15)",
                            borderRadius: "16px",
                            transform: "translateX(-10px) translateY(10px) translateZ(-60px)",
                        }}
                    />

                    {/* Front Card */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            border: "2px solid #22c55e",
                            background: "rgba(34, 197, 94, 0.15)",
                            borderRadius: "16px",
                            transform: "translateZ(0px)",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
