"use strict";

const { json, methodNotAllowed, readBody, requireAdmin, errorToResponse } = require("./_lib/http");
const { getStore } = require("./_lib/store");
const { str, para, normalizeUrl } = require("./_lib/validate");
const { LIMITS } = require("./_lib/config");

const ACTIONS = new Set(["approve", "reject", "publish", "unpublish", "update", "delete"]);

function fail(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.publicMessage = message;
  return err;
}

function applyUpdate(entry, patch, errors) {
  if (patch.url !== undefined) {
    const url = normalizeUrl(patch.url);
    if (!url.ok) errors.url = url.error;
    else entry.url = url.value;
    if (!entry.url) entry.embed = "off";
  }
  if (patch.embed !== undefined) {
    const embed = String(patch.embed);
    if (embed !== "on" && embed !== "off") errors.embed = "Preview must be 'on' or 'off'.";
    else if (embed === "on" && !entry.url) errors.embed = "Add a live website address before enabling the preview.";
    else entry.embed = embed;
  }
  if (patch.project !== undefined) {
    const value = str(patch.project, 200);
    if (value.length < LIMITS.project[0]) errors.project = "Project name is too short.";
    else entry.project = value;
  }
  if (patch.clientName !== undefined) {
    const value = str(patch.clientName, 140);
    if (value.length < LIMITS.clientName[0]) errors.clientName = "Client name is too short.";
    else entry.clientName = value;
  }
  if (patch.role !== undefined) entry.role = str(patch.role, 140);
  if (patch.attribution !== undefined) {
    const value = str(patch.attribution, 30);
    if (!LIMITS.attributionChoice.includes(value)) errors.attribution = "Unknown attribution choice.";
    else entry.attribution = value;
  }
  if (patch.testimonial !== undefined) {
    const value = para(patch.testimonial, LIMITS.testimonial[1] + 500);
    if (value.length < LIMITS.testimonial[0]) errors.testimonial = `Testimonial must be at least ${LIMITS.testimonial[0]} characters.`;
    else entry.testimonial = value;
  }
  if (patch.work !== undefined) {
    const value = para(patch.work, LIMITS.work[1] + 500);
    if (value.length < LIMITS.work[0]) errors.work = `Project description must be at least ${LIMITS.work[0]} characters.`;
    else entry.work = value;
  }
  if (patch.details !== undefined) {
    const value = para(patch.details, LIMITS.details[1] + 500);
    if (value.length > LIMITS.details[1]) errors.details = "Notes are too long.";
    else entry.details = value;
  }
  if (patch.allowScreenshot !== undefined) entry.allowScreenshot = patch.allowScreenshot !== false;
  if (patch.consent !== undefined) entry.consent = patch.consent === true;
  return entry;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return methodNotAllowed(res, "POST");

  try {
    requireAdmin(req);
    const store = getStore();
    if (!store.configured) {
      throw fail(
        503,
        "storage_not_configured",
        "No storage backend is configured on this deployment, so there is nothing to review. Configure Supabase credentials first."
      );
    }

    const body = await readBody(req, 64 * 1024);
    const action = body && typeof body.action === "string" ? body.action : "";
    const id = body && typeof body.id === "string" ? body.id.trim() : "";
    if (!ACTIONS.has(action)) throw fail(400, "unknown_action", "Unknown administrative action.");
    if (!id || id.length > 60) throw fail(400, "missing_id", "A submission id is required.");

    const entry = await store.get(id);
    if (!entry) throw fail(404, "not_found", "That submission no longer exists.");

    const now = new Date().toISOString();

    if (action === "update") {
      const errors = {};
      const patch = body && typeof body.patch === "object" && body.patch ? body.patch : {};
      applyUpdate(entry, patch, errors);
      if (Object.keys(errors).length) {
        return json(res, 422, { error: "validation_failed", message: "Some edited fields are invalid.", errors });
      }
      entry.updatedAt = now;
      await store.put(entry);
      return json(res, 200, { ok: true, entry });
    }

    if (action === "approve") {
      if (!entry.consent) throw fail(409, "no_consent", "This submission does not include consent to publish, so it cannot be approved.");
      if (!entry.screenshot && !entry.url) throw fail(409, "missing_media", "Add a screenshot or a live website address before approving.");
      entry.status = "approved";
      entry.reviewedAt = now;
      entry.updatedAt = now;
      await store.put(entry);
      return json(res, 200, { ok: true, entry });
    }

    if (action === "reject") {
      entry.status = "rejected";
      entry.published = false;
      entry.publishedAt = null;
      entry.reviewedAt = now;
      entry.updatedAt = now;
      await store.put(entry);
      return json(res, 200, { ok: true, entry });
    }

    if (action === "publish") {
      if (entry.status !== "approved") throw fail(409, "not_approved", "Approve this submission before publishing it.");
      if (!entry.consent) throw fail(409, "no_consent", "Consent is required before publication.");
      if (!entry.screenshot && !entry.url) throw fail(409, "missing_media", "Add a screenshot or a live website address before publishing.");
      entry.published = true;
      entry.publishedAt = entry.publishedAt || now;
      entry.updatedAt = now;
      await store.put(entry);
      return json(res, 200, { ok: true, entry });
    }

    if (action === "unpublish") {
      entry.published = false;
      entry.publishedAt = null;
      entry.updatedAt = now;
      await store.put(entry);
      return json(res, 200, { ok: true, entry });
    }

    if (action === "delete") {
      await store.remove(entry.id);
      if (entry.screenshot && entry.screenshot.id) {
        await store.removeImage(entry.screenshot.id).catch(() => undefined);
      }
      return json(res, 200, { ok: true, deleted: entry.id });
    }

    throw fail(400, "unknown_action", "Unknown administrative action.");
  } catch (err) {
    return errorToResponse(res, err);
  }
};
