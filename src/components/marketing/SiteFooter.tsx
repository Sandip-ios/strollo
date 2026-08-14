import Link from "next/link";
import { Instagram, Facebook, Twitter, Youtube, Linkedin, MapPin, Phone, Mail } from "lucide-react";
import Logo from "@/components/brand/Logo";
import WhatsAppIcon from "@/components/marketing/WhatsAppIcon";
import { CONTACT, addressOneLine, whatsappUrl } from "@/lib/site";

const SOCIAL_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
} as const;

export default function SiteFooter() {
  const socialEntries = Object.entries(CONTACT.social).filter(([, url]) => url) as [
    keyof typeof SOCIAL_ICONS,
    string,
  ][];

  return (
    <footer className="border-t border-sand bg-white">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-4">
          <div>
            <Logo variant="full" className="h-auto w-[9rem]" />
            <p className="mt-3 max-w-[220px] text-sm leading-relaxed text-ink/60">
              Trusted, GPS-tracked dog walking in Ahmedabad.
            </p>
            <div className="mt-4 flex gap-3">
              {socialEntries.map(([key, url]) => {
                const Icon = SOCIAL_ICONS[key];
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={key}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-sand/60 text-navy-700 transition hover:bg-navy-100"
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </a>
                );
              })}
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-sand/60 text-navy-700 transition hover:bg-navy-100"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-ink">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-ink/60">
              <li>
                <Link href="/about" className="hover:text-ink">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-ink">
                  Contact us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-ink">
                  Privacy policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-ink">
                  Terms of service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-ink">Account</p>
            <ul className="mt-3 space-y-2 text-sm text-ink/60">
              <li>
                <Link href="/login" className="hover:text-ink">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-ink">
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-bold text-ink">Get in touch</p>
            <ul className="mt-3 space-y-2.5 text-sm text-ink/60">
              <li className="flex min-w-0 gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="min-w-0 break-words">{addressOneLine()}</span>
              </li>
              <li className="flex min-w-0 gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                <span className="min-w-0 space-y-0.5 break-words">
                  {CONTACT.phones.map((p) => (
                    <a key={p} href={`tel:+91${p}`} className="block hover:text-ink">
                      {p}
                    </a>
                  ))}
                </span>
              </li>
              <li className="flex min-w-0 gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                <a href={`mailto:${CONTACT.email}`} className="min-w-0 break-words hover:text-ink">
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-sand pt-6 text-center text-xs text-ink/40">
          © {new Date().getFullYear()} Strollo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
