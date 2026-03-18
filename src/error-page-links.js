window.addEventListener("DOMContentLoaded", function () {
  var list = document.querySelector(".error-page-sections .blocks-list");
  if (!list) return;

  var localeMatch = window.location.pathname.match(/\/hc\/([^/]+)\//);
  var locale = localeMatch ? localeMatch[1] : "en-us";

  var iconSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

  fetch("/api/v2/help_center/" + locale + "/sections.json")
    .then(function (r) {
      if (!r.ok) throw new Error("fetch failed: " + r.status);
      return r.json();
    })
    .then(function (data) {
      var sections = data.sections || [];
      sections.forEach(function (section, index) {
        var n = index + 1;
        var iconUrl = list.dataset["icon" + n];
        var descText = list.dataset["desc" + n];

        var li = document.createElement("li");
        li.className = "blocks-item";

        var a = document.createElement("a");
        a.href = section.html_url;
        a.className = "blocks-item-link";

        var iconDiv = document.createElement("div");
        iconDiv.className = "blocks-item-icon";
        if (iconUrl) {
          var img = document.createElement("img");
          img.src = iconUrl;
          img.alt = "";
          img.setAttribute("aria-hidden", "true");
          iconDiv.appendChild(img);
        } else {
          iconDiv.innerHTML = iconSvg;
        }

        var title = document.createElement("span");
        title.className = "blocks-item-title";
        title.textContent = section.name;

        var desc = document.createElement("span");
        desc.className = "blocks-item-description";
        desc.textContent = descText || section.description || "";

        a.appendChild(iconDiv);
        a.appendChild(title);
        a.appendChild(desc);
        li.appendChild(a);
        list.appendChild(li);
      });
    })
    .catch(function (err) {
      console.error("[error-page-links]", err);
    });
});
