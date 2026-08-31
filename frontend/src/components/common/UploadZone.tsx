import { useRef, useState } from "react";
import { UploadSimple } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function UploadZone({
  accept,
  hint,
  onFile,
}: {
  accept: string;
  hint: string;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFile(file);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
        dragging ? "border-gold bg-gold/5" : "border-input bg-muted/30",
      )}
    >
      <UploadSimple className="h-7 w-7 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        Glissez un fichier ici ou{" "}
        <button
          type="button"
          className="text-info hover:underline"
          onClick={() => inputRef.current?.click()}
        >
          parcourez
        </button>
      </p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
        }}
      />
    </div>
  );
}
