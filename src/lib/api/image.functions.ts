import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fileURLToPath } from "url";

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const saveImage = createServerFn({ method: "POST" })
  .validator(
    z.object({
      collection: z.enum(["users", "contacts"]),
      fileName: z.string().min(1),
      mimeType: z.string(),
      base64Data: z.string(),
      // optional previousPath to delete replaced images from disk
      previousPath: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    if (!ALLOWED_MIME_TYPES.includes(data.mimeType)) {
      throw new Error("Only JPEG, PNG, WEBP and GIF images are allowed.");
    }

    const fileBuffer = Buffer.from(data.base64Data, "base64");
    if (fileBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      throw new Error("Image must be 2MB or smaller.");
    }

    const extension = data.mimeType.split("/")[1];
    const safeName = data.fileName.replace(/[^a-zA-Z0-9-_\.]/g, "_");
    const fileName = `${safeName}.${extension}`;
    const fs = await import("fs/promises");
    const path = await import("path");
    // Save images under `src/data/image` so the server static handler can serve them
    const imageRoot = fileURLToPath(new URL("../../data/image", import.meta.url));
    const targetDir = path.join(imageRoot, data.collection === "users" ? "users_image" : "customers_image");

    await fs.mkdir(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, fileName);
    await fs.writeFile(targetPath, fileBuffer);

    // If a previousPath was provided and points inside our data/image folder,
    // attempt to remove it so we don't accumulate orphaned files.
    if (data.previousPath && data.previousPath.startsWith("/data/image/")) {
      try {
        const prevParts = data.previousPath.split("/").filter(Boolean); // ["data","image","users_image","file.png"]
        const fileNameIndex = prevParts.length - 1;
        const prevFileName = prevParts[fileNameIndex];
        const prevCollectionDir = prevParts.slice(2, fileNameIndex).join("/");
        const prevFullPath = path.join(imageRoot, prevCollectionDir, prevFileName);
        // Only unlink if file exists
        try {
          await fs.unlink(prevFullPath);
        } catch (err) {
          // ignore missing file or permission errors — log for debugging
          // eslint-disable-next-line no-console
          console.warn("Could not delete previous image:", prevFullPath, err?.message ?? err);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Failed to process previousPath for deletion:", err?.message ?? err);
      }
    }

    return {
      success: true,
      path: `/data/image/${data.collection === "users" ? "users_image" : "customers_image"}/${fileName}`,
    };
  });

export const getImagePath = (collection: "users" | "contacts", fileName: string): string =>
  `/data/image/${collection === "users" ? "users_image" : "customers_image"}/${fileName}`;

export const deleteImage = createServerFn({ method: "POST" })
  .validator(
    z.object({ path: z.string().min(1) }),
  )
  .handler(async ({ data }) => {
    const fs = await import("fs/promises");
    const path = await import("path");
    const imageRoot = fileURLToPath(new URL("../../data/image", import.meta.url));

    if (!data.path.startsWith("/data/image/")) {
      throw new Error("Invalid image path");
    }

    try {
      const parts = data.path.split("/").filter(Boolean); // ["data","image","users_image","file.png"]
      const fileName = parts[parts.length - 1];
      const collectionDir = parts.slice(2, parts.length - 1).join("/");
      const target = path.join(imageRoot, collectionDir, fileName);
      await fs.unlink(target);
      return { success: true };
    } catch (err) {
      // If file didn't exist that's fine — return success for idempotency
      return { success: false, message: (err as Error).message };
    }
  });
