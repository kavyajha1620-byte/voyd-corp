(() => {
  "use strict";

  /*
   * Portfolio tabs + navigation.
   *
   * Two primary categories only: Web Development and App Development.
   * The tab panels are already in the HTML, so the section still reads without
   * JavaScript; this file only adds switching, keyboard support and the
   * Portfolio dropdown in the header.
   */

  const qs = (selector, context = document) => context.querySelector(selector);
  const qsa = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const initPortfolio = () => {
    const tabs = qsa("[data-portfolio-tab]");
    const panels = qsa(".portfolio-panel");
    if (!tabs.length || !panels.length) return;

    const activate = (name, { focus = false } = {}) => {
      tabs.forEach((tab) => {
        const active = tab.getAttribute("data-portfolio-tab") === name;
        tab.classList.toggle("is-active", active);
        tab.setAttribute("aria-selected", String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) tab.focus();
      });

      panels.forEach((panel) => {
        const active = panel.id === `portfolio-${name}`;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });
    };

    panels.forEach((panel) => {
      panel.hidden = !panel.classList.contains("is-active");
    });

    const currentIndex = () =>
      Math.max(
        0,
        tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true")
      );

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        activate(tab.getAttribute("data-portfolio-tab"));
      });

      tab.addEventListener("keydown", (event) => {
        let next = null;
        if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        activate(tabs[next].getAttribute("data-portfolio-tab"), { focus: true });
      });
    });

    // Deep links such as #work from the services section should land on the
    // category the visitor asked for.
    qsa("[data-portfolio-target]").forEach((link) => {
      link.addEventListener("click", () => {
        const target = link.getAttribute("data-portfolio-target");
        if (target) activate(target);
      });
    });

    // Keep arrow keys meaningful even if focus sits on a panel.
    const activeTab = () => tabs[currentIndex()];
    qsa(".portfolio-panel").forEach((panel) => {
      panel.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        const trigger = activeTab();
        if (trigger) trigger.focus();
      });
    });
  };

  const initPortfolioDropdown = () => {
    const dropdown = qs(".nav-dropdown");
    if (!dropdown) return;

    const trigger = qs("[aria-haspopup]", dropdown);
    const menu = qs(".nav-dropdown__menu", dropdown);
    if (!trigger || !menu) return;

    if (!menu.id) menu.id = "nav-portfolio-menu";
    trigger.setAttribute("aria-controls", menu.id);

    const setOpen = (open) => {
      dropdown.classList.toggle("is-open", open);
      trigger.setAttribute("aria-expanded", String(open));
    };

    setOpen(false);

    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      setOpen(trigger.getAttribute("aria-expanded") !== "true");
    });

    dropdown.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (trigger.getAttribute("aria-expanded") !== "true") return;
      setOpen(false);
      trigger.focus();
    });

    dropdown.addEventListener("focusout", (event) => {
      if (!dropdown.contains(event.relatedTarget)) setOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (dropdown.contains(event.target)) return;
      setOpen(false);
    });

    qsa("a", menu).forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });
  };

  initPortfolio();
  initPortfolioDropdown();
})();
