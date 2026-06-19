"use client";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useUserSessionStore } from "@/store/user/useUserSessionStore";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Button } from "../../ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../ui/input-otp";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "../../ui/dialog";
import { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { REQUEST_OTP_URL } from "@/routes/api_routes";
import { cn } from "@/lib/utils";

const ACCENT = "#9bc24f";

interface SigninOptions {
    type: "github" | "google" | "facebook";
    image: string;
}

const signin_options: SigninOptions[] = [
    { type: "google", image: "/images/google.png" },
    { type: "github", image: "/images/github.png" },
];

interface SigninModalProps {
    // Where to land after OAuth sign-in. Defaults to the home page; the invite page
    // passes its own URL so OAuth returns the user to the invitation.
    callbackUrl?: string;
}

export default function SigninModal({ callbackUrl = "/" }: SigninModalProps) {
    const { openSigninModal, setOpenSigninModal } = useUserSessionStore();
    const [email, setEmail] = useState<string>("");
    const [otp, setOtp] = useState<string>("");
    const [step, setStep] = useState<"email" | "otp">("email");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const router = useRouter();

    function handleOpenChange(open: boolean) {
        setOpenSigninModal(open);
        if (!open) {
            setStep("email");
            setOtp("");
            setError("");
        }
    }

    function singinHandler(type: "github" | "google" | "facebook") {
        signIn(type, { callbackUrl });
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
        if (!otp) return;
        setLoading(true);
        setError("");
        const result = await signIn("email-otp", {
            email,
            otp,
            redirect: false,
        });
        setLoading(false);
        if (result?.ok) {
            handleOpenChange(false);
            router.refresh();
        } else {
            setError("Invalid or expired OTP. Please try again.");
        }
    }

    const otpSlotClass = cn(
        "h-12 flex-1 rounded-md border border-input bg-surface text-base shadow-none",
        "data-[active=true]:border-[#9bc24f] data-[active=true]:ring-2 data-[active=true]:ring-[#9bc24f]/30",
    );

    return (
        <Dialog open={openSigninModal} onOpenChange={handleOpenChange}>
            <DialogContent className="gap-0 overflow-hidden rounded-xl border-border bg-card p-0 sm:max-w-100">
                <DialogHeader className="relative h-36 w-full space-y-0 overflow-hidden">
                    <Image
                        src="/images/ui/bg-flower.png"
                        alt=""
                        fill
                        priority
                        sizes="400px"
                        className="object-cover"
                        aria-hidden
                    />
                    <div className="absolute inset-0 bg-black/40" aria-hidden />
                    <div className="relative flex h-full flex-col justify-between p-5.5">
                        <div className="flex items-center justify-between gap-x-2 w-full">
                            <div className="flex items-center gap-x-2">
                                <span
                                    className="flex size-6 items-center justify-center rounded-md shadow-sm"
                                    style={{
                                        background: `linear-gradient(135deg, ${ACCENT}, #bcdb6f)`,
                                    }}
                                    aria-hidden
                                >
                                    <span className="size-2 rounded-full bg-[#1a2e05]/80" />
                                </span>
                                <span className="text-sm font-semibold tracking-tight text-white">
                                    matcha
                                </span>
                            </div>
                        </div>

                        <div>
                            <DialogTitle className="text-xl font-semibold tracking-tight text-white">
                                Sign in to matcha
                            </DialogTitle>
                            <DialogDescription className="text-sm text-white/70">
                                File an issue, let the agents ship the fix.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>
                <div className="flex flex-col p-6">
                    {step === "email" ? (
                        <div className="flex flex-col">
                            <div className="grid grid-cols-2 gap-x-3">
                                {signin_options.map((option) => (
                                    <button
                                        key={option.type}
                                        type="button"
                                        className="flex h-11 cursor-pointer items-center justify-center gap-x-2 rounded-md border border-border bg-secondary text-sm font-medium text-secondary-foreground capitalize transition-[transform,background-color] hover:bg-secondary/70 active:scale-[.98]"
                                        onClick={() => singinHandler(option.type)}
                                    >
                                        <Image
                                            src={option.image}
                                            alt={option.type}
                                            width={18}
                                            height={18}
                                            className="shrink-0"
                                        />
                                        {option.type}
                                    </button>
                                ))}
                            </div>

                            <div className="my-5 flex items-center gap-x-3">
                                <span className="h-px flex-1 bg-border" />
                                <span className="text-xs text-muted-foreground">
                                    or continue with email
                                </span>
                                <span className="h-px flex-1 bg-border" />
                            </div>

                            <Label
                                className="ml-0.5 text-sm font-medium text-foreground"
                                htmlFor="email"
                            >
                                Work email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="youremail@example.com"
                                value={email}
                                className="bg-neutral-100 shadow-[inset_0_2px_0_0_#F0F0F0] hover:bg-neutral-200/60 transition-colors transform duration-150"
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                            />
                            <Button
                                className="mt-4 h-10 w-full"
                                onClick={handleSendOtp}
                                loading={loading}
                                disabled={loading || !email}
                            >
                                {loading ? "Sending..." : "Get OTP"}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <p className="text-xs text-muted-foreground">
                                OTP sent to{" "}
                                <span className="font-semibold text-foreground">{email}</span>.{" "}
                                <button
                                    type="button"
                                    className="cursor-pointer font-medium text-[#7a9c34] underline-offset-2 hover:underline"
                                    onClick={() => {
                                        setStep("email");
                                        setOtp("");
                                        setError("");
                                    }}
                                >
                                    Change
                                </button>
                            </p>

                            <Label className="mt-5 ml-0.5 text-sm font-medium text-foreground">
                                Verification code
                            </Label>
                            <p className="mt-1 ml-0.5 text-xs text-muted-foreground">
                                Enter the 6-digit code we just emailed you.
                            </p>
                            <InputOTP
                                maxLength={6}
                                containerClassName="w-full mt-2"
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
                                className="mt-6 h-10 w-full"
                                onClick={handleVerifyOtp}
                                loading={loading}
                                disabled={loading || otp.length !== 6}
                            >
                                {loading ? "Verifying..." : "Sign In"}
                            </Button>
                        </div>
                    )}

                    {error && <p className="mt-3 text-center text-xs text-destructive">{error}</p>}

                    <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
                        By continuing, you agree to matcha&apos;s{" "}
                        <a
                            href="/terms"
                            className="font-medium text-[#7a9c34] underline-offset-2 hover:underline"
                        >
                            Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                            href="/privacy"
                            className="font-medium text-[#7a9c34] underline-offset-2 hover:underline"
                        >
                            Privacy Policy
                        </a>
                        .
                    </p>
                </div>

                <div className="border-t border-border bg-surface/50 px-6 py-3.5">
                    <p className="text-center text-xs text-muted-foreground">
                        New to matcha? Just enter your email & we&apos;ll create your account.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
