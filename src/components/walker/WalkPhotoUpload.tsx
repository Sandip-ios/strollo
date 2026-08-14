"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";

const MAX_PHOTOS = 6;

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
};

export default function WalkPhotoUpload({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setError(null);
    const remaining = MAX_PHOTOS - value.length;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "walks", fileType: file.type }),
        });
        const presignData = await presignRes.json();
        if (!presignRes.ok) {
          setError(presignData.error);
          continue;
        }

        const uploadRes = await fetch(presignData.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadRes.ok) {
          setError("One or more photos failed to upload — please try again");
          continue;
        }

        uploaded.push(presignData.objectUrl);
      }
      if (uploaded.length) onChange([...value, ...uploaded]);
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink/80">
        Photos ({value.length}/{MAX_PHOTOS})
      </label>
      <div className="grid grid-cols-3 gap-2">
        {value.map((url) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-lg border border-sand">
            <Image src={url} alt="Walk photo" fill className="object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              aria-label="Remove photo"
              className="absolute right-1 top-1 rounded-full bg-ink/60 p-1 text-paper transition hover:bg-ink/80"
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          </div>
        ))}
        {value.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-sand text-ink/40 transition hover:border-navy-300 hover:text-navy-500 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.75} />
            ) : (
              <Camera className="h-5 w-5" strokeWidth={1.5} />
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
