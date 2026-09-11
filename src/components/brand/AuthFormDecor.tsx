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

// Purely decorative accents for the auth form column — a small illustrated
// dog tucked into the corner, sized to sit in the margin beside the
// centered form column rather than behind it (the form's max-w-sm content,
// including the trust card at the bottom, would otherwise overlap a
// larger version of this). Hidden below md since the form column is
// full-width there and has no room to spare.
export default function AuthFormDecor() {
  return (
    <>
      <div className="pointer-events-none absolute bottom-32 right-4 hidden text-sky-200 md:block lg:right-6">
        <PawPrint className="h-4 w-4" rotate={-15} />
        <PawPrint className="ml-5 mt-2 h-5 w-5" rotate={10} />
      </div>
      <Image
        src="/marketing/dog-illustration.png"
        alt=""
        width={767}
        height={304}
        className="pointer-events-none absolute bottom-4 right-4 hidden w-44 opacity-95 md:block lg:w-64"
      />
    </>
  );
}
