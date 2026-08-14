import Link from "next/link";
import AuthBrandPanel from "@/components/brand/AuthBrandPanel";
import AuthFormDecor from "@/components/brand/AuthFormDecor";
import AuthMobileCarousel from "@/components/brand/AuthMobileCarousel";
import AuthTrustCard from "@/components/brand/AuthTrustCard";
import OtpAuthForm from "@/components/OtpAuthForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-paper md:flex-row">
      <AuthBrandPanel />
      <AuthMobileCarousel
        mode="LOGIN"
        heading="Welcome back"
        subheading="Login with your mobile number to continue."
        footerText="New to Strollo?"
        footerLinkHref="/signup"
        footerLinkLabel="Sign up"
      />
      <div className="relative hidden w-full flex-1 flex-col justify-center overflow-hidden px-6 py-10 sm:px-10 md:flex md:px-16 lg:px-24">
        <AuthFormDecor />
        <div className="relative z-10 mx-auto w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold text-ink">
            Welcome back
          </h1>
          <p className="mb-8 mt-2 text-sm text-ink/60">
            Login with your mobile number to continue.
          </p>
          <OtpAuthForm purpose="LOGIN" />
          <p className="mt-8 text-sm text-ink/60">
            New to Strollo?{" "}
            <Link href="/signup" className="font-medium text-navy-600 underline underline-offset-2">
              Sign up
            </Link>
          </p>
          <AuthTrustCard />
        </div>
      </div>
    </main>
  );
}
