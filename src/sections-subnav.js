window.addEventListener("DOMContentLoaded", function () {
  var nav = document.getElementById("sections-subnav");
  if (!nav) return;

  var currentSectionId = parseInt(nav.dataset.sectionId, 10);

  // Extract locale from the page URL (/hc/en-us/...) — more reliable than lang attr
  var localeMatch = window.location.pathname.match(/\/hc\/([^/]+)\//);
  var locale = localeMatch ? localeMatch[1] : "en-us";
  var base = "/api/v2/help_center/" + locale;

  function cachedFetch(url) {
    var key = "subnav:" + url;
    try {
      var cached = sessionStorage.getItem(key);
      if (cached) return Promise.resolve(JSON.parse(cached));
    } catch (_) {}
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("fetch failed: " + r.status + " " + url);
        return r.json();
      })
      .then(function (data) {
        try {
          sessionStorage.setItem(key, JSON.stringify(data));
        } catch (_) {}
        return data;
      });
  }

  cachedFetch(base + "/sections/" + currentSectionId + ".json")
    .then(function (data) {
      var categoryId = data.section.category_id;
      return Promise.all([
        cachedFetch(
          base + "/categories/" + categoryId + "/sections.json?per_page=100"
        ),
        cachedFetch(
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
    })
    .catch(function (err) {
      console.error("[sections-subnav]", err);
    });
});
