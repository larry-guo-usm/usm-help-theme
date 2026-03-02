window.addEventListener("DOMContentLoaded", function () {
  var iconList = document.querySelector(".blocks-list[data-icon1]");
  if (iconList) {
    var items = iconList.querySelectorAll(".blocks-item");
    items.forEach(function (item, index) {
      var n = index + 1;

      var iconUrl = iconList.dataset["icon" + n];
      if (iconUrl) {
        var iconDiv = item.querySelector(".blocks-item-icon");
        if (iconDiv) {
          var img = document.createElement("img");
          img.src = iconUrl;
          img.alt = "";
          img.setAttribute("aria-hidden", "true");
          iconDiv.innerHTML = "";
          iconDiv.appendChild(img);
        }
      }

      var descText = iconList.dataset["desc" + n];
      if (descText) {
        var descSpan = item.querySelector(".blocks-item-description");
        if (descSpan) {
          descSpan.textContent = descText;
        }
      }
    });
    iconList.classList.add("is-ready");
  }

  var links = document.querySelectorAll("a[data-section-id]");
  if (!links.length) return;

  var localeMatch = window.location.pathname.match(/\/hc\/([^/]+)\//);
  var locale = localeMatch ? localeMatch[1] : "en-us";
  var base = "/api/v2/help_center/" + locale;

  function cachedFetch(url) {
    var key = "hsl:" + url;
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

  links.forEach(function (link) {
    var sectionId = link.dataset.sectionId;
    cachedFetch(
      base + "/sections/" + sectionId + "/articles.json?per_page=1&sort_by=position"
    )
      .then(function (data) {
        if (data.articles && data.articles[0]) {
          link.href = data.articles[0].html_url;
        }
      })
      .catch(function (err) {
        console.error("[home-section-links]", err);
      });
  });
});
