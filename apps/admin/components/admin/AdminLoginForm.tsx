"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { REQUEST_ADMIN_OTP_URL, VERIFY_ADMIN_OTP_URL } from "@/routes/api_routes";
import AdminSession from "@/lib/session";
import { cn } from "@/lib/utils";

type Step = "email" | "otp";

export default function AdminLoginForm() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("email");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSendOtp() {
        if (!email) return;
        setLoading(true);
        setError("");
        try {
            await axios.post(REQUEST_ADMIN_OTP_URL, { email });
            setStep("otp");
        } catch {
            setError("Failed to send code. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOtp() {
        if (otp.length !== 6) return;
        setLoading(true);
        setError("");
        try {
            const { data } = await axios.post(VERIFY_ADMIN_OTP_URL, { email, code: otp });
            AdminSession.set(data.data.token, data.data.admin.email);
            router.replace("/");
            router.refresh();
        } catch {
            setError("Invalid or expired code. Please try again.");
            setLoading(false);
        }
    }

    const otpSlotClass = cn(
        "h-12 flex-1 rounded-md border border-white/15 bg-white/5 text-base text-white shadow-none",
        "data-[active=true]:border-[#8B77EC] data-[active=true]:ring-2 data-[active=true]:ring-[#8B77EC]/30",
    );

    return (
        <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-ink px-4 text-white">
            <div className="w-full max-w-80">
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-medium tracking-tight">darwin admin</h1>
                    <p className="mt-1.5 text-center text-sm text-white/40">
                        Sign in with an allowlisted address.
                    </p>
                </div>

                <div className="mt-8 flex flex-col gap-y-3">
                    {step === "email" && (
                        <div className="flex flex-col gap-y-3">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                autoFocus
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                                className="h-12 w-full rounded-full border border-white/15 bg-white/5 px-5 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#8B77EC]"
                            />
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={handleSendOtp}
                                loading={loading}
                                disabled={!email}
                                className="flex h-12 cursor-pointer items-center justify-center gap-x-2 rounded-full bg-[#8B77EC] text-sm font-medium text-white transition-colors hover:bg-[#7c67e3] active:scale-[.99] disabled:opacity-60"
                            >
                                Send code
                            </Button>
                        </div>
                    )}

                    {step === "otp" && (
                        <div className="flex flex-col gap-y-4">
                            <p className="text-center text-sm text-white/60">
                                Enter the 6-digit code sent to{" "}
                                <span className="font-medium text-white">{email}</span>
                            </p>
                            <InputOTP
                                maxLength={6}
                                containerClassName="w-full"
                                value={otp}
                                onChange={setOtp}
                                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                            >
                                <InputOTPGroup className="w-full justify-between gap-x-2">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <InputOTPSlot key={i} index={i} className={otpSlotClass} />
                                    ))}
                                </InputOTPGroup>
                            </InputOTP>
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={handleVerifyOtp}
                                loading={loading}
                                disabled={otp.length !== 6}
                                className="flex h-12 cursor-pointer items-center justify-center gap-x-2 rounded-full bg-[#8B77EC] text-sm font-medium text-white transition-colors hover:bg-[#7c67e3] active:scale-[.99] disabled:opacity-60"
                            >
                                Sign in
                            </Button>
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={() => {
                                    setStep("email");
                                    setOtp("");
                                    setError("");
                                }}
                                className="cursor-pointer text-sm text-white/50 transition-colors hover:text-white/80"
                            >
                                Change email
                            </Button>
                        </div>
                    )}

                    {error && <p className="text-center text-xs text-red-400">{error}</p>}
                </div>
            </div>
        </main>
    );
}
