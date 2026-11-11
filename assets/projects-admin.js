(() => {
  "use strict";

  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const STORAGE_KEY = "voyd.admin.token";

  const FALLBACK_CATEGORIES = [
    { slug: "website-development", label: "Website Development" },
    { slug: "app-development", label: "App Development" },
    { slug: "ai-automation", label: "AI Automation" },
    { slug: "business-process-automation", label: "Business Process Automation" },
    { slug: "seo", label: "SEO" },
    { slug: "digital-marketing", label: "Digital Marketing" },
    { slug: "social-media-marketing", label: "Social Media Marketing" },
    { slug: "branding-graphic-design", label: "Branding & Graphic Design" },
    { slug: "ui-ux-design", label: "UI/UX Design" },
    { slug: "custom-software-development", label: "Custom Software Development" },
    { slug: "crm-business-management", label: "CRM & Business Management Systems" },
    { slug: "api-development-integrations", label: "API Development & Integrations" }
  ];

  const MAX_SHOTS = 8;
  const MAX_BYTES = 3 * 1024 * 1024;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const splitTech = (value) =>
    String(value || "")
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 12);

  const state = {
    projects: [],
    categories: FALLBACK_CATEGORIES.slice(),
    selectedId: null,
    search: "",
    screenshots: [],
    driver: "none",
    busy: false
  };

  const categoryLabel = (slug) => {
    const match = state.categories.find((category) => category.slug === slug);
    return match ? match.label : slug;
  };

  /* ── api ─────────────────────────────────────────────── */

  const API = (() => {
    let token = "";

    const headers = (extra) => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...extra
    });

    const request = async (path, options = {}) => {
      let response;
      try {
        response = await fetch(path, { ...options, headers: headers(options.headers || {}) });
      } catch (err) {
        throw { status: 0, message: "The request could not be sent. Check your connection and try again." };
      }
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw {
          status: response.status,
          code: data.error,
          message: data.message || "The request was refused.",
          errors: data.errors
        };
      }
      return data;
    };

    return {
      setToken(value) {
        token = value || "";
      },
      hasToken() {
        return Boolean(token);
      },
      token() {
        return token;
      },
      list() {
        return request("/api/projects?all=1");
      },
      post(payload) {
        return request("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      },
      fetchBlob(url) {
        return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      }
    };
  })();

  /* ── toast ───────────────────────────────────────────── */

  const toast = (() => {
    const node = qs("#toast");
    let timer = null;
    return (message) => {
      if (!node) return;
      node.textContent = message;
      node.classList.add("is-visible");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => node.classList.remove("is-visible"), 2800);
    };
  })();

  /* ── gate ────────────────────────────────────────────── */

  const initGate = (onUnlock) => {
    const gate = qs("#gate");
    const app = qs("#app");
    const form = qs("#gate-form");
    const input = qs("#token");
    const remember = qs("#remember");
    const label = qs("#gate-label");
    const error = qs("#gate-error");
    const lock = qs("#lock");

    const showError = (message) => {
      if (!error) return;
      error.hidden = false;
      error.innerHTML = "";
      error.append(el("strong", null, "Access denied"), el("span", null, message));
    };

    const clearError = () => {
      if (error) error.hidden = true;
    };

    const enter = () => {
      clearError();
      gate.hidden = true;
      app.hidden = false;
      if (lock) lock.hidden = false;
    };

    const leave = () => {
      API.setToken("");
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        /* ignore */
      }
      app.hidden = true;
      gate.hidden = false;
      if (lock) lock.hidden = true;
      if (input) {
        input.value = "";
        input.focus();
      }
    };

    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const value = input ? input.value.trim() : "";
      if (value.length < 16) {
        showError("That token looks too short. The admin token is at least 16 characters.");
        return;
      }
      clearError();
      if (label) label.textContent = "Checking…";
      API.setToken(value);
      try {
        await API.list();
      } catch (err) {
        API.setToken("");
        if (label) label.textContent = "Unlock dashboard";
        if (err.status === 503) {
          showError(
            err.message ||
              "Administration is not configured on this deployment. Set VOYD_ADMIN_TOKEN on the server first."
          );
        } else if (err.status === 401) {
          showError("That token was refused. Check it and try again — the server accepts nothing less than an exact match.");
        } else {
          showError(err.message || "The token could not be verified.");
        }
        return;
      }
      if (label) label.textContent = "Unlock dashboard";
      if (remember && remember.checked) {
        try {
          sessionStorage.setItem(STORAGE_KEY, value);
        } catch (err) {
          /* ignore */
        }
      }
      enter();
      onUnlock();
    });

    lock?.addEventListener("click", leave);

    let saved = "";
    try {
      saved = sessionStorage.getItem(STORAGE_KEY) || "";
    } catch (err) {
      saved = "";
    }
    if (saved) {
      API.setToken(saved);
      if (input) input.value = saved;
      if (remember) remember.checked = true;
      enter();
      onUnlock();
    }
  };

  /* ── list ────────────────────────────────────────────── */

  const visibleProjects = () => {
    const term = state.search.trim().toLowerCase();
    if (!term) return state.projects;
    return state.projects.filter((project) =>
      [project.title, categoryLabel(project.category), project.summary, (project.tech || []).join(" ")]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  };

  const statusOf = (project) => (project.status === "published" ? "published" : "draft");

  const renderStats = () => {
    const published = state.projects.filter((project) => statusOf(project) === "published").length;
    const drafts = state.projects.length - published;
    const pub = qs("#stat-published");
    const dr = qs("#stat-drafts");
    if (pub) pub.textContent = String(published);
    if (dr) dr.textContent = String(drafts);
  };

  const renderList = () => {
    const list = qs("#list");
    const empty = qs("#list-empty");
    const status = qs("#list-status");
    if (!list) return;

    const items = visibleProjects();
    list.textContent = "";

    items.forEach((project) => {
      const item = el("li");
      const button = el("button", "adm-item");
      button.type = "button";
      button.dataset.id = project.id;
      if (project.id === state.selectedId) button.classList.add("is-active");

      const top = el("span", "adm-item__top");
      top.append(el("span", "adm-item__name", project.title || "Untitled project"));
      const badge = el("span", "adm-badge", statusOf(project) === "published" ? "Published" : "Draft");
      badge.dataset.state = statusOf(project) === "published" ? "published" : "pending";
      top.append(badge);

      const meta = el("span", "adm-item__meta");
      meta.append(el("span", null, categoryLabel(project.category)));
      meta.append(el("span", null, formatDate(project.updatedAt || project.createdAt)));

      const excerpt = el(
        "span",
        "adm-item__excerpt",
        project.summary || project.description || "No description yet."
      );

      button.append(top, meta, excerpt);
      button.addEventListener("click", () => openEditor(project.id));
      item.append(button);
      list.append(item);
    });

    list.hidden = items.length === 0;
    if (empty) empty.hidden = items.length > 0;
    if (status) {
      if (!state.projects.length) status.textContent = "No projects yet.";
      else status.textContent = `${state.projects.length} project${state.projects.length === 1 ? "" : "s"} across ${state.categories.length} categories.`;
    }
    renderStats();
  };

  /* ── editor ──────────────────────────────────────────── */

  const blankEditor = () => {
    state.selectedId = null;
    state.screenshots = [];
    const form = qs("#editor");
    if (!form) return;
    form.reset();
    qs("#p-id").value = "";
    qs("#p-category").value = state.categories[0] ? state.categories[0].slug : "";
    qs("#p-status").value = "draft";
    qs("#editor-title").textContent = "New project";
    qs("#editor-sub").textContent = "Not saved yet";
    const badge = qs("#editor-badge");
    badge.dataset.state = "pending";
    badge.textContent = "Draft";
    qs("#delete").hidden = true;
    qs("#editor-errors").hidden = true;
    renderThumbs();
  };

  const showEditor = () => {
    const form = qs("#editor");
    const blank = qs("#detail-blank");
    if (blank) blank.hidden = true;
    if (form) form.hidden = false;
    qsa(".adm-item").forEach((item) => item.classList.toggle("is-active", item.dataset.id === state.selectedId));
  };

  const openEditor = (id) => {
    const project = state.projects.find((item) => item.id === id);
    if (!project) return;
    state.selectedId = project.id;
    state.screenshots = (project.screenshots || []).map((shot) => ({
      id: shot.id,
      mime: shot.mime || "",
      url: shot.url || "",
      preview: ""
    }));

    const form = qs("#editor");
    if (!form) return;
    form.reset();
    qs("#p-id").value = project.id;
    qs("#p-category").value = project.category;
    qs("#p-status").value = statusOf(project);
    qs("#p-title").value = project.title || "";
    qs("#p-summary").value = project.summary || "";
    qs("#p-description").value = project.description || "";
    qs("#p-tech").value = (project.tech || []).join(", ");
    qs("#p-url").value = project.liveUrl || "";

    qs("#editor-title").textContent = project.title || "Untitled project";
    qs("#editor-sub").textContent = `Updated ${formatDate(project.updatedAt || project.createdAt)}`;
    const badge = qs("#editor-badge");
    badge.dataset.state = statusOf(project) === "published" ? "published" : "pending";
    badge.textContent = statusOf(project) === "published" ? "Published" : "Draft";
    qs("#delete").hidden = false;
    qs("#editor-errors").hidden = true;
    qs("#p-files").value = "";

    renderThumbs();
    showEditor();
    renderList();
  };

  /* thumbnail previews: uploaded files use a local data URL, saved drafts are
     fetched with the bearer token so private images can still be seen. */

  const renderThumbs = () => {
    const holder = qs("#p-thumbs");
    if (!holder) return;
    holder.textContent = "";

    state.screenshots.forEach((shot, index) => {
      const wrap = el("div", "p-thumb");
      const img = el("img");
      img.alt = "";
      img.loading = "lazy";
      if (shot.preview) img.src = shot.preview;

      const foot = el("div", "p-thumb__foot");
      if (index === 0) foot.append(el("span", "p-thumb__first", "Card"));
      else foot.append(el("span", null, `Shot ${index + 1}`));

      const remove = el("button", "p-thumb__remove", "Remove");
      remove.type = "button";
      remove.addEventListener("click", () => {
        state.screenshots = state.screenshots.filter((item) => item !== shot);
        renderThumbs();
      });
      foot.append(remove);

      wrap.append(img, foot);
      holder.append(wrap);

      if (!shot.preview && shot.url) {
        API.fetchBlob(shot.url)
          .then((response) => {
            if (!response.ok) throw new Error(`status ${response.status}`);
            return response.blob();
          })
          .then((blob) => {
            img.src = URL.createObjectURL(blob);
          })
          .catch(() => {
            if (shot.url) img.src = shot.url;
            else img.alt = "Screenshot preview unavailable";
          });
      }
    });

    holder.hidden = state.screenshots.length === 0;
  };

  const setError = (message, errors) => {
    const box = qs("#editor-errors");
    if (!box) return;
    box.textContent = "";
    if (!message && (!errors || !Object.keys(errors).length)) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    if (message) box.append(el("p", null, message));
    Object.entries(errors || {}).forEach(([field, text]) => {
      box.append(el("p", null, `${field}: ${text}`));
    });
  };

  /* ── uploads ─────────────────────────────────────────── */

  const readFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("read_failed"));
      reader.readAsDataURL(file);
    });

  const uploadStatus = (text) => {
    const node = qs("#p-upload-status");
    if (!node) return;
    node.hidden = !text;
    node.textContent = text || "";
  };

  const handleFiles = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;

    const room = MAX_SHOTS - state.screenshots.length;
    if (room <= 0) {
      toast(`Up to ${MAX_SHOTS} screenshots per project.`);
      return;
    }

    // Only keep formats the server accepts, and never more than the cap.
    const accepted = list
      .filter((file) => ["image/png", "image/jpeg", "image/webp"].includes(file.type))
      .slice(0, room);

    if (!accepted.length) {
      toast("Use a PNG, JPEG, or WebP image.");
      return;
    }
    if (list.length > room) toast(`Only ${room} more screenshot${room === 1 ? "" : "s"} can be added.`);

    const input = qs("#p-files");
    if (input) input.disabled = true;

    let done = 0;
    for (const file of accepted) {
      if (file.size > MAX_BYTES) {
        toast(`${file.name} is larger than 3 MB and was skipped.`);
        continue;
      }
      done += 1;
      uploadStatus(`Uploading ${done} of ${accepted.length}…`);
      try {
        const data = await readFile(file);
        const result = await API.post({
          action: "upload",
          image: { mime: file.type, data }
        });
        state.screenshots.push({
          id: result.screenshot.id,
          mime: result.screenshot.mime,
          url: result.screenshot.url,
          preview: data
        });
        renderThumbs();
      } catch (err) {
        toast(err.message || `${file.name} could not be uploaded.`);
        break;
      }
    }

    uploadStatus("");
    if (input) {
      input.disabled = false;
      input.value = "";
    }
  };

  /* ── save / delete ───────────────────────────────────── */

  const collect = () => {
    const status = qs("#p-status").value === "published" ? "published" : "draft";
    return {
      status,
      project: {
        status,
        category: qs("#p-category").value,
        title: qs("#p-title").value.trim(),
        summary: qs("#p-summary").value.trim(),
        description: qs("#p-description").value.trim(),
        tech: splitTech(qs("#p-tech").value),
        liveUrl: qs("#p-url").value.trim(),
        screenshots: state.screenshots.map((shot) => ({ id: shot.id, mime: shot.mime || undefined }))
      }
    };
  };

  const save = async (event) => {
    if (event) event.preventDefault();
    if (state.busy) return;

    const payload = collect();
    if (!payload.project.title) {
      setError("Give the project a name before saving.", { title: "A project name is required." });
      qs("#p-title").focus();
      return;
    }
    if (!payload.project.category) {
      setError("Choose a service category.", { category: "A category is required." });
      return;
    }

    const id = qs("#p-id").value;
    state.busy = true;
    const button = qs("#save");
    if (button) {
      button.disabled = true;
      button.textContent = "Saving…";
    }
    setError("");

    try {
      const result = await API.post({ action: "save", id: id || undefined, ...payload });
      const saved = result.project;
      const index = state.projects.findIndex((item) => item.id === saved.id);
      if (index >= 0) state.projects[index] = saved;
      else state.projects.unshift(saved);

      state.selectedId = saved.id;
      state.screenshots = (saved.screenshots || []).map((shot) => ({
        id: shot.id,
        mime: shot.mime || "",
        url: shot.url || "",
        preview: ""
      }));
      qs("#p-id").value = saved.id;
      qs("#editor-title").textContent = saved.title;
      qs("#editor-sub").textContent = `Updated ${formatDate(saved.updatedAt)}`;
      const badge = qs("#editor-badge");
      badge.dataset.state = saved.status === "published" ? "published" : "pending";
      badge.textContent = saved.status === "published" ? "Published" : "Draft";
      qs("#delete").hidden = false;
      renderThumbs();
      renderList();
      toast(saved.status === "published" ? "Saved and published." : "Saved as a draft.");
    } catch (err) {
      setError(err.message || "The project could not be saved.", err.errors);
      toast(err.message || "The project could not be saved.");
    } finally {
      state.busy = false;
      if (button) {
        button.disabled = false;
        button.textContent = "Save project";
      }
    }
  };

  const remove = async () => {
    const id = qs("#p-id").value;
    if (!id) return;
    const project = state.projects.find((item) => item.id === id);
    const name = project ? project.title : "this project";
    if (!window.confirm(`Delete “${name}”? Its screenshots are removed too. This cannot be undone.`)) return;

    const button = qs("#delete");
    if (button) button.disabled = true;
    try {
      await API.post({ action: "delete", id });
      state.projects = state.projects.filter((item) => item.id !== id);
      state.selectedId = null;
      state.screenshots = [];
      const form = qs("#editor");
      const blank = qs("#detail-blank");
      if (form) form.hidden = true;
      if (blank) blank.hidden = false;
      renderList();
      toast("Project deleted.");
    } catch (err) {
      toast(err.message || "The project could not be deleted.");
    } finally {
      if (button) button.disabled = false;
    }
  };

  /* ── boot ────────────────────────────────────────────── */

  const fillCategories = () => {
    const select = qs("#p-category");
    if (!select) return;
    select.textContent = "";
    state.categories.forEach((category) => {
      const option = el("option", null, category.label);
      option.value = category.slug;
      select.append(option);
    });
  };

  const showBanner = () => {
    const banner = qs("#driver-banner");
    if (!banner) return;
    if (state.driver === "none") {
      banner.hidden = false;
      banner.textContent =
        "No storage backend is configured on this deployment. You can review the dashboard, but saving or uploading will be refused until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.";
    } else {
      banner.hidden = true;
    }
  };

  const load = async () => {
    const status = qs("#list-status");
    if (status) status.textContent = "Loading projects…";
    try {
      const data = await API.list();
      state.driver = data.driver || "none";
      if (Array.isArray(data.categories) && data.categories.length) state.categories = data.categories;
      state.projects = Array.isArray(data.projects) ? data.projects : [];
      fillCategories();
      showBanner();
      renderList();
      if (state.selectedId) {
        const still = state.projects.find((item) => item.id === state.selectedId);
        if (still) openEditor(still.id);
      }
    } catch (err) {
      if (status) status.textContent = "";
      state.driver = "error";
      const banner = qs("#driver-banner");
      if (banner) {
        banner.hidden = false;
        banner.textContent = err.message || "Projects could not be loaded.";
      }
      renderList();
      if (err.status === 401) toast("The admin token was refused.");
    }
  };

  const init = () => {
    fillCategories();

    initGate(load);

    qs("#editor")?.addEventListener("submit", save);
    qs("#delete")?.addEventListener("click", remove);
    qs("#refresh")?.addEventListener("click", load);

    qs("#new")?.addEventListener("click", () => {
      blankEditor();
      showEditor();
      renderList();
      qs("#p-title").focus();
    });

    qs("#cancel")?.addEventListener("click", () => {
      state.selectedId = null;
      state.screenshots = [];
      const form = qs("#editor");
      const blank = qs("#detail-blank");
      if (form) form.hidden = true;
      if (blank) blank.hidden = false;
      renderList();
    });

    qs("#p-files")?.addEventListener("change", (event) => {
      handleFiles(event.target.files);
    });

    let timer = null;
    qs("#search")?.addEventListener("input", (event) => {
      state.search = event.target.value;
      window.clearTimeout(timer);
      timer = window.setTimeout(renderList, 120);
    });

    // Keep the badge in the editor honest before a save.
    qs("#p-status")?.addEventListener("change", (event) => {
      const badge = qs("#editor-badge");
      if (!badge) return;
      const published = event.target.value === "published";
      badge.dataset.state = published ? "published" : "pending";
      badge.textContent = published ? "Published" : "Draft";
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
