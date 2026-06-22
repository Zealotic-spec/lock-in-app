import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import type { Goal, GoalStatus } from "@/types";

export function GoalModal({
  open,
  onClose,
  onSubmit,
  initial,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    title: string;
    description: string | null;
    deadline: string | null;
    progress: number;
    status: GoalStatus;
  }) => void;
  initial?: Goal | null;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<GoalStatus>("ACTIVE");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setDescription(initial?.description ?? "");
      setDeadline(initial?.deadline ? initial.deadline.slice(0, 10) : "");
      setProgress(initial?.progress ?? 0);
      setStatus(initial?.status ?? "ACTIVE");
    }
  }, [open, initial]);

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit goal" : "New goal"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onSubmit({
            title: title.trim(),
            description: description.trim() || null,
            deadline: deadline || null,
            progress,
            status,
          });
        }}
      >
        <Field label="Title">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ship side project v1" />
        </Field>
        <Field label="Description">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Deadline">
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value as GoalStatus)}>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </Field>
        </div>
        <Field label={`Progress — ${progress}%`}>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </Field>
        <Button type="submit" className="w-full mt-1" disabled={submitting}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create goal"}
        </Button>
      </form>
    </Modal>
  );
}
