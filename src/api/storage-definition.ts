// src/api/storage-definition.ts
import type { IncomingMessage, ServerResponse } from "http";
import { promises as fs } from "fs";
import path from "path";

// Absolute path to your JSON definition file
const STORAGE_DEF_PATH = path.join(
  process.cwd(),
  "content",
  "definitions",
  "storage.hard-disk-1.used.json"
);

type StorageDefinition = unknown; // tighten this when you know the shape

async function readDefinition(): Promise<StorageDefinition> {
  const raw = await fs.readFile(STORAGE_DEF_PATH, "utf8");
  return JSON.parse(raw);
}

async function writeDefinition(data: StorageDefinition): Promise<void> {
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(STORAGE_DEF_PATH, json, "utf8");
}

// Gatsby Function handler
export default async function handler(
  req: IncomingMessage & { method?: string },
  res: ServerResponse & { status: (code: number) => any; json: (body: any) => void }
) {
  // CORS / headers if you need them
  res.setHeader("Content-Type", "application/json");

  try {
    if (req.method === "GET") {
      const def = await readDefinition();
      res.status(200).json(def);
      return;
    }

    if (req.method === "POST" || req.method === "PUT") {
      // Collect body (Gatsby Functions give you parsed body if using their types,
      // but this manual approach stays generic)
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", async () => {
        try {
          const parsed = JSON.parse(body);

          // TODO: validate `parsed` shape here if you know the schema.

          await writeDefinition(parsed);
          res.status(200).json({ ok: true });
        } catch (err: any) {
          console.error("Error writing storage definition:", err);
          res.status(400).json({ ok: false, error: "Invalid JSON or write failed" });
        }
      });
      return;
    }

    // Method not allowed
    res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("Storage definition handler error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
