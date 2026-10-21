(function () {
  "use strict";

  var rooms = [
    { id: "dune", name: "Dune Room", view: "Garden view", rate: 180, sleeps: 2, desc: "A bright ground-floor room opening onto the garden. King bed, walk-in shower, no television.", feats: ["King bed", "Walk-in shower", "Garden access", "Sleeps 2"] },
    { id: "tide", name: "Tide Room", view: "Partial sea", rate: 240, sleeps: 2, desc: "First-floor room with a side window onto the water and a deep armchair by it.", feats: ["King bed", "Sea glimpse", "Armchair", "Sleeps 2"] },
    { id: "horizon", name: "Horizon Suite", view: "Full sea view", rate: 360, sleeps: 3, desc: "Corner suite with wraparound glass, a separate sitting room, and a terrace facing the water.", feats: ["Corner glass", "Sitting room", "Terrace", "Sleeps 3"] },
    { id: "lantern", name: "Lantern Loft", view: "Skylit", rate: 300, sleeps: 2, desc: "A top-floor loft with a skylight over the bed and a small private deck.", feats: ["Skylight", "Private deck", "Soaking tub", "Sleeps 2"] },
    { id: "shell", name: "Shell Room", view: "Garden view", rate: 200, sleeps: 2, desc: "A quiet room toward the back of the house, twin beds that can be joined.", feats: ["Twin or king", "Quiet side", "Walk-in shower", "Sleeps 2"] },
    { id: "beacon", name: "Beacon Suite", view: "Full sea view", rate: 420, sleeps: 4, desc: "The largest room, with two bedrooms, a long balcony, and the best of the horizon.", feats: ["Two bedrooms", "Long balcony", "Double vanity", "Sleeps 4"] }
  ];

  var stay = window.VOYD.createCart("halcyon-stay", "$");
  var grid = document.getElementById("grid");
  var dialog = document.getElementById("room");
  var checkout = document.getElementById("checkout");
  var active = null;
  var dates = { from: "", to: "", guests: 2 };
  var nights = 0;
  var available = rooms.map(function (r) { return r.id; });

  function iso(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  var now = new Date();
  document.querySelector('#search input[name="from"]').min = iso(now);
  document.querySelector('#search input[name="to"]').min = iso(new Date(now.getTime() + 86400000));

  function daysBetween(a, b) {
    var ms = new Date(b).getTime() - new Date(a).getTime();
    return Math.round(ms / 86400000);
  }

  /* Deterministic pseudo-availability from the date range: same dates give the same result. */
  function computeAvailability(from, to) {
    var seed = 0;
    var key = from + to;
    for (var i = 0; i < key.length; i += 1) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
    available = rooms.filter(function (r, idx) {
      var rnd = ((seed >>> (idx % 24)) + idx * 7) % 10;
      return rnd !== 0;
    }).map(function (r) { return r.id; });
  }

  function renderGrid() {
    grid.innerHTML = "";
    rooms.forEach(function (r) {
      var isAvail = !nights || available.indexOf(r.id) >= 0;
      var total = nights ? r.rate * nights : r.rate;
      var card = document.createElement("article");
      card.className = "room" + (isAvail ? "" : " room--full");
      card.tabIndex = 0;
      card.setAttribute("role", "button");
      card.setAttribute("aria-label", "View " + r.name);
      card.dataset.id = r.id;
      card.innerHTML =
        '<div class="room__art"><span class="room__badge">' + (nights ? (isAvail ? "Available" : "Booked") : "From " + stay.money(r.rate)) + "</span></div>" +
        '<div class="room__body">' +
        '<span class="room__view">' + r.view + "</span>" +
        '<h3 class="room__name">' + r.name + "</h3>" +
        '<p class="room__meta">Sleeps ' + r.sleeps + " · " + (nights ? nights + " night" + (nights > 1 ? "s" : "") : "nightly from " + stay.money(r.rate)) + "</p>" +
        '<div class="room__price"><strong>' + stay.money(total) + "</strong> <span>" + (nights ? "total for stay" : "/ night") + "</span></div>" +
        "</div>";
      grid.appendChild(card);
    });
  }

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".room");
    if (card) openRoom(card.dataset.id);
  });
  grid.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    var card = e.target.closest(".room");
    if (card) { e.preventDefault(); openRoom(card.dataset.id); }
  });

  function openRoom(id) {
    active = rooms.find(function (r) { return r.id === id; });
    if (!active) return;
    var isAvail = !nights || available.indexOf(active.id) >= 0;
    document.getElementById("r-view").textContent = active.view;
    document.getElementById("r-title").textContent = active.name;
    var total = nights ? active.rate * nights : active.rate;
    document.getElementById("r-price").textContent = nights
      ? stay.money(total) + " · " + nights + " night" + (nights > 1 ? "s" : "")
      : stay.money(active.rate) + " / night";
    document.getElementById("r-desc").textContent = active.desc;
    var feats = document.getElementById("r-feats");
    feats.innerHTML = "";
    active.feats.forEach(function (f) {
      var li = document.createElement("li"); li.textContent = f; feats.appendChild(li);
    });
    var bookBtn = document.getElementById("r-book");
    bookBtn.disabled = !isAvail;
    bookBtn.textContent = isAvail ? "Reserve (demo)" : "Not available for these dates";
    dialog.showModal();
  }

  document.getElementById("r-close").addEventListener("click", function () { dialog.close(); });
  document.getElementById("r-book").addEventListener("click", function () {
    if (!active) return;
    var n = nights || 1;
    stay.clear();
    stay.add({ id: active.id, name: active.name, price: active.rate * n, meta: dates.from + " → " + dates.to, variant: dates.from + dates.to }, 1);
    dialog.close();
    openCheckout();
  });

  var search = document.getElementById("search");
  var statusEl = document.querySelector("#search ~ [data-form-status], .search__msg");
  search.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(search);
    var from = data.get("from"); var to = data.get("to");
    if (!from || !to) {
      statusEl.hidden = false; statusEl.dataset.state = "error";
      statusEl.textContent = "Choose both an arrival and a departure date.";
      return;
    }
    if (daysBetween(from, to) < 1) {
      statusEl.hidden = false; statusEl.dataset.state = "error";
      statusEl.textContent = "Departure must be after arrival.";
      return;
    }
    dates = { from: from, to: to, guests: parseInt(data.get("guests"), 10) || 2 };
    nights = daysBetween(from, to);
    computeAvailability(from, to);
    statusEl.hidden = false; statusEl.dataset.state = "success";
    var openCount = available.length;
    statusEl.textContent = "Demo availability for " + nights + " night" + (nights > 1 ? "s" : "") + ": " + openCount + " of " + rooms.length + " rooms show as open. Dates are illustrative — nothing is actually booked or held.";
    document.getElementById("avail-note").textContent = "Showing demo availability for " + from + " → " + to + " (" + nights + " night" + (nights > 1 ? "s" : "") + ").";
    renderGrid();
  });

  function openCheckout() {
    checkout.showModal();
    var summary = checkout.querySelector("[data-order-summary]");
    if (summary) {
      summary.hidden = false;
      summary.innerHTML = "";
      var it = stay.items()[0];
      if (it) {
        var p = document.createElement("p");
        p.textContent = it.name + " · " + (it.variant || "") + " · " + it.qty + " night(s)";
        var t = document.createElement("p");
        t.className = "demo-order-total";
        t.textContent = "Total: " + stay.money(stay.total());
        summary.appendChild(p); summary.appendChild(t);
      }
    }
  }
  document.getElementById("co-close").addEventListener("click", function () { checkout.close(); });

  window.VOYD.bindDemoCheckout(document.getElementById("co-form"), stay, {
    message: "Demo booking confirmed. No payment was taken and no reservation was created — this is a concept hotel."
  });

  renderGrid();
})();
