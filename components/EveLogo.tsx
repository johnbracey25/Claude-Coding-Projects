"use client";

const IRIS = { cx: 338, cy: 148 };

function IrisLines() {
  const lines = [];
  for (let i = 0; i < 24; i++) {
    const a = (i * 15 * Math.PI) / 180;
    lines.push(
      <line
        key={i}
        x1={IRIS.cx + 10 * Math.cos(a)}
        y1={IRIS.cy + 10 * Math.sin(a)}
        x2={IRIS.cx + 23 * Math.cos(a)}
        y2={IRIS.cy + 23 * Math.sin(a)}
        stroke="#8fa688"
        strokeWidth="1.2"
      />
    );
  }
  return <g className="eve-iris-lines">{lines}</g>;
}

function EyeIcon() {
  return (
    <>
      {/* Upper eyelid */}
      <path
        d="M 40,200 C 55,55 385,40 410,190"
        fill="none"
        stroke="#1f3d57"
        strokeWidth="12"
        strokeLinecap="round"
      />
      {/* Lower eyelid */}
      <path
        d="M 40,200 C 120,310 360,310 410,190"
        fill="none"
        stroke="#1f3d57"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* "e" upper bowl - follows the eyelid curve */}
      <path
        d="M 245,178 C 235,80 115,65 108,178"
        fill="none"
        stroke="#1f3d57"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* "e" lower bowl with tail */}
      <path
        d="M 108,178 C 108,258 248,272 262,215"
        fill="none"
        stroke="#1f3d57"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* "e" crossbar */}
      <line
        x1="108"
        y1="178"
        x2="245"
        y2="175"
        stroke="#1f3d57"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* "v" in sage green */}
      <path
        d="M 238,152 L 288,260 L 338,148"
        fill="none"
        stroke="#90a687"
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />

      {/* Iris with animation */}
      <g className="eve-iris-group">
        <circle
          cx={IRIS.cx}
          cy={IRIS.cy}
          r="25"
          fill="none"
          stroke="#8fa688"
          strokeWidth="2.5"
        />
        <IrisLines />
        <circle cx={IRIS.cx} cy={IRIS.cy} r="7.5" fill="#1f3d57" />
        <circle
          cx={IRIS.cx - 3}
          cy={IRIS.cy - 3}
          r="2.5"
          fill="#f6f4ee"
          opacity="0.4"
        />
      </g>
    </>
  );
}

const ANIM_STYLES = `
  @keyframes irisPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.06); }
  }
  @keyframes irisShimmer {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.7; }
  }
  .eve-iris-group {
    animation: irisPulse 6s ease-in-out infinite;
    transform-origin: ${IRIS.cx}px ${IRIS.cy}px;
  }
  .eve-iris-lines {
    animation: irisShimmer 6s ease-in-out infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .eve-iris-group, .eve-iris-lines { animation: none; }
  }
`;

export default function EveLogo({
  size = "lg",
  className = "",
}: {
  size?: "sm" | "lg";
  className?: string;
}) {
  if (size === "sm") {
    return (
      <svg
        viewBox="20 25 400 290"
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Eve Research"
      >
        <style>{ANIM_STYLES}</style>
        <EyeIcon />
      </svg>
    );
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        viewBox="0 0 460 500"
        className="w-72 sm:w-80"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Eve Research - Focused on Tomorrow's Vision"
      >
        <style>{ANIM_STYLES}</style>
        <EyeIcon />

        {/* "eve" */}
        <text
          x="225"
          y="388"
          textAnchor="middle"
          fontFamily="var(--font-heading), Georgia, serif"
          fontSize="82"
          fontWeight="500"
          letterSpacing="10"
          fill="#1f3d57"
        >
          eve
        </text>

        {/* "RESEARCH" */}
        <text
          x="225"
          y="425"
          textAnchor="middle"
          fontFamily="var(--font-heading), Georgia, serif"
          fontSize="23"
          fontWeight="300"
          letterSpacing="14"
          fill="#8fa688"
        >
          RESEARCH
        </text>

        {/* Divider */}
        <line
          x1="200"
          y1="446"
          x2="250"
          y2="446"
          stroke="#8fa688"
          strokeWidth="1.5"
        />

        {/* Tagline */}
        <text
          x="225"
          y="474"
          textAnchor="middle"
          fontFamily="var(--font-body), system-ui, sans-serif"
          fontSize="10.5"
          fontWeight="500"
          letterSpacing="4"
          fill="#8fa688"
        >
          {"FOCUSED ON TOMORROW’S VISION"}
        </text>
      </svg>
    </div>
  );
}
