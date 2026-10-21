(() => {
  "use strict";

  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const MAX_BYTES = 3 * 1024 * 1024;
  const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

  const FRIENDLY = {
    clientName: "Your name",
    project: "Business or project name",
    email: "Email",
    role: "Role",
    url: "Website address",
    testimonial: "Your feedback",
    work: "Description of the work",
    details: "Extra details",
    attribution: "Credit preference",
    consent: "Consent to publish",
    screenshot: "Screenshot"
  };

  /* ── small helpers ─────────────────────────────────── */

  const setText = (node, value) => {
    if (node) node.textContent = value;
  };

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const hostOf = (value) => {
    try {
      return new URL(value).hostname.replace(/^www\./, "");
    } catch (err) {
      return "";
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

  /* ── toast + shared chrome ─────────────────────────── */

  const initToast = () => {
    const toast = qs("#toast");
    let timer = null;
    return (message) => {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("is-visible");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
    };
  };

  const initChrome = () => {
    const intro = qs(".page-intro");
    if (intro) window.setTimeout(() => intro.remove(), 2400);

    const header = qs("#site-header");
    const progress = qs("#scroll-progress-bar");

    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) {
        const value = maxScroll > 0 ? clamp(scrollTop / maxScroll, 0, 1) : 0;
        progress.style.transform = `scaleX(${value})`;
      }
      if (header) header.classList.toggle("is-scrolled", scrollTop > 16);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  };

  const initMobileMenu = () => {
    const toggle = qs("#nav-toggle");
    const menu = qs("#mobile-menu");
    if (!toggle || !menu) return;

    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      menu.classList.toggle("is-open", open);
      menu.inert = !open;
    };

    setOpen(false);
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));

    qsa("a", menu).forEach((link) =>
      link.addEventListener("click", () => setOpen(false))
    );

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("is-open")) setOpen(false);
    });
  };

  const initReveals = () => {
    const items = qsa("[data-reveal]");
    if (!items.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!("IntersectionObserver" in window) || reduced) {
      items.forEach((item) => item.classList.add("in-view"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
    );
    items.forEach((item) => observer.observe(item));
  };

  const initYear = () => setText(qs("#year"), String(new Date().getFullYear()));

  /* ── embed capability probing ──────────────────────── */

  const probeCache = new Map();

  const probePreview = async (url) => {
    if (!url) return { blocked: true, reason: "no_url", message: "" };
    if (probeCache.has(url)) return probeCache.get(url);

    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 9000);
    let verdict;
    try {
      const response = await fetch(`/api/embed-check?url=${encodeURIComponent(url)}`, {
        signal: controller.signal,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`status ${response.status}`);
      verdict = await response.json();
    } catch (err) {
      verdict = {
        blocked: true,
        reason: "check_failed",
        message: "We could not verify whether this site allows embedding, so the live preview has been replaced with a direct link."
      };
    } finally {
      window.clearTimeout(timer);
    }
    probeCache.set(url, verdict);
    return verdict;
  };

  /* ── viewer dialog ─────────────────────────────────── */

  const initViewer = () => {
    const viewer = qs("#viewer");
    if (!viewer) return null;

    const tag = qs("#viewer-tag");
    const title = qs("#viewer-title");
    const urlLine = qs("#viewer-url");
    const stage = qs("#viewer-stage");
    const message = qs("#viewer-message");
    const wrap = qs("#viewer-frame-wrap");
    const frame = qs("#viewer-frame");
    const note = qs("#viewer-note");
    const external = qs("#viewer-external");
    const close = qs("#viewer-close");
    let currentUrl = "";

    const clampFrame = () => {
      const width = clamp(stage.clientWidth, 320, 1600);
      frame.style.width = `${width}px`;
      frame.style.transformOrigin = "0 0";
      frame.style.transform = `scale(${stage.clientWidth / width})`;
      frame.style.height = `${stage.clientHeight / (stage.clientWidth / width)}px`;
    };

    const open = ({ url, label }) => {
      currentUrl = url || "";
      setText(tag, label || "Live website");
      setText(title, hostOf(currentUrl) || "Website");
      setText(urlLine, currentUrl || "No address provided");
      if (external) external.disabled = !currentUrl;

      setText(stage.dataset.state || "", "");
      wrap.hidden = true;
      message.hidden = false;
      setText(message, "Loading the live website…");
      if (note) note.textContent = "";

      if (typeof viewer.showModal === "function") viewer.showModal();
      else viewer.setAttribute("open", "");

      if (currentUrl) {
        frame.src = currentUrl;
        window.requestAnimationFrame(() => {
          clampFrame();
          window.setTimeout(clampFrame, 350);
        });
        setText(message, "");
        message.hidden = true;
        wrap.hidden = false;
        if (note) {
          note.textContent =
            "This frame loads the client's website directly from their own server. If it stays blank, their site blocks embedding — use “Open in new tab”.";
        }
      }
    };

    const closeViewer = () => {
      frame.removeAttribute("src");
      wrap.hidden = true;
      if (typeof viewer.close === "function" && viewer.open) viewer.close();
      else viewer.removeAttribute("open");
    };

    close?.addEventListener("click", closeViewer);
    viewer.addEventListener("close", () => {
      frame.removeAttribute("src");
      wrap.hidden = true;
    });
    viewer.addEventListener("click", (event) => {
      if (event.target === viewer) closeViewer();
    });
    external?.addEventListener("click", () => {
      if (currentUrl) window.open(currentUrl, "_blank", "noopener,noreferrer");
    });
    window.addEventListener("resize", () => {
      if (viewer.open) clampFrame();
    });

    return { open, close: closeViewer, clampFrame };
  };

  /* ── entries rendering ─────────────────────────────── */

  const createBadge = (state, text) => {
    const badge = document.createElement("span");
    badge.className = "tst-entry__badge";
    badge.dataset.state = state;
    badge.textContent = text;
    return badge;
  };

  const renderEntry = (entry, index, viewer, openForm) => {
    const article = document.createElement("article");
    article.className = "tst-entry";
    article.dataset.reveal = "";

    /* left: the quote */
    const quote = document.createElement("div");
    quote.className = "tst-entry__quote";

    const top = document.createElement("div");
    top.className = "tst-entry__index";
    const indexLabel = document.createElement("span");
    indexLabel.textContent = `Entry ${String(index + 1).padStart(2, "0")}`;
    top.append(indexLabel);

    const hasUrl = Boolean(entry.url);
    const badge = createBadge(hasUrl ? (entry.embed === "on" ? "preview" : "link") : "fallback",
      hasUrl ? (entry.embed === "on" ? "Live preview available" : "Linked, not embeddable") : "Website not shared");
    top.append(badge);
    quote.append(top);

    const mark = document.createElement("p");
    mark.className = "tst-entry__mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = "\u201C";
    quote.append(mark);

    const text = document.createElement("blockquote");
    text.className = "tst-entry__text";
    text.textContent = entry.testimonial;
    quote.append(text);

    if (entry.details) {
      const details = document.createElement("p");
      details.className = "tst-entry__details";
      details.textContent = entry.details;
      quote.append(details);
    }

    const foot = document.createElement("div");
    foot.className = "tst-entry__foot";

    const credit = document.createElement("div");
    const nameLine = document.createElement("span");
    nameLine.className = "tst-credit__name";
    nameLine.textContent = entry.credit || "Anonymous client";
    credit.append(nameLine);

    if (entry.project) {
      const projectLine = document.createElement("span");
      projectLine.className = "tst-credit__project";
      projectLine.textContent = entry.project;
      credit.append(projectLine);
    }

    if (entry.year) {
      const dateLine = document.createElement("span");
      dateLine.className = "tst-credit__date";
      dateLine.textContent = `Published ${entry.year}`;
      credit.append(dateLine);
    }
    foot.append(credit);

    const quoteActions = document.createElement("div");
    quoteActions.className = "tst-preview__actions";
    if (entry.url) {
      const link = document.createElement("a");
      link.className = "text-button";
      link.href = entry.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer nofollow";
      link.textContent = "Visit live website ↗";
      quoteActions.append(link);
    }
    foot.append(quoteActions);
    quote.append(foot);
    article.append(quote);

    /* right: the website */
    const preview = document.createElement("div");
    preview.className = "tst-preview";

    const bar = document.createElement("div");
    bar.className = "tst-preview__top";
    const dots = document.createElement("span");
    dots.className = "tst-preview__dots";
    dots.setAttribute("aria-hidden", "true");
    dots.append(document.createElement("span"), document.createElement("span"), document.createElement("span"));
    bar.append(dots);
    const barLabel = document.createElement("span");
    barLabel.textContent = `Website — ${entry.project || "client site"}`;
    bar.append(barLabel);
    if (hasUrl) {
      const host = document.createElement("span");
      host.className = "tst-preview__host";
      host.textContent = hostOf(entry.url);
      bar.append(host);
    }
    preview.append(bar);

    const screen = document.createElement("div");
    screen.className = "tst-screen";

    if (entry.screenshot) {
      const img = document.createElement("img");
      img.className = "tst-screen__img";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = entry.screenshot;
      img.alt = `Hero section of the ${entry.project || "client"} website`;
      screen.append(img);
    }

    const veil = document.createElement("div");
    veil.className = "tst-screen__veil";
    const spinner = document.createElement("span");
    spinner.className = "tst-screen__spinner";
    spinner.setAttribute("aria-hidden", "true");
    const veilText = document.createElement("p");
    veilText.className = "tst-screen__message";
    veilText.textContent = "Ready to load the real website.";
    veil.append(spinner, veilText);
    screen.append(veil);
    preview.append(screen);

    const previewFoot = document.createElement("div");
    previewFoot.className = "tst-preview__foot";
    const verdict = document.createElement("span");
    verdict.className = "tst-preview__verdict";
    verdict.textContent = hasUrl ? "Checking whether this site can be embedded…" : "No live address was shared for this project.";
    previewFoot.append(verdict);

    const actions = document.createElement("div");
    actions.className = "tst-preview__actions";

    if (hasUrl) {
      const explore = document.createElement("button");
      explore.className = "tst-explore";
      explore.type = "button";
      explore.innerHTML = 'Explore full website <span aria-hidden="true">↗</span>';
      explore.addEventListener("click", () => {
        const ok = safeUrl(entry.url);
        if (!ok) {
          window.open(entry.url, "_blank", "noopener,noreferrer");
          return;
        }
        viewer?.open({ url: entry.url, label: `Live preview — ${entry.project || hostOf(entry.url)}` });
      });
      actions.append(explore);

      const openNew = document.createElement("a");
      openNew.className = "text-button";
      openNew.href = entry.url;
      openNew.target = "_blank";
      openNew.rel = "noopener noreferrer nofollow";
      openNew.textContent = "Open separately ↗";
      actions.append(openNew);
    } else {
      const cta = document.createElement("button");
      cta.className = "text-button";
      cta.type = "button";
      cta.textContent = "Add your project instead →";
      cta.addEventListener("click", openForm);
      actions.append(cta);
    }
    previewFoot.append(actions);
    preview.append(previewFoot);

    const fallback = document.createElement("p");
    fallback.className = "tst-fallback";
    fallback.hidden = true;
    preview.append(fallback);

    article.append(preview);

    /* capability check, lazy */
    if (hasUrl && entry.embed === "on") {
      const check = async () => {
        const result = await probePreview(entry.url);
        if (result.blocked) {
          badge.dataset.state = "fallback";
          badge.textContent = "Embedding not permitted";
          veil.hidden = true;
          verdict.textContent = "Live preview unavailable here.";
          fallback.hidden = false;
          fallback.textContent =
            result.message ||
            "This website does not allow being embedded in another page. Use the link to view the real site.";
          return;
        }
        verdict.textContent = "This site allows embedding. Explore it right here.";
      };
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((item) => {
              if (!item.isIntersecting) return;
              observer.disconnect();
              check();
            });
          },
          { rootMargin: "260px" }
        );
        observer.observe(article);
      } else {
        check();
      }
    } else if (hasUrl) {
      badge.dataset.state = "link";
      badge.textContent = "Live preview turned off";
      veil.hidden = true;
      verdict.textContent = "The embedded preview is turned off for this entry, so the site is linked directly.";
    } else {
      badge.dataset.state = "fallback";
      badge.textContent = "No live address";
      veil.hidden = true;
      verdict.textContent = "No live website address was shared for this project.";
      fallback.hidden = false;
      fallback.textContent = "Screenshot shown with the client's permission. There is no live site to open for this entry.";
    }

    return article;
  };

  const initEntries = (viewer, openForm) => {
    const list = qs("#tst-list");
    const status = qs("#tst-status");
    const empty = qs("#tst-empty");
    const count = qs("#tst-count");
    if (!list || !status || !empty) return;

    const show = (entries) => {
      status.hidden = true;
      setText(count, String(entries.length));

      if (!entries.length) {
        empty.hidden = false;
        return;
      }

      const fragment = document.createDocumentFragment();
      entries.forEach((entry, index) => fragment.append(renderEntry(entry, index, viewer, openForm)));
      list.append(fragment);
      list.hidden = false;

      if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        qsa("[data-reveal]", list).forEach((item) => item.classList.add("in-view"));
        return;
      }
      const observer = new IntersectionObserver(
        (items) => {
          items.forEach((item) => {
            if (!item.isIntersecting) return;
            item.target.classList.add("in-view");
            observer.unobserve(item.target);
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      qsa("[data-reveal]", list).forEach((item) => observer.observe(item));
    };

    fetch("/api/entries", { headers: { Accept: "application/json" } })
      .then((response) => {
        if (!response.ok) throw new Error(`status ${response.status}`);
        return response.json();
      })
      .then((data) => show(Array.isArray(data.entries) ? data.entries : []))
      .catch(() => {
        status.hidden = true;
        setText(count, "0");
        empty.hidden = false;
        const body = qs(".tst-empty__body", empty);
        if (body) {
          body.textContent =
            "We could not load published entries just now. Nothing is wrong with the page itself — please refresh, or use the form below to share your own experience.";
        }
      });
  };

  /* ── screenshot handling ───────────────────────────── */

  const initUpload = () => {
    const input = qs("#screenshot");
    const drop = qs("#drop-zone");
    const preview = qs("#screenshot-preview");
    const img = qs("#screenshot-img");
    const meta = qs("#screenshot-meta");
    const remove = qs("#screenshot-remove");
    const error = qs("#error-screenshot");
    if (!input || !drop) return { current: () => null };

    let current = null;
    let objectUrl = null;

    const clearError = () => {
      if (!error) return;
      error.hidden = true;
      error.textContent = "";
    };

    const showError = (message) => {
      if (!error) return;
      error.hidden = false;
      error.textContent = message;
    };

    const reset = () => {
      current = null;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      input.value = "";
      if (preview) preview.hidden = true;
      if (drop) drop.hidden = false;
      clearError();
    };

    const accept = (file) => {
      clearError();
      if (!file) return;
      if (!ACCEPTED.includes(file.type)) {
        reset();
        showError("That file type is not supported. Use PNG, JPEG, or WebP.");
        return;
      }
      if (file.size > MAX_BYTES) {
        reset();
        showError(`That image is ${formatBytes(file.size)}. The maximum is 3 MB — try a smaller export.`);
        return;
      }
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(file);
      current = file;
      if (img) {
        img.src = objectUrl;
        img.alt = `Preview of ${file.name}`;
      }
      if (meta) meta.textContent = `${file.name} — ${formatBytes(file.size)}`;
      if (preview) preview.hidden = false;
      if (drop) drop.hidden = true;
    };

    input.addEventListener("change", () => accept(input.files && input.files[0]));

    ["dragenter", "dragover"].forEach((type) =>
      drop.addEventListener(type, (event) => {
        event.preventDefault();
        drop.classList.add("is-over");
      })
    );
    ["dragleave", "drop"].forEach((type) =>
      drop.addEventListener(type, (event) => {
        event.preventDefault();
        drop.classList.remove("is-over");
      })
    );
    drop.addEventListener("drop", (event) => {
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) accept(file);
    });

    remove?.addEventListener("click", () => {
      reset();
      input.click();
    });

    return {
      current: () => current,
      reset,
      showError,
      clearError
    };
  };

  /* ── form ──────────────────────────────────────────── */

  const initForm = (upload, showToast) => {
    const form = qs("#tst-form");
    if (!form) return { open: () => {} };

    const state = qs("#form-state");
    const errorBox = qs("#form-error");
    const errorList = qs("#form-error-list");
    const success = qs("#form-success");
    const successBody = qs("#success-body");
    const successRef = qs("#success-ref");
    const submitButton = qs("#submit-button");
    const submitLabel = qs("#submit-label");
    const testimonial = qs("#testimonial");
    const counter = qs("#testimonial-count");
    const section = qs("#share");
    const startedAt = Date.now();
    let submitting = false;

    const setState = (label, key) => {
      if (!state) return;
      state.textContent = label;
      state.dataset.state = key || "";
    };

    if (testimonial && counter) {
      const sync = () => setText(counter, String(testimonial.value.length));
      testimonial.addEventListener("input", sync);
      sync();
    }

    const clearFieldErrors = () => {
      qsa("[aria-invalid]", form).forEach((node) => node.removeAttribute("aria-invalid"));
      qsa(".tst-error[data-field]", form).forEach((node) => node.remove());
      if (errorBox) errorBox.hidden = true;
      if (errorList) errorList.innerHTML = "";
    };

    const markField = (field, message) => {
      const control =
        qs(`[name="${field}"]`, form) ||
        (field === "screenshot" ? qs("#screenshot") : null) ||
        (field === "attribution" ? qs(".tst-choices", form) : null) ||
        (field === "consent" ? qs(".tst-consents", form) : null);
      if (control) control.setAttribute("aria-invalid", "true");

      if (field === "screenshot") {
        upload.showError(message);
        return;
      }
      const anchor = control || form;
      const note = document.createElement("p");
      note.className = "tst-error";
      note.dataset.field = field;
      note.textContent = message;
      anchor.parentNode.insertBefore(note, anchor.nextSibling);
    };

    const clientValidate = () => {
      clearFieldErrors();
      const errors = {};
      const value = (name) => {
        const node = qs(`[name="${name}"]`, form);
        return node ? node.value.trim() : "";
      };

      if (value("clientName").length < 2) errors.clientName = "Please add your name.";
      if (value("project").length < 2) errors.project = "Please add the business or project name.";

      const email = value("email");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";

      const url = value("url");
      if (url) {
        try {
          const parsed = new URL(url);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("protocol");
        } catch (err) {
          errors.url = "Enter a full address including https://";
        }
      }

      if (value("work").length < 20) errors.work = "Please describe the work in at least 20 characters.";
      if (value("testimonial").length < 40) errors.testimonial = "Please write at least 40 characters of honest feedback.";

      const attribution = qs('input[name="attribution"]:checked', form);
      if (!attribution) errors.attribution = "Choose how you would like to be credited.";

      if (!qs("#consent", form)?.checked) errors.consent = "Consent is required before anything can be published.";
      if (!qs("#embed-consent", form)?.checked) errors.consent = "Please confirm you are allowed to share this website.";

      if (!upload.current()) errors.screenshot = "Add a screenshot of the website's hero section.";

      return errors;
    };

    const toBase64 = (file) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || "");
          const comma = result.indexOf(",");
          resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = () => reject(new Error("Could not read the file."));
        reader.readAsDataURL(file);
      });

    const focusFirstError = (errors) => {
      const order = ["clientName", "project", "email", "url", "work", "testimonial", "screenshot", "attribution", "consent"];
      const first = order.find((field) => errors[field]);
      if (!first) return;
      const node = qs(`[name="${first}"]`, form) || qs(`#${first}`, form) || qs(".tst-consents", form);
      node?.focus?.();
      node?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitting) return;

      const errors = clientValidate();
      if (Object.keys(errors).length) {
        Object.entries(errors).forEach(([field, message]) => markField(field, message));
        setState("Needs attention", "error");
        showToast("Please fix the highlighted fields.");
        focusFirstError(errors);
        return;
      }

      submitting = true;
      setState("Sending…", "loading");
      submitButton?.setAttribute("disabled", "");
      if (submitLabel) submitLabel.textContent = "Sending…";
      if (success) success.hidden = true;

      try {
        const file = upload.current();
        const payload = {
          clientName: qs("#clientName").value,
          project: qs("#project").value,
          email: qs("#email").value,
          role: qs("#role").value,
          url: qs("#url").value,
          work: qs("#work").value,
          details: qs("#details").value,
          testimonial: qs("#testimonial").value,
          attribution: qs('input[name="attribution"]:checked', form)?.value || "",
          consent: Boolean(qs("#consent", form)?.checked && qs("#embed-consent", form)?.checked),
          honeypot: qs("#website-url", form)?.value || "",
          startedAt,
          screenshot: { mime: file.type, data: await toBase64(file), name: file.name }
        };

        const response = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          if (data.errors) {
            Object.entries(data.errors).forEach(([field, message]) => markField(field, message));
            if (errorBox) {
              errorBox.hidden = false;
              errorList.innerHTML = "";
              Object.values(data.errors).forEach((message) => {
                const li = document.createElement("li");
                li.textContent = message;
                errorList.append(li);
              });
            }
            focusFirstError(data.errors);
          } else if (errorBox) {
            errorBox.hidden = false;
            errorList.innerHTML = "";
            const li = document.createElement("li");
            li.textContent = data.message || "The submission could not be saved.";
            errorList.append(li);
          }
          setState("Not saved", "error");
          showToast(data.message || "Nothing was saved. Please try again.");
          return;
        }

        form.reset();
        upload.reset();
        if (counter) setText(counter, "0");
        if (success) success.hidden = false;
        setText(successRef, data.reference || "—");
        if (successBody) {
          successBody.textContent =
            data.message || "Received. Your entry is pending review and stays private until it is approved.";
        }
        setState("Received", "success");
        showToast("Received. It stays private until reviewed.");
        success?.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch (err) {
        if (errorBox) {
          errorBox.hidden = false;
          errorList.innerHTML = "";
          const li = document.createElement("li");
          li.textContent = "The request could not be sent. Nothing was saved — please check your connection and try again.";
          errorList.append(li);
        }
        setState("Not saved", "error");
        showToast("Nothing was saved. Please try again.");
      } finally {
        submitting = false;
        submitButton?.removeAttribute("disabled");
        if (submitLabel) submitLabel.textContent = "Submit for review";
      }
    });

    const open = () => {
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        if (success && !success.hidden) return;
        qs("#clientName", form)?.focus({ preventScroll: true });
      }, 600);
    };

    qsa("[data-open-form]").forEach((button) => button.addEventListener("click", open));

    return { open };
  };

  /* ── boot ──────────────────────────────────────────── */

  const init = () => {
    const showToast = initToast();
    initChrome();
    initMobileMenu();
    initReveals();
    initYear();

    const upload = initUpload();
    const viewer = initViewer();
    const formApi = initForm(upload, showToast);

    initEntries(viewer, () => formApi.open());

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && qs("#viewer")?.open) viewer?.close();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
