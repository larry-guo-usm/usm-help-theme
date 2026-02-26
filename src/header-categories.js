window.addEventListener("DOMContentLoaded", function () {
  var nav = document.getElementById("header-categories-nav");
  if (!nav) return;

  var locale = nav.getAttribute("data-locale") || "en-us";
  var mobilePlaceholder = document.getElementById("mobile-categories-placeholder");

  fetch("/api/v2/help_center/" + locale + "/categories.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      var categories = data.categories || [];

      // Desktop header nav
      categories.forEach(function (category) {
        var a = document.createElement("a");
        a.href = category.html_url;
        a.className = "header-category-link";
        a.textContent = category.name;
        nav.appendChild(a);
      });

      // Mobile hamburger menu
      if (mobilePlaceholder) {
        var fragment = document.createDocumentFragment();
        categories.forEach(function (category) {
          var li = document.createElement("li");
          li.className = "item";
          var a = document.createElement("a");
          a.href = category.html_url;
          a.textContent = category.name;
          li.appendChild(a);
          fragment.appendChild(li);
        });
        mobilePlaceholder.replaceWith(fragment);
      }
    })
    .catch(function () {
      // Fail silently — header nav is non-critical
    });
});
