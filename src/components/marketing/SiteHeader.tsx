import Link from "next/link";
import Logo from "@/components/brand/Logo";

type Props = { variant?: "solid" | "transparent" };

export default function SiteHeader({ variant = "solid" }: Props) {
  const transparent = variant === "transparent";
  const linkClass = transparent
    ? "text-sm font-semibold text-white/90 hover:text-white"
    : "text-sm font-semibold text-ink/70 hover:text-ink";

  return (
    <header className={transparent ? "absolute inset-x-0 top-0 z-20" : "border-b border-sand bg-white"}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/">
          <Logo
            variant="full"
            priority
            className={`h-auto w-[10.5rem] ${transparent ? "brightness-0 invert" : ""}`}
          />
        </Link>
        <nav className="hidden items-center gap-7 sm:flex">
          <Link href="/about" className={linkClass}>
            About
          </Link>
          <Link href="/contact" className={linkClass}>
            Contact
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className={linkClass}>
            Login
          </Link>
          <Link
            href="/signup"
            className={
              transparent
                ? "rounded-full bg-white px-5 py-2.5 text-sm font-bold text-navy-700 shadow-sm transition hover:bg-sky-50"
                : "rounded-full bg-navy-600 px-5 py-2.5 text-sm font-bold text-paper shadow-sm transition hover:bg-navy-700"
            }
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}
