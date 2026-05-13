"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { setRosterCellMembersAction } from "@/app/actions/roster";
import type { RosterEntryRow, OrgMember } from "./roster-board";
import { DAY_LABELS } from "./roster-board-constants";

function formatWeekDate(weekStart: Date, dayIndex: number): string {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + dayIndex);
  return `${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}`;
}

function memberDisplayName(m: OrgMember): string {
  return m.botName ?? m.user?.name ?? "Unknown";
}

interface EditCellDialogProps {
  orgId: string;
  weekStart: Date;
  dayIndex: number;
  members: OrgMember[];
  currentEntries: RosterEntryRow[];
  onClose: () => void;
}

export function EditCellDialog({
  orgId,
  weekStart,
  dayIndex,
  members,
  currentEntries,
  onClose,
}: EditCellDialogProps) {
  const [selected, setSelected] = useState<string[]>(
    currentEntries.map((e) => e.membershipId),
  );
  const [isPending, startTransition] = useTransition();

  const dayLabel = DAY_LABELS[dayIndex];
  const dateLabel = formatWeekDate(weekStart, dayIndex);
  const title = `Edit ${dayLabel} — ${dateLabel}`;

  const available = members.filter((m) => !selected.includes(m.id));

  function addMember(id: string) {
    setSelected((prev) => [...prev, id]);
  }

  function removeMember(id: string) {
    setSelected((prev) => prev.filter((s) => s !== id));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await setRosterCellMembersAction(
        orgId,
        weekStart,
        dayIndex,
        selected,
      );
      if (result.ok) {
        onClose();
      } else {
        toast.error(result.error ?? "Failed to save");
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">{title}</DialogTitle>
        </DialogHeader>

        {/* Member picker */}
        {available.length > 0 && (
          <select
            className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) addMember(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              Add member…
            </option>
            {available.map((m) => (
              <option key={m.id} value={m.id}>
                {memberDisplayName(m)}
              </option>
            ))}
          </select>
        )}

        {/* Selected members list */}
        <div className="flex flex-col gap-1 min-h-[60px]">
          {selected.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              No members rostered.
            </p>
          ) : (
            selected.map((id) => {
              const member = members.find((m) => m.id === id);
              if (!member) return null;
              return (
                <div
                  key={id}
                  className="flex items-center justify-between px-2 py-1 rounded bg-muted/50 text-sm"
                >
                  <span>{memberDisplayName(member)}</span>
                  <button
                    type="button"
                    onClick={() => removeMember(id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
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
