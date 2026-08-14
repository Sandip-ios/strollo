import type { Metadata } from "next";
import { MapPin, Phone, Mail, ExternalLink } from "lucide-react";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import ContactForm from "@/components/marketing/ContactForm";
import WhatsAppIcon from "@/components/marketing/WhatsAppIcon";
import { CONTACT, addressOneLine, googleMapsSearchUrl, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us — Strollo",
  description: "Get in touch with the Strollo team.",
};

export default function ContactPage() {
  return (
    <main className="bg-paper">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <span className="text-sm font-bold uppercase tracking-wide text-sky-600">Get in touch</span>
        <h1 className="mt-3 font-display text-4xl font-extrabold text-navy-700 sm:text-5xl">
          We'd love to hear from you.
        </h1>
        <p className="mt-4 max-w-lg text-base text-ink/60">
          Questions about a booking, a plan, or just want to say hi to your walker? Send us a
          message or reach out directly.
        </p>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-sand bg-white p-6">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-semibold text-ink">Office</p>
                  <p className="mt-1 text-sm text-ink/60">{addressOneLine()}</p>
                  <a
                    href={googleMapsSearchUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-navy-600 underline underline-offset-2"
                  >
                    View on Google Maps
                    <ExternalLink className="h-3 w-3" strokeWidth={2} />
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-sand bg-white p-6">
              <div className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-semibold text-ink">Call us</p>
                  {CONTACT.phones.map((p) => (
                    <p key={p} className="mt-1 text-sm text-ink/60">
                      <a href={`tel:+91${p}`} className="hover:text-ink">
                        +91 {p}
                      </a>
                    </p>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-sand bg-white p-6">
              <div className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-semibold text-ink">Email us</p>
                  <a href={`mailto:${CONTACT.email}`} className="mt-1 block text-sm text-ink/60 hover:text-ink">
                    {CONTACT.email}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-sand bg-white p-6">
              <div className="flex gap-3">
                <WhatsAppIcon className="mt-0.5 h-5 w-5 shrink-0 text-navy-600" />
                <div>
                  <p className="text-sm font-semibold text-ink">WhatsApp us</p>
                  <a
                    href={whatsappUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-ink/60 hover:text-ink"
                  >
                    +91 {CONTACT.whatsappNumber}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
