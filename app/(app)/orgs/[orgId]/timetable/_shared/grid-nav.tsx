"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GridNavProps {
  label: string;
  onPrev: (() => void) | { href: string };
  onNext: (() => void) | { href: string };
  prevDisabled?: boolean;
  nextDisabled?: boolean;
}

export function GridNav({
  label,
  onPrev,
  onNext,
  prevDisabled,
  nextDisabled,
}: GridNavProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-1.5">
      {typeof onPrev === "function" ? (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          disabled={prevDisabled}
          onClick={onPrev}
        >
          <ChevronLeft className="h-4 w-4" /> Prev
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          disabled={prevDisabled}
          asChild={!prevDisabled}
        >
          {prevDisabled ? (
            <span>
              <ChevronLeft className="h-4 w-4" /> Prev
            </span>
          ) : (
            <Link href={onPrev.href}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Link>
          )}
        </Button>
      )}
      <span className="text-sm font-medium">{label}</span>
      {typeof onNext === "function" ? (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          disabled={nextDisabled}
          onClick={onNext}
        >
          Next <ChevronRight className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          disabled={nextDisabled}
          asChild={!nextDisabled}
        >
          {nextDisabled ? (
            <span>
              Next <ChevronRight className="h-4 w-4" />
            </span>
          ) : (
            <Link href={onNext.href}>
              Next <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </Button>
      )}
    </div>
  );
}
