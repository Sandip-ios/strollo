type Props = {
  className?: string;
};

// The "leash path": a dashed line winding past paw prints, in the logo's
// own navy/sky palette. Used as a quiet background motif — never competes
// with the actual logo mark.
export default function LeashPath({ className }: Props) {
  return (
    <svg
      viewBox="0 0 320 640"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M60 20 C 200 60, 40 160, 180 220 S 280 380, 100 420 S 40 560, 220 620"
        stroke="#243b5a"
        strokeWidth="3"
        strokeDasharray="2 14"
        strokeLinecap="round"
      />
      {[
        { x: 58, y: 22 },
        { x: 178, y: 222 },
        { x: 102, y: 422 },
        { x: 218, y: 618 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x}, ${p.y}) rotate(${i % 2 ? -18 : 14})`}>
          <ellipse cx="0" cy="0" rx="6.5" ry="8" fill="#4b83b2" />
          <ellipse cx="-8" cy="-9" rx="3" ry="3.6" fill="#4b83b2" />
          <ellipse cx="8" cy="-9" rx="3" ry="3.6" fill="#4b83b2" />
          <ellipse cx="-5" cy="-15" rx="2.4" ry="3" fill="#4b83b2" />
          <ellipse cx="5" cy="-15" rx="2.4" ry="3" fill="#4b83b2" />
        </g>
      ))}
    </svg>
  );
}
