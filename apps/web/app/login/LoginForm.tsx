"use client";

import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";

import AppLogo from "@/components/app/Applogo";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";
import { REQUEST_OTP_URL } from "@/routes/api_routes";

type Step = "options" | "email" | "otp";
type OauthProvider = (typeof oauth_options)[number]["type"];

interface LoginFormProps {
    // Where to land after signing in. The invite page passes its own URL so the
    // user returns to the invitation.
    callbackUrl?: string;
}

const oauth_options = [
    { type: "google", label: "Continue with Google", image: "/images/google.png" },
    { type: "github", label: "Continue with GitHub", image: "/images/github.png" },
] as const;

export default function LoginForm({ callbackUrl = "/playground" }: LoginFormProps) {
    const router = useRouter();
    const [step, setStep] = useState<Step>("options");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [oauthPending, setOauthPending] = useState<OauthProvider | null>(null);
    const [error, setError] = useState("");

    function handleOauth(type: OauthProvider) {
        setOauthPending(type);
        setError("");
        signIn(type, { callbackUrl }).catch(() => {
            setOauthPending(null);
            setError("Couldn't reach the provider. Please try again.");
        });
    }

    async function handleSendOtp() {
        if (!email) return;
        setLoading(true);
        setError("");
        try {
            await axios.post(REQUEST_OTP_URL, { email });
            setStep("otp");
        } catch {
            setError("Failed to send OTP. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function handleVerifyOtp() {
        if (otp.length !== 6) return;
        setLoading(true);
        setError("");
        try {
            const result = await signIn("email-otp", { email, otp, redirect: false });
            if (result?.ok) {
                router.push(callbackUrl);
                router.refresh();
                return;
            }
            setError("Invalid or expired OTP. Please try again.");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
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
                    <AppLogo iconOnly className="mb-6 scale-125" />
                    <h1 className="text-xl font-medium tracking-tight">Log in to matcha</h1>
                </div>

                <div className="mt-8 flex flex-col gap-y-3">
                    {step === "options" && (
                        <>
                            {oauth_options.map((option) => (
                                <Button
                                    key={option.type}
                                    variant="unstyled"
                                    type="button"
                                    onClick={() => handleOauth(option.type)}
                                    loading={oauthPending === option.type}
                                    disabled={oauthPending !== null}
                                    className="flex h-12 items-center justify-center gap-x-2.5 rounded-full bg-white/6 text-sm font-medium transition-colors hover:bg-white/10 active:scale-[.99] cursor-pointer disabled:opacity-60"
                                >
                                    {oauthPending !== option.type && (
                                        <Image
                                            src={option.image}
                                            alt=""
                                            width={18}
                                            height={18}
                                            className={cn(
                                                "shrink-0",
                                                option.type === "github" && "invert",
                                            )}
                                        />
                                    )}
                                    {option.label}
                                </Button>
                            ))}
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={() => setStep("email")}
                                className="flex h-12 items-center justify-center rounded-full bg-white/6 text-sm font-medium transition-colors hover:bg-white/10 active:scale-[.99] cursor-pointer"
                            >
                                Continue with email
                            </Button>
                        </>
                    )}

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
                                className="flex h-12 items-center justify-center gap-x-2 rounded-full bg-[#8B77EC] text-sm font-medium text-white transition-colors hover:bg-[#7c67e3] active:scale-[.99] disabled:opacity-60"
                            >
                                Continue with email
                            </Button>
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={() => {
                                    setStep("options");
                                    setError("");
                                }}
                                className="text-sm text-white/50 transition-colors hover:text-white/80"
                            >
                                Back to all options
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
                                className="flex h-12 items-center justify-center gap-x-2 rounded-full bg-[#8B77EC] text-sm font-medium text-white transition-colors hover:bg-[#7c67e3] active:scale-[.99] disabled:opacity-60"
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
                                className="text-sm text-white/50 transition-colors hover:text-white/80"
                            >
                                Change email
                            </Button>
                        </div>
                    )}

                    {error && <p className="text-center text-xs text-red-400">{error}</p>}
                </div>

                <p className="mt-8 text-center text-xs leading-relaxed text-white/40">
                    Don&apos;t have an account? Just enter your email &amp; we&apos;ll create one.
                </p>
            </div>
        </main>
    );
}
