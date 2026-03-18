window.addEventListener("DOMContentLoaded", function () {
  var modal = document.getElementById("mobile-search-modal");
  var openBtn = document.querySelector(".search-button-mobile");
  var headerSearch = document.querySelector(".header-search");
  if (!modal || !openBtn || !headerSearch) return;

  // Record where to put it back: original parent and sibling
  var originalParent = headerSearch.parentElement;
  var originalNextSibling = headerSearch.nextElementSibling;

  var inner = modal.querySelector(".mobile-search-modal-inner");
  var closeBtn = modal.querySelector(".mobile-search-close");
  var backdrop = modal.querySelector(".mobile-search-backdrop");

  function openModal() {
    // Move the single search widget into the modal
    inner.insertBefore(headerSearch, closeBtn);
    headerSearch.classList.add("in-modal");

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    openBtn.setAttribute("aria-expanded", "true");

    var input = headerSearch.querySelector("input[type='search']");
    if (input) setTimeout(function () { input.focus(); }, 50);
  }

  function closeModal() {
    // Return the search widget to its original position in the header
    originalParent.insertBefore(headerSearch, originalNextSibling);
    headerSearch.classList.remove("in-modal");

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    openBtn.setAttribute("aria-expanded", "false");
    openBtn.focus();
  }

  openBtn.addEventListener("click", openModal);
  closeBtn && closeBtn.addEventListener("click", closeModal);
  backdrop && backdrop.addEventListener("click", closeModal);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
});
