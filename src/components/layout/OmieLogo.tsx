import { cn } from "@/lib/utils";

interface OmieLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
};

export function OmieLogo({ className, size = "md", showText = true }: OmieLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Play Button Icon - Omie Style */}
      <div
        className={cn(
          "relative flex items-center justify-center rounded-lg gradient-primary shadow-glow",
          sizeClasses[size]
        )}
      >
        {/* Play Triangle */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-1/2 w-1/2 translate-x-[1px] text-primary-foreground"
        >
          <polygon points="6,4 20,12 6,20" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold text-gradient-omie tracking-tight">
            Conector
          </span>
          <span className="text-xs text-muted-foreground">
            Bitrix24 ↔ Omie ERP
          </span>
        </div>
      )}
    </div>
  );
}
