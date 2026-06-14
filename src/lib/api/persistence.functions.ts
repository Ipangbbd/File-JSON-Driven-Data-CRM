import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const saveCollection = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      collection: z.string(),
      data: z.array(z.any()),
    }),
  )
  .handler(async ({ data: { collection, data } }) => {
    const fs = await import("fs");
    const path = await import("path");

    // Resolve target seed file path
    const filePath = path.resolve(process.cwd(), "src", "data", "seed", `${collection}.json`);

    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
      console.log(`[Persistence Server] Successfully saved ${data.length} records to ${filePath}`);
      return { success: true };
    } catch (error) {
      console.error(`[Persistence Server] Failed to save collection ${collection}:`, error);
      throw error;
    }
  });
