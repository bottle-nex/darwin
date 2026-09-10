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
        "h-12 flex-1 rounded-md border border-edge bg-snow text-base text-foreground shadow-none",
        "data-[active=true]:border-primary data-[active=true]:ring-2 data-[active=true]:ring-primary/30",
    );

    return (
        <main className="flex min-h-dvh w-full flex-col items-center justify-center bg-ink px-4 text-foreground">
            <div className="w-full max-w-80">
                <div className="flex flex-col items-center">
                    <AppLogo iconOnly className="mb-6 scale-125" />
                    <h1 className="text-xl font-medium tracking-tight">Log in to darwin</h1>
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
                                    className="flex h-12 items-center justify-center gap-x-2.5 rounded-full border border-edge bg-snow text-sm font-medium shadow-[0_1px_2px_rgba(24,24,27,0.05)] transition-colors hover:bg-mist active:scale-[.99] cursor-pointer disabled:opacity-60"
                                >
                                    {oauthPending !== option.type && (
                                        <Image
                                            src={option.image}
                                            alt=""
                                            width={18}
                                            height={18}
                                            className="shrink-0"
                                        />
                                    )}
                                    {option.label}
                                </Button>
                            ))}
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={() => setStep("email")}
                                className="flex h-12 items-center justify-center rounded-full border border-edge bg-snow text-sm font-medium shadow-[0_1px_2px_rgba(24,24,27,0.05)] transition-colors hover:bg-mist active:scale-[.99] cursor-pointer"
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
                                className="h-12 w-full rounded-full border border-edge bg-snow px-5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
                            />
                            <Button
                                variant="unstyled"
                                type="button"
                                onClick={handleSendOtp}
                                loading={loading}
                                disabled={!email}
                                className="flex h-12 items-center justify-center gap-x-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[.99] disabled:opacity-60"
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
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Back to all options
                            </Button>
                        </div>
                    )}

                    {step === "otp" && (
                        <div className="flex flex-col gap-y-4">
                            <p className="text-center text-sm text-muted-foreground">
                                Enter the 6-digit code sent to{" "}
                                <span className="font-medium text-foreground">{email}</span>
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
                                className="flex h-12 items-center justify-center gap-x-2 rounded-full bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[.99] disabled:opacity-60"
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
                                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Change email
                            </Button>
                        </div>
                    )}

                    {error && <p className="text-center text-xs text-destructive">{error}</p>}
                </div>

                <p className="mt-8 text-center text-xs leading-relaxed text-muted-foreground">
                    Don&apos;t have an account? Just enter your email &amp; we&apos;ll create one.
                </p>
            </div>
        </main>
    );
}
