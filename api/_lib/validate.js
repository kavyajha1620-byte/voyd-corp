"use strict";

const { LIMITS, EMAIL_RE, IMAGE_TYPES } = require("./config");

function str(value, max = 500) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim().slice(0, max);
}

function para(value, max = 3000) {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim()
    .slice(0, max);
}

function range(label, value, limits, errors) {
  if (value.length < limits[0]) {
    errors[label] = `Must be at least ${limits[0]} characters (${value.length} so far).`;
    return false;
  }
  if (value.length > limits[1]) {
    errors[label] = `Must be ${limits[1]} characters or fewer.`;
    return false;
  }
  return true;
}

function normalizeUrl(raw) {
  const value = str(raw, LIMITS.url[1]);
  if (!value) return { ok: true, value: "" };
  let parsed;
  try {
    parsed = new URL(value);
  } catch (err) {
    return { ok: false, value, error: "Enter a full website address, including https://" };
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { ok: false, value, error: "Only http:// and https:// addresses are supported." };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, value, error: "Remove any username or password from the address." };
  }
  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    return { ok: false, value, error: "That does not look like a valid website address." };
  }
  return { ok: true, value: parsed.toString() };
}

function hasMagic(buffer, spec) {
  const head = spec.magic;
  if (buffer.length < head.length + 4) return false;
  for (let i = 0; i < head.length; i += 1) {
    if (buffer[i] !== head[i]) return false;
  }
  if (spec.magicAt !== undefined) {
    const at = spec.magicAt;
    if (buffer.length < at + 4) return false;
    for (let i = 0; i < spec.tail.length; i += 1) {
      if (buffer[at + i] !== spec.tail[i]) return false;
    }
  }
  return true;
}

function decodeImage(screenshot) {
  if (!screenshot || typeof screenshot !== "object") {
    return { error: "Add a screenshot of the website's hero section." };
  }
  const mime = typeof screenshot.mime === "string" ? screenshot.mime.toLowerCase().trim() : "";
  const spec = IMAGE_TYPES[mime];
  if (!spec) return { error: "Unsupported image type. Use PNG, JPEG, or WebP." };

  let data = typeof screenshot.data === "string" ? screenshot.data : "";
  if (data.startsWith("data:")) {
    const comma = data.indexOf(",");
    data = comma >= 0 ? data.slice(comma + 1) : "";
  }
  if (!data) return { error: "The screenshot could not be read. Please choose the file again." };
  if (!/^[A-Za-z0-9+/=\s]+$/.test(data)) {
    return { error: "The screenshot data is corrupted. Please choose the file again." };
  }

  const buffer = Buffer.from(data.replace(/\s+/g, ""), "base64");
  if (!buffer.length) return { error: "The screenshot could not be read." };
  if (buffer.length > LIMITS.image) {
    return { error: `Screenshot is too large. Maximum size is ${(LIMITS.image / 1024 / 1024).toFixed(1)} MB.` };
  }
  if (!hasMagic(buffer, spec)) {
    return { error: "That file is not a PNG, JPEG, or WebP image." };
  }
  return { buffer, mime, ext: spec.ext };
}

function validateSubmission(input) {
  const errors = {};
  const source = input && typeof input === "object" ? input : {};

  const clientName = str(source.clientName, 120);
  const project = str(source.project, 160);
  const email = str(source.email, 240);
  const role = str(source.role, 140);
  const testimonial = para(source.testimonial, LIMITS.testimonial[1] + 500);
  const work = para(source.work, LIMITS.work[1] + 500);
  const details = para(source.details, LIMITS.details[1] + 500);

  range("clientName", clientName, LIMITS.clientName, errors);
  range("project", project, LIMITS.project, errors);

  if (!email) {
    errors.email = "An email address is required so we can reach you privately. It is never published.";
  } else if (email.length > LIMITS.email[1] || !EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (role.length > LIMITS.role[1]) errors.role = `Must be ${LIMITS.role[1]} characters or fewer.`;

  const urlResult = normalizeUrl(source.url);
  if (!urlResult.ok) errors.url = urlResult.error;

  range("testimonial", testimonial, LIMITS.testimonial, errors);
  range("work", work, LIMITS.work, errors);
  if (details.length > LIMITS.details[1]) errors.details = `Must be ${LIMITS.details[1]} characters or fewer.`;

  const attribution = typeof source.attribution === "string" ? source.attribution.trim() : "";
  if (!LIMITS.attributionChoice.includes(attribution)) {
    errors.attribution = "Choose how you would like to be credited.";
  }

  if (source.consent !== true) {
    errors.consent = "Consent is required before anything can be published. Nothing is published without it.";
  }

  const image = decodeImage(source.screenshot);
  if (image.error) errors.screenshot = image.error;

  const honeypot = str(source.honeypot, 200);
  const startedAt = Number(source.startedAt);
  const elapsed = Number.isFinite(startedAt) && startedAt > 0 ? Date.now() - startedAt : -1;
  const tooFast = elapsed >= 0 && elapsed < 3000;

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    honeypot,
    tooFast,
    hasStartedAt: elapsed >= 0,
    value: {
      clientName,
      project,
      email,
      role: role || "",
      url: urlResult.value || "",
      testimonial,
      work,
      details: details || "",
      attribution,
      consent: source.consent === true,
      image: image.buffer ? image : null
    }
  };
}

module.exports = { str, para, validateSubmission, decodeImage, normalizeUrl };
