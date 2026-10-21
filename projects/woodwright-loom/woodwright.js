(function () {
  "use strict";

  var pieces = [
    { id: "trestle", name: "Trestle Dining Table", material: "oak", price: 2400, featured: true, desc: "A six-to-eight seat dining table on trestle legs. The top is built from staves so it stays flat season to season.", spec: { Timber: "European oak", Finish: "Hard-wax oil", Size: "220 × 95 × 74 cm", Lead: "8–10 weeks" } },
    { id: "bowl", name: "Walnut Bowl Chair", material: "walnut", price: 680, featured: true, desc: "A low lounge chair with a steam-bent back. Upholstered in wool over a linen base.", spec: { Timber: "American walnut", Upholstery: "Wool over linen", Size: "72 × 78 × 70 cm", Lead: "6–8 weeks" } },
    { id: "shelf", name: "Peg Shelving", material: "oak", price: 540, featured: false, desc: "A wall system that fixes on dowel pegs, so shelves can be moved without leaving holes.", spec: { Timber: "European oak", Finish: "Soap wash", Size: "180 × 22 × 30 cm", Lead: "4–6 weeks" } },
    { id: "daybed", name: "Loom Day Bed", material: "linen", price: 1450, featured: true, desc: "A day bed with a slatted base and a linen-covered cushion. Doubles as a guest bed.", spec: { Frame: "Ash", Upholstery: "Washed linen", Size: "190 × 80 × 62 cm", Lead: "7–9 weeks" } },
    { id: "bench", name: "Long Ash Bench", material: "ash", price: 420, featured: false, desc: "A simple six-foot bench for a hallway or the foot of a bed. Cut from a single board.", spec: { Timber: "Ash", Finish: "Hard-wax oil", Size: "180 × 35 × 45 cm", Lead: "4–6 weeks" } },
    { id: "side", name: "Walnut Side Table", material: "walnut", price: 380, featured: false, desc: "A small round side table with a tapered tripod base that sits tight to a sofa.", spec: { Timber: "American walnut", Finish: "Hard-wax oil", Size: "45 × 45 × 55 cm", Lead: "4–6 weeks" } },
    { id: "sofa", name: "Stone Sofa", material: "linen", price: 3200, featured: true, desc: "A low three-seat sofa with removable covers, built on a hardwood frame meant to be reupholstered.", spec: { Frame: "Kiln-dried hardwood", Upholstery: "Removable linen", Size: "230 × 98 × 70 cm", Lead: "10–12 weeks" } },
    { id: "cube", name: "Ash Cubby Unit", material: "ash", price: 890, featured: false, desc: "A grid of open cubbies for books and records. Free-standing and square, no fixings required.", spec: { Timber: "Ash", Finish: "Soap wash", Size: "140 × 40 × 120 cm", Lead: "6–8 weeks" } }
  ];

  var money = window.VOYD.money;
  var grid = document.getElementById("grid");
  var dialog = document.getElementById("product");
  var filter = "all";
  var sort = "featured";
  var active = null;

  function render() {
    var list = pieces.filter(function (p) { return filter === "all" || p.material === filter; });
    if (sort === "low") list.sort(function (a, b) { return a.price - b.price; });
    if (sort === "high") list.sort(function (a, b) { return b.price - a.price; });
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
        '<div class="card__art" data-material="' + p.material + '"></div>' +
        '<div class="card__body">' +
        '<span class="card__material">' + p.material + "</span>" +
        '<h3 class="card__name">' + p.name + "</h3>" +
        '<span class="card__price">from ' + money(p.price) + "</span>" +
        "</div>";
      grid.appendChild(card);
    });
  }

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".card"); if (card) openProduct(card.dataset.id);
  });
  grid.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest(".card");
    if (card) { e.preventDefault(); openProduct(card.dataset.id); }
  });

  function openProduct(id) {
    active = pieces.find(function (p) { return p.id === id; });
    if (!active) return;
    document.getElementById("p-material").textContent = active.material;
    document.getElementById("p-title").textContent = active.name;
    document.getElementById("p-price").textContent = "from " + money(active.price);
    document.getElementById("p-desc").textContent = active.desc;
    var spec = document.getElementById("p-spec");
    spec.innerHTML = "";
    Object.keys(active.spec).forEach(function (k) {
      var dt = document.createElement("dt"); dt.textContent = k;
      var dd = document.createElement("dd"); dd.textContent = active.spec[k];
      spec.appendChild(dt); spec.appendChild(dd);
    });
    document.getElementById("p-art").dataset.material = active.material;
    dialog.showModal();
  }

  document.getElementById("p-close").addEventListener("click", function () { dialog.close(); });

  var enquiry = document.getElementById("enquiry");
  function openEnq(context) {
    var ctx = document.getElementById("enq-context");
    if (context) {
      ctx.textContent = "Enquiring about: " + context + ". This is a demo — nothing is sent to a workshop.";
    } else {
      ctx.textContent = "Tell us what you're after. This is a demo — nothing is sent to a workshop.";
    }
    enquiry.showModal();
  }
  document.getElementById("enq-open").addEventListener("click", function () { openEnq(null); });
  document.getElementById("p-enquire").addEventListener("click", function () {
    if (active) { dialog.close(); openEnq(active.name); }
  });
  document.getElementById("enq-close").addEventListener("click", function () { enquiry.close(); });

  window.VOYD.bindForm(document.getElementById("enq-form"), {
    successMessage: "Enquiry received. This is a demo — no workshop was contacted and no quote exists.",
    errorMessage: "Please complete the highlighted fields before sending."
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
})();
