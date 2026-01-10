// json-server.js
const express = require("express");
const path = require("path");
const fs = require("fs");

const PORT = Number(process.env.JSON_PORT || 7000);
const ROOT = process.env.JSON_ROOT || path.join(process.cwd(), "content");

const app = express();

// ---- helpers -------------------------------------------------------------

function mount(urlPath, diskPath) {
  if (!fs.existsSync(diskPath)) {
    console.warn(`[json] WARNING: ${diskPath} does not exist`);
  }
  app.use(
    urlPath,
    express.static(diskPath, {
      etag: false,
      lastModified: true,
      index: false,
    })
  );
}

// ---- routes --------------------------------------------------------------

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

// Serve only approved folders
mount("/latest", path.join(ROOT, "latest"));
mount("/series", path.join(ROOT, "series"));
mount("/configs", path.join(ROOT, "configs"));
mount("/scripts", path.join(ROOT, "scripts"));
mount("/prompts", path.join(ROOT, "prompts"));

// Explicit 404 for anything else
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ---- start ---------------------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[json] listening on 0.0.0.0:${PORT}`);
  console.log(`[json] root = ${ROOT}`);
});
