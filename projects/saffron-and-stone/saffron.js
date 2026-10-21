(function () {
  "use strict";

  var dishes = [
    { id: "flatbread", name: "Ember Flatbread", course: "small", price: 9, desc: "Blistered dough, cultured butter, smoked salt. Torn and shared.", tag: "Bread" },
    { id: "peppers", name: "Blistered Peppers", course: "small", price: 8, desc: "Padrón peppers, lemon oil, flaked salt. Mostly mild, occasionally not.", tag: "Small" },
    { id: "anchovy", name: "Anchovy & Radish", course: "small", price: 11, desc: "Cured anchovy on toast with shaved radish and parsley.", tag: "Small" },
    { id: "lamb", name: "Coal-Roasted Lamb", course: "fire", price: 28, desc: "Shoulder cooked low over coals, finished hard for crust. Served with its juices.", tag: "Fire" },
    { id: "sourdough", name: "Grilled Chicken Thigh", course: "fire", price: 19, desc: "Brined overnight, grilled skin-side down until the fat renders crisp.", tag: "Fire" },
    { id: "onions", name: "Charred Onion", course: "veg", price: 12, desc: "Whole roasted onion, brown butter, aged vinegar, thyme.", tag: "Veg" },
    { id: "greens", name: "Wood-Fired Greens", course: "veg", price: 10, desc: "Seasonal greens wilted in the pan with garlic and chilli.", tag: "Veg" },
    { id: "potato", name: "Ash Potatoes", course: "veg", price: 11, desc: "Potatoes roasted in the ashes, cracked open with smoked butter.", tag: "Veg" },
    { id: "fish", name: "Whole Grilled Fish", course: "fire", price: 32, desc: "Day-boat fish over coals, olive oil, lemon, nothing else. Serves two.", tag: "Fire" },
    { id: "burnt", name: "Burnt Honey Custard", course: "sweet", price: 9, desc: "Set custard under a hard caramel lid. Tap through the top.", tag: "Sweet" },
    { id: "sorbet", name: "Ember Sorbet", course: "sweet", price: 7, desc: "Seasonal fruit sorbet with a whisper of smoke from charred fruit.", tag: "Sweet" }
  ];

  var menu = document.getElementById("menu-list");
  var filter = "all";

  function render() {
    var list = dishes.filter(function (d) { return filter === "all" || d.course === filter; });
    menu.innerHTML = "";
    document.getElementById("empty").hidden = list.length > 0;
    list.forEach(function (d) {
      var li = document.createElement("li");
      li.className = "dish";
      li.innerHTML =
        '<div class="dish__main">' +
        '<div class="dish__top"><span class="dish__name">' + d.name + '</span><span class="dish__tag" data-course="' + d.course + '">' + d.tag + "</span></div>" +
        '<p class="dish__desc">' + d.desc + "</p>" +
        "</div>" +
        '<span class="dish__price">$' + d.price + "</span>";
      menu.appendChild(li);
    });
  }

  document.querySelector(".filters").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    filter = chip.dataset.filter;
    document.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("is-active", c === chip); });
    render();
  });

  var booking = document.getElementById("booking");
  function openBooking() { booking.showModal(); }
  document.getElementById("book-open").addEventListener("click", openBooking);
  document.getElementById("book-open-2").addEventListener("click", openBooking);
  document.getElementById("bk-close").addEventListener("click", function () { booking.close(); });

  var form = document.getElementById("bk-form");
  var dateInput = form.querySelector('input[name="date"]');
  var today = new Date();
  var iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  dateInput.min = iso;

  window.VOYD.bindForm(form, {
    successMessage: "Request received. This is a demo — no table was actually held and nothing was sent to a restaurant.",
    errorMessage: "Please complete the highlighted fields before requesting a table."
  });

  render();
})();
