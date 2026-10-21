(function () {
  "use strict";

  var pieces = [
    { id: "aurora", name: "Aurora Band", material: "gold", price: 780, desc: "A slim 18k band with a single brilliant-cut stone. Sits flush against a wedding ring.", spec: { Metal: "18k yellow gold", Stone: "0.25ct brilliant", Sizes: "48–60 (EU)", Finish: "Hand-polished" } },
    { id: "meridian", name: "Meridian Hoop", material: "gold", price: 540, desc: "Everyday hoops with a subtle brushed texture that catches light without shouting.", spec: { Metal: "18k gold vermeil", Stone: "None", Sizes: "16mm, 22mm", Finish: "Brushed" } },
    { id: "halo", name: "Halo Drop", material: "stone", price: 1240, desc: "An evening drop earring set with a rose-cut stone framed in fine milgrain.", spec: { Metal: "18k white gold", Stone: "1.1ct rose-cut", Drop: "32mm", Finish: "Milgrain" } },
    { id: "linea", name: "Linea Chain", material: "silver", price: 320, desc: "A fine sterling chain built to layer. Clasp is small and secure, not fussy.", spec: { Metal: "925 sterling", Length: "40cm, 45cm", Weight: "6g", Finish: "Polished" } },
    { id: "solstice", name: "Solstice Signet", material: "gold", price: 690, desc: "A clean signet with space for a monogram, sized properly and weighted to sit flat.", spec: { Metal: "18k gold", Face: "11mm", Sizes: "48–60 (EU)", Finish: "Satin" } },
    { id: "verity", name: "Verity Stud", material: "stone", price: 460, desc: "A single-stone stud that reads as a dot of light. Comfortable for daily wear.", spec: { Metal: "18k gold", Stone: "0.4ct round", Back: "Push", Finish: "Polished" } },
    { id: "cascade", name: "Cascade Necklace", material: "silver", price: 410, desc: "A graduated sterling necklace that drapes rather than sits. Designed for open necklines.", spec: { Metal: "925 sterling", Length: "42cm", Drop: "18mm", Finish: "Polished" } },
    { id: "ember", name: "Ember Cocktail Ring", material: "stone", price: 1580, desc: "A statement ring with a warm-toned stone and a low, wearable setting.", spec: { Metal: "18k rose gold", Stone: "2.4ct oval", Sizes: "48–60 (EU)", Finish: "Hand-polished" } }
  ];

  var saved = window.VOYD.createCart("atelier-saved", "$");
  var grid = document.getElementById("grid");
  var detail = document.getElementById("detail");
  var drawer = document.getElementById("drawer");
  var active = null;
  var filter = "all";
  var sort = "featured";

  function gemHtml() {
    return '<div class="gem" aria-hidden="true"><span class="gem__ring"></span><span class="gem__stone"></span></div>';
  }

  function current() {
    var list = pieces.filter(function (p) { return filter === "all" || p.material === filter; });
    if (sort === "low") list.sort(function (a, b) { return a.price - b.price; });
    if (sort === "high") list.sort(function (a, b) { return b.price - a.price; });
    return list;
  }

  function render() {
    var list = current();
    grid.innerHTML = "";
    document.getElementById("empty").hidden = list.length > 0;
    list.forEach(function (p) {
      var card = document.createElement("article");
      card.className = "card";
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "View " + p.name);
      card.dataset.id = p.id;
      card.innerHTML =
        '<div class="card__art" data-mat="' + p.material + '">' + gemHtml() + "</div>" +
        '<div class="card__body">' +
        '<span class="card__mat">' + p.material + "</span>" +
        '<h3 class="card__name">' + p.name + "</h3>" +
        '<span class="card__price">' + saved.money(p.price) + "</span>" +
        "</div>";
      grid.appendChild(card);
    });
  }

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".card");
    if (card) openDetail(card.dataset.id);
  });
  grid.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest(".card");
    if (card) { e.preventDefault(); openDetail(card.dataset.id); }
  });

  function isSaved(id) {
    return saved.items().some(function (it) { return it.id === id; });
  }

  function openDetail(id) {
    active = pieces.find(function (p) { return p.id === id; });
    if (!active) return;
    document.getElementById("d-material").textContent = active.material;
    document.getElementById("d-title").textContent = active.name;
    document.getElementById("d-price").textContent = saved.money(active.price);
    document.getElementById("d-desc").textContent = active.desc;
    var spec = document.getElementById("d-spec");
    spec.innerHTML = "";
    Object.keys(active.spec).forEach(function (k) {
      var dt = document.createElement("dt"); dt.textContent = k;
      var dd = document.createElement("dd"); dd.textContent = active.spec[k];
      spec.appendChild(dt); spec.appendChild(dd);
    });
    document.getElementById("d-art").innerHTML = gemHtml();
    document.getElementById("d-save").hidden = isSaved(active.id);
    document.getElementById("d-remove").hidden = !isSaved(active.id);
    detail.showModal();
  }

  document.getElementById("d-close").addEventListener("click", function () { detail.close(); });
  document.getElementById("d-save").addEventListener("click", function () {
    if (!active) return;
    saved.add({ id: active.id, name: active.name, price: active.price }, 1);
    openDetail(active.id);
    renderDrawer();
  });
  document.getElementById("d-remove").addEventListener("click", function () {
    if (!active) return;
    var idx = saved.items().findIndex(function (it) { return it.id === active.id; });
    if (idx >= 0) saved.remove(idx);
    openDetail(active.id);
    renderDrawer();
  });

  document.getElementById("cart-open").addEventListener("click", function () {
    drawer.hidden = false;
    renderDrawer();
  });
  drawer.querySelectorAll("[data-close]").forEach(function (n) {
    n.addEventListener("click", function () { drawer.hidden = true; });
  });

  function renderDrawer() {
    var box = document.getElementById("drawer-items");
    var items = saved.items();
    document.getElementById("cart-count").textContent = String(items.length);
    box.innerHTML = "";
    if (!items.length) {
      box.innerHTML = '<p class="tiny">No pieces saved yet. Open a piece and choose “Save to showcase”.</p>';
      return;
    }
    items.forEach(function (it, i) {
      var row = document.createElement("div");
      row.className = "saved-item";
      row.innerHTML =
        '<div><div class="saved-item__name">' + it.name + '</div><div class="saved-item__price">' + saved.money(it.price) + "</div></div>" +
        '<button type="button" data-remove="' + i + '">Remove</button>';
      box.appendChild(row);
    });
  }
  document.getElementById("drawer-items").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-remove]");
    if (btn) { saved.remove(parseInt(btn.dataset.remove, 10)); renderDrawer(); }
  });

  document.querySelector(".filters").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    filter = chip.dataset.filter;
    document.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("is-active", c === chip); });
    render();
  });
  document.getElementById("sort").addEventListener("change", function (e) {
    sort = e.target.value;
    render();
  });

  render();
  renderDrawer();
})();
