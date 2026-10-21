(function () {
  "use strict";

  var products = [
    {
      id: "cleanser",
      name: "Quiet Cleanser",
      cat: "cleanse",
      price: 24,
      desc: "A low-foam gel that removes the day without leaving skin tight or squeaky.",
      ingredients: ["Amino-acid surfactants", "Glycerin", "Panthenol"]
    },
    {
      id: "serum",
      name: "Clear Serum",
      cat: "treat",
      price: 38,
      desc: "A weightless serum that works on texture and tone without the sting.",
      ingredients: ["Niacinamide 5%", "Hyaluronic acid", "Zinc PCA"]
    },
    {
      id: "cream",
      name: "Barrier Cream",
      cat: "hydrate",
      price: 32,
      desc: "A ceramide cream that seals moisture in and keeps the barrier steady.",
      ingredients: ["Ceramide NP", "Squalane", "Shea butter"]
    },
    {
      id: "oil",
      name: "Night Oil",
      cat: "treat",
      price: 44,
      desc: "A dry-touch oil for evening. Absorbs fast, never leaves a film.",
      ingredients: ["Squalane", "Rosehip", "Vitamin E"]
    },
    {
      id: "mist",
      name: "Reset Mist",
      cat: "hydrate",
      price: 20,
      desc: "A fine hydrating mist for mid-day. No fragrance, no stickiness.",
      ingredients: ["Glycerin", "Aloe", "Allantoin"]
    },
    {
      id: "balm",
      name: "Soft Balm",
      cat: "cleanse",
      price: 26,
      desc: "A melting cleansing balm for removing sunscreen and make-up gently.",
      ingredients: ["Sunflower wax", "Jojoba", "Vitamin E"]
    }
  ];

  var cart = window.VOYD.createCart("lumen", "$");
  var dialog = document.getElementById("product-dialog");
  var drawer = document.getElementById("cart-drawer");
  var checkout = document.getElementById("checkout-dialog");
  var active = null;

  var grid = document.getElementById("product-grid");
  var chipRow = document.querySelector(".filters");

  function cardArtHtml() {
    return '<div class="mini" aria-hidden="true"></div>';
  }

  function renderGrid(filter) {
    grid.innerHTML = "";
    products
      .filter(function (p) { return filter === "all" || p.cat === filter; })
      .forEach(function (p) {
        var card = document.createElement("article");
        card.className = "card";
        card.innerHTML =
          '<div class="card__art" data-cat="' + p.cat + '">' + cardArtHtml() + "</div>" +
          '<div class="card__body">' +
          '<span class="card__cat">' + p.cat + "</span>" +
          '<h3 class="card__name">' + p.name + "</h3>" +
          '<span class="card__price">' + cart.money(p.price) + "</span>" +
          '<p class="card__desc">' + p.desc + "</p>" +
          '<div class="card__actions">' +
          '<button class="btn btn--ink" type="button" data-view="' + p.id + '">View</button>' +
          '<button class="btn btn--ghost" type="button" data-add="' + p.id + '">Add</button>' +
          "</div></div>";
        grid.appendChild(card);
      });
  }

  chipRow.addEventListener("click", function (event) {
    var chip = event.target.closest(".chip");
    if (!chip) return;
    chipRow.querySelectorAll(".chip").forEach(function (c) {
      c.classList.toggle("is-active", c === chip);
      c.setAttribute("aria-selected", String(c === chip));
    });
    renderGrid(chip.dataset.filter);
  });

  grid.addEventListener("click", function (event) {
    var view = event.target.closest("[data-view]");
    var add = event.target.closest("[data-add]");
    if (view) openProduct(view.dataset.view);
    if (add) {
      var p = products.find(function (x) { return x.id === add.dataset.add; });
      if (p) {
        cart.add(p, 1);
        flash("Added " + p.name + " to cart.");
      }
    }
  });

  function openProduct(id) {
    active = products.find(function (p) { return p.id === id; });
    if (!active) return;
    document.getElementById("pd-category").textContent = active.cat;
    document.getElementById("pd-title").textContent = active.name;
    document.getElementById("pd-price").textContent = cart.money(active.price);
    document.getElementById("pd-desc").textContent = active.desc;
    var ing = document.getElementById("pd-ingredients");
    ing.innerHTML = "";
    active.ingredients.forEach(function (i) {
      var li = document.createElement("li");
      li.textContent = i;
      ing.appendChild(li);
    });
    document.getElementById("pd-art").innerHTML = '<div class="mini" aria-hidden="true"></div>';
    document.getElementById("pd-qty").value = "1";
    dialog.showModal();
  }

  document.getElementById("pd-add").addEventListener("click", function () {
    if (!active) return;
    var qty = parseInt(document.getElementById("pd-qty").value, 10) || 1;
    cart.add(active, qty);
    dialog.close();
    flash("Added " + qty + " × " + active.name + " to cart.");
  });
  document.getElementById("pd-close").addEventListener("click", function () { dialog.close(); });

  function openCart() { drawer.hidden = false; renderCart(); document.body.style.overflow = "hidden"; }
  function closeCart() { drawer.hidden = true; document.body.style.overflow = ""; }
  document.getElementById("cart-open").addEventListener("click", openCart);
  drawer.querySelectorAll("[data-cart-close]").forEach(function (n) { n.addEventListener("click", closeCart); });

  function renderCart() {
    var box = document.getElementById("cart-items");
    var items = cart.items();
    box.innerHTML = "";
    if (!items.length) {
      box.innerHTML = '<p class="cart-empty">Your cart is empty. Add a product to get started.</p>';
    } else {
      items.forEach(function (it, index) {
        var row = document.createElement("div");
        row.className = "cart-item";
        row.innerHTML =
          '<span class="cart-item__name">' + it.name + "</span>" +
          '<span class="cart-item__meta">' + cart.money(it.price) + "</span>" +
          '<div class="cart-item__row">' +
          '<label class="tiny">Qty <input type="number" min="0" max="9" value="' + it.qty + '" data-qty="' + index + '"></label>' +
          '<button class="cart-item__remove" type="button" data-remove="' + index + '">Remove</button>' +
          "</div>";
        box.appendChild(row);
      });
    }
    document.getElementById("cart-total").textContent = cart.money(cart.total());
    document.getElementById("cart-count").textContent = String(cart.count());
    var checkoutBtn = document.getElementById("checkout-open");
    checkoutBtn.disabled = !items.length;
  }

  document.getElementById("cart-items").addEventListener("input", function (event) {
    var input = event.target.closest("[data-qty]");
    if (!input) return;
    cart.setQty(parseInt(input.dataset.qty, 10), input.value);
  });
  document.getElementById("cart-items").addEventListener("click", function (event) {
    var btn = event.target.closest("[data-remove]");
    if (btn) cart.remove(parseInt(btn.dataset.remove, 10));
  });

  document.addEventListener("voyd:cart", renderCart);

  document.getElementById("checkout-open").addEventListener("click", function () {
    closeCart();
    checkout.showModal();
  });
  document.getElementById("co-close").addEventListener("click", function () { checkout.close(); });

  window.VOYD.bindDemoCheckout(document.getElementById("checkout-form"), cart, {
    message: "Demo order placed. No payment was taken and no real order was created — this is a concept storefront."
  });

  function flash(message) {
    var toast = document.createElement("div");
    toast.className = "toast-flash";
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add("is-on"); });
    setTimeout(function () {
      toast.classList.remove("is-on");
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

  renderGrid("all");
  renderCart();
})();
