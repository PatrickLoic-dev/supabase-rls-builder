import { cn } from "@/lib/utils";

interface LogoMarkProps { size?: number }
interface LogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  tagline?: string;
}

export function LogoMark({ size = 34 }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="PolicyCraft logo"
    >
      {/* Shield fill */}
      <path
        d="M17 2.5L4.5 7.5V17C4.5 23.9 9.8 30.2 17 31.8C24.2 30.2 29.5 23.9 29.5 17V7.5L17 2.5Z"
        className="fill-primary/15"
      />
      {/* Shield stroke */}
      <path
        d="M17 2.5L4.5 7.5V17C4.5 23.9 9.8 30.2 17 31.8C24.2 30.2 29.5 23.9 29.5 17V7.5L17 2.5Z"
        className="stroke-primary"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* DB cylinder top ellipse */}
      <ellipse cx="17" cy="13" rx="5" ry="1.8" className="fill-primary" />
      {/* DB cylinder body */}
      <path
        d="M12 13V19C12 20 14.2 20.8 17 20.8C19.8 20.8 22 20 22 19V13"
        className="fill-primary/15 stroke-primary"
        strokeWidth="1.4"
      />
      {/* DB mid line */}
      <path
        d="M12 16C12 17 14.2 17.8 17 17.8C19.8 17.8 22 17 22 16"
        className="stroke-primary"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function Logo({ size = 34, className, showWordmark = true, tagline }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-foreground">
            PolicyCraft
          </span>
          {tagline && (
            <span className="text-[10.5px] text-muted-foreground mt-0.5 leading-snug max-w-[140px]">
              {tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
