"use client";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function MobileNumberInput({ value, onChange }: Props) {
  function handleChange(raw: string) {
    const digitsOnly = raw.replace(/\D/g, "").slice(0, 10);
    onChange(digitsOnly);
  }

  return (
    <div className="flex overflow-hidden rounded-lg border border-sand bg-white transition focus-within:border-navy-500 focus-within:ring-2 focus-within:ring-navy-200">
      <span className="flex items-center border-r border-sand bg-sand/30 px-3 font-mono text-sm text-ink/70">
        +91
      </span>
      <input
        type="tel"
        inputMode="numeric"
        required
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="98765 43210"
        className="w-full bg-transparent px-3 py-2.5 font-mono text-sm tracking-wide text-ink outline-none placeholder:text-ink/30"
      />
    </div>
  );
}
