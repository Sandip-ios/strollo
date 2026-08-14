import Link from "next/link";
import AuthBrandPanel from "@/components/brand/AuthBrandPanel";
import AuthFormDecor from "@/components/brand/AuthFormDecor";
import AuthMobileCarousel from "@/components/brand/AuthMobileCarousel";
import AuthTrustCard from "@/components/brand/AuthTrustCard";
import OtpAuthForm from "@/components/OtpAuthForm";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col bg-paper md:flex-row">
      <AuthBrandPanel />
      <AuthMobileCarousel
        mode="SIGNUP"
        heading="Create your account"
        subheading="Sign up with your mobile number to get started."
        footerText="Already have an account?"
        footerLinkHref="/login"
        footerLinkLabel="Login"
      />
      <div className="relative hidden w-full flex-1 flex-col justify-center overflow-hidden px-6 py-10 sm:px-10 md:flex md:px-16 lg:px-24">
        <AuthFormDecor />
        <div className="relative z-10 mx-auto w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold text-ink">
            Create your account
          </h1>
          <p className="mb-8 mt-2 text-sm text-ink/60">
            Sign up with your mobile number to get started.
          </p>
          <OtpAuthForm purpose="SIGNUP" />
          <p className="mt-8 text-sm text-ink/60">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-navy-600 underline underline-offset-2">
              Login
            </Link>
          </p>
          <AuthTrustCard />
        </div>
      </div>
    </main>
  );
}
