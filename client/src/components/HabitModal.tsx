import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";
import type { Frequency, Habit } from "@/types";

const PALETTE = ["#39FF14", "#14D1FF", "#FF8A14", "#FF4DD2", "#A14DFF"];

export function HabitModal({
  open,
  onClose,
  onSubmit,
  initial,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { title: string; color: string; frequency: Frequency }) => void;
  initial?: Habit | null;
  submitting?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [frequency, setFrequency] = useState<Frequency>("DAILY");

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setColor(initial?.color ?? PALETTE[0]);
      setFrequency(initial?.frequency ?? "DAILY");
    }
  }, [open, initial]);

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit habit" : "New habit"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onSubmit({ title: title.trim(), color, frequency });
        }}
      >
        <Field label="Title">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Morning run" />
        </Field>
        <Field label="Frequency">
          <Select value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly</option>
          </Select>
        </Field>
        <div className="mb-4">
          <p className="eyebrow mb-1.5">Color</p>
          <div className="flex gap-2.5">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-full border-2 transition"
                style={{
                  background: c,
                  borderColor: color === c ? "#fff" : "transparent",
                  boxShadow: color === c ? `0 0 10px ${c}` : "none",
                }}
                aria-label={`Choose color ${c}`}
              />
            ))}
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Saving…" : initial ? "Save changes" : "Create habit"}
        </Button>
      </form>
    </Modal>
  );
}
