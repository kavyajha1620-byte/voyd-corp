(function () {
  "use strict";

  var days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var types = {
    strength: "Strength",
    conditioning: "Conditioning",
    mobility: "Mobility"
  };

  /* Deterministic "spots left" so the same class always shows the same number. */
  function spotsFor(day, id) {
    var seed = 0;
    var key = day + id;
    for (var i = 0; i < key.length; i += 1) seed = (seed * 37 + key.charCodeAt(i)) >>> 0;
    return seed % 13;
  }

  var base = [
    { time: "06:30", name: "Barbell Strength", type: "strength", coach: "Lead Coach", dur: 45 },
    { time: "07:30", name: "Engine Room", type: "conditioning", coach: "Conditioning Coach", dur: 45 },
    { time: "09:00", name: "Mobility Flow", type: "mobility", coach: "Mobility Coach", dur: 45 },
    { time: "12:15", name: "Lunch Express", type: "strength", coach: "Lead Coach", dur: 45 },
    { time: "17:30", name: "Conditioning 45", type: "conditioning", coach: "Conditioning Coach", dur: 45 },
    { time: "18:30", name: "Lower Body", type: "strength", coach: "Lead Coach", dur: 45 },
    { time: "19:30", name: "Wind-Down Mobility", type: "mobility", coach: "Mobility Coach", dur: 45 }
  ];

  var daybar = document.getElementById("daybar");
  var tt = document.getElementById("tt");
  var activeDay = "Mon";
  var filter = "all";
  var activeSlot = null;

  days.forEach(function (d, i) {
    var b = document.createElement("button");
    b.className = "day" + (i === 0 ? " is-active" : "");
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", i === 0 ? "true" : "false");
    b.textContent = d;
    b.dataset.day = d;
    daybar.appendChild(b);
  });

  function render() {
    tt.innerHTML = "";
    var list = base.filter(function (s) { return filter === "all" || s.type === filter; });
    document.getElementById("empty").hidden = list.length > 0;
    list.forEach(function (s) {
      var id = activeDay + s.time;
      var spots = spotsFor(activeDay, id);
      var full = spots === 0;
      var li = document.createElement("li");
      li.className = "slot" + (full ? " slot--full" : "");
      li.innerHTML =
        '<span class="slot__time">' + s.time + "</span>" +
        '<div><span class="slot__name">' + s.name + '</span>' +
        '<div class="slot__meta"><span class="slot__type" data-type="' + s.type + '">' + types[s.type] + "</span>" +
        "<span>" + s.dur + " min</span><span>" + s.coach + "</span></div></div>" +
        '<div class="slot__right"><span class="slot__spots">' + (full ? "Fully booked" : "<strong>" + spots + "</strong> left") + "</span>" +
        '<button class="btn" type="button" data-book="' + id + '"' + (full ? " disabled" : "") + ">" + (full ? "Waitlist" : "Reserve") + "</button></div>";
      tt.appendChild(li);
    });
  }

  daybar.addEventListener("click", function (e) {
    var b = e.target.closest(".day");
    if (!b) return;
    activeDay = b.dataset.day;
    daybar.querySelectorAll(".day").forEach(function (x) {
      x.classList.toggle("is-active", x === b);
      x.setAttribute("aria-selected", String(x === b));
    });
    render();
  });

  document.querySelector(".filters").addEventListener("click", function (e) {
    var chip = e.target.closest(".chip");
    if (!chip) return;
    filter = chip.dataset.filter;
    document.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("is-active", c === chip); });
    render();
  });

  var booking = document.getElementById("booking");
  document.getElementById("join-open").addEventListener("click", function () {
    activeSlot = null;
    document.getElementById("bk-slot").innerHTML = "Choose a class from the timetable, or book a Drop-in below.";
    booking.showModal();
  });

  tt.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-book]");
    if (!btn || btn.disabled) return;
    var id = btn.dataset.book;
    var slot = base.find(function (s) { return activeDay + s.time === id; });
    if (!slot) return;
    activeSlot = slot;
    var spots = spotsFor(activeDay, id);
    document.getElementById("bk-slot").innerHTML =
      '<strong>' + slot.name + "</strong><br>" + activeDay + " · " + slot.time + " · " + slot.dur + " min · " + slot.coach +
      "<br><span class='muted'>" + spots + " spots shown as open (demo)</span>";
    booking.showModal();
  });

  document.getElementById("bk-close").addEventListener("click", function () { booking.close(); });

  window.VOYD.bindForm(document.getElementById("bk-form"), {
    successMessage: "Spot reserved (demo). No place was actually held and nothing was charged — this is a concept studio.",
    errorMessage: "Please complete the highlighted fields before reserving."
  });

  render();
})();
