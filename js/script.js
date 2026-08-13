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
    var optionsMount = document.getElementById("filter-options");
    var countBadge = document.getElementById("filter-count");
    var selectAllBtn = document.getElementById("filter-select-all");
    var clearBtn = document.getElementById("filter-clear");

    // Build the unique, sorted list of individual owners (split combined "A, B" cells)
    var ownerSet = {};
    SCHEDULE_DATA.forEach(function (row) {
      if (!row.owner) return;
      row.owner.split(",").forEach(function (name) {
        name = name.trim();
        if (name) ownerSet[name] = true;
      });
    });
    var owners = Object.keys(ownerSet).sort(function (a, b) {
      return a.localeCompare(b);
    });

    var selected = {}; // empty = show all
    owners.forEach(function (o) { selected[o] = true; });

    function renderOptions() {
      optionsMount.innerHTML = owners.map(function (o) {
        var id = "owner-" + o.replace(/[^a-z0-9]/gi, "");
        return (
          '<label class="filter-option" for="' + id + '">' +
            '<input type="checkbox" id="' + id + '" data-owner="' + o.replace(/"/g, "&quot;") + '" ' + (selected[o] ? "checked" : "") + '>' +
            '<span>' + o + '</span>' +
          '</label>'
        );
      }).join("");

      optionsMount.querySelectorAll("input[type=checkbox]").forEach(function (cb) {
        cb.addEventListener("change", function () {
          selected[cb.getAttribute("data-owner")] = cb.checked;
          updateCountBadge();
          renderTimeline();
        });
      });
    }

    function updateCountBadge() {
      var activeCount = owners.filter(function (o) { return selected[o]; }).length;
      if (activeCount === owners.length || activeCount === 0) {
        countBadge.textContent = "All";
      } else {
        countBadge.textContent = activeCount;
      }
    }

    function rowMatches(row) {
      var activeCount = owners.filter(function (o) { return selected[o]; }).length;
      if (activeCount === owners.length || activeCount === 0) return true; // no filter = show all
      if (!row.owner) return false;
      var rowOwners = row.owner.split(",").map(function (s) { return s.trim(); });
      return rowOwners.some(function (o) { return selected[o]; });
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
      list.innerHTML = rows.map(function (row) {
        var isBuffer = row.event.toUpperCase().indexOf("BUFFER") !== -1;
        var metaBits = [];
        if (row.owner) metaBits.push("<strong>" + row.owner + "</strong>");
        if (row.people) metaBits.push(row.people);
        var meta = metaBits.length ? '<div class="timeline-meta">' + metaBits.join(" &middot; ") + '</div>' : "";
        return (
          '<li class="timeline-item' + (isBuffer ? " is-buffer" : "") + '">' +
            '<div class="timeline-time">' + formatTime(row.time) + '</div>' +
            '<div class="timeline-event">' + row.event + '</div>' +
            meta +
          '</li>'
        );
      }).join("");
    }

    toggle.addEventListener("click", function () {
      var isOpen = panel.classList.contains("is-open");
      panel.classList.toggle("is-open", !isOpen);
      toggle.setAttribute("aria-expanded", String(!isOpen));
    });

    selectAllBtn.addEventListener("click", function () {
      owners.forEach(function (o) { selected[o] = true; });
      renderOptions();
      updateCountBadge();
      renderTimeline();
    });

    clearBtn.addEventListener("click", function () {
      owners.forEach(function (o) { selected[o] = false; });
      renderOptions();
      updateCountBadge();
      renderTimeline();
    });

    renderOptions();
    updateCountBadge();
    renderTimeline();
  }

  /* ---------------- Family portrait list: checkboxes, synced across devices ---------------- */
  function initFamilyList() {
    var container = document.getElementById("family-list");
    if (!container) return;

    var STORAGE_KEY = "sb-wedding-portrait-checklist";
    var config = (typeof SYNC_CONFIG !== "undefined") ? SYNC_CONFIG : {};
    var syncEnabled = !!(config.binId && config.apiKey);
    var binUrl = "https://api.jsonbin.io/v3/b/" + config.binId;

    var state = {};
    try {
      state = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      state = {};
    }

    var checkboxes = Array.prototype.slice.call(container.querySelectorAll("input[type=checkbox]"));
    var progressFill = document.getElementById("progress-fill");
    var progressLabel = document.getElementById("progress-label-count");
    var statusEl = document.getElementById("sync-status");

    function saveLocal() {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) { /* storage unavailable — state still works for this session */ }
    }

    function setStatus(kind) {
      if (!statusEl) return;
      statusEl.classList.remove("is-synced", "is-saving", "is-offline");
      if (kind === "loading") {
        statusEl.innerHTML = '<span class="dot"></span>Loading shared progress&hellip;';
      } else if (kind === "saving") {
        statusEl.classList.add("is-saving");
        statusEl.innerHTML = '<span class="dot"></span>Saving&hellip;';
      } else if (kind === "synced") {
        statusEl.classList.add("is-synced");
        statusEl.innerHTML = '<span class="dot"></span>Synced with both coordinators';
      } else if (kind === "offline") {
        statusEl.classList.add("is-offline");
        statusEl.innerHTML = '<span class="dot"></span>Offline &mdash; saved on this device only';
      } else if (kind === "local-only") {
        statusEl.innerHTML = '<span class="dot"></span>Saved on this device only';
      } else {
        statusEl.innerHTML = "";
      }
    }

    function fetchRemoteState() {
      return fetch(binUrl + "/latest", {
        headers: { "X-Access-Key": config.apiKey }
      }).then(function (res) {
        if (!res.ok) throw new Error("jsonbin GET failed: " + res.status);
        return res.json();
      }).then(function (data) {
        return (data && data.record) ? data.record : {};
      });
    }

    function putRemoteState(newState) {
      return fetch(binUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Access-Key": config.apiKey
        },
        body: JSON.stringify(newState)
      }).then(function (res) {
        if (!res.ok) throw new Error("jsonbin PUT failed: " + res.status);
        return newState;
      });
    }

    function applyStateToCheckboxes() {
      checkboxes.forEach(function (cb) {
        var shot = cb.getAttribute("data-shot");
        var checked = !!state[shot];
        cb.checked = checked;
        cb.closest(".shot-row").classList.toggle("is-done", checked);
      });
      updateProgress();
    }

    function updateProgress() {
      var total = checkboxes.length;
      var done = checkboxes.filter(function (cb) { return cb.checked; }).length;
      if (progressFill) progressFill.style.width = (total ? (done / total * 100) : 0) + "%";
      if (progressLabel) progressLabel.textContent = done + " of " + total + " shots taken";
    }

    checkboxes.forEach(function (cb) {
      cb.addEventListener("change", function () {
        var shot = cb.getAttribute("data-shot");
        var checked = cb.checked;

        state[shot] = checked;
        cb.closest(".shot-row").classList.toggle("is-done", checked);
        updateProgress();
        saveLocal();

        if (!syncEnabled) {
          setStatus("local-only");
          return;
        }

        setStatus("saving");
        // Re-fetch the latest shared state first so a change made on the other
        // coordinator's phone in the meantime doesn't get overwritten — only
        // this one shot's value is merged in before saving back.
        fetchRemoteState()
          .then(function (remote) {
            remote[shot] = checked;
            return putRemoteState(remote);
          })
          .then(function (merged) {
            state = merged;
            saveLocal();
            setStatus("synced");
          })
          .catch(function () {
            setStatus("offline");
          });
      });
    });

    if (syncEnabled) {
      setStatus("loading");
      fetchRemoteState()
        .then(function (remote) {
          state = remote;
          saveLocal();
          applyStateToCheckboxes();
          setStatus("synced");
        })
        .catch(function () {
          // No connection / bin unreachable — fall back to this device's local copy
          applyStateToCheckboxes();
          setStatus("offline");
        });
    } else {
      applyStateToCheckboxes();
      setStatus("local-only");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    injectHeader();
    injectFooter();
    initSchedule();
    initFamilyList();
  });
})();
