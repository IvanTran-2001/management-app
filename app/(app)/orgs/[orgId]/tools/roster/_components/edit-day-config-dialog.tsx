"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upsertRosterDayConfigAction } from "@/app/actions/roster";
import type { DayConfigRow } from "./roster-board";
import { DAY_LABELS } from "./roster-board-constants";

function minToTime(min: number | null): string {
  if (min === null) return "";
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function timeToMin(time: string): number | null {
  if (!time) return null;
  const [h, m] = time.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
}

interface EditDayConfigDialogProps {
  orgId: string;
  dayIndex: number;
  config: DayConfigRow | null;
  onClose: () => void;
}

export function EditDayConfigDialog({
  orgId,
  dayIndex,
  config,
  onClose,
}: EditDayConfigDialogProps) {
  const [recommendedSize, setRecommendedSize] = useState(
    config?.recommendedSize ?? 1,
  );
  const [openTime, setOpenTime] = useState(
    minToTime(config?.openTimeMin ?? null),
  );
  const [closeTime, setCloseTime] = useState(
    minToTime(config?.closeTimeMin ?? null),
  );
  const [isPending, startTransition] = useTransition();

  const dayLabel = DAY_LABELS[dayIndex];

  function handleSave() {
    startTransition(async () => {
      const result = await upsertRosterDayConfigAction(orgId, dayIndex, {
        recommendedSize,
        openTimeMin: timeToMin(openTime),
        closeTimeMin: timeToMin(closeTime),
      });
      if (result.ok) {
        onClose();
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-sm">Edit {dayLabel} row</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Recommended Size</label>
            <Input
              type="number"
              min={0}
              max={100}
              value={recommendedSize}
              onChange={(e) =>
                setRecommendedSize(Math.max(0, Number(e.target.value)))
              }
              className="h-8 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Open Time</label>
            <Input
              type="time"
              value={openTime}
              onChange={(e) => setOpenTime(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Close Time</label>
            <Input
              type="time"
              value={closeTime}
              onChange={(e) => setCloseTime(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
