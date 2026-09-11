"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MobileNumberInput from "@/components/MobileNumberInput";
import OtpDigitInput from "@/components/OtpDigitInput";
import { homeRouteForRole } from "@/lib/constants";
import { startNavProgress } from "@/lib/nav-progress";

type Props = {
  purpose: "SIGNUP" | "LOGIN";
};

type Step = "MOBILE" | "OTP";

export default function OtpAuthForm({ purpose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("MOBILE");
  const [mobileNumber, setMobileNumber] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fullMobile = `+91${mobileNumber}`;

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (mobileNumber.length !== 10) {
      setError("Enter a 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobileNumber: fullMobile, purpose }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setStep("OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError("Enter the 6-digit code");
      return;
    }
    if (purpose === "SIGNUP" && !acceptedTerms) {
      setError("Please accept the Terms of Service and Privacy Policy to continue");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobileNumber: fullMobile,
          code,
          purpose,
          ...(purpose === "SIGNUP" ? { name, acceptedTerms } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        setLoading(false);
        return;
      }
      // Deliberately leave loading=true (and don't touch it again) rather
      // than resetting it here — router.push() returns before the new
      // route has actually rendered, so clearing it now would briefly
      // re-enable the button while the redirect is still in flight, which
      // is exactly what was causing the double-click. The form unmounts
      // once navigation lands, so there's nothing to reset it back for.
      startNavProgress();
      router.push(homeRouteForRole(data.user?.role ?? "CUSTOMER"));
      router.refresh();
    } catch {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <div>
      {/* step indicator connected by a short dashed leash line */}
      <div className="mb-8 flex items-center gap-2">
        <StepDot active label="1" filled={step === "OTP"} />
        <span className="h-px w-8 border-t-2 border-dashed border-sand" />
        <StepDot active={step === "OTP"} label="2" filled={false} />
        <span className="ml-3 font-mono text-xs uppercase tracking-wider text-ink/40">
          {step === "MOBILE" ? "Mobile number" : "Verify code"}
        </span>
      </div>

      {step === "MOBILE" ? (
        <form onSubmit={handleRequestOtp} className="flex flex-col gap-5">
          {purpose === "SIGNUP" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/80">
                Your name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
                placeholder="Ananya Sharma"
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink/80">
              Mobile number
            </label>
            <MobileNumberInput value={mobileNumber} onChange={setMobileNumber} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-lg bg-navy-600 px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
          >
            {loading ? "Sending code…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
          <p className="text-sm text-ink/60">
            Enter the 6-digit code sent to{" "}
            <span className="font-mono font-medium text-ink">{fullMobile}</span>
          </p>
          <OtpDigitInput value={code} onChange={setCode} />
          {purpose === "SIGNUP" && (
            <label className="flex items-start gap-2 text-sm text-ink/70">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-sand text-navy-600 focus:ring-navy-200"
              />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" className="font-medium text-navy-600 underline underline-offset-2">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="font-medium text-navy-600 underline underline-offset-2">
                  Privacy Policy
                </Link>
              </span>
            </label>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || (purpose === "SIGNUP" && !acceptedTerms)}
            className="mt-1 rounded-lg bg-navy-600 px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify & continue"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("MOBILE");
              setCode("");
              setError(null);
            }}
            className="text-sm text-ink/50 underline underline-offset-2 hover:text-ink"
          >
            Change mobile number
          </button>
        </form>
      )}
    </div>
  );
}

function StepDot({
  active,
  filled,
  label,
}: {
  active: boolean;
  filled: boolean;
  label: string;
}) {
  return (
    <span
      className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold transition ${
        active
          ? filled
            ? "bg-navy-600 text-paper"
            : "border-2 border-navy-600 text-navy-600"
          : "border border-sand text-ink/30"
      }`}
    >
      {label}
    </span>
  );
}
