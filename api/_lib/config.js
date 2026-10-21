"use strict";

const path = require("node:path");

const LIMITS = {
  payload: 5 * 1024 * 1024,
  image: 3 * 1024 * 1024,
  clientName: [2, 80],
  project: [2, 120],
  email: [5, 200],
  role: [0, 100],
  url: [0, 500],
  testimonial: [40, 3000],
  work: [20, 900],
  details: [0, 2000],
  attributionChoice: ["full", "name", "business", "anonymous"],
  embed: ["on", "off"]
};

const EMAIL_RE = /^[^\s@,;:<>()[\]\\]+@[^\s@.,;:<>()\[\]\\]+(?:\.[^\s@.,;:<>()\[\]\\]+)+$/;

const IMAGE_TYPES = {
  "image/png": { ext: "png", magic: [0x89, 0x50, 0x4e, 0x47] },
  "image/jpeg": { ext: "jpg", magic: [0xff, 0xd8, 0xff] },
  "image/webp": { ext: "webp", magic: [0x52, 0x49, 0x46, 0x46], magicAt: 8, tail: [0x57, 0x45, 0x42, 0x50] }
};

function adminToken() {
  const raw = process.env.VOYD_ADMIN_TOKEN;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length >= 16 ? trimmed : null;
}

function supabaseConfig() {
  const url = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const bucket = (process.env.SUPABASE_BUCKET || "voyd-screenshots").trim();
  if (!url || !key) return null;
  return { url, key, bucket };
}

function dataDir() {
  const custom = (process.env.VOYD_DATA_DIR || "").trim();
  if (custom) return path.resolve(custom);
  return path.resolve(process.cwd(), "..", ".voyd-data");
}

function storageDriverName() {
  const explicit = (process.env.VOYD_STORAGE || "").trim().toLowerCase();
  if (explicit === "filesystem" || explicit === "supabase" || explicit === "none") return explicit;
  if (supabaseConfig()) return "supabase";
  if (process.env.VERCEL) return "none";
  return "filesystem";
}

module.exports = { LIMITS, EMAIL_RE, IMAGE_TYPES, adminToken, supabaseConfig, dataDir, storageDriverName };
