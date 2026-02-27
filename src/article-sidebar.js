window.addEventListener("DOMContentLoaded", function () {
  var aside = document.querySelector(".article-sidebar[data-section-id]");
  if (!aside) return;

  var sectionId = aside.getAttribute("data-section-id");
  var articleId = aside.getAttribute("data-article-id");
  var locale = aside.getAttribute("data-locale") || "en-us";
  var enhanced = document.getElementById("article-sidebar-enhanced");
  var fallback = document.getElementById("article-sidebar-fallback");

  if (!sectionId || !enhanced) return;

  var CACHE_KEY = "usm_sidebar_" + sectionId;
  var CACHE_TTL = 60 * 60 * 1000; // 1 hour

  function readCache() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (Date.now() - entry.ts > CACHE_TTL) {
        localStorage.removeItem(CACHE_KEY);
        return null;
      }
      return entry.data;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: data }));
    } catch (e) {
      // localStorage unavailable or full — silently skip
    }
  }

  function render(sections, articles) {
    // Group articles by section_id
    var articlesBySection = {};
    articles.forEach(function (article) {
      var sid = String(article.section_id);
      if (!articlesBySection[sid]) articlesBySection[sid] = [];
      articlesBySection[sid].push(article);
    });

    var nav = document.createElement("nav");
    nav.setAttribute("aria-label", "In this category");

    sections.forEach(function (section) {
      var sid = String(section.id);
      var sectionArticles = articlesBySection[sid] || [];

      var group = document.createElement("div");
      group.className = "sidebar-section-group";

      var heading = document.createElement("p");
      heading.className = "sidebar-section-title";
      heading.textContent = section.name;

      var ul = document.createElement("ul");
      ul.className = "sidebar-section-articles";

      sectionArticles.forEach(function (article) {
        var isCurrent = String(article.id) === String(articleId);
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = article.html_url;
        a.className = "sidenav-item" + (isCurrent ? " current-article" : "");
        if (isCurrent) a.setAttribute("aria-current", "page");
        a.textContent = article.title;
        li.appendChild(a);
        ul.appendChild(li);
      });

      group.appendChild(heading);
      group.appendChild(ul);
      nav.appendChild(group);
    });

    enhanced.appendChild(nav);
    enhanced.removeAttribute("hidden");
    if (fallback) fallback.style.display = "none";
  }

  // Render immediately from cache if available
  var cached = readCache();
  if (cached) {
    render(cached.sections, cached.articles);
    return;
  }

  // Otherwise fetch, render, and cache
  fetch("/api/v2/help_center/" + locale + "/sections/" + sectionId + ".json")
    .then(function (res) { return res.json(); })
    .then(function (data) {
      var categoryId = data.section && data.section.category_id;
      if (!categoryId) return;

      return Promise.all([
        fetch(
          "/api/v2/help_center/" + locale + "/categories/" + categoryId + "/sections.json"
        ).then(function (res) { return res.json(); }),
        fetch(
          "/api/v2/help_center/" + locale + "/categories/" + categoryId + "/articles.json?per_page=100"
        ).then(function (res) { return res.json(); }),
      ]);
    })
    .then(function (results) {
      if (!results) return;

      var sections = (results[0] && results[0].sections) || [];
      var articles = (results[1] && results[1].articles) || [];

      render(sections, articles);
      writeCache({ sections: sections, articles: articles });
    })
    .catch(function () {
      // Fail silently — fallback server-rendered sidebar remains visible
    });
});
