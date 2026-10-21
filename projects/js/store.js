/* VOYD CORP concept projects — shared demo helpers.
   Zero dependencies. Each project opts in. Nothing here is tied to a real backend:
   carts live in localStorage and checkouts are clearly labelled demo flows. */
(function () {
  "use strict";

  var KEY = "voyd.demo.cart.";

  function loadCart(ns) {
    try {
      return JSON.parse(localStorage.getItem(KEY + ns) || "[]");
    } catch (e) {
      return [];
    }
  }

  function saveCart(ns, items) {
    try {
      localStorage.setItem(KEY + ns, JSON.stringify(items));
    } catch (e) {
      /* storage unavailable: cart simply stays in memory for this page */
    }
  }

  function money(value, currency) {
    var symbol = currency || "$";
    return symbol + value.toFixed(2);
  }

  function createCart(namespace, currency) {
    var items = loadCart(namespace);

    function total() {
      return items.reduce(function (sum, it) {
        return sum + it.price * it.qty;
      }, 0);
    }

    function count() {
      return items.reduce(function (sum, it) {
        return sum + it.qty;
      }, 0);
    }

    function emit() {
      saveCart(namespace, items);
      document.dispatchEvent(
        new CustomEvent("voyd:cart", { detail: { items: items.slice(), total: total(), count: count() } })
      );
    }

    return {
      items: function () {
        return items.slice();
      },
      count: count,
      total: total,
      money: function (v) {
        return money(v, currency);
      },
      add: function (product, qty) {
        var n = Math.max(1, parseInt(qty, 10) || 1);
        var existing = items.find(function (it) {
          return it.id === product.id && it.variant === product.variant;
        });
        if (existing) existing.qty += n;
        else
          items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            variant: product.variant || "",
            qty: n
          });
        emit();
      },
      setQty: function (index, qty) {
        var n = parseInt(qty, 10) || 0;
        if (n <= 0) items.splice(index, 1);
        else items[index].qty = n;
        emit();
      },
      remove: function (index) {
        items.splice(index, 1);
        emit();
      },
      clear: function () {
        items = [];
        emit();
      }
    };
  }

  /* Minimal, honest form validation + demo-success rendering. */
  function bindForm(form, options) {
    if (!form) return null;
    var opts = options || {};
    var status = form.querySelector("[data-form-status]");

    function setStatus(message, state) {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = state || "";
      status.hidden = false;
    }

    function fieldError(control, message) {
      control.setAttribute("aria-invalid", "true");
      var note = control.parentElement.querySelector(".field-error");
      if (!note) {
        note = document.createElement("p");
        note.className = "field-error";
        control.parentElement.appendChild(note);
      }
      note.textContent = message;
    }

    function clearErrors() {
      form.querySelectorAll("[aria-invalid]").forEach(function (n) {
        n.removeAttribute("aria-invalid");
      });
      form.querySelectorAll(".field-error").forEach(function (n) {
        n.remove();
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors();
      var data = new FormData(form);
      var errors = [];
      var firstBad = null;

      form.querySelectorAll("[required]").forEach(function (control) {
        var value = (data.get(control.name) || "").toString().trim();
        if (!value) {
          fieldError(control, "This field is required.");
          errors.push(control.name);
          if (!firstBad) firstBad = control;
        } else if (control.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          fieldError(control, "Enter a valid email address.");
          errors.push(control.name);
          if (!firstBad) firstBad = control;
        }
      });

      if (errors.length) {
        setStatus(opts.errorMessage || "Please correct the highlighted fields.", "error");
        if (firstBad) firstBad.focus();
        return;
      }

      if (typeof opts.onSubmit === "function") {
        opts.onSubmit(data, { setStatus: setStatus, form: form });
      } else {
        setStatus(opts.successMessage || "Received. This is a demo — nothing was sent to a real business.", "success");
        form.reset();
      }
    });

    return { setStatus: setStatus };
  }

  /* Demo checkout: never collects real payment details. Validates required fields first. */
  function bindDemoCheckout(form, cart, options) {
    if (!form) return;
    var opts = options || {};
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var summary = form.querySelector("[data-order-summary]");
      var message = form.querySelector("[data-checkout-message]");

      form.querySelectorAll(".field-error").forEach(function (n) { n.remove(); });
      form.querySelectorAll("[aria-invalid]").forEach(function (n) { n.removeAttribute("aria-invalid"); });

      var data = new FormData(form);
      var firstBad = null;
      form.querySelectorAll("[required]").forEach(function (control) {
        var value = (data.get(control.name) || "").toString().trim();
        var message2 = null;
        if (!value) message2 = "This field is required.";
        else if (control.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message2 = "Enter a valid email address.";
        if (message2) {
          control.setAttribute("aria-invalid", "true");
          var note = document.createElement("p");
          note.className = "field-error";
          note.textContent = message2;
          control.parentElement.appendChild(note);
          if (!firstBad) firstBad = control;
        }
      });
      if (firstBad) {
        if (message) {
          message.hidden = false;
          message.dataset.state = "error";
          message.textContent = "Please correct the highlighted fields before placing the demo order.";
        }
        firstBad.focus();
        return;
      }

      if (!cart.items().length) {
        if (message) {
          message.hidden = false;
          message.dataset.state = "error";
          message.textContent = "Your cart is empty. Add a product before checking out.";
        }
        return;
      }
      if (summary) {
        summary.hidden = false;
        summary.innerHTML = "";
        var list = document.createElement("ul");
        cart.items().forEach(function (it) {
          var li = document.createElement("li");
          li.textContent = it.qty + " × " + it.name + (it.variant ? " (" + it.variant + ")" : "") + " — " + cart.money(it.price * it.qty);
          list.appendChild(li);
        });
        var totalLine = document.createElement("p");
        totalLine.className = "demo-order-total";
        totalLine.textContent = "Total: " + cart.money(cart.total());
        summary.appendChild(list);
        summary.appendChild(totalLine);
      }
      if (message) {
        message.hidden = false;
        message.dataset.state = "success";
        message.textContent =
          opts.message ||
          "Demo order placed successfully. No payment was taken and no real order was created — this is a concept storefront.";
      }
      cart.clear();
    });
  }

  window.VOYD = {
    createCart: createCart,
    bindForm: bindForm,
    bindDemoCheckout: bindDemoCheckout,
    money: money
  };
})();
