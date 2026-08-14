import Image from "next/image";

type Props = {
  variant?: "full" | "mark";
  className?: string;
  priority?: boolean;
};

// variant "full" = wordmark + tagline (use on light backgrounds, headers, hero)
// variant "mark" = icon-only (use where space is tight, e.g. compact nav)
export default function Logo({ variant = "full", className, priority }: Props) {
  if (variant === "mark") {
    return (
      <Image
        src="/favicon-mark.png"
        alt="Strollo"
        width={40}
        height={40}
        priority={priority}
        className={className}
      />
    );
  }
  return (
    <Image
      src="/logo.png"
      alt="Strollo — Happy Steps, Happy Dogs"
      width={703}
      height={355}
      priority={priority}
      className={className}
    />
  );
}
