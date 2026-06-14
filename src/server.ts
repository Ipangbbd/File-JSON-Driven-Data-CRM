import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/data/image/")) {
      try {
        const fs = await import("fs/promises");
        const path = await import("path");

        const segments = url.pathname.split("/").filter(Boolean);
        if (segments.length < 4 || segments[0] !== "data" || segments[1] !== "image") {
          return new Response("Not found", { status: 404 });
        }

        const safeSegments = segments.slice(2).map((segment) => segment.replace(/\/\\|\.\.|\s+/g, "_"));

        // Try the primary image root first (src/data/image), then fall back to the legacy
        // location where images were previously written (src/lib/data/image).
        const candidateRoots = [
          path.join(process.cwd(), "src", "data", "image"),
          path.join(process.cwd(), "src", "lib", "data", "image"),
        ];

        let file: Uint8Array | null = null;
        let targetPath = "";
        for (const root of candidateRoots) {
          const candidate = path.join(root, ...safeSegments);
          try {
            const buf = await fs.readFile(candidate);
            file = buf;
            targetPath = candidate;
            break;
          } catch {
            // try next root
          }
        }

        if (!file) {
          return new Response("Not found", { status: 404 });
        }

        const extension = path.extname(targetPath).slice(1).toLowerCase();
        const contentType = {
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
          gif: "image/gif",
        }[extension] ?? "application/octet-stream";

        return new Response(file, {
          status: 200,
          headers: { "content-type": contentType },
        });
      } catch {
        return new Response("Not found", { status: 404 });
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
