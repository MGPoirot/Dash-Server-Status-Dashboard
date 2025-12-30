// src/api/log-definition.ts
import type { GatsbyFunctionRequest, GatsbyFunctionResponse } from "gatsby";
import { promises as fs } from "fs";
import path from "path";

const DEFINITIONS_DIR = path.join(process.cwd(), "content", "definitions");

// Allow only simple ids like "system.cpu.temp" or "storage.hard-disk-1.used"
const isSafeId = (id: string): boolean =>
  /^[a-zA-Z0-9._-]+$/.test(id);

const getFilePathForId = (id: string): string => {
  if (!isSafeId(id)) {
    throw new Error("Invalid id");
  }
  return path.join(DEFINITIONS_DIR, `${id}.json`);
};

export default async function handler(
  req: GatsbyFunctionRequest,
  res: GatsbyFunctionResponse
) {
  res.setHeader("Content-Type", "application/json");

  const id = typeof req.query.id === "string" ? req.query.id : undefined;

  if (!id) {
    res.status(400).json({ error: "Missing ?id=definition.id" });
    return;
  }

  let filePath: string;
  try {
    filePath = getFilePathForId(id);
  } catch {
    res.status(400).json({ error: "Invalid definition id" });
    return;
  }

  try {
    if (req.method === "GET") {
      const raw = await fs.readFile(filePath, "utf8");
      const json = JSON.parse(raw);
      res.status(200).json(json);
      return;
    }

    if (req.method === "POST" || req.method === "PUT") {
      // Gatsby will usually give you req.body already parsed if JSON,
      // but we guard both cases
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      // TODO: optional schema validation of `body`

      const asJson = JSON.stringify(body, null, 2);
      await fs.writeFile(filePath, asJson, "utf8");
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    console.error("log-definition error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
