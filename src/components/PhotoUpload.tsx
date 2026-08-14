"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { PawPrint, Loader2 } from "lucide-react";

type Props = {
  folder: "dogs" | "walks" | "walkers";
  value: string;
  onChange: (url: string) => void;
};

export default function PhotoUpload({ folder, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder, fileType: file.type }),
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        setError(presignData.error);
        return;
      }

      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!uploadRes.ok) {
        setError("Upload failed, please try again");
        return;
      }

      onChange(presignData.objectUrl);
    } catch {
      setError("Upload failed, please try again");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sand bg-sand/20">
          {value ? (
            <Image src={value} alt="Photo" width={80} height={80} className="h-full w-full object-cover" />
          ) : uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-navy-400" strokeWidth={1.75} />
          ) : (
            <PawPrint className="h-7 w-7 text-navy-300" strokeWidth={1.5} />
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-sand px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-sand/30 disabled:opacity-50"
          >
            {uploading ? "Uploading…" : value ? "Change photo" : "Upload photo"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
