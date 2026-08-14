import type { Metadata } from "next";
import SiteHeader from "@/components/marketing/SiteHeader";
import SiteFooter from "@/components/marketing/SiteFooter";
import { CONTACT, addressOneLine } from "@/lib/site";
import { CANCELLATION_LEAD_HOURS, WALK_DURATION_MINUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service — Strollo",
  description: "The terms that govern using Strollo to book and manage dog walks.",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-10">
      <h2 className="font-display text-xl font-bold text-navy-700">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/70">{children}</div>
    </div>
  );
}

export default function TermsPage() {
  return (
    <main className="bg-paper">
      <SiteHeader />

      <section className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <span className="text-sm font-bold uppercase tracking-wide text-sky-600">Legal</span>
        <h1 className="mt-3 font-display text-4xl font-extrabold text-navy-700 sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-ink/50">Last updated: 14 August 2026</p>
        <p className="mt-6 text-base leading-relaxed text-ink/70">
          These terms govern your use of Strollo to book and manage dog walks. By creating an
          account or booking a walk, you agree to them. If anything here doesn't make sense,
          write to us before you book — see contact details at the bottom.
        </p>

        <Section title="1. Who can use Strollo">
          <p>
            You must be at least 18 years old and able to enter a binding contract to create an
            account. You're responsible for keeping your mobile number's OTP access secure — it's
            the only way into your account.
          </p>
        </Section>

        <Section title="2. Bookings and plans">
          <ul className="ml-5 list-disc space-y-1.5">
            <li>
              Plans (Monthly, Weekly, or custom) are sold for a specific number of dogs — the plan
              you book must match how many dogs you're booking for.
            </li>
            <li>
              A billing cycle runs for exactly one calendar month (or the plan's stated duration)
              from your chosen start date, extended by any days carried forward from cancelled
              walks on an earlier booking.
            </li>
            <li>Walks are {WALK_DURATION_MINUTES} minutes each, Monday to Saturday. No walks are scheduled on Sundays.</li>
            <li>
              A booking is confirmed once payment succeeds, but still needs our admin team's
              review and approval before a walker is assigned — this usually happens quickly, but
              isn't instant.
            </li>
            <li>
              We only accept bookings for addresses within our current service area. If your
              pincode isn't covered, you won't be able to save that address.
            </li>
          </ul>
        </Section>

        <Section title="3. Payments">
          <p>
            All payments are processed by Razorpay; we never see or store your full card or bank
            details. Prices shown are GST-inclusive, and a GST tax invoice is generated for every
            successful payment. Prices are in Indian Rupees; the service is offered in India only.
          </p>
        </Section>

        <Section title="4. Cancellations, refunds, and carry-forward">
          <ul className="ml-5 list-disc space-y-1.5">
            <li>
              You can cancel an individual day's walk up to {CANCELLATION_LEAD_HOURS} hours before
              its scheduled slot. That day is credited toward your next booking's duration — it
              doesn't extend your current booking or issue a cash refund on its own.
            </li>
            <li>
              You can't cancel a confirmed booking outright yourself. If you need to stop a plan
              partway through, contact us — an admin can cancel it with a refund pro-rated for the
              walks that haven't happened yet; walks already completed or missed aren't refunded.
            </li>
            <li>
              If we can't fulfil a booking (for example, no walker is available in your area), we
              will cancel it and refund the full amount.
            </li>
          </ul>
        </Section>

        <Section title="5. Walkers and how walks are run">
          <p>
            Walkers are personally assigned by our admin team, not self-listed — each one is
            ID-verified before being added to the platform. Every walk is tracked with a GPS route
            and photo updates where possible. Walker assignment and scheduling is managed manually
            by our team; we don't guarantee a specific walker for every walk.
          </p>
        </Section>

        <Section title="6. Your dog, your responsibility">
          <p>
            You're responsible for giving us accurate, complete information about your dog —
            breed, size, vaccination status, medical conditions, and behavioural notes (including
            any history of aggression) — before booking. Withholding information that could affect
            a walker's safety, or your dog's, is a breach of these terms and may result in your
            account being deactivated. You remain responsible for your dog's health, vaccinations,
            and any veterinary care it may need.
          </p>
        </Section>

        <Section title="7. What we don't guarantee">
          <p>
            We take reasonable care in vetting and assigning walkers and in handling your dog
            during a walk, but Strollo is provided on a reasonable-efforts basis, not as an
            insured or guaranteed service. We aren't liable for delays, missed walks due to
            circumstances outside our control (weather, walker unavailability, access issues at
            your address), or indirect losses. Nothing in these terms limits liability that can't
            be limited under Indian law.
          </p>
        </Section>

        <Section title="8. Account suspension">
          <p>
            We may deactivate an account that provides false information, misuses the platform, or
            puts a walker's safety at risk. Deactivated accounts are soft-deactivated, not erased —
            see our{" "}
            <a href="/privacy" className="font-medium text-navy-600 underline underline-offset-2">
              Privacy Policy
            </a>{" "}
            for how we handle data after that.
          </p>
        </Section>

        <Section title="9. Changes to these terms">
          <p>
            If we make material changes, we'll update the date at the top of this page. Continued
            use of Strollo after a change means you accept the updated terms.
          </p>
        </Section>

        <Section title="10. Governing law">
          <p>
            These terms are governed by the laws of India, and any disputes are subject to the
            exclusive jurisdiction of the courts in Ahmedabad, Gujarat.
          </p>
        </Section>

        <Section title="11. Contact us">
          <p>
            Questions about these terms? Reach us at{" "}
            <a href={`mailto:${CONTACT.email}`} className="font-medium text-navy-600 underline underline-offset-2">
              {CONTACT.email}
            </a>{" "}
            or write to us at {addressOneLine()}.
          </p>
        </Section>
      </section>

      <SiteFooter />
    </main>
  );
}
