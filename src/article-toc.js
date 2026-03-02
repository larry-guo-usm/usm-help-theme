document.addEventListener("DOMContentLoaded", function () {
  const articleBody = document.querySelector(".article-body");
  const tocNav = document.querySelector(".article-toc-nav");
  const tocWrapper = document.querySelector(".article-toc");
  const mobileTrigger = document.querySelector(".article-toc-mobile-trigger");
  const mobileBtn = document.querySelector(".article-toc-mobile-btn");
  const modal = document.querySelector(".article-toc-modal");
  const mobileTocNav = document.querySelector(".article-toc-modal-nav");

  if (!articleBody || !tocNav) return;

  const headings = Array.from(articleBody.querySelectorAll("h2, h3, h4"));

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

  function getStickyOffset() {
    let offset = 0;
    [".header", ".sections-subnav", ".sidebar-mobile-bar"].forEach((sel) => {
      const el = document.querySelector(sel);
      if (el && getComputedStyle(el).display !== "none") {
        offset += el.offsetHeight;
      }
    });
    return offset + 16; // extra breathing room
  }

  function scrollToHeading(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - getStickyOffset();
    window.scrollTo({ top, behavior: "smooth" });
  }

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
        scrollToHeading(heading.id);
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

  if (headings.length > 0) {
    window.addEventListener("scroll", updateActive, { passive: true });
    updateActive();
  }

  function openMobileModal() {
    modal?.classList.add("is-open");
    mobileBtn?.setAttribute("aria-expanded", "true");
  }

  function closeMobileModal() {
    modal?.classList.remove("is-open");
    mobileBtn?.setAttribute("aria-expanded", "false");
  }

  mobileBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    modal?.classList.contains("is-open") ? closeMobileModal() : openMobileModal();
  });

  document.addEventListener("click", (e) => {
    if (modal?.classList.contains("is-open") && !mobileTrigger?.contains(e.target)) {
      closeMobileModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMobileModal();
  });
});
