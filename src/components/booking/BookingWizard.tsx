"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import { PawPrint, Sun, CloudSun, Sunset, Moon } from "lucide-react";
import { WALK_SLOTS, WALK_DURATION_MINUTES } from "@/lib/constants";
import { startNavProgress } from "@/lib/nav-progress";
import DogFormModal from "@/components/dogs/DogFormModal";
import AddressFormModal from "@/components/addresses/AddressFormModal";

const SLOT_ICONS: Record<string, typeof Sun> = {
  MORNING: Sun,
  AFTERNOON: CloudSun,
  EVENING: Sunset,
  NIGHT: Moon,
};

type Dog = { id: string; name: string; breed: string; photoUrl: string | null };
type Address = {
  id: string;
  houseNumber: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  area: string | null;
  walkerAvailable: boolean;
};
type Plan = { id: string; name: string; price: number; dogQuantity: number };

type Props = {
  dogs: Dog[];
  addresses: Address[];
  plans: Plan[];
  customerName: string;
  customerEmail: string;
  customerMobile: string;
};

type DogApiRecord = { id: string; name: string; breed: string; photoUrl: string | null };
type AddressApiRecord = {
  id: string;
  houseNumber: string;
  label: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  area: string | null;
  walkerAvailable: boolean;
};

type Step = "DOGS" | "PLAN" | "ADDRESS" | "SLOT" | "DATE" | "REVIEW";
const STEPS: Step[] = ["DOGS", "PLAN", "ADDRESS", "SLOT", "DATE", "REVIEW"];

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

// Bookings must start the day after booking, never the same day — there's
// no time to assign a walker for a plan that begins immediately.
function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function BookingWizard({
  dogs: initialDogs,
  addresses: initialAddresses,
  plans,
  customerName,
  customerEmail,
  customerMobile,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("DOGS");
  const [dogs, setDogs] = useState<Dog[]>(initialDogs);
  const [addresses, setAddresses] = useState<Address[]>(initialAddresses);
  const [dogIds, setDogIds] = useState<string[]>([]);
  const [planId, setPlanId] = useState<string>("");
  const [addressId, setAddressId] = useState(initialAddresses[0]?.id ?? "");
  const [slot, setSlot] = useState<string>("");
  const [startDate, setStartDate] = useState(tomorrowISO());
  const [error, setError] = useState<string | null>(null);
  const [addingDog, setAddingDog] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [stage, setStage] = useState<
    "IDLE" | "CREATING_ORDER" | "AWAITING_PAYMENT" | "VERIFYING"
  >("IDLE");

  const stepIndex = STEPS.indexOf(step);
  const eligiblePlans = plans.filter((p) => p.dogQuantity === dogIds.length);
  const plan = eligiblePlans.find((p) => p.id === planId);

  function toggleDog(id: string) {
    setDogIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function refreshDogs(): Promise<Dog[]> {
    const res = await fetch("/api/dogs");
    const data = await res.json();
    const list: Dog[] = (data.dogs ?? []).map((d: DogApiRecord) => ({
      id: d.id,
      name: d.name,
      breed: d.breed,
      photoUrl: d.photoUrl,
    }));
    setDogs(list);
    return list;
  }

  async function refreshAddresses(): Promise<Address[]> {
    const res = await fetch("/api/addresses");
    const data = await res.json();
    const list: Address[] = (data.addresses ?? []).map((a: AddressApiRecord) => ({
      id: a.id,
      houseNumber: a.houseNumber,
      label: a.label,
      line1: a.line1,
      line2: a.line2,
      city: a.city,
      state: a.state,
      pincode: a.pincode,
      area: a.area,
      walkerAvailable: a.walkerAvailable,
    }));
    setAddresses(list);
    return list;
  }

  // New dog/address added inline from this screen — pull the fresh list
  // and auto-select whatever just got created so the customer doesn't
  // have to find and tap it again.
  async function handleDogAdded() {
    const previousIds = new Set(dogs.map((d) => d.id));
    const updated = await refreshDogs();
    setAddingDog(false);
    const added = updated.find((d) => !previousIds.has(d.id));
    if (added) setDogIds((prev) => (prev.includes(added.id) ? prev : [...prev, added.id]));
  }

  async function handleAddressAdded() {
    const previousIds = new Set(addresses.map((a) => a.id));
    const updated = await refreshAddresses();
    setAddingAddress(false);
    const added = updated.find((a) => !previousIds.has(a.id));
    if (added) setAddressId(added.id);
  }

  function goNext() {
    setError(null);
    if (step === "DOGS" && dogIds.length === 0) {
      setError("Select at least one dog");
      return;
    }
    if (step === "PLAN" && !plan) {
      setError("Select a plan");
      return;
    }
    if (step === "ADDRESS") {
      const selected = addresses.find((a) => a.id === addressId);
      if (!selected) {
        setError("Select an address");
        return;
      }
      if (!selected.walkerAvailable) {
        setError("There's no walker available in this area yet — pick a different address, or check back soon.");
        return;
      }
    }
    if (step === "SLOT" && !slot) {
      setError("Select a walking slot");
      return;
    }
    setStep(STEPS[stepIndex + 1]);
  }

  function goBack() {
    setError(null);
    setStep(STEPS[stepIndex - 1]);
  }

  async function handlePayment() {
    if (!plan) {
      setError("Select a plan");
      return;
    }
    setError(null);
    setStage("CREATING_ORDER");
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, addressId, dogIds, slot, startDate }),
      });

      let order: {
        error?: string;
        bookingId?: string;
        razorpayOrderId?: string;
        amount?: number;
        currency?: string;
        keyId?: string;
      };
      try {
        order = await res.json();
      } catch {
        setError(
          `The server returned an unexpected response (status ${res.status}). This usually means an unhandled error on the server — check the terminal running "npm run dev" for details.`
        );
        setStage("IDLE");
        return;
      }

      if (!res.ok) {
        setError(order.error ?? `Something went wrong (status ${res.status}).`);
        setStage("IDLE");
        return;
      }

      if (!window.Razorpay) {
        setError("Payment couldn't load. Please refresh and try again.");
        setStage("IDLE");
        return;
      }

      setStage("AWAITING_PAYMENT");

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.razorpayOrderId,
        name: "Strollo",
        description: plan.name,
        prefill: {
          name: customerName,
          email: customerEmail,
          contact: customerMobile,
        },
        theme: { color: "#243b5a" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          setStage("VERIFYING");
          try {
            const verifyRes = await fetch(`/api/bookings/${order.bookingId}/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(response),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              setError(
                `Payment was received but we couldn't confirm the booking (${verifyData.error ?? "unknown error"}). ` +
                  `Please contact support with booking ID ${order.bookingId} — don't pay again.`
              );
              setStage("IDLE");
              return;
            }
            startNavProgress();
            router.push(`/bookings/${order.bookingId}`);
            router.refresh();
          } catch {
            setError(
              `Payment was received but we couldn't confirm the booking due to a network error. ` +
                `Please contact support with booking ID ${order.bookingId} — don't pay again.`
            );
            setStage("IDLE");
          }
        },
        modal: {
          ondismiss: () => {
            setError("Payment was cancelled. You can try again whenever you're ready.");
            setStage("IDLE");
          },
        },
      });

      razorpay.on("payment.failed", (response: unknown) => {
        const failure = response as { error?: { description?: string; reason?: string } };
        setError(
          failure?.error?.description ??
            failure?.error?.reason ??
            "Payment failed. Please try a different payment method."
        );
        setStage("IDLE");
      });

      razorpay.open();
    } catch {
      setError("Something went wrong creating your order. Please try again.");
      setStage("IDLE");
    }
  }

  const stageLabel =
    stage === "CREATING_ORDER"
      ? "Setting up your order…"
      : stage === "AWAITING_PAYMENT"
        ? "Waiting for payment…"
        : stage === "VERIFYING"
          ? "Confirming your booking…"
          : null;

  return (
    <div>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      {/* step indicator */}
      <div className="mb-8 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-semibold ${
                i < stepIndex
                  ? "bg-navy-600 text-paper"
                  : i === stepIndex
                    ? "border-2 border-navy-600 text-navy-600"
                    : "border border-sand text-ink/30"
              }`}
            >
              {i + 1}
            </span>
            {i < STEPS.length - 1 && (
              <span className="h-px w-6 border-t-2 border-dashed border-sand" />
            )}
          </div>
        ))}
      </div>

      {step === "DOGS" && (
        <StepBlock title="Select dog(s)">
          {dogs.length === 0 && (
            <p className="mb-3 text-sm text-ink/50">
              No dogs added yet — add one below to get started.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {dogs.map((dog) => (
              <button
                key={dog.id}
                type="button"
                onClick={() => toggleDog(dog.id)}
                className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                  dogIds.includes(dog.id)
                    ? "border-navy-500 bg-navy-50 ring-1 ring-navy-300"
                    : "border-sand bg-white hover:border-navy-200"
                }`}
              >
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-sand bg-sand/20">
                  {dog.photoUrl ? (
                    <Image src={dog.photoUrl} alt={dog.name} width={48} height={48} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-sky-50">
                      <PawPrint className="h-5 w-5 text-navy-300" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{dog.name}</p>
                  <p className="text-xs text-ink/50">{dog.breed}</p>
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAddingDog(true)}
              className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-sand p-4 text-sm font-medium text-navy-600 transition hover:border-navy-300 hover:bg-navy-50"
            >
              + Add a dog
            </button>
          </div>
        </StepBlock>
      )}

      {step === "PLAN" && (
        <StepBlock title="Select a plan">
          {eligiblePlans.length === 0 ? (
            <p className="rounded-xl border border-dashed border-sand bg-white/60 p-6 text-center text-sm text-ink/60">
              No plan is set up for {dogIds.length} {dogIds.length === 1 ? "dog" : "dogs"} yet.
              Go back and select a different number of dogs, or check back later.
            </p>
          ) : (
            <div className="space-y-3">
              {eligiblePlans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlanId(p.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition ${
                    planId === p.id
                      ? "border-navy-500 bg-navy-50 ring-1 ring-navy-300"
                      : "border-sand bg-white hover:border-navy-200"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-ink/50">
                      For {p.dogQuantity} {p.dogQuantity === 1 ? "dog" : "dogs"}
                    </p>
                  </div>
                  <p className="font-mono text-sm font-semibold text-ink">
                    ₹{(p.price / 100).toLocaleString("en-IN")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </StepBlock>
      )}

      {step === "ADDRESS" && (
        <StepBlock title="Select address">
          {addresses.length === 0 && (
            <p className="mb-3 text-sm text-ink/50">
              No addresses added yet — add one below to get started.
            </p>
          )}
          <div className="space-y-3">
            {addresses.map((address) => (
              <button
                key={address.id}
                type="button"
                onClick={() => setAddressId(address.id)}
                className={`w-full rounded-xl border p-4 text-left transition ${
                  !address.walkerAvailable
                    ? "border-sand bg-sand/10"
                    : addressId === address.id
                      ? "border-navy-500 bg-navy-50 ring-1 ring-navy-300"
                      : "border-sand bg-white hover:border-navy-200"
                }`}
              >
                <p className={`text-sm font-semibold ${address.walkerAvailable ? "text-ink" : "text-ink/50"}`}>
                  {address.label}
                </p>
                <p className="text-xs text-ink/60">
                  {address.houseNumber}, {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                </p>
                <p className="text-xs text-ink/50">
                  {address.area ? `${address.area}, ` : ""}
                  {address.city}, {address.state} – {address.pincode}
                </p>
                {!address.walkerAvailable && (
                  <p className="mt-1.5 text-xs font-medium text-amber-600">
                    No walker available in this area yet
                  </p>
                )}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAddingAddress(true)}
              className="w-full rounded-xl border border-dashed border-sand p-4 text-center text-sm font-medium text-navy-600 transition hover:border-navy-300 hover:bg-navy-50"
            >
              + Add address
            </button>
          </div>
        </StepBlock>
      )}

      {step === "SLOT" && (
        <StepBlock title="Select walking slot">
          <div className="grid gap-3 sm:grid-cols-2">
            {WALK_SLOTS.map((s) => {
              const Icon = SLOT_ICONS[s.value];
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSlot(s.value)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                    slot === s.value
                      ? "border-navy-500 bg-navy-50 ring-1 ring-navy-300"
                      : "border-sand bg-white hover:border-navy-200"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0 text-sky-600" strokeWidth={1.75} />
                  <div>
                    <p className="text-sm font-semibold text-ink">{s.label}</p>
                    <p className="text-xs text-ink/50">{s.time}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-ink/50">
            Your walker arrives sometime within the chosen window for a{" "}
            {WALK_DURATION_MINUTES}-minute walk.
          </p>
        </StepBlock>
      )}

      {step === "DATE" && (
        <StepBlock title="Select start date">
          <input
            type="date"
            min={tomorrowISO()}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-sand bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-navy-500 focus:ring-2 focus:ring-navy-200"
          />
          <p className="mt-3 text-xs text-ink/50">
            Your plan runs for one calendar month from this date, Monday–Saturday
            (~24–26 walks, exact count depends on how many Sundays fall in
            your cycle).
          </p>
        </StepBlock>
      )}

      {step === "REVIEW" && (
        <StepBlock title="Review & pay">
          <div className="space-y-3 rounded-xl border border-sand bg-white p-5 text-sm">
            <ReviewRow
              label="Dogs"
              value={dogs.filter((d) => dogIds.includes(d.id)).map((d) => d.name).join(", ")}
            />
            <ReviewRow
              label="Address"
              value={(() => {
                const a = addresses.find((addr) => addr.id === addressId);
                if (!a) return "";
                return `${a.label} — ${a.area ? `${a.area}, ` : ""}${a.city}`;
              })()}
            />
            <ReviewRow label="Slot" value={WALK_SLOTS.find((s) => s.value === slot)?.label ?? ""} />
            <ReviewRow label="Walk duration" value={`${WALK_DURATION_MINUTES} minutes per walk`} />
            <ReviewRow label="Start date" value={startDate} />
            <div className="border-t border-sand pt-3">
              <ReviewRow
                label={plan?.name ?? ""}
                value={plan ? `₹${(plan.price / 100).toLocaleString("en-IN")}` : ""}
                bold
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-ink/50">
            Bookings once confirmed cannot be cancelled.
          </p>
        </StepBlock>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {stageLabel && (
        <p className="mt-4 flex items-center gap-2 text-sm text-navy-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-navy-600" />
          {stageLabel}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        {stepIndex > 0 && stage === "IDLE" && (
          <button
            onClick={goBack}
            className="rounded-lg border border-sand px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-sand/30"
          >
            Back
          </button>
        )}
        {step !== "REVIEW" ? (
          <button
            onClick={goNext}
            disabled={step === "PLAN" && eligiblePlans.length === 0}
            className="rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handlePayment}
            disabled={stage !== "IDLE" || !plan}
            className="rounded-lg bg-navy-600 px-5 py-2.5 text-sm font-semibold text-paper transition hover:bg-navy-700 disabled:opacity-50"
          >
            {stage !== "IDLE"
              ? "Please wait…"
              : plan
                ? `Pay ₹${(plan.price / 100).toLocaleString("en-IN")}`
                : "Select a plan"}
          </button>
        )}
      </div>

      {addingDog && <DogFormModal onClose={() => setAddingDog(false)} onSaved={handleDogAdded} />}
      {addingAddress && (
        <AddressFormModal onClose={() => setAddingAddress(false)} onSaved={handleAddressAdded} />
      )}
    </div>
  );
}

function StepBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 font-display text-lg font-semibold text-ink">{title}</h2>
      {children}
    </div>
  );
}

function ReviewRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-ink/60">{label}</span>
      <span className={bold ? "font-semibold text-ink" : "text-ink"}>{value}</span>
    </div>
  );
}
