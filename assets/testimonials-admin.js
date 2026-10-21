(() => {
  "use strict";

  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const STORAGE_KEY = "voyd.admin.token";
  const FILTERS = ["pending", "approved", "rejected", "all"];

  /* ── helpers ───────────────────────────────────────── */

  const setText = (node, value) => {
    if (node) node.textContent = value;
  };

  const hostOf = (value) => {
    try {
      return new URL(value).hostname.replace(/^www\./, "");
    } catch (err) {
      return "";
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  const stateOf = (entry) => {
    if (entry.status === "rejected") return "rejected";
    if (entry.status === "approved" && entry.published === true) return "published";
    if (entry.status === "approved") return "approved";
    return "pending";
  };

  const stateLabel = (state) =>
    ({ pending: "Pending", approved: "Approved", published: "Published", rejected: "Rejected" }[state] || state);

  const creditPreview = (entry) => {
    switch (entry.attribution) {
      case "name":
        return entry.clientName || "";
      case "business":
        return entry.project || "";
      case "anonymous":
        return "Anonymous";
      case "full":
      default:
        return [entry.clientName, entry.role].filter(Boolean).join(", ");
    }
  };

  const safeUrl = (value) => {
    try {
      const url = new URL(value, window.location.href);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      return url;
    } catch (err) {
      return null;
    }
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  /* ── api ───────────────────────────────────────────── */

  const API = (() => {
    let token = "";

    const headers = (extra) => ({
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      ...extra
    });

    const parse = async (response) => {
      const data = await response.json().catch(() => ({}));
      return { ok: response.ok, status: response.status, data };
    };

    const request = async (path, options = {}) => {
      let response;
      try {
        response = await fetch(path, { ...options, headers: headers(options.headers || {}) });
      } catch (err) {
        throw { status: 0, message: "The request could not be sent. Check your connection and try again." };
      }
      const result = await parse(response);
      if (!result.ok) {
        throw {
          status: result.status,
          code: result.data.error,
          message: result.data.message || "The request was refused.",
          errors: result.data.errors
        };
      }
      return result.data;
    };

    return {
      setToken(value) {
        token = value || "";
      },
      hasToken() {
        return Boolean(token);
      },
      list() {
        return request("/api/entries");
      },
      action(action, id, patch) {
        return request("/api/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch ? { action, id, patch } : { action, id })
        });
      },
      checkEmbed(url) {
        return request(`/api/embed-check?url=${encodeURIComponent(url)}`);
      }
    };
  })();

  /* ── state ─────────────────────────────────────────── */

  const state = {
    entries: [],
    filter: "pending",
    search: "",
    selectedId: null,
    editing: false,
    driver: "none",
    configured: true
  };

  /* ── toast ─────────────────────────────────────────── */

  const toast = (() => {
    const node = qs("#toast");
    let timer = null;
    return (message) => {
      if (!node) return;
      node.textContent = message;
      node.classList.add("is-visible");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => node.classList.remove("is-visible"), 2600);
    };
  })();

  /* ── gate ──────────────────────────────────────────── */

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
        if (label) label.textContent = "Unlock review";
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
      if (label) label.textContent = "Unlock review";
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

  /* ── rendering: list ───────────────────────────────── */

  const visibleEntries = () => {
    const term = state.search.trim().toLowerCase();
    return state.entries.filter((entry) => {
      const matchFilter = state.filter === "all" || stateOf(entry) === state.filter;
      if (!matchFilter) return false;
      if (!term) return true;
      return [entry.clientName, entry.project, entry.testimonial, entry.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    });
  };

  const renderStats = () => {
    const counts = { pending: 0, approved: 0, published: 0, rejected: 0 };
    state.entries.forEach((entry) => {
      const key = stateOf(entry);
      counts[key] += 1;
    });
    setText(qs("#stat-pending"), String(counts.pending));
    setText(qs("#stat-approved"), String(counts.approved));
    setText(qs("#stat-published"), String(counts.published));
    setText(qs("#stat-rejected"), String(counts.rejected));
  };

  const renderList = () => {
    const list = qs("#list");
    const empty = qs("#list-empty");
    const emptyText = qs("#list-empty-text");
    if (!list || !empty) return;

    const entries = visibleEntries();
    list.innerHTML = "";

    if (!entries.length) {
      list.hidden = true;
      empty.hidden = false;
      if (emptyText) {
        emptyText.textContent = state.entries.length
          ? `No submissions match “${state.filter}”${state.search ? ` and “${state.search}”` : ""}.`
          : "No submissions have arrived yet. When someone uses the public form, they show up here as pending.";
      }
      return;
    }

    empty.hidden = true;
    list.hidden = false;

    entries.forEach((entry) => {
      const item = el("button", "adm-item");
      item.type = "button";
      item.dataset.id = entry.id;
      if (entry.id === state.selectedId) item.classList.add("is-active");

      const top = el("div", "adm-item__top");
      top.append(el("span", "adm-item__name", entry.clientName || "Unnamed"));
      const badge = el("span", "adm-badge", stateLabel(stateOf(entry)));
      badge.dataset.state = stateOf(entry);
      top.append(badge);
      item.append(top);

      const meta = el("div", "adm-item__meta");
      meta.append(el("span", null, entry.project || "No project name"));
      meta.append(el("span", null, formatDate(entry.createdAt)));
      if (entry.url) meta.append(el("span", null, hostOf(entry.url)));
      item.append(meta);

      item.append(el("p", "adm-item__excerpt", entry.testimonial || ""));

      item.addEventListener("click", () => select(entry.id));
      list.append(item);
    });
  };

  /* ── rendering: detail ─────────────────────────────── */

  const renderDetail = () => {
    const blank = qs("#detail-blank");
    const body = qs("#detail-body");
    if (!blank || !body) return;

    const entry = state.entries.find((item) => item.id === state.selectedId);
    if (!entry) {
      blank.hidden = false;
      body.hidden = true;
      body.innerHTML = "";
      return;
    }

    blank.hidden = true;
    body.hidden = false;
    body.innerHTML = "";

    const state_ = stateOf(entry);

    /* head */
    const head = el("div", "adm-detail__head");
    const headText = el("div");
    headText.append(el("h2", "adm-detail__title", entry.clientName || "Unnamed"));
    headText.append(el("p", "adm-detail__sub", `${entry.project || "No project name"} · received ${formatDate(entry.createdAt)}`));
    head.append(headText);

    const badges = el("div", "adm-detail__badges");
    const statusBadge = el("span", "adm-badge", stateLabel(state_));
    statusBadge.dataset.state = state_;
    badges.append(statusBadge);
    if (!entry.consent) {
      const consentBadge = el("span", "adm-badge", "No consent");
      consentBadge.dataset.state = "rejected";
      badges.append(consentBadge);
    }
    if (entry.embed === "on") badges.append(el("span", "adm-badge", "Preview on"));
    head.append(badges);
    body.append(head);

    /* testimonial (read + edit) */
    body.append(
      section("Their words", [
        el("blockquote", "adm-quote", entry.testimonial || "(empty)")
      ])
    );

    /* project + work read-only */
    const projectSection = section("The work", []);
    const work = el("p", "adm-readonly", entry.work || "(no description provided)");
    projectSection.append(work);
    if (entry.details) projectSection.append(el("p", "adm-readonly adm-readonly--muted", entry.details));
    body.append(projectSection);

    /* private contact */
    const contact = section("Private details", []);
    const kv = el("dl", "adm-kv");
    const addKV = (key, value, node) => {
      kv.append(el("dt", null, key));
      const dd = el("dd");
      dd.append(node || document.createTextNode(value || "—"));
      kv.append(dd);
    };
    addKV("Email", entry.email);
    addKV("Role", entry.role);
    addKV("Attribution", `${entry.attribution} → “${creditPreview(entry) || "no name shown"}”`);
    addKV("Consent", entry.consent ? `Yes (${formatDate(entry.consentAt)})` : "No");
    addKV("Screenshot permission", entry.allowScreenshot === false ? "Not permitted" : "Permitted");
    addKV("Source", `${(entry.source && entry.source.ua) || "unknown"} · ${(entry.source && entry.source.elapsedMs) || "?"} ms`);
    addKV("Submission id", entry.id);
    contact.append(kv);
    body.append(contact);

    /* website preview + check */
    const site = section("Live website", []);
    if (entry.url) {
      const line = el("p", "adm-readonly");
      const link = el("a", "adm-link", `${hostOf(entry.url)} ↗`);
      link.href = entry.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer nofollow";
      line.append(link, document.createTextNode(`  ${entry.url}`));
      site.append(line);

      const verdict = el("div", "adm-verdict", "Not checked yet.");
      verdict.dataset.state = "";
      site.append(verdict);

      const checkBtn = el("button", "adm-button adm-button--ghost adm-button--small", "Check embeddability");
      checkBtn.type = "button";
      checkBtn.addEventListener("click", async () => {
        verdict.dataset.state = "checking";
        verdict.textContent = "Checking this website…";
        checkBtn.disabled = true;
        try {
          const result = await API.checkEmbed(entry.url);
          verdict.dataset.state = result.blocked ? "blocked" : "ok";
          verdict.textContent = `${result.blocked ? "Blocked" : "Allowed"} — ${result.message || result.reason}${
            result.status ? ` (HTTP ${result.status})` : ""
          }`;
        } catch (err) {
          verdict.dataset.state = "blocked";
          verdict.textContent = err.message || "The check could not be completed.";
        } finally {
          checkBtn.disabled = false;
        }
      });
      site.append(checkBtn);
    } else {
      site.append(el("p", "adm-readonly adm-readonly--muted", "No live address was provided for this submission."));
    }
    body.append(site);

    /* screenshot */
    const shot = section("Hero screenshot", []);
    if (entry.screenshot && entry.screenshot.id) {
      const frame = el("div", "adm-shot");
      const img = el("img");
      img.alt = `Hero screenshot for ${entry.project || entry.clientName || "submission"}`;
      img.src = `/api/image?id=${encodeURIComponent(entry.screenshot.id)}&v=${Date.now()}`;
      frame.append(img);
      shot.append(frame);
    } else {
      shot.append(el("div", "adm-shot__missing", "No screenshot was uploaded with this submission."));
    }
    body.append(shot);

    /* edit form */
    body.append(renderEditor(entry));

    /* actions */
    body.append(renderActions(entry, state_));
  };

  const section = (title, children) => {
    const wrap = el("div", "adm-section");
    wrap.append(el("h3", "adm-section__title", title));
    children.forEach((child) => wrap.append(child));
    return wrap;
  };

  const field = (labelText, control, hint) => {
    const wrap = el("label", "adm-field");
    wrap.append(el("span", "adm-field__label", labelText));
    wrap.append(control);
    if (hint) {
      const note = el("span", "adm-readonly adm-readonly--muted", hint);
      wrap.append(note);
    }
    return wrap;
  };

  /* ── edit form ─────────────────────────────────────── */

  let editor = null;

  const renderEditor = (entry) => {
    const wrap = section("Edit before deciding", []);
    const toggle = el("label", "adm-toggle");
    const toggleInput = document.createElement("input");
    toggleInput.type = "checkbox";
    toggleInput.checked = state.editing;
    toggle.append(toggleInput, document.createTextNode("Edit fields"));
    wrap.append(toggle);

    const panel = el("div", "adm-section");
    panel.hidden = !state.editing;
    wrap.append(panel);

    const build = () => {
      panel.innerHTML = "";
      panel.append(el("h3", "adm-section__title", "Editable fields"));

      const grid = el("div", "adm-grid2");
      const projectInput = document.createElement("input");
      projectInput.type = "text";
      projectInput.value = entry.project || "";
      projectInput.maxLength = 120;
      grid.append(field("Project name", projectInput));

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.value = entry.clientName || "";
      nameInput.maxLength = 80;
      grid.append(field("Client name", nameInput));

      const roleInput = document.createElement("input");
      roleInput.type = "text";
      roleInput.value = entry.role || "";
      roleInput.maxLength = 100;
      grid.append(field("Role", roleInput));

      const attr = document.createElement("select");
      ["full", "name", "business", "anonymous"].forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        if ((entry.attribution || "anonymous") === value) option.selected = true;
        attr.append(option);
      });
      grid.append(field("Attribution", attr));
      panel.append(grid);

      const urlInput = document.createElement("input");
      urlInput.type = "url";
      urlInput.value = entry.url || "";
      urlInput.placeholder = "https://example.com";
      urlInput.maxLength = 500;
      panel.append(field("Live website address", urlInput, "Leave empty if no live site. Only http(s) is accepted."));

      const embed = document.createElement("select");
      ["on", "off"].forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value === "on" ? "Embeddable preview on" : "Do not embed (link only)";
        if ((entry.embed || "off") === value) option.selected = true;
        embed.append(option);
      });
      panel.append(field("Embedded preview", embed));

      const workArea = document.createElement("textarea");
      workArea.value = entry.work || "";
      panel.append(field("Project description", workArea));

      const testArea = document.createElement("textarea");
      testArea.value = entry.testimonial || "";
      panel.append(field("Testimonial", testArea));

      const detailsArea = document.createElement("textarea");
      detailsArea.value = entry.details || "";
      panel.append(field("Extra details", detailsArea));

      const permissions = el("div", "adm-grid2");
      const shotLabel = el("label", "adm-toggle");
      const shotInput = document.createElement("input");
      shotInput.type = "checkbox";
      shotInput.checked = entry.allowScreenshot !== false;
      shotLabel.append(shotInput, document.createTextNode("Allow the screenshot to be published"));
      permissions.append(shotLabel);

      const consentLabel = el("label", "adm-toggle");
      const consentInput = document.createElement("input");
      consentInput.type = "checkbox";
      consentInput.checked = entry.consent === true;
      consentLabel.append(consentInput, document.createTextNode("Client consent on file"));
      permissions.append(consentLabel);
      panel.append(permissions);

      const errorsBox = el("div", "adm-errors");
      errorsBox.hidden = true;
      panel.append(errorsBox);

      const save = el("button", "adm-button adm-button--ink adm-button--small", "Save changes");
      save.type = "button";
      save.addEventListener("click", async () => {
        const patch = {
          project: projectInput.value,
          clientName: nameInput.value,
          role: roleInput.value,
          attribution: attr.value,
          url: urlInput.value.trim(),
          embed: embed.value,
          work: workArea.value,
          testimonial: testArea.value,
          details: detailsArea.value,
          allowScreenshot: shotInput.checked,
          consent: consentInput.checked
        };
        save.disabled = true;
        save.textContent = "Saving…";
        errorsBox.hidden = true;
        errorsBox.innerHTML = "";
        try {
          const result = await API.action("update", entry.id, patch);
          applyEntry(result.entry);
          toast("Changes saved.");
        } catch (err) {
          if (err.errors) {
            errorsBox.hidden = false;
            Object.entries(err.errors).forEach(([key, message]) => errorsBox.append(el("p", null, `${key}: ${message}`)));
          } else {
            errorsBox.hidden = false;
            errorsBox.append(el("p", null, err.message || "The changes could not be saved."));
          }
          toast("Not saved.");
        } finally {
          save.disabled = false;
          save.textContent = "Save changes";
        }
      });
      panel.append(save);
    };

    build();

    toggleInput.addEventListener("change", () => {
      state.editing = toggleInput.checked;
      panel.hidden = !state.editing;
      if (state.editing) build();
    });

    return wrap;
  };

  /* ── actions ───────────────────────────────────────── */

  const renderActions = (entry, state_) => {
    const wrap = el("div", "adm-section");
    wrap.append(el("h3", "adm-section__title", "Decision"));

    const row = el("div", "adm-actions");
    const group = el("div", "adm-actions__group");

    const run = (label, action, confirmText) => {
      if (confirmText && !window.confirm(confirmText)) return;
      return action;
    };

    const button = (text, fn, extra) => {
      const btn = el("button", `adm-button ${extra || "adm-button--ghost"} adm-button--small`, text);
      btn.type = "button";
      btn.addEventListener("click", async () => {
        btn.disabled = true;
        const original = btn.textContent;
        btn.textContent = "Working…";
        try {
          await fn();
        } catch (err) {
          toast(err.message || "The action was refused.");
        } finally {
          btn.disabled = false;
          btn.textContent = original;
        }
      });
      return btn;
    };

    if (state_ === "pending" || state_ === "rejected") {
      group.append(
        button("Approve", async () => {
          const result = await API.action("approve", entry.id);
          applyEntry(result.entry);
          toast("Approved.");
        }, "adm-button--ink")
      );
    }

    if (state_ === "approved") {
      group.append(
        button("Publish", async () => {
          const result = await API.action("publish", entry.id);
          applyEntry(result.entry);
          toast("Published. It is now live on the public page.");
        }, "adm-button--ink")
      );
      group.append(
        button("Unpublish", async () => {
          const result = await API.action("unpublish", entry.id);
          applyEntry(result.entry);
          toast("Unpublished. It is hidden until you publish again.");
        })
      );
    }

    if (state_ === "published") {
      group.append(
        button("Unpublish", async () => {
          const result = await API.action("unpublish", entry.id);
          applyEntry(result.entry);
          toast("Unpublished. It is hidden until you publish again.");
        })
      );
    }

    if (state_ !== "rejected") {
      group.append(
        button("Reject", async () => {
          const result = await API.action("reject", entry.id);
          applyEntry(result.entry);
          toast("Rejected. It cannot be published unless you approve it again.");
        })
      );
    }

    group.append(
      button("Copy public link", async () => {
        const link = new URL("testimonials.html", window.location.href).toString();
        try {
          await navigator.clipboard.writeText(link);
          toast("Public page link copied.");
        } catch (err) {
          window.prompt("Copy this link:", link);
        }
      })
    );

    row.append(group);

    const danger = button(
      "Delete permanently",
      async () => {
        if (!window.confirm("Delete this submission and its screenshot permanently? This cannot be undone.")) return;
        await API.action("delete", entry.id);
        state.entries = state.entries.filter((item) => item.id !== entry.id);
        state.selectedId = null;
        render();
        toast("Deleted.");
      },
      "adm-button--danger"
    );
    danger.classList.add("adm-actions__danger");
    row.append(danger);

    wrap.append(row);
    return wrap;
  };

  /* ── mutations ─────────────────────────────────────── */

  const applyEntry = (updated) => {
    const index = state.entries.findIndex((item) => item.id === updated.id);
    if (index >= 0) state.entries[index] = updated;
    render();
  };

  const select = (id) => {
    state.selectedId = id;
    state.editing = false;
    render();
    const detail = qs("#detail");
    if (detail && window.innerWidth <= 980) detail.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ── data load ─────────────────────────────────────── */

  const load = async (showToastOnError) => {
    const status = qs("#list-status");
    if (status) status.hidden = false;
    if (status) status.textContent = "Loading submissions…";
    try {
      const data = await API.list();
      state.entries = Array.isArray(data.entries) ? data.entries : [];
      state.driver = data.driver || "none";
      state.configured = data.configured !== false;
      if (status) status.hidden = true;
      renderBanner();
      render();
    } catch (err) {
      if (err.status === 401) {
        if (showToastOnError) toast("Session expired. Unlock again.");
        lockOut();
        return;
      }
      if (status) {
        status.hidden = false;
        status.textContent = err.message || "Submissions could not be loaded.";
      }
      if (showToastOnError) toast(err.message || "Could not load submissions.");
    }
  };

  const renderBanner = () => {
    const banner = qs("#driver-banner");
    if (!banner) return;
    if (!state.configured) {
      banner.hidden = false;
      banner.textContent =
        "No storage backend is configured on this deployment, so submissions cannot be stored or reviewed yet. Configure Supabase credentials, then reload.";
    } else if (state.driver === "filesystem") {
      banner.hidden = false;
      banner.textContent =
        "Storage driver: filesystem (local preview). On the deployed site you should switch to the Supabase driver so nothing is lost when an instance recycles.";
    } else {
      banner.hidden = true;
    }
  };

  /* ── wiring ────────────────────────────────────────── */

  const lockOut = () => {
    API.setToken("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
    qs("#app").hidden = true;
    qs("#gate").hidden = false;
    const lock = qs("#lock");
    if (lock) lock.hidden = true;
  };

  const render = () => {
    renderStats();
    renderList();
    renderDetail();
  };

  const initApp = () => {
    qsa(".adm-filter").forEach((button) => {
      button.addEventListener("click", () => {
        state.filter = button.dataset.filter;
        qsa(".adm-filter").forEach((other) => {
          const active = other === button;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-selected", String(active));
        });
        state.selectedId = null;
        render();
      });
    });

    const search = qs("#search");
    search?.addEventListener("input", () => {
      state.search = search.value;
      renderList();
    });

    qs("#refresh")?.addEventListener("click", () => load(true));

    load(false);
  };

  const init = () => {
    initGate(initApp);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
