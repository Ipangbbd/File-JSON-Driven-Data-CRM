import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/crm/PageHeader";
import { UserAvatar } from "@/components/crm/UserAvatar";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useStore } from "@/lib/providers/DataProvider";
import { activityService } from "@/lib/services/activity.service";
import { tasksService } from "@/lib/services/tasks.service";
import { usersService } from "@/lib/services/users.service";
import { saveImage } from "@/lib/api/image.functions";
import { formatDateTime, relativeTime } from "@/lib/format";
import { readFileAsBase64 } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Northwind CRM" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, permissions, refreshUser } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const myTasks = useStore(() => (user ? tasksService.forAssignee(user.id) : []));
  const activity = useStore(() => activityService.recent(20));
  if (!user) return null;

  const open = myTasks.filter((t) => t.status !== "completed");
  const done = myTasks.length - open.length;

  useEffect(() => {
    setImagePreview(user.avatarImage ?? null);
  }, [user.avatarImage]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      setImagePreview(user.avatarImage ?? null);
      setImageError(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageError("Image must be 2MB or smaller.");
      setImageFile(null);
      setImagePreview(user.avatarImage ?? null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setImageError("Only JPEG, PNG, WEBP, and GIF images are allowed.");
      setImageFile(null);
      setImagePreview(user.avatarImage ?? null);
      return;
    }

    setImageError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!imageFile) {
      setImageError("Please choose an image before saving.");
      return;
    }

    setImageError(null);
    setSaving(true);
    setStatusMessage(null);
    try {
      const response = await saveImage({
        data: {
          collection: "users",
          fileName: `${user.id}-${Date.now()}`,
          mimeType: imageFile.type,
          base64Data: await readFileAsBase64(imageFile),
        },
      });
      usersService.update(user.id, { avatarImage: response.path });
      refreshUser();
      setStatusMessage("Profile image saved successfully.");
      setImageFile(null);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Unable to update profile image.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Your profile" description="Account details and access summary." />
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="surface-card lg:col-span-1 flex flex-col items-center gap-3 p-6 text-center">
          <UserAvatar initials={user.initials} color={user.avatarColor} imageSrc={imagePreview ?? undefined} size="lg" />
          <div>
            <div className="text-lg font-semibold">{user.firstName} {user.lastName}</div>
            <div className="text-sm text-muted-foreground">{user.jobTitle}</div>
          </div>
          <div className="space-y-3 w-full">
            <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium transition hover:bg-muted/10">
              <span>{imageFile ? "Change profile image" : "Upload profile image"}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
            </label>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Profile preview"
                className="mx-auto h-24 w-24 rounded-2xl object-cover"
              />
            )}
            {statusMessage && (
            <p className="text-sm text-success">{statusMessage}</p>
          )}
          {imageError && <p className="text-xs text-destructive">{imageError}</p>}
            {imageFile && (
              <Button
                className="w-full rounded-full"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save profile image"}
              </Button>
            )}
          </div>
          <div className="grid w-full grid-cols-2 gap-2 pt-4 text-left text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Role</div>
              <div className="font-medium">{ROLE_LABELS[user.role]}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Email</div>
              <div className="truncate font-medium">{user.email}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Open tasks</div>
              <div className="font-medium">{open.length}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Completed</div>
              <div className="font-medium">{done}</div>
            </div>
          </div>
        </section>

        <section className="surface-card lg:col-span-2 p-6">
          <h3 className="text-base font-semibold">Permissions</h3>
          <p className="text-xs text-muted-foreground">Capabilities granted by your role.</p>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {permissions.map((p) => (
              <li
                key={p}
                className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
              >
                {p}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="surface-card p-6">
        <h3 className="text-base font-semibold">Recent activity</h3>
        <ul className="mt-4 divide-y divide-border">
          {activity.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-3 text-sm">
              <span>{entry.message}</span>
              <span
                className="text-xs text-muted-foreground"
                title={formatDateTime(entry.createdAt)}
              >
                {relativeTime(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
