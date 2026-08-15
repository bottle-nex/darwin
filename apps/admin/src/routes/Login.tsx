import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, error_message } from "../lib/api";
import AdminSession from "../lib/session";

export default function Login() {
    const navigate = useNavigate();
    const [step, setStep] = useState<"email" | "code">("email");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function requestCode(event: React.FormEvent) {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
            await api.post("/admin/auth/otp/request", { email });
            setStep("code");
        } catch (err) {
            setError(error_message(err, "Could not send a code."));
        } finally {
            setPending(false);
        }
    }

    async function verifyCode(event: React.FormEvent) {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
            const { data } = await api.post("/admin/auth/otp/verify", { email, code });
            AdminSession.set(data.data.token, data.data.admin.email);
            navigate("/", { replace: true });
        } catch (err) {
            setError(error_message(err, "That code did not work."));
        } finally {
            setPending(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center px-6">
            <div className="w-full max-w-sm">
                <h1 className="text-2xl tracking-tight text-snow">matcha admin</h1>
                <p className="mt-2 text-sm text-mist/45">
                    {step === "email"
                        ? "Sign in with an allowlisted address."
                        : `We sent a six-digit code to ${email}.`}
                </p>

                {step === "email" ? (
                    <form onSubmit={requestCode} className="mt-8 flex flex-col gap-3">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@trymatcha.dev"
                            className="rounded-md border border-graphite bg-charcoal px-3 py-2.5 text-[15px] text-mist outline-none focus:border-primary/40"
                        />
                        <button
                            type="submit"
                            disabled={pending || !email}
                            className="rounded-md bg-primary px-3 py-2.5 text-[15px] font-medium text-ink disabled:opacity-40"
                        >
                            {pending ? "Sending…" : "Send code"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verifyCode} className="mt-8 flex flex-col gap-3">
                        <input
                            inputMode="numeric"
                            pattern="\d{6}"
                            required
                            value={code}
                            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            maxLength={6}
                            className="rounded-md border border-graphite bg-charcoal px-3 py-2.5 font-mono text-[15px] tracking-[0.3em] text-mist outline-none focus:border-primary/40"
                        />
                        <button
                            type="submit"
                            disabled={pending || code.length !== 6}
                            className="rounded-md bg-primary px-3 py-2.5 text-[15px] font-medium text-ink disabled:opacity-40"
                        >
                            {pending ? "Checking…" : "Sign in"}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setStep("email");
                                setCode("");
                                setError(null);
                            }}
                            className="text-[13px] text-mist/40 hover:text-mist"
                        >
                            Use a different address
                        </button>
                    </form>
                )}

                {error && <p className="mt-4 text-[13px] text-red-400">{error}</p>}
            </div>
        </main>
    );
}
