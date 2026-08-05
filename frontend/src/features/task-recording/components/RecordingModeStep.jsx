import { Mic, Monitor, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { RECORDING_MODES } from "../constants";

const MODE_OPTIONS = [
  {
    mode: RECORDING_MODES.AUDIO,
    label: "Audio",
    description: "Record voice with your microphone.",
    icon: Mic,
  },
  {
    mode: RECORDING_MODES.VIDEO,
    label: "Video",
    description: "Record camera and microphone.",
    icon: Video,
  },
  {
    mode: RECORDING_MODES.SCREEN,
    label: "Screen",
    description: "Record your screen (and optional audio).",
    icon: Monitor,
  },
];

export function RecordingModeStep({ selectedMode, onSelect }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {MODE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = selectedMode === option.mode;

        return (
          <button
            key={option.mode}
            type="button"
            onClick={() => onSelect(option.mode)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/40 hover:bg-surface"
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                isSelected ? "text-primary" : "text-text-muted"
              )}
            />
            <span className="text-sm font-medium text-text-primary">
              {option.label}
            </span>
            <span className="text-xs text-text-muted">{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}
