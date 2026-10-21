"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { supabaseConfig, dataDir, storageDriverName } = require("./config");

function newId(prefix) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

function notConfigured() {
  const err = new Error("storage_not_configured");
  err.status = 503;
  err.code = "storage_not_configured";
  err.publicMessage =
    "Submissions are temporarily unavailable because no storage backend is configured on this deployment. Nothing has been saved.";
  return err;
}

function backendFailed(detail) {
  const err = new Error("storage_backend_failed");
  err.status = 502;
  err.code = "storage_backend_failed";
  err.publicMessage = "The storage backend could not complete the request. Nothing has been saved.";
  err.detail = detail;
  return err;
}

/* ── filesystem driver (local preview only) ──────────── */

function createFileSystemStore() {
  const root = dataDir();
  const dbFile = path.join(root, "db.json");
  const uploads = path.join(root, "uploads");
  let queue = Promise.resolve();

  const withLock = (fn) => {
    const run = queue.then(fn, fn);
    queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  };

  async function readAll() {
    try {
      const raw = await fs.readFile(dbFile, "utf8");
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed.entries) ? parsed.entries : [];
    } catch (err) {
      if (err.code === "ENOENT") return [];
      throw backendFailed(String(err && err.message));
    }
  }

  async function writeAll(entries) {
    await fs.mkdir(root, { recursive: true });
    const tmp = `${dbFile}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ version: 1, entries }, null, 2), "utf8");
    await fs.rename(tmp, dbFile);
  }

  return {
    name: "filesystem",
    configured: true,
    async list() {
      const entries = await readAll();
      return entries.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    },
    async get(id) {
      const entries = await readAll();
      return entries.find((entry) => entry.id === id) || null;
    },
    async put(record) {
      return withLock(async () => {
        const entries = await readAll();
        const index = entries.findIndex((entry) => entry.id === record.id);
        if (index >= 0) entries[index] = record;
        else entries.push(record);
        await writeAll(entries);
        return record;
      });
    },
    async remove(id) {
      return withLock(async () => {
        const entries = await readAll();
        const next = entries.filter((entry) => entry.id !== id);
        await writeAll(next);
        return next.length !== entries.length;
      });
    },
    async putImage(id, buffer, mime, ext) {
      await withLock(async () => {
        await fs.mkdir(uploads, { recursive: true });
        await fs.writeFile(path.join(uploads, `${id}.${ext}`), buffer);
      });
      return { id: `${id}.${ext}`, mime };
    },
    async getImage(id) {
      if (!/^[a-z0-9_-]+(\.[a-z0-9]+)?$/i.test(id)) return null;
      const base = id.replace(/\.(png|jpe?g|webp)$/i, "");
      const dir = await fs.readdir(uploads).catch(() => []);
      const match = dir.find((name) => name === `${base}.png` || name === `${base}.jpg` || name === `${base}.webp`);
      if (!match) return null;
      const ext = path.extname(match).slice(1);
      const buffer = await fs.readFile(path.join(uploads, match));
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      return { buffer, mime };
    },
    async removeImage(id) {
      const base = String(id).replace(/\.(png|jpe?g|webp)$/i, "");
      await withLock(async () => {
        const dir = await fs.readdir(uploads).catch(() => []);
        await Promise.all(
          dir
            .filter((name) => name === `${base}.png` || name === `${base}.jpg` || name === `${base}.webp`)
            .map((name) => fs.unlink(path.join(uploads, name)).catch(() => undefined))
        );
      });
      return true;
    },
    publicImage(entry) {
      const shot = entry && entry.screenshot;
      if (!shot || !shot.id) return null;
      const version = entry.updatedAt ? new Date(entry.updatedAt).getTime() : 0;
      return `/api/image?id=${encodeURIComponent(shot.id)}&v=${version}`;
    }
  };
}

/* ── supabase driver (production) ────────────────────── */

function createSupabaseStore(config) {
  const table = (process.env.SUPABASE_TABLE || "testimonials").trim();
  const base = `${config.url}/rest/v1/${table}`;
  const storageBase = `${config.url}/storage/v1/object`;

  const headers = (extra) => ({
    apikey: config.key,
    Authorization: `Bearer ${config.key}`,
    "Content-Type": "application/json",
    ...extra
  });

  async function request(url, options = {}) {
    let response;
    try {
      response = await fetch(url, options);
    } catch (err) {
      throw backendFailed(String(err && err.message));
    }
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw backendFailed(text.slice(0, 300));
    }
    const type = response.headers.get("content-type") || "";
    if (type.includes("application/json")) return response.json();
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (err) {
      return text;
    }
  }

  return {
    name: "supabase",
    configured: true,
    async list() {
      const rows = await request(`${base}?select=*&order=createdAt.desc`, { headers: headers() });
      return Array.isArray(rows) ? rows : [];
    },
    async get(id) {
      const rows = await request(`${base}?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, {
        headers: headers()
      });
      return Array.isArray(rows) && rows.length ? rows[0] : null;
    },
    async put(record) {
      const updated = await request(`${base}?id=eq.${encodeURIComponent(record.id)}`, {
        method: "PATCH",
        headers: headers({ Prefer: "return=representation" }),
        body: JSON.stringify(record)
      });
      if (Array.isArray(updated) && updated.length) return updated[0];
      const inserted = await request(base, {
        method: "POST",
        headers: headers({ Prefer: "return=representation" }),
        body: JSON.stringify(record)
      });
      return Array.isArray(inserted) && inserted.length ? inserted[0] : record;
    },
    async remove(id) {
      await request(`${base}?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: headers() });
      return true;
    },
    async putImage(id, buffer, mime, ext) {
      const object = `${id}.${ext}`;
      await request(`${storageBase}/${config.bucket}/${object}`, {
        method: "POST",
        headers: {
          apikey: config.key,
          Authorization: `Bearer ${config.key}`,
          "Content-Type": mime,
          "x-upsert": "true"
        },
        body: buffer
      });
      return { id: object, mime };
    },
    async getImage(id) {
      if (!/^[a-z0-9_-]+\.(png|jpg|webp)$/i.test(id)) return null;
      let response;
      try {
        response = await fetch(`${storageBase}/${config.bucket}/${id}`, {
          headers: { apikey: config.key, Authorization: `Bearer ${config.key}` }
        });
      } catch (err) {
        throw backendFailed(String(err && err.message));
      }
      if (!response.ok) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      const ext = id.split(".").pop().toLowerCase();
      const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
      return { buffer, mime };
    },
    async removeImage(id) {
      await request(`${storageBase}/${config.bucket}/${id}`, {
        method: "DELETE",
        headers: { apikey: config.key, Authorization: `Bearer ${config.key}` }
      });
      return true;
    },
    publicImage(entry) {
      const shot = entry && entry.screenshot;
      if (!shot || !shot.id) return null;
      if (shot.id.includes("/")) return shot.id;
      return `${config.url}/storage/v1/object/public/${config.bucket}/${shot.id}`;
    }
  };
}

/* ── disabled driver (honest no-op) ──────────────────── */

function createDisabledStore() {
  return {
    name: "none",
    configured: false,
    async list() {
      return [];
    },
    async get() {
      return null;
    },
    async put() {
      throw notConfigured();
    },
    async remove() {
      throw notConfigured();
    },
    async putImage() {
      throw notConfigured();
    },
    async getImage() {
      return null;
    },
    async removeImage() {
      return true;
    },
    publicImage() {
      return null;
    }
  };
}

let cached = null;

function getStore() {
  const driver = storageDriverName();
  if (cached && cached.__driver === driver) return cached;

  let store;
  if (driver === "supabase") {
    const config = supabaseConfig();
    store = config ? createSupabaseStore(config) : createDisabledStore();
  } else if (driver === "filesystem") {
    store = createFileSystemStore();
  } else {
    store = createDisabledStore();
  }
  store.__driver = driver;
  cached = store;
  return store;
}

module.exports = { getStore, newId };
