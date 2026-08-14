import Image from "next/image";
import { ShieldCheck, MapPin, Camera } from "lucide-react";
import Logo from "./Logo";

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verified & trained",
    description: "Every walker is ID-verified, trained, and personally assigned by our team.",
  },
  {
    icon: MapPin,
    title: "Live walk tracking",
    description: "Watch the route update in real time while your walk is on.",
  },
  {
    icon: Camera,
    title: "Photo updates",
    description: "Real photos from every visit — not just a checkmark when it's done.",
  },
];

export default function AuthBrandPanel() {
  return (
    <div className="relative hidden overflow-hidden bg-paper md:flex md:w-[58%] lg:w-[54%]">
      <div className="flex h-full w-full">
        {/* text column */}
        <div className="z-10 flex w-[250px] shrink-0 flex-col justify-between p-8 lg:w-[300px] lg:p-10">
          <Logo variant="full" priority className="h-auto w-36" />

          <div>
            {/* dashed heart squiggle, matches the leash-dash brand motif */}
            <svg viewBox="0 0 60 110" fill="none" className="h-16 w-10 text-sky-400">
              <path
                d="M18 14a6 6 0 1 1 8 8.8L18 32l-8-9.2A6 6 0 1 1 18 14Z"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path
                d="M18 34 C 40 46, -4 66, 20 80 S 44 106, 30 108"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="1 8"
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <p className="mt-3 font-display text-4xl font-extrabold leading-[1.05]">
              <span className="text-navy-700">Happy Steps,</span>
              <br />
              <span className="text-sky-600">Happy Dogs</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-ink/60">
              Trusted walkers, tracked routes, and a happier dog waiting for
              you at the door.
            </p>

            <div className="mt-7 space-y-4">
              {FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 shadow-sm">
                    <f.icon className="h-4.5 w-4.5 text-navy-600" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-700">{f.title}</p>
                    <p className="text-xs leading-relaxed text-ink/50">{f.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div />
        </div>

        {/* photo card, soft-blended into the paper background on its left edge */}
        <div className="relative flex-1 py-6 pr-6">
          <div className="relative h-full w-full overflow-hidden rounded-[2.5rem]">
            <div
              className="absolute inset-0"
              style={{
                maskImage: "linear-gradient(to right, transparent, black 14%)",
                WebkitMaskImage: "linear-gradient(to right, transparent, black 14%)",
              }}
            >
              <Image
                src="/marketing/walker-full.png"
                alt="A trained Strollo walker in uniform walking a golden retriever wearing a Strollo scarf"
                fill
                priority
                className="object-cover"
                style={{ objectPosition: "58% 42%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
