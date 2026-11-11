"use strict";

const { json, methodNotAllowed, readBody, requireAdmin, errorToResponse } = require("./_lib/http");
const { getStore, newId } = require("./_lib/store");
const { decodeImage } = require("./_lib/validate");
const { CATEGORIES, validateProject, decorate } = require("./_lib/projects");

const ACTIONS = new Set(["save", "delete", "publish", "unpublish", "upload"]);

function fail(status, code, message) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.publicMessage = message;
  return err;
}

async function handleGet(req, res) {
  const store = getStore();

  // ?all=1 is the editor's view: every draft and every published project.
  const wantsAll = ["1", "true", "all"].includes(String(req.query.all || "").toLowerCase());

  if (!store.configured) {
    // Even with no backend, the admin gate still has to prove the token.
    if (wantsAll) requireAdmin(req);
    return json(res, 200, { driver: "none", categories: CATEGORIES, projects: [] });
  }

  const all = await store.listProjects();
  if (wantsAll) {
    requireAdmin(req);
    return json(res, 200, {
      driver: store.name,
      categories: CATEGORIES,
      projects: all.map((project) => decorate(store, project))
    });
  }

  const projects = all
    .filter((project) => project.status === "published")
    .map((project) => decorate(store, project));
  return json(res, 200, { driver: store.name, categories: CATEGORIES, projects });
}

module.exports = async (req, res) => {
  if (req.method === "GET" || req.method === "HEAD") {
    try {
      return await handleGet(req, res);
    } catch (err) {
      return errorToResponse(res, err);
    }
  }
  if (req.method !== "POST") return methodNotAllowed(res, "GET, POST");

  try {
    requireAdmin(req);
    const store = getStore();
    if (!store.configured) {
      throw fail(
        503,
        "storage_not_configured",
        "No storage backend is configured on this deployment, so projects cannot be saved. Configure Supabase credentials first."
      );
    }

    const body = await readBody(req, 8 * 1024 * 1024);
    const action = body && typeof body.action === "string" ? body.action : "";
    if (!ACTIONS.has(action)) throw fail(400, "unknown_action", "Unknown project action.");

    if (action === "upload") {
      const image = decodeImage(body.image);
      if (image.error) return json(res, 422, { error: "validation_failed", message: image.error });
      const stored = await store.putImage(newId("shot"), image.buffer, image.mime, image.ext);
      const shot = { id: stored.id, mime: stored.mime };
      const url = store.publicImage({ screenshot: shot });
      return json(res, 201, { ok: true, screenshot: { id: stored.id, mime: stored.mime, url } });
    }

    const id = body && typeof body.id === "string" ? body.id.trim() : "";

    if (action === "delete") {
      if (!id) throw fail(400, "missing_id", "A project id is required.");
      const existing = await store.getProject(id);
      if (!existing) throw fail(404, "not_found", "That project no longer exists.");
      await store.removeProject(id);
      const shots = Array.isArray(existing.screenshots) ? existing.screenshots : [];
      await Promise.all(shots.map((shot) => store.removeImage(shot.id).catch(() => undefined)));
      return json(res, 200, { ok: true, deleted: id });
    }

    if (action === "publish" || action === "unpublish") {
      if (!id) throw fail(400, "missing_id", "A project id is required.");
      const existing = await store.getProject(id);
      if (!existing) throw fail(404, "not_found", "That project no longer exists.");
      if (action === "publish" && !existing.title) {
        throw fail(409, "incomplete", "Add a project name before publishing.");
      }
      existing.status = action === "publish" ? "published" : "draft";
      existing.updatedAt = new Date().toISOString();
      await store.putProject(existing);
      return json(res, 200, { ok: true, project: decorate(store, existing) });
    }

    // action === "save"
    const source = body && typeof body.project === "object" && body.project ? body.project : {};
    const result = validateProject(source);
    if (!result.ok) {
      return json(res, 422, {
        error: "validation_failed",
        message: "Some project fields are invalid.",
        errors: result.errors
      });
    }

    const now = new Date().toISOString();
    const existing = id ? await store.getProject(id) : null;
    if (id && !existing) throw fail(404, "not_found", "That project no longer exists.");

    const record = {
      id: existing ? existing.id : newId("prj"),
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
      status: source.status === "published" ? "published" : "draft",
      order: Number.isFinite(Number(source.order)) ? Number(source.order) : existing ? existing.order : 0,
      ...result.value
    };

    // Drop images that the editor removed so uploads do not pile up.
    if (existing) {
      const keep = new Set(record.screenshots.map((shot) => shot.id));
      const old = Array.isArray(existing.screenshots) ? existing.screenshots : [];
      await Promise.all(
        old
          .filter((shot) => !keep.has(shot.id))
          .map((shot) => store.removeImage(shot.id).catch(() => undefined))
      );
    }

    await store.putProject(record);
    return json(res, 200, { ok: true, project: decorate(store, record) });
  } catch (err) {
    return errorToResponse(res, err);
  }
};

module.exports.CATEGORIES = CATEGORIES;
