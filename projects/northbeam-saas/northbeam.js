(function () {
  "use strict";

  var plans = [
    { id: "starter", name: "Starter", monthly: 0, desc: "For side projects and small teams finding their footing.", feats: ["Up to 3 services", "7-day deploy history", "Slack alerts", "Community support"], cta: "Start free", featured: false },
    { id: "team", name: "Team", monthly: 49, desc: "For teams shipping every day and needing answers fast.", feats: ["Unlimited services", "90-day history", "Risk scoring", "Slack + PagerDuty", "Priority support"], cta: "Start 14-day trial", featured: true },
    { id: "scale", name: "Scale", monthly: 149, desc: "For platform teams with compliance and audit needs.", feats: ["Everything in Team", "Unlimited history", "SSO / SAML", "Audit log", "Dedicated support"], cta: "Talk to us (demo)", featured: false }
  ];

  var faqs = [
    { q: "How does Northbeam decide what's risky?", a: "It compares each deploy against your own historical change patterns, then surfaces the ones that resemble past incidents. It learns from your history, not a generic public model." },
    { q: "How long does setup take?", a: "In this concept, sign-up is a single form. In a real product, connecting a repo and a monitoring source would be an OAuth handshake and a couple of config values." },
    { q: "Do you replace our monitoring?", a: "No. Northbeam sits alongside Datadog, Grafana, or whatever you already run, and connects deploys to the signals those tools already emit." },
    { q: "Is this real software?", a: "No. Northbeam is a self-initiated concept project by VOYD CORP. The interface is fully built, but there is no backend and no accounts are created." }
  ];

  var plansBox = document.getElementById("plans");
  var annual = false;

  function renderPlans() {
    plansBox.innerHTML = "";
    plans.forEach(function (p) {
      var price = annual ? Math.round(p.monthly * 0.8) : p.monthly;
      var unit = p.monthly === 0 ? "forever" : "/mo";
      var el = document.createElement("article");
      el.className = "plan" + (p.featured ? " plan--feature" : "");
      el.innerHTML =
        (p.featured ? '<span class="plan__badge">Most popular</span>' : "") +
        "<h3>" + p.name + "</h3>" +
        '<div class="plan__price">$' + price + " <span>" + unit + (annual && p.monthly ? ", billed annually" : "") + "</span></div>" +
        '<p class="plan__desc">' + p.desc + "</p>" +
        "<ul>" + p.feats.map(function (f) { return "<li>" + f + "</li>"; }).join("") + "</ul>" +
        '<button class="btn' + (p.featured ? "" : " btn--ghost") + '" type="button" data-plan="' + p.name + '">' + p.cta + "</button>";
      plansBox.appendChild(el);
    });
  }

  document.getElementById("bill-m").addEventListener("click", function () {
    annual = false;
    this.classList.add("is-active"); this.setAttribute("aria-pressed", "true");
    var y = document.getElementById("bill-y"); y.classList.remove("is-active"); y.setAttribute("aria-pressed", "false");
    renderPlans();
  });
  document.getElementById("bill-y").addEventListener("click", function () {
    annual = true;
    this.classList.add("is-active"); this.setAttribute("aria-pressed", "true");
    var m = document.getElementById("bill-m"); m.classList.remove("is-active"); m.setAttribute("aria-pressed", "false");
    renderPlans();
  });

  var faqBox = document.getElementById("faq-list");
  faqs.forEach(function (f) {
    var d = document.createElement("details");
    d.innerHTML = "<summary>" + f.q + "</summary><p>" + f.a + "</p>";
    faqBox.appendChild(d);
  });

  var signup = document.getElementById("signup");
  function openSignup() { signup.showModal(); }
  document.getElementById("signup-open").addEventListener("click", openSignup);
  document.getElementById("signup-open-2").addEventListener("click", openSignup);
  document.getElementById("su-close").addEventListener("click", function () { signup.close(); });

  plansBox.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-plan]");
    if (!btn) return;
    openSignup();
  });

  window.VOYD.bindForm(document.getElementById("su-form"), {
    successMessage: "Demo workspace would be created here. This is a concept — no account exists and no email was sent.",
    errorMessage: "Please complete the highlighted fields to continue."
  });

  renderPlans();
})();
