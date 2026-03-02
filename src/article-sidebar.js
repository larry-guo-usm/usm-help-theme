window.addEventListener("DOMContentLoaded", function () {
  var openBtn = document.getElementById("sidebar-mobile-open");
  var sidebar = document.getElementById("article-sidebar");
  var overlay = document.getElementById("sidebar-overlay");
  var closeBtn = document.getElementById("sidebar-mobile-close");

  if (!openBtn || !sidebar || !overlay) return;

  function openDrawer() {
    sidebar.classList.add("is-open");
    overlay.classList.add("is-open");
    document.body.classList.add("sidebar-drawer-open");
    openBtn.setAttribute("aria-expanded", "true");
  }

  function closeDrawer() {
    sidebar.classList.remove("is-open");
    overlay.classList.remove("is-open");
    document.body.classList.remove("sidebar-drawer-open");
    openBtn.setAttribute("aria-expanded", "false");
  }

  openBtn.addEventListener("click", openDrawer);
  overlay.addEventListener("click", closeDrawer);

  if (closeBtn) {
    closeBtn.addEventListener("click", closeDrawer);
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeDrawer();
  });
});
