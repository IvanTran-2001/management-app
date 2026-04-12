import { HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * FriendChise wordmark — circle icon + logotype.
 * Renders purely with SVG/CSS so it scales crisply at any size and
 * inherits theme colors automatically.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5 select-none", className)}>
      {/* Circle badge */}
      <span className="flex items-center justify-center rounded-full border-2 border-current p-1.5">
        <HeartHandshake className="h-4 w-4" strokeWidth={1.75} />
      </span>
      {/* Logotype — Poppins SemiBold */}
      <span
        className="text-base font-semibold tracking-tight leading-none"
        style={{ fontFamily: "var(--font-logo, system-ui)" }}
      >
        FriendChise
      </span>
    </span>
  );
}
