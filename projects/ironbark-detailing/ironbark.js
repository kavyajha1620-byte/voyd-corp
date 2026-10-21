(function () {
  "use strict";

  var packages = [
    { id: "refresh", name: "Refresh", price: 120, desc: "A thorough maintenance detail for a well-kept car.", feats: ["Safe hand wash", "Wheels & arches", "Interior vacuum", "Sealant top-up"], featured: false },
    { id: "correct", name: "Correct", price: 480, desc: "Single-stage machine polish to lift swirls and restore gloss.", feats: ["Full decontamination", "Single-stage polish", "Gloss enhancement", "6-month sealant"], featured: true },
    { id: "protect", name: "Protect", price: 980, desc: "Multi-stage correction plus a ceramic coating built to last.", feats: ["Multi-stage correction", "Ceramic coating", "Wheels coated", "Coating log provided"], featured: false }
  ];

  var addons = [
    { id: "interior", name: "Interior deep clean", price: 90 },
    { id: "engine", name: "Engine bay detail", price: 60 },
    { id: "headlight", name: "Headlight restoration", price: 75 },
    { id: "glass", name: "Glass coating", price: 55 },
    { id: "odor", name: "Odour treatment", price: 70 }
  ];

  var booking = window.VOYD.createCart("ironbark-booking", "$");

  var pkgBox = document.getElementById("packages");
  packages.forEach(function (p) {
    var el = document.createElement("article");
    el.className = "pkg" + (p.featured ? " pkg--feature" : "");
    el.innerHTML =
      (p.featured ? '<span class="pkg__badge">Most booked</span>' : "") +
      "<h3>" + p.name + "</h3>" +
      '<div class="pkg__price">' + booking.money(p.price) + " <span>from</span></div>" +
      '<p class="pkg__desc">' + p.desc + "</p>" +
      "<ul>" + p.feats.map(function (f) { return "<li>" + f + "</li>"; }).join("") + "</ul>" +
      '<button class="btn" type="button" data-pkg="' + p.id + '">Choose ' + p.name + "</button>";
    pkgBox.appendChild(el);
  });

  var pkgOpts = document.getElementById("pkg-opts");
  packages.forEach(function (p, i) {
    var label = document.createElement("label");
    label.className = "opt";
    label.innerHTML = '<input type="radio" name="pkg" value="' + p.id + '" data-add="' + p.price + '"' + (i === 1 ? " checked" : "") + "><span>" + p.name + "<em>" + booking.money(p.price) + "</em></span>";
    pkgOpts.appendChild(label);
  });

  var addonBox = document.getElementById("addon-opts");
  addons.forEach(function (a) {
    var label = document.createElement("label");
    label.className = "check";
    label.innerHTML = '<input type="checkbox" name="addon" value="' + a.id + '" data-add="' + a.price + '" data-name="' + a.name + '"><span class="check__label">' + a.name + '</span><span class="check__price">+' + booking.money(a.price) + "</span>";
    addonBox.appendChild(label);
  });

  var form = document.getElementById("quote-form");
  var linesBox = document.getElementById("quote-lines");
  var totalEl = document.getElementById("quote-total");
  var current = { size: "small", sizeAdd: 0, sizeLabel: "Small", pkg: null, addons: [], total: 0 };

  function recalc() {
    var size = form.querySelector('input[name="size"]:checked');
    var pkg = form.querySelector('input[name="pkg"]:checked');
    var chosenAddons = Array.prototype.slice.call(form.querySelectorAll('input[name="addon"]:checked'));

    current.size = size.value;
    current.sizeAdd = parseInt(size.dataset.add, 10) || 0;
    current.sizeLabel = size.parentElement.querySelector("span").childNodes[0].textContent;
    current.pkg = packages.find(function (p) { return p.id === pkg.value; });
    current.addons = chosenAddons.map(function (c) { return { name: c.dataset.name, price: parseInt(c.dataset.add, 10) }; });

    var total = current.sizeAdd + current.pkg.price + current.addons.reduce(function (s, a) { return s + a.price; }, 0);
    current.total = total;

    linesBox.innerHTML = "";
    function line(label, value) {
      var li = document.createElement("li");
      li.innerHTML = "<span>" + label + "</span><strong>" + booking.money(value) + "</strong>";
      linesBox.appendChild(li);
    }
    line("Vehicle size (" + current.sizeLabel + ")", current.sizeAdd);
    line(current.pkg.name + " package", current.pkg.price);
    current.addons.forEach(function (a) { line(a.name, a.price); });
    if (!current.addons.length) {
      var empty = document.createElement("li");
      empty.innerHTML = "<span>No add-ons</span><strong>$0.00</strong>";
      linesBox.appendChild(empty);
    }
    totalEl.textContent = booking.money(total);
  }

  form.addEventListener("change", recalc);
  pkgBox.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-pkg]");
    if (!btn) return;
    var radio = form.querySelector('input[name="pkg"][value="' + btn.dataset.pkg + '"]');
    if (radio) { radio.checked = true; recalc(); }
    document.getElementById("quote").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function buildSummary() {
    var items = [{ name: current.pkg.name + " (" + current.sizeLabel + ")", price: current.pkg.price + current.sizeAdd }];
    current.addons.forEach(function (a) { items.push({ name: a.name, price: a.price }); });
    return items;
  }

  var bk = document.getElementById("booking");
  var dateInput = bk.querySelector('input[name="date"]');
  var now = new Date();
  dateInput.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  function openBooking() {
    booking.clear();
    buildSummary().forEach(function (it) {
      booking.add({ id: it.name, name: it.name, price: it.price }, 1);
    });
    var summary = bk.querySelector("[data-order-summary]");
    summary.hidden = false;
    summary.innerHTML = "";
    var ul = document.createElement("ul");
    booking.items().forEach(function (it) {
      var li = document.createElement("li");
      li.textContent = it.name + " — " + booking.money(it.price);
      ul.appendChild(li);
    });
    var t = document.createElement("p");
    t.className = "demo-order-total";
    t.textContent = "Estimate total: " + booking.money(booking.total());
    summary.appendChild(ul); summary.appendChild(t);
    bk.showModal();
  }

  document.getElementById("book-open").addEventListener("click", openBooking);
  document.getElementById("quote-book").addEventListener("click", openBooking);
  document.getElementById("bk-close").addEventListener("click", function () { bk.close(); });

  window.VOYD.bindDemoCheckout(document.getElementById("bk-form"), booking, {
    message: "Demo booking noted. No appointment was created and no payment was taken — this is a concept studio."
  });

  recalc();
})();
