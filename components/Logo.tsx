import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  tagline?: string;
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PolicyCraft logo"
    >
      {/* Shield body */}
      <path
        d="M18 3L5 8.5V18C5 25.18 10.64 31.88 18 33.5C25.36 31.88 31 25.18 31 18V8.5L18 3Z"
        fill="var(--brand)"
        opacity="0.15"
      />
      <path
        d="M18 3L5 8.5V18C5 25.18 10.64 31.88 18 33.5C25.36 31.88 31 25.18 31 18V8.5L18 3Z"
        stroke="var(--brand)"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Database cylinder top */}
      <ellipse cx="18" cy="14" rx="5.5" ry="2" fill="var(--brand)" opacity="0.9" />
      {/* Database cylinder body */}
      <path
        d="M12.5 14V20.5C12.5 21.6 14.97 22.5 18 22.5C21.03 22.5 23.5 21.6 23.5 20.5V14"
        stroke="var(--brand)"
        strokeWidth="1.5"
        fill="var(--brand)"
        fillOpacity="0.12"
      />
      {/* Middle line of cylinder */}
      <path
        d="M12.5 17.25C12.5 18.35 14.97 19.25 18 19.25C21.03 19.25 23.5 18.35 23.5 17.25"
        stroke="var(--brand)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

export function Logo({ size = 36, className, showWordmark = true, tagline }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            PolicyCraft
          </span>
          {tagline && (
            <span className="text-[11px] text-muted-foreground mt-0.5">{tagline}</span>
          )}
        </div>
      )}
    </div>
  );
}
