(function () {
  "use strict";

  var projects = [
    { id: "oakfield", room: "living", name: "Oakfield Terrace", sub: "A dark Victorian front room opened up to the garden", desc: "A cramped, north-facing front room was reworked around a taller window and a low, continuous joinery wall. Storage was moved out of the sightline so the room reads calm when you walk in.", meta: { Type: "Living room", Scope: "Full design", Duration: "14 weeks", Location: "Concept — Oakfield" }, feats: ["Bespoke low joinery", "Rebalanced lighting", "New sightline to garden", "Warm mineral palette"] },
    { id: "rowan", room: "kitchen", name: "Rowan Kitchen", sub: "A galley kitchen made sociable without an extension", desc: "Instead of extending, the galley was made to work harder: a tall pantry column, an island on castors, and a bench that doubles as a spot to eat.", meta: { Type: "Kitchen", Scope: "Full design", Duration: "11 weeks", Location: "Concept — Rowan" }, feats: ["Rolling island", "Tall pantry", "Integrated bench", "Sage and stone palette"] },
    { id: "linden", room: "bedroom", name: "Linden Loft", sub: "A sloped attic turned into a restful main bedroom", desc: "The low side of the roof became a headboard wall, with full-height storage tucked into the eaves under the slope.", meta: { Type: "Bedroom", Scope: "Design + styling", Duration: "8 weeks", Location: "Concept — Linden" }, feats: ["Eaves storage", "Sloped-wall headboard", "Layered lighting", "Linen and clay tones"] },
    { id: "pewter", room: "studio", name: "Pewter Studio", sub: "A live-work studio for a ceramicist", desc: "A single room that needed to hold a wheel, a kiln, a desk, and a sofa. Zoning with floor finish and light does the work that walls would have.", meta: { Type: "Studio", Scope: "Full design", Duration: "9 weeks", Location: "Concept — Pewter" }, feats: ["Zoned by floor finish", "Dust control", "Task lighting", "Flexible desk wall"] },
    { id: "harbour", room: "living", name: "Harbour Sitting Room", sub: "A formal room made comfortable for every day", desc: "Small changes — a deeper sofa, a rug that reaches the walls, two pools of lamplight — turned a rarely-used sitting room into the room the family actually uses.", meta: { Type: "Living room", Scope: "Styling only", Duration: "4 weeks", Location: "Concept — Harbour" }, feats: ["Rug scaled to room", "Two light pools", "Warmer textile layer", "Rehung artwork"] },
    { id: "ash", room: "kitchen", name: "Ash Open Plan", sub: "Kitchen, dining and living read as one room", desc: "An open plan that felt like three islands of furniture was unified with a single floor, a repeated joinery detail, and a ceiling line that carries through.", meta: { Type: "Kitchen", Scope: "Full design", Duration: "16 weeks", Location: "Concept — Ash" }, feats: ["Unified floor", "Repeated joinery line", "Continuous ceiling", "Palette of three materials"] },
    { id: "fern", room: "bedroom", name: "Fern Guest Room", sub: "An awkward spare room made genuinely useful", desc: "A room too narrow for a double gets a built-in bed with storage under, freeing the floor and making it work as both guest room and study.", meta: { Type: "Bedroom", Scope: "Design clinic", Duration: "2 weeks", Location: "Concept — Fern" }, feats: ["Built-in bed", "Under-bed storage", "Fold-out desk", "Narrow-room layout"] },
    { id: "slate", room: "studio", name: "Slate Workshop", sub: "A maker's workshop with honest finishes", desc: "A working workshop that doesn't pretend to be a showroom — durable surfaces, good light, and a wall of tools that's part of the design rather than hidden.", meta: { Type: "Studio", Scope: "Full design", Duration: "7 weeks", Location: "Concept — Slate" }, feats: ["Durable surfaces", "High-output lighting", "Tool wall", "Dust-separated zone"] }
  ];

  var portfolio = document.getElementById("portfolio");
  var dialog = document.getElementById("project");
  var filter = "all";
  var active = null;

  function render() {
    var list = projects.filter(function (p) { return filter === "all" || p.room === filter; });
    portfolio.innerHTML = "";
    document.getElementById("empty").hidden = list.length > 0;
    list.forEach(function (p) {
      var el = document.createElement("article");
      el.className = "proj";
      el.tabIndex = 0;
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", "View " + p.name);
      el.dataset.id = p.id;
      el.innerHTML =
        '<div class="proj__art" data-room="' + p.room + '"></div>' +
        '<div class="proj__info">' +
        '<span class="proj__room">' + p.room + "</span>" +
        '<h3 class="proj__name">' + p.name + "</h3>" +
        '<p class="proj__sub">' + p.sub + "</p>" +
        "</div>";
      portfolio.appendChild(el);
    });
  }

  portfolio.addEventListener("click", function (e) {
    var el = e.target.closest(".proj");
    if (el) openProject(el.dataset.id);
  });
  portfolio.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var el = e.target.closest(".proj");
    if (el) { e.preventDefault(); openProject(el.dataset.id); }
  });

  function openProject(id) {
    active = projects.find(function (p) { return p.id === id; });
    if (!active) return;
    document.getElementById("p-room").textContent = active.room;
    document.getElementById("p-title").textContent = active.name;
    document.getElementById("p-desc").textContent = active.desc;
    var meta = document.getElementById("p-meta");
    meta.innerHTML = "";
    Object.keys(active.meta).forEach(function (k) {
      var dt = document.createElement("dt"); dt.textContent = k;
      var dd = document.createElement("dd"); dd.textContent = active.meta[k];
      meta.appendChild(dt); meta.appendChild(dd);
    });
    var feats = document.getElementById("p-feats");
    feats.innerHTML = "";
    active.feats.forEach(function (f) {
      var li = document.createElement("li"); li.textContent = f; feats.appendChild(li);
    });
    document.getElementById("p-art").dataset.room = active.room;
    dialog.showModal();
  }

  document.getElementById("p-close").addEventListener("click", function () { dialog.close(); });

  var enquiry = document.getElementById("enquiry");
  function openEnq() { enquiry.showModal(); }
  document.getElementById("enq-open").addEventListener("click", openEnq);
  document.getElementById("enq-open-2").addEventListener("click", openEnq);
  document.getElementById("enq-close").addEventListener("click", function () { enquiry.close(); });

  window.VOYD.bindForm(document.getElementById("enq-form"), {
    successMessage: "Brief received. This is a demo — nothing was sent to a real studio and no project was started.",
    errorMessage: "Please complete the highlighted fields before sending."
  });

  document.querySelector(".filters").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    filter = chip.dataset.filter;
    document.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("is-active", c === chip); });
    render();
  });

  render();
})();
