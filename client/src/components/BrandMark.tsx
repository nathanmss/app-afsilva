import { useState } from "react";
import { Truck } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  imageClassName,
  fallbackClassName,
}: {
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {!hasError ? (
        <img
          src="/favicon.jpg"
          alt="AF Silva Logo"
          className={cn("w-full h-full object-contain", imageClassName)}
          onError={() => setHasError(true)}
        />
      ) : null}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-slate-100 text-primary transition-opacity",
          hasError ? "opacity-100" : "opacity-0 pointer-events-none",
          fallbackClassName,
        )}
      >
        <Truck className="w-[55%] h-[55%]" />
      </div>
    </div>
  );
}
