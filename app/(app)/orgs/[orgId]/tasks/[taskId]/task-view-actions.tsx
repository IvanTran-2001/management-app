"use client";

/**
 * TaskViewActions — Actions for the task view page.
 *
 * Renders an Edit button (navigates to edit page) and a Delete button
 * (shows an inline confirmation overlay, then calls `deleteTaskAction`
 * and redirects to the tasks list on success).
 *
 * Shown only when the viewer holds `MANAGE_TASKS` (gated server-side in the
 * parent page; this component receives no auth props).
 */
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTaskAction } from "@/app/actions/tasks";

interface Props {
  orgId: string;
  taskId: string;
  taskName: string;
}

export function TaskViewActions({ orgId, taskId, taskName }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteTaskAction(orgId, taskId);
      if (res.ok) {
        router.push(`/orgs/${orgId}/tasks`);
      } else {
        toast.error(res.error);
        setConfirming(false);
      }
    });
  };

  return (
    <>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/orgs/${orgId}/tasks/${taskId}/edit`}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
          onClick={() => setConfirming(true)}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete
        </Button>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border rounded-lg p-6 shadow-xl flex flex-col gap-4 w-80">
            <p className="text-sm">
              Are you sure you want to remove <strong>{taskName}</strong>?
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
              >
                {isPending ? "Deleting..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
