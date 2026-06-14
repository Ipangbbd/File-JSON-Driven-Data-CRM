import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { z } from "zod";

import { PageHeader } from "@/components/crm/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/providers/DataProvider";
import { companiesService } from "@/lib/services/companies.service";
import { contactsService } from "@/lib/services/contacts.service";
import { saveImage } from "@/lib/api/image.functions";
import { readFileAsBase64 } from "@/lib/utils";

const searchSchema = z.object({
  defaultCompanyId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/contacts/new")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({ meta: [{ title: "New Contact — Northwind CRM" }] }),
  component: NewContactPage,
});

const AVATAR_COLORS = ["blue", "emerald", "violet", "rose", "amber", "cyan", "fuchsia"];

function NewContactPage() {
  const { defaultCompanyId } = Route.useSearch();
  const navigate = useNavigate();
  const companies = useStore(() => companiesService.list());

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [companyId, setCompanyId] = useState(defaultCompanyId ?? "");
  const [avatarColor, setAvatarColor] = useState(
    AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      setImageError(null);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setImageError("Image must be 2MB or smaller.");
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setImageError("Only JPEG, PNG, WEBP, and GIF images are allowed.");
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    setImageError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and Last name are required.");
      return;
    }
    if (!companyId) {
      setError("Please select a company for this contact.");
      return;
    }
    if (!email.includes("@")) {
      setError("A valid email address is required.");
      return;
    }

    try {
      setIsSaving(true);
      const avatarImage = imageFile
        ? (await saveImage({
            data: {
              collection: "contacts",
              fileName: `${firstName}-${lastName}-${Date.now()}`,
              mimeType: imageFile.type,
              base64Data: await readFileAsBase64(imageFile),
            },
          })).path
        : undefined;

      contactsService.create({
        companyId,
        firstName,
        lastName,
        email,
        phone: phone || "—",
        role: role || "Contributor",
        avatarColor,
        avatarImage,
      });
      // Navigate back to company detail or contacts list
      if (defaultCompanyId) {
        navigate({ to: `/companies/${defaultCompanyId}` });
      } else {
        navigate({ to: "/contacts" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create contact.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={() => {
            if (defaultCompanyId) {
              navigate({ to: `/companies/${defaultCompanyId}` });
            } else {
              navigate({ to: "/contacts" });
            }
          }}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
      </div>

      <PageHeader
        title="New Contact"
        description="Add a new contact person associated with a customer account."
      />

      <form onSubmit={handleSubmit} className="surface-card p-6 space-y-6">
        {error && (
          <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">First Name *</label>
            <Input
              placeholder="e.g. Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="rounded-full border-border bg-surface"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Last Name *</label>
            <Input
              placeholder="e.g. Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="rounded-full border-border bg-surface"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address *</label>
            <Input
              type="email"
              placeholder="e.g. jane.doe@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="rounded-full border-border bg-surface"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              placeholder="e.g. +1 (555) 019-2834"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-full border-border bg-surface"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company *</label>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="rounded-full h-10 border-border bg-surface">
                <SelectValue placeholder="Select a company" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Job Title / Role</label>
            <Input
              placeholder="e.g. Engineering Lead, Purchasing Manager"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-full border-border bg-surface"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Profile image</label>
          <div className="flex items-center gap-3">
            <label className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground transition hover:bg-muted/10 cursor-pointer">
              Select image
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
            {imagePreview && (
              <img src={imagePreview} alt="Contact preview" className="h-14 w-14 rounded-2xl object-cover" />
            )}
          </div>
          {imageError && <p className="text-xs text-destructive">{imageError}</p>}
          <label className="text-sm font-medium">Avatar Color</label>
          <div className="flex gap-2">
            {AVATAR_COLORS.map((color) => {
              const bgMap: Record<string, string> = {
                blue: "bg-blue-500",
                emerald: "bg-emerald-500",
                violet: "bg-violet-500",
                rose: "bg-rose-500",
                amber: "bg-amber-500",
                cyan: "bg-cyan-500",
                fuchsia: "bg-fuchsia-500",
              };
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  className={`h-8 w-8 rounded-full ${bgMap[color] || "bg-gray-500"} transition-all ${
                    avatarColor === color ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80 hover:opacity-100"
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => {
              if (defaultCompanyId) {
                navigate({ to: `/companies/${defaultCompanyId}` });
              } else {
                navigate({ to: "/contacts" });
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" className="rounded-full" disabled={isSaving}>
            <Save className="mr-1.5 h-4 w-4" /> {isSaving ? "Saving..." : "Save Contact"}
          </Button>
        </div>
      </form>
    </div>
  );
}
