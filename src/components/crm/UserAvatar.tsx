import { cn } from "@/lib/utils";
import { useState } from "react";

interface AvatarProps {
  initials: string;
  color: string;
  imageSrc?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  title?: string;
}

const SIZE_CLASS: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function UserAvatar({ initials, color, imageSrc, size = "md", className, title }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const baseClasses = cn(
    "inline-flex overflow-hidden rounded-full font-medium text-white ring-2 ring-surface",
    SIZE_CLASS[size],
    className,
  );

  if (imageSrc && !failed) {
    return (
      <span title={title} className={baseClasses} style={{ backgroundColor: color }}>
        <img
          src={imageSrc}
          alt={title ?? initials}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }

  return (
    <span
      title={title}
      className={baseClasses}
      style={{ backgroundColor: color }}
    >
      {initials}
    </span>
  );
}

interface StackProps {
  users: { id: string; initials: string; avatarColor: string; firstName: string; lastName: string }[];
  max?: number;
  size?: AvatarProps["size"];
}

export function AvatarStack({ users, max = 6, size = "sm" }: StackProps) {
  const shown = users.slice(0, max);
  const overflow = users.length - shown.length;
  return (
    <div className="flex -space-x-2">
      {shown.map((u) => (
        <UserAvatar
          key={u.id}
          initials={u.initials}
          color={u.avatarColor}
          size={size}
          title={`${u.firstName} ${u.lastName}`}
        />
      ))}
      {overflow > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-secondary font-medium text-secondary-foreground ring-2 ring-surface",
            size === "lg" ? "h-12 w-12 text-sm" : size === "md" ? "h-10 w-10 text-xs" : "h-8 w-8 text-[11px]",
          )}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
