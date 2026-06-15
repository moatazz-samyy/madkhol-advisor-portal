type LogoProps = {
  className?: string;
  variant?: "mark" | "wordmark";
  tone?: "dark" | "light";
};

// Stylized "M" inspired by the Madkhol brand mark (Letter M + Growth + Money + Flow).
// Inline SVG so it works in RTL/LTR, light/dark, and at any size.
export function Logo({
  className = "h-8 w-8",
  variant = "mark",
  tone = "dark",
}: LogoProps) {
  const fill = tone === "dark" ? "#0A2E1F" : "#F5F2E8";
  if (variant === "wordmark") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <LogoMark fill={fill} />
        <span
          className="font-semibold text-2xl tracking-tight"
          style={{ color: fill }}
        >
          Madkhol
        </span>
      </div>
    );
  }
  return <LogoMark fill={fill} className={className} />;
}

function LogoMark({ fill, className }: { fill: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Madkhol"
    >
      {/* Left rising stroke */}
      <path
        d="M6 38 L18 8 Q19.5 5 22 8 L26 14 L20 22 L14 32 Q12.5 36 10 38 Z"
        fill={fill}
      />
      {/* Right rising stroke */}
      <path
        d="M26 14 L32 8 Q34 5.5 36 8 L42 36 Q42.5 38 40 38 L34 32 L28 24 Z"
        fill={fill}
      />
      {/* Highlight wedge that makes the inner counter-form */}
      <path
        d="M30 18 L34 14 L36 22 L32 26 Z"
        fill={fill}
        opacity="0.85"
      />
    </svg>
  );
}
