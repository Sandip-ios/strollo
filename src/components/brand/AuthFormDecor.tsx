import Image from "next/image";

function PawPrint({ className, rotate = 0 }: { className?: string; rotate?: number }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={{ transform: `rotate(${rotate}deg)` }}>
      <ellipse cx="20" cy="24" rx="10" ry="12" fill="currentColor" />
      <ellipse cx="7" cy="10" rx="4.4" ry="5.6" fill="currentColor" />
      <ellipse cx="20" cy="4" rx="4.4" ry="5.6" fill="currentColor" />
      <ellipse cx="33" cy="10" rx="4.4" ry="5.6" fill="currentColor" />
    </svg>
  );
}

// Purely decorative accents for the auth form column — an illustrated dog
// tucked in the corner below the primary button, with a footstep trail
// leading into it from the left, matching the reference composition where
// both live together in the same corner. Hidden below md since the form
// column is full-width there and has no room to spare.
export default function AuthFormDecor() {
  return (
    <>
      <div className="pointer-events-none absolute bottom-16 right-56 hidden text-sky-200 md:block lg:right-72">
        <PawPrint className="h-5 w-5" rotate={-15} />
        <PawPrint className="ml-7 mt-2 h-6 w-6" rotate={10} />
        <PawPrint className="ml-3 mt-2 h-7 w-7" rotate={-8} />
      </div>
      <Image
        src="/marketing/dog-illustration.png"
        alt=""
        width={767}
        height={304}
        className="pointer-events-none absolute bottom-0 right-0 hidden w-72 opacity-95 md:block lg:w-96"
      />
    </>
  );
}
