(function () {
  "use strict";

  var items = [
    { id: "tee", name: "Heavyweight Tee", cat: "tops", price: 48, desc: "A dense organic-cotton tee that keeps its shape. Runs true to size.", spec: { Fabric: "240gsm organic cotton", Fit: "True to size", Care: "Cold wash, line dry" }, sizes: ["XS", "S", "M", "L", "XL"] },
    { id: "shirt", name: "Poplin Overshirt", cat: "tops", price: 92, desc: "A relaxed poplin overshirt that works open or buttoned. Size down for a closer fit.", spec: { Fabric: "Cotton poplin", Fit: "Relaxed", Care: "Machine wash 30°" }, sizes: ["S", "M", "L", "XL"] },
    { id: "trouser", name: "Wide Pleat Trouser", cat: "bottoms", price: 118, desc: "A high-waist pleat trouser with a clean fall. Sits long — hem to taste.", spec: { Fabric: "Wool blend", Fit: "Relaxed waist", Care: "Dry clean" }, sizes: ["XS", "S", "M", "L"] },
    { id: "denim", name: "Straight Denim", cat: "bottoms", price: 104, desc: "A rigid straight-leg denim with no stretch. Breaks in, not out.", spec: { Fabric: "14oz rigid cotton", Fit: "Straight", Care: "Wash sparingly" }, sizes: ["26", "28", "30", "32", "34"] },
    { id: "coat", name: "Wool Overcoat", cat: "outerwear", price: 268, desc: "A double-faced wool coat with a collar that holds. Cut for layering.", spec: { Fabric: "Double-faced wool", Fit: "Oversized", Care: "Dry clean" }, sizes: ["S", "M", "L", "XL"] },
    { id: "jacket", name: "Cropped Chore Jacket", cat: "outerwear", price: 156, desc: "A sturdy cotton-twill chore jacket, cropped at the hip. Three real pockets.", spec: { Fabric: "Cotton twill", Fit: "Cropped", Care: "Machine wash 30°" }, sizes: ["XS", "S", "M", "L"] },
    { id: "knit", name: "Ribbed Knit", cat: "knitwear", price: 132, desc: "A fine rib knit with a neat neckline. Layers under everything.", spec: { Fabric: "Merino blend", Fit: "Slim", Care: "Hand wash" }, sizes: ["XS", "S", "M", "L"] },
    { id: "cardigan", name: "Boxy Cardigan", cat: "knitwear", price: 148, desc: "A boxy cotton cardigan with shell buttons. Wears like a layer, not a sweater.", spec: { Fabric: "Cotton knit", Fit: "Boxy", Care: "Hand wash" }, sizes: ["S", "M", "L", "XL"] }
  ];

  var cart = window.VOYD.createCart("meridian", "$");
  var grid = document.getElementById("grid");
  var detail = document.getElementById("detail");
  var drawer = document.getElementById("drawer");
  var checkout = document.getElementById("checkout");
  var active = null;
  var filter = "all";

  function cardArtHtml(cat) { return '<div class="card__art" data-cat="' + cat + '"></div>'; }

  function render() {
    var list = items.filter(function (p) { return filter === "all" || p.cat === filter; });
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
        cardArtHtml(p.cat) +
        '<div class="card__body">' +
        '<span class="card__cat">' + p.cat + "</span>" +
        '<h3 class="card__name">' + p.name + "</h3>" +
        '<span class="card__price">' + cart.money(p.price) + "</span>" +
        "</div>";
      grid.appendChild(card);
    });
  }

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".card"); if (card) openDetail(card.dataset.id);
  });
  grid.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest(".card");
    if (card) { e.preventDefault(); openDetail(card.dataset.id); }
  });

  function openDetail(id) {
    active = items.find(function (p) { return p.id === id; });
    if (!active) return;
    document.getElementById("d-cat").textContent = active.cat;
    document.getElementById("d-title").textContent = active.name;
    document.getElementById("d-price").textContent = cart.money(active.price);
    document.getElementById("d-desc").textContent = active.desc;
    var spec = document.getElementById("d-spec");
    spec.innerHTML = "";
    Object.keys(active.spec).forEach(function (k) {
      var dt = document.createElement("dt"); dt.textContent = k;
      var dd = document.createElement("dd"); dd.textContent = active.spec[k];
      spec.appendChild(dt); spec.appendChild(dd);
    });
    var sizes = document.getElementById("d-sizes");
    sizes.innerHTML = "<legend>Size</legend>";
    active.sizes.forEach(function (s, i) {
      var label = document.createElement("label");
      label.innerHTML = '<input type="radio" name="size" value="' + s + '"' + (i === 0 ? "" : "") + '><span>' + s + "</span>";
      sizes.appendChild(label);
    });
    document.getElementById("d-error").hidden = true;
    detail.showModal();
  }

  document.getElementById("d-close").addEventListener("click", function () { detail.close(); });
  document.getElementById("d-add").addEventListener("click", function () {
    if (!active) return;
    var picked = detail.querySelector('input[name="size"]:checked');
    if (!picked) { document.getElementById("d-error").hidden = false; return; }
    cart.add({ id: active.id + "-" + picked.value, name: active.name, price: active.price, meta: "Size " + picked.value }, 1);
    detail.close();
    drawer.hidden = false;
    renderDrawer();
  });

  function openDrawer() { drawer.hidden = false; renderDrawer(); }
  document.getElementById("cart-open").addEventListener("click", openDrawer);
  drawer.querySelectorAll("[data-close]").forEach(function (n) { n.addEventListener("click", function () { drawer.hidden = true; }); });

  function renderDrawer() {
    var box = document.getElementById("drawer-items");
    var list = cart.items();
    document.getElementById("cart-count").textContent = String(cart.count());
    document.getElementById("subtotal").textContent = cart.money(cart.total());
    box.innerHTML = "";
    if (!list.length) {
      box.innerHTML = '<p class="tiny">Your bag is empty. Open a piece to add a size.</p>';
      return;
    }
    list.forEach(function (it, i) {
      var row = document.createElement("div");
      row.className = "bag-item";
      row.innerHTML =
        '<div><div class="bag-item__name">' + it.name + '</div>' +
        '<div class="bag-item__meta">' + (it.meta || "") + " · " + cart.money(it.price) + "</div>" +
        '<div class="bag-item__row"><label class="tiny">Qty <input type="number" min="0" max="9" value="' + it.qty + '" data-qty="' + i + '"></label>' +
        '<button type="button" data-remove="' + i + '">Remove</button></div></div>' +
        '<div class="bag-item__meta">' + cart.money(it.price * it.qty) + "</div>";
      box.appendChild(row);
    });
  }

  document.getElementById("drawer-items").addEventListener("input", function (e) {
    var input = e.target.closest("[data-qty]");
    if (input) cart.setQty(parseInt(input.dataset.qty, 10), input.value);
  });
  document.getElementById("drawer-items").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-remove]");
    if (btn) cart.remove(parseInt(btn.dataset.remove, 10));
  });
  document.addEventListener("voyd:cart", renderDrawer);

  document.getElementById("co-open").addEventListener("click", function () {
    drawer.hidden = true;
    checkout.showModal();
  });
  document.getElementById("co-close").addEventListener("click", function () { checkout.close(); });

  window.VOYD.bindDemoCheckout(document.getElementById("co-form"), cart, {
    message: "Demo order placed. No payment was taken and no real order was created — this is a concept storefront."
  });

  document.querySelector(".filters").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    filter = chip.dataset.filter;
    document.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("is-active", c === chip); });
    render();
  });

  render();
  renderDrawer();
})();
