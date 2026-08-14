import { ShieldCheck } from "lucide-react";

export default function AuthTrustCard() {
  return (
    <div className="mt-8 rounded-2xl bg-sky-50 p-5 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
        <ShieldCheck className="h-5 w-5 text-navy-600" strokeWidth={1.75} />
      </div>
      <p className="mt-3 font-display text-base font-bold text-ink">Your data is safe with us</p>
      <p className="mt-1 text-xs text-ink/50">We never share your information with anyone.</p>
    </div>
  );
}
