/* ==========================================================================
   Sara & Ben — Wedding Plan Site
   Shared script: nav injection, mobile menu, schedule filter, portrait list
   ========================================================================== */

(function () {
  "use strict";

  var PAGES = [
    { href: "index.html", label: "Home" },
    { href: "schedule.html", label: "Schedule" },
    { href: "ceremony.html", label: "Ceremony Details" },
    { href: "location.html", label: "Location Info" },
    { href: "contacts.html", label: "Contacts" },
    { href: "food.html", label: "Food & Drinks" },
    { href: "family.html", label: "Family Portrait List" }
  ];

  /* ---------------- Header + nav menu ---------------- */
  function injectHeader() {
    var mount = document.getElementById("site-header-mount");
    if (!mount) return;

    var current = document.body.getAttribute("data-page") || "index.html";

    var linksHtml = PAGES.map(function (p) {
      var active = p.href === current ? ' is-active" aria-current="page' : '"';
      return '<li><a class="' + (p.href === current ? "is-active" : "") + '" href="' + p.href + '"' +
        (p.href === current ? ' aria-current="page"' : "") + ">" + p.label + "</a></li>";
    }).join("");

    mount.innerHTML =
      '<header class="site-header">' +
        '<div class="header-inner">' +
          '<a class="brand" href="index.html">' +
            '<img class="brand-logo" src="images/logo.png" alt="Sara and Ben logo">' +
            '<span class="brand-text">Plan Site</span>' +
          '</a>' +
          '<button class="menu-toggle" id="menu-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="site-menu">' +
            '<span></span><span></span><span></span>' +
          '</button>' +
        '</div>' +
      '</header>' +
      '<nav class="site-menu" id="site-menu" aria-hidden="true">' +
        '<ul>' + linksHtml + '</ul>' +
      '</nav>' +
      '<div class="menu-overlay" id="menu-overlay"></div>';

    var toggle = document.getElementById("menu-toggle");
    var menu = document.getElementById("site-menu");
    var overlay = document.getElementById("menu-overlay");

    function closeMenu() {
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("is-open");
      menu.setAttribute("aria-hidden", "true");
      overlay.classList.remove("is-open");
      document.body.classList.remove("menu-locked");
    }

    function openMenu() {
      toggle.setAttribute("aria-expanded", "true");
      menu.classList.add("is-open");
      menu.setAttribute("aria-hidden", "false");
      overlay.classList.add("is-open");
      document.body.classList.add("menu-locked");
    }

    toggle.addEventListener("click", function () {
      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });

    overlay.addEventListener("click", closeMenu);

    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMenu();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------------- Footer ---------------- */
  function injectFooter() {
    var mount = document.getElementById("site-footer-mount");
    if (!mount) return;
    mount.innerHTML =
      '<footer class="site-footer">' +
        '<p class="footer-names">Sara &amp; Ben</p>' +
        '<p>October 3, 2026 &middot; Wedding Coordinator Site</p>' +
      '</footer>';
  }

  /* ---------------- Schedule page: filter + timeline render ---------------- */
  function initSchedule() {
    var list = document.getElementById("timeline-list");
    if (!list || typeof SCHEDULE_DATA === "undefined") return;

    var toggle = document.getElementById("filter-toggle");
    var panel = document.getElementById("filter-panel");
    var countBadge = document.getElementById("filter-count");
    var selectAllBtn = document.getElementById("filter-select-all");
    var clearBtn = document.getElementById("filter-clear");
    var tabOwner = document.getElementById("filter-tab-owner");
    var tabPeople = document.getElementById("filter-tab-people");
    var groupOwner = document.getElementById("filter-group-owner");
    var groupPeople = document.getElementById("filter-group-people");

    // Pull the unique, sorted set of individual names out of a column,
    // splitting combined cells like "Casey S, Garrett S".
    function uniqueNames(field) {
      var set = {};
      SCHEDULE_DATA.forEach(function (row) {
        if (!row[field]) return;
        row[field].split(",").forEach(function (name) {
          name = name.trim();
          if (name) set[name] = true;
        });
      });
      return Object.keys(set).sort(function (a, b) { return a.localeCompare(b); });
    }

    var owners = uniqueNames("owner");
    var peopleNames = uniqueNames("people");

    var selectedOwner = {};
    owners.forEach(function (o) { selectedOwner[o] = true; });
    var selectedPeople = {};
    peopleNames.forEach(function (p) { selectedPeople[p] = true; });

    var activeTab = "owner";

    function renderGroup(mount, names, selectedMap, prefix) {
      mount.innerHTML = names.map(function (name) {
        var id = prefix + "-" + name.replace(/[^a-z0-9]/gi, "");
        return (
          '<label class="filter-option" for="' + id + '">' +
            '<input type="checkbox" id="' + id + '" data-name="' + name.replace(/"/g, "&quot;") + '" ' + (selectedMap[name] ? "checked" : "") + '>' +
            '<span>' + name + '</span>' +
          '</label>'
        );
      }).join("");

      mount.querySelectorAll("input[type=checkbox]").forEach(function (cb) {
        cb.addEventListener("change", function () {
          selectedMap[cb.getAttribute("data-name")] = cb.checked;
          updateCountBadge();
          renderTimeline();
        });
      });
    }

    function isRestricted(names, selectedMap) {
      var activeCount = names.filter(function (n) { return selectedMap[n]; }).length;
      return activeCount > 0 && activeCount < names.length;
    }

    function updateCountBadge() {
      var restricted = isRestricted(owners, selectedOwner) || isRestricted(peopleNames, selectedPeople);
      countBadge.textContent = restricted ? "Filtered" : "All";
    }

    function rowMatchesGroup(row, field, names, selectedMap) {
      if (!isRestricted(names, selectedMap)) return true; // no restriction on this facet
      if (!row[field]) return false;
      var rowNames = row[field].split(",").map(function (s) { return s.trim(); });
      return rowNames.some(function (n) { return selectedMap[n]; });
    }

    function rowMatches(row) {
      return rowMatchesGroup(row, "owner", owners, selectedOwner) &&
             rowMatchesGroup(row, "people", peopleNames, selectedPeople);
    }

    function formatTime(t) {
      var parts = t.split(":");
      var h = parseInt(parts[0], 10);
      var m = parts[1];
      var suffix = h >= 12 ? "PM" : "AM";
      var h12 = h % 12;
      if (h12 === 0) h12 = 12;
      return h12 + ":" + m + " " + suffix;
    }

    function renderTimeline() {
      var rows = SCHEDULE_DATA.filter(rowMatches);
      if (rows.length === 0) {
        list.innerHTML = '<p class="empty-state">No events match the selected filters.</p>';
        return;
      }

      var html = "";
      var lastPhase = null;
      rows.forEach(function (row) {
        if (row.phase && row.phase !== lastPhase) {
          html += '<li class="phase-heading"><span class="phase-heading-inner">' + row.phase + '</span></li>';
          lastPhase = row.phase;
        }

        var metaBits = [];
        if (row.owner) metaBits.push("<strong>" + row.owner + "</strong>");
        if (row.people) metaBits.push(row.people);
        var meta = metaBits.length ? '<div class="timeline-meta">' + metaBits.join(" &middot; ") + '</div>' : "";
        var keyBadge = row.key ? '<span class="key-badge">Key</span>' : "";

        html += (
          '<li class="timeline-item' + (row.key ? " is-key" : "") + '">' +
            '<div class="timeline-time">' + formatTime(row.time) + '</div>' +
            '<div class="timeline-event">' + row.event + keyBadge + '</div>' +
            meta +
          '</li>'
        );
      });
      list.innerHTML = html;
    }

    function switchTab(tab) {
      activeTab = tab;
      tabOwner.classList.toggle("is-active", tab === "owner");
      tabPeople.classList.toggle("is-active", tab === "people");
      groupOwner.classList.toggle("is-active", tab === "owner");
      groupPeople.classList.toggle("is-active", tab === "people");
    }

    tabOwner.addEventListener("click", function () { switchTab("owner"); });
    tabPeople.addEventListener("click", function () { switchTab("people"); });

    toggle.addEventListener("click", function () {
      var isOpen = panel.classList.contains("is-open");
      panel.classList.toggle("is-open", !isOpen);
      toggle.setAttribute("aria-expanded", String(!isOpen));
    });

    selectAllBtn.addEventListener("click", function () {
      if (activeTab === "owner") {
        owners.forEach(function (o) { selectedOwner[o] = true; });
        renderGroup(groupOwner, owners, selectedOwner, "owner");
      } else {
        peopleNames.forEach(function (p) { selectedPeople[p] = true; });
        renderGroup(groupPeople, peopleNames, selectedPeople, "people");
      }
      updateCountBadge();
      renderTimeline();
    });

    clearBtn.addEventListener("click", function () {
      if (activeTab === "owner") {
        owners.forEach(function (o) { selectedOwner[o] = false; });
        renderGroup(groupOwner, owners, selectedOwner, "owner");
      } else {
        peopleNames.forEach(function (p) { selectedPeople[p] = false; });
        renderGroup(groupPeople, peopleNames, selectedPeople, "people");
      }
      updateCountBadge();
      renderTimeline();
    });

    renderGroup(groupOwner, owners, selectedOwner, "owner");
    renderGroup(groupPeople, peopleNames, selectedPeople, "people");
    updateCountBadge();
    renderTimeline();
  }

  /* ---------------- Family portrait list: checkboxes, saved on this device ---------------- */
  function initFamilyList() {
    var container = document.getElementById("family-list");
    if (!container) return;

    var STORAGE_KEY = "sb-wedding-portrait-checklist";
    var state = {};
    try {
      state = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      state = {};
    }

    var checkboxes = Array.prototype.slice.call(container.querySelectorAll("input[type=checkbox]"));

    function saveLocal() {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) { /* storage unavailable — state still works for this session */ }
    }

    checkboxes.forEach(function (cb) {
      var shot = cb.getAttribute("data-shot");
      var checked = !!state[shot];
      cb.checked = checked;
      cb.closest(".shot-row").classList.toggle("is-done", checked);

      cb.addEventListener("change", function () {
        state[shot] = cb.checked;
        cb.closest(".shot-row").classList.toggle("is-done", cb.checked);
        saveLocal();
      });
    });
  }

  /* ---------------- Photo gallery lightbox (used on the Location Info page) ---------------- */
  function initGallery() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".gallery-item"));
    var lightbox = document.getElementById("lightbox");
    if (!items.length || !lightbox) return;

    var img = document.getElementById("lightbox-img");
    var caption = document.getElementById("lightbox-caption");
    var closeBtn = document.getElementById("lightbox-close");
    var prevBtn = document.getElementById("lightbox-prev");
    var nextBtn = document.getElementById("lightbox-next");
    var current = 0;

    function show(index) {
      current = (index + items.length) % items.length;
      var item = items[current];
      img.src = item.getAttribute("data-full") || item.querySelector("img").src;
      img.alt = item.querySelector("img").alt || "";
      caption.textContent = item.getAttribute("data-caption") || "";
    }

    function open(index) {
      show(index);
      lightbox.classList.add("is-open");
      document.body.classList.add("menu-locked");
    }

    function close() {
      lightbox.classList.remove("is-open");
      document.body.classList.remove("menu-locked");
    }

    items.forEach(function (item, index) {
      item.addEventListener("click", function () { open(index); });
    });

    closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) close();
    });
    prevBtn.addEventListener("click", function () { show(current - 1); });
    nextBtn.addEventListener("click", function () { show(current + 1); });

    document.addEventListener("keydown", function (e) {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    injectHeader();
    injectFooter();
    initSchedule();
    initFamilyList();
    initGallery();
  });
})();
