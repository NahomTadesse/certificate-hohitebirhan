"use client";

import { useEffect, useState } from "react";
import { UserRound } from "lucide-react";
import { resolveImageUrl } from "@/utils/imageUrl";

interface PhotoAvatarProps {
  /** Relative API path (/api/files/...), absolute URL, or blob/data URL */
  src?: string | null;
  alt?: string;
  /** Tailwind size classes, e.g. "h-10 w-10" */
  size?: string;
  /** "circle" for lists, "square" for ID/certificate style photos */
  shape?: "circle" | "square";
  className?: string;
}

// Shows the person's photo, falling back to a neutral icon when there is no
// photo or the image fails to load (broken path, offline, etc.).
export default function PhotoAvatar({
  src,
  alt = "",
  size = "h-10 w-10",
  shape = "circle",
  className = "",
}: PhotoAvatarProps) {
  const url = resolveImageUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const radius = shape === "circle" ? "rounded-full" : "rounded-md";

  return (
    <div
      className={`${size} ${radius} shrink-0 overflow-hidden bg-primary/10 flex items-center justify-center border border-border ${className}`}
    >
      {url && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <UserRound className="h-1/2 w-1/2 text-primary" />
      )}
    </div>
  );
}
