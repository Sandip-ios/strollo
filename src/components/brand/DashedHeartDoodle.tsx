type Props = {
  className?: string;
};

// A small dashed line trailing up into a heart outline — a quiet decorative
// accent for the landing hero, floating in the photo's negative space.
export default function DashedHeartDoodle({ className }: Props) {
  return (
    <svg
      viewBox="0 0 120 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M10 190 C 60 170, 20 120, 55 90 S 70 40, 60 20"
        stroke="#4b83b2"
        strokeWidth="2"
        strokeDasharray="1 10"
        strokeLinecap="round"
      />
      <path
        d="M60 34 C 52 24, 38 26, 38 38 C 38 48, 60 62, 60 62 C 60 62, 82 48, 82 38 C 82 26, 68 24, 60 34 Z"
        stroke="#4b83b2"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
