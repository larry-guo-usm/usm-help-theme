window.addEventListener("DOMContentLoaded", function () {
  var nav = document.getElementById("sections-subnav");
  if (!nav) return;

  var currentSectionId = parseInt(nav.dataset.sectionId, 10);

  // Extract locale from the page URL (/hc/en-us/...) — more reliable than lang attr
  var localeMatch = window.location.pathname.match(/\/hc\/([^/]+)\//);
  var locale = localeMatch ? localeMatch[1] : "en-us";
  var base = "/api/v2/help_center/" + locale;

  var CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  function apiFetch(url) {
    var key = "subnav:" + url;
    try {
      var entry = sessionStorage.getItem(key);
      if (entry) {
        var parsed = JSON.parse(entry);
        if (Date.now() - parsed.ts < CACHE_TTL) {
          return Promise.resolve(parsed.data);
        }
      }
    } catch (_) {}
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("fetch failed: " + r.status + " " + url);
        return r.json();
      })
      .then(function (data) {
        try {
          sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), data: data }));
        } catch (_) {}
        return data;
      });
  }

  var currentSection = null;

  apiFetch(base + "/sections/" + currentSectionId + ".json")
    .then(function (data) {
      currentSection = data.section;
      var categoryId = data.section.category_id;
      return Promise.all([
        apiFetch(
          base + "/categories/" + categoryId + "/sections.json?per_page=100"
        ),
        apiFetch(
          base +
            "/categories/" +
            categoryId +
            "/articles.json?per_page=100&sort_by=position"
        ),
      ]);
    })
    .then(function (results) {
      var sectionsData = results[0];
      var articlesData = results[1];

      // Build map: section_id → first article html_url (articles are sorted by
      // position, so the first occurrence per section is the first article)
      var firstArticleUrl = {};
      articlesData.articles.forEach(function (a) {
        if (!firstArticleUrl[a.section_id]) {
          firstArticleUrl[a.section_id] = a.html_url;
        }
      });

      // Populate desktop subnav
      var inner = nav.querySelector(".sections-subnav-inner");
      sectionsData.sections.forEach(function (s) {
        var a = document.createElement("a");
        a.href = firstArticleUrl[s.id] || s.html_url;
        a.textContent = s.name;
        a.className =
          "sections-subnav-link" +
          (s.id === currentSectionId ? " is-active" : "");
        inner.appendChild(a);
      });

      // Populate sidebar section picker (below desktop breakpoint)
      var picker = document.getElementById("sidebar-section-picker");
      if (!picker) return;

      var label = picker.querySelector(".sidebar-section-picker-label");
      if (label && currentSection) label.textContent = currentSection.name;

      var dropdown = picker.querySelector(".sidebar-section-picker-dropdown");
      sectionsData.sections.forEach(function (s) {
        var a = document.createElement("a");
        a.href = firstArticleUrl[s.id] || s.html_url;
        a.textContent = s.name;
        a.className =
          "sidebar-section-picker-option" +
          (s.id === currentSectionId ? " is-active" : "");
        dropdown.appendChild(a);
      });

      var btn = picker.querySelector(".sidebar-section-picker-btn");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var isOpen = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", String(!isOpen));
        picker.classList.toggle("is-open", !isOpen);
      });

      document.addEventListener("click", function (e) {
        if (!picker.contains(e.target)) {
          btn.setAttribute("aria-expanded", "false");
          picker.classList.remove("is-open");
        }
      });
    })
    .catch(function (err) {
      console.error("[sections-subnav]", err);
    });
});
