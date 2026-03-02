document.addEventListener("DOMContentLoaded", function () {
  const articleBody = document.querySelector(".article-body");
  const tocNav = document.querySelector(".article-toc-nav");
  const tocWrapper = document.querySelector(".article-toc");
  const mobileTrigger = document.querySelector(".article-toc-mobile-trigger");
  const mobileBtn = document.querySelector(".article-toc-mobile-btn");
  const modal = document.querySelector(".article-toc-modal");
  const modalClose = document.querySelector(".article-toc-modal-close");
  const mobileTocNav = document.querySelector(".article-toc-modal-nav");

  if (!articleBody || !tocNav) return;

  const headings = Array.from(articleBody.querySelectorAll("h2, h3, h4"));

  if (headings.length < 2) {
    if (tocWrapper) tocWrapper.style.display = "none";
    if (mobileTrigger) mobileTrigger.style.display = "none";
    return;
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const usedIds = new Set();
  headings.forEach((heading) => {
    if (!heading.id) {
      const base = slugify(heading.textContent) || "heading";
      let id = base;
      let n = 1;
      while (usedIds.has(id)) id = `${base}-${n++}`;
      heading.id = id;
    }
    usedIds.add(heading.id);
  });

  function buildList(headings, onLinkClick) {
    const ul = document.createElement("ul");
    ul.className = "article-toc-list";
    headings.forEach((heading) => {
      const li = document.createElement("li");
      li.className = `article-toc-item article-toc-item--${heading.tagName.toLowerCase()}`;
      const a = document.createElement("a");
      a.href = `#${heading.id}`;
      a.className = "article-toc-link";
      a.textContent = heading.textContent;
      a.dataset.headingId = heading.id;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" });
        if (onLinkClick) onLinkClick();
      });
      li.appendChild(a);
      ul.appendChild(li);
    });
    return ul;
  }

  tocNav.appendChild(buildList(headings, null));
  if (mobileTocNav) {
    mobileTocNav.appendChild(buildList(headings, closeMobileModal));
  }

  let activeId = null;

  function setActive(id) {
    if (activeId === id) return;
    activeId = id;
    [tocNav, mobileTocNav].forEach((container) => {
      if (!container) return;
      container.querySelectorAll(".article-toc-link").forEach((link) => {
        link.classList.toggle("is-active", link.dataset.headingId === id);
      });
    });
  }

  function updateActive() {
    let current = headings[0];
    for (const h of headings) {
      if (h.getBoundingClientRect().top <= 130) current = h;
    }
    setActive(current.id);
  }

  window.addEventListener("scroll", updateActive, { passive: true });
  updateActive();

  function openMobileModal() {
    modal?.classList.add("is-open");
    document.body.classList.add("toc-modal-open");
  }

  function closeMobileModal() {
    modal?.classList.remove("is-open");
    document.body.classList.remove("toc-modal-open");
  }

  mobileBtn?.addEventListener("click", openMobileModal);
  modalClose?.addEventListener("click", closeMobileModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeMobileModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileModal();
  });
});
