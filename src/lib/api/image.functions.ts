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

    return {
      success: true,
      path: `/data/image/${data.collection === "users" ? "users_image" : "customers_image"}/${fileName}`,
    };
  });

export const getImagePath = (collection: "users" | "contacts", fileName: string): string =>
  `/data/image/${collection === "users" ? "users_image" : "customers_image"}/${fileName}`;
