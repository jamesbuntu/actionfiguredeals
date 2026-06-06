/**
 * Loads obfuscated deal data from the embedded JSON block,
 * decodes keys, and renders a filterable card feed.
 */

(function () {
  "use strict";

  // Obfuscated key map: short key -> readable property
  var KEY_MAP = {
    t: "title",
    i: "image",
    p: "price",
    o: "oldPrice",
    d: "discount",
    c: "category",
    u: "url",
  };

  var CATEGORY_LABELS = {
    marvel: "Marvel Legends",
    starwars: "Star Wars Black Series",
    neca: "NECA",
    mcfarlane: "McFarlane",
    transformers: "Transformers",
    anime: "Anime figures",
    funko: "Funko",
  };

  var feedEl = document.getElementById("feed");
  var filtersEl = document.getElementById("filters");
  var sortEl = document.getElementById("sort");
  var updatedEl = document.getElementById("updated");

  function decodeDeal(raw) {
    var deal = {};
    for (var shortKey in raw) {
      if (Object.prototype.hasOwnProperty.call(raw, shortKey)) {
        var longKey = KEY_MAP[shortKey] || shortKey;
        deal[longKey] = raw[shortKey];
      }
    }
    return deal;
  }

  function formatPrice(amount) {
    return "$" + Number(amount).toFixed(2);
  }

  function decodeHtmlEntities(text) {
    var el = document.createElement("textarea");
    el.innerHTML = text;
    return el.value;
  }

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function displayText(text) {
    return escapeHtml(decodeHtmlEntities(text));
  }

  function sortDeals(deals) {
    var mode = sortEl ? sortEl.value : "discount-desc";
    var sorted = deals.slice();

    sorted.sort(function (a, b) {
      if (mode === "price-asc") {
        return a.price - b.price;
      }
      if (mode === "price-desc") {
        return b.price - a.price;
      }
      if (mode === "discount-asc") {
        return a.discount - b.discount;
      }
      return b.discount - a.discount;
    });

    return sorted;
  }

  function getSelectedCategories() {
    var checked = filtersEl.querySelectorAll('input[type="checkbox"]:checked');
    var categories = [];
    for (var i = 0; i < checked.length; i++) {
      categories.push(checked[i].value);
    }
    return categories;
  }

  function renderCard(deal) {
    var card = document.createElement("article");
    card.className = "card";
    card.dataset.category = deal.category;

    var label = CATEGORY_LABELS[deal.category] || deal.category;

    card.innerHTML =
      '<img class="card-image" src="' +
      escapeHtml(deal.image) +
      '" alt="" loading="lazy" width="88" height="88">' +
      '<div class="card-body">' +
      '<p class="card-category">' +
      escapeHtml(label) +
      "</p>" +
      '<h2 class="card-title">' +
      displayText(deal.title) +
      "</h2>" +
      '<div class="prices">' +
      '<span class="price-new">' +
      formatPrice(deal.price) +
      "</span>" +
      '<span class="price-old">' +
      formatPrice(deal.oldPrice) +
      "</span>" +
      '<span class="discount">-' +
      Math.round(deal.discount) +
      "%</span>" +
      "</div>" +
      '<a class="card-link" href="' +
      escapeHtml(deal.url) +
      '" target="_blank" rel="noopener noreferrer sponsored">View deal</a>' +
      "</div>";

    return card;
  }

  function renderFeed(deals) {
    feedEl.innerHTML = "";

    var selected = getSelectedCategories();

    if (selected.length === 0) {
      feedEl.innerHTML = '<p class="empty">Select at least one category.</p>';
      return;
    }

    var filtered = deals.filter(function (deal) {
      return selected.indexOf(deal.category) !== -1;
    });

    if (filtered.length === 0) {
      feedEl.innerHTML =
        '<p class="empty">No deals found for the selected categories.</p>';
      return;
    }

    filtered = sortDeals(filtered);

    for (var i = 0; i < filtered.length; i++) {
      feedEl.appendChild(renderCard(filtered[i]));
    }
  }

  function buildFilters(categories) {
    filtersEl.innerHTML = "";

    categories.forEach(function (cat) {
      var label = document.createElement("label");
      label.className = "filter-label";

      var input = document.createElement("input");
      input.type = "checkbox";
      input.value = cat.id;
      input.checked = true;

      input.addEventListener("change", function () {
        renderFeed(window.__deals);
      });

      label.appendChild(input);
      label.appendChild(document.createTextNode(cat.name));
      filtersEl.appendChild(label);
    });
  }

  function loadData() {
    var dataEl = document.getElementById("deal-data");
    if (!dataEl) {
      feedEl.innerHTML =
        '<p class="error">Deal data not found. Run generate.py to build the feed.</p>';
      return;
    }

    var payload;
    try {
      payload = JSON.parse(dataEl.textContent);
    } catch (err) {
      feedEl.innerHTML = '<p class="error">Could not parse deal data.</p>';
      return;
    }

    if (updatedEl && payload.u) {
      updatedEl.textContent = "Updated " + payload.u;
    }

    var rawDeals = payload.x || [];
    var deals = rawDeals.map(decodeDeal);
    window.__deals = deals;

    buildFilters(payload.c || []);

    if (sortEl) {
      sortEl.addEventListener("change", function () {
        renderFeed(window.__deals);
      });
    }

    renderFeed(deals);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadData);
  } else {
    loadData();
  }
})();
