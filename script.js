(function () {
  'use strict';

  // Key map
  const ENTER = 13;
  const ESCAPE = 27;

  function toggleNavigation(toggle, menu) {
    const isExpanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", !isExpanded);
    toggle.setAttribute("aria-expanded", !isExpanded);
  }

  function closeNavigation(toggle, menu) {
    menu.setAttribute("aria-expanded", false);
    toggle.setAttribute("aria-expanded", false);
    toggle.focus();
  }

  // Navigation

  window.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".header .menu-button-mobile");
    const menuList = document.querySelector("#user-nav-mobile");

    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleNavigation(menuButton, menuList);
    });

    menuList.addEventListener("keyup", (event) => {
      if (event.keyCode === ESCAPE) {
        event.stopPropagation();
        closeNavigation(menuButton, menuList);
      }
    });

    // Toggles expanded aria to collapsible elements
    const collapsible = document.querySelectorAll(
      ".collapsible-nav, .collapsible-sidebar"
    );

    collapsible.forEach((element) => {
      const toggle = element.querySelector(
        ".collapsible-nav-toggle, .collapsible-sidebar-toggle"
      );

      element.addEventListener("click", () => {
        toggleNavigation(toggle, element);
      });

      element.addEventListener("keyup", (event) => {
        console.log("escape");
        if (event.keyCode === ESCAPE) {
          closeNavigation(toggle, element);
        }
      });
    });

    // If multibrand search has more than 5 help centers or categories collapse the list
    const multibrandFilterLists = document.querySelectorAll(
      ".multibrand-filter-list"
    );
    multibrandFilterLists.forEach((filter) => {
      if (filter.children.length > 6) {
        // Display the show more button
        const trigger = filter.querySelector(".see-all-filters");
        trigger.setAttribute("aria-hidden", false);

        // Add event handler for click
        trigger.addEventListener("click", (event) => {
          event.stopPropagation();
          trigger.parentNode.removeChild(trigger);
          filter.classList.remove("multibrand-filter-list--collapsed");
        });
      }
    });
  });

  const isPrintableChar = (str) => {
    return str.length === 1 && str.match(/^\S$/);
  };

  function Dropdown(toggle, menu) {
    this.toggle = toggle;
    this.menu = menu;

    this.menuPlacement = {
      top: menu.classList.contains("dropdown-menu-top"),
      end: menu.classList.contains("dropdown-menu-end"),
    };

    this.toggle.addEventListener("click", this.clickHandler.bind(this));
    this.toggle.addEventListener("keydown", this.toggleKeyHandler.bind(this));
    this.menu.addEventListener("keydown", this.menuKeyHandler.bind(this));
    document.body.addEventListener("click", this.outsideClickHandler.bind(this));

    const toggleId = this.toggle.getAttribute("id") || crypto.randomUUID();
    const menuId = this.menu.getAttribute("id") || crypto.randomUUID();

    this.toggle.setAttribute("id", toggleId);
    this.menu.setAttribute("id", menuId);

    this.toggle.setAttribute("aria-controls", menuId);
    this.menu.setAttribute("aria-labelledby", toggleId);

    if (!this.toggle.hasAttribute("aria-haspopup")) {
      this.toggle.setAttribute("aria-haspopup", "true");
    }

    if (!this.toggle.hasAttribute("aria-expanded")) {
      this.toggle.setAttribute("aria-expanded", "false");
    }

    this.toggleIcon = this.toggle.querySelector(".dropdown-chevron-icon");
    if (this.toggleIcon) {
      this.toggleIcon.setAttribute("aria-hidden", "true");
    }

    this.menu.setAttribute("tabindex", -1);
    this.menuItems.forEach((menuItem) => {
      menuItem.tabIndex = -1;
    });

    this.focusedIndex = -1;
  }

  Dropdown.prototype = {
    get isExpanded() {
      return this.toggle.getAttribute("aria-expanded") === "true";
    },

    get menuItems() {
      return Array.prototype.slice.call(
        this.menu.querySelectorAll("[role='menuitem'], [role='menuitemradio']")
      );
    },

    dismiss: function () {
      if (!this.isExpanded) return;

      this.toggle.setAttribute("aria-expanded", "false");
      this.menu.classList.remove("dropdown-menu-end", "dropdown-menu-top");
      this.focusedIndex = -1;
    },

    open: function () {
      if (this.isExpanded) return;

      this.toggle.setAttribute("aria-expanded", "true");
      this.handleOverflow();
    },

    handleOverflow: function () {
      var rect = this.menu.getBoundingClientRect();

      var overflow = {
        right: rect.left < 0 || rect.left + rect.width > window.innerWidth,
        bottom: rect.top < 0 || rect.top + rect.height > window.innerHeight,
      };

      if (overflow.right || this.menuPlacement.end) {
        this.menu.classList.add("dropdown-menu-end");
      }

      if (overflow.bottom || this.menuPlacement.top) {
        this.menu.classList.add("dropdown-menu-top");
      }

      if (this.menu.getBoundingClientRect().top < 0) {
        this.menu.classList.remove("dropdown-menu-top");
      }
    },

    focusByIndex: function (index) {
      if (!this.menuItems.length) return;

      this.menuItems.forEach((item, itemIndex) => {
        if (itemIndex === index) {
          item.tabIndex = 0;
          item.focus();
        } else {
          item.tabIndex = -1;
        }
      });

      this.focusedIndex = index;
    },

    focusFirstMenuItem: function () {
      this.focusByIndex(0);
    },

    focusLastMenuItem: function () {
      this.focusByIndex(this.menuItems.length - 1);
    },

    focusNextMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const nextIndex = (currentIndex + 1) % this.menuItems.length;

      this.focusByIndex(nextIndex);
    },

    focusPreviousMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const previousIndex =
        currentIndex <= 0 ? this.menuItems.length - 1 : currentIndex - 1;

      this.focusByIndex(previousIndex);
    },

    focusByChar: function (currentItem, char) {
      char = char.toLowerCase();

      const itemChars = this.menuItems.map((menuItem) =>
        menuItem.textContent.trim()[0].toLowerCase()
      );

      const startIndex =
        (this.menuItems.indexOf(currentItem) + 1) % this.menuItems.length;

      // look up starting from current index
      let index = itemChars.indexOf(char, startIndex);

      // if not found, start from start
      if (index === -1) {
        index = itemChars.indexOf(char, 0);
      }

      if (index > -1) {
        this.focusByIndex(index);
      }
    },

    outsideClickHandler: function (e) {
      if (
        this.isExpanded &&
        !this.toggle.contains(e.target) &&
        !e.composedPath().includes(this.menu)
      ) {
        this.dismiss();
        this.toggle.focus();
      }
    },

    clickHandler: function (event) {
      event.stopPropagation();
      event.preventDefault();

      if (this.isExpanded) {
        this.dismiss();
        this.toggle.focus();
      } else {
        this.open();
        this.focusFirstMenuItem();
      }
    },

    toggleKeyHandler: function (e) {
      const key = e.key;

      switch (key) {
        case "Enter":
        case " ":
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusFirstMenuItem();
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusLastMenuItem();
          break;
        }
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
      }
    },

    menuKeyHandler: function (e) {
      const key = e.key;
      const currentElement = this.menuItems[this.focusedIndex];

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      switch (key) {
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.focusNextMenuItem(currentElement);
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();
          this.focusPreviousMenuItem(currentElement);
          break;
        }
        case "Home":
        case "PageUp": {
          e.stopPropagation();
          e.preventDefault();
          this.focusFirstMenuItem();
          break;
        }
        case "End":
        case "PageDown": {
          e.stopPropagation();
          e.preventDefault();
          this.focusLastMenuItem();
          break;
        }
        case "Tab": {
          if (e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            this.dismiss();
            this.toggle.focus();
          } else {
            this.dismiss();
          }
          break;
        }
        default: {
          if (isPrintableChar(key)) {
            e.stopPropagation();
            e.preventDefault();
            this.focusByChar(currentElement, key);
          }
        }
      }
    },
  };

  // Drodowns

  window.addEventListener("DOMContentLoaded", () => {
    const dropdowns = [];
    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

    dropdownToggles.forEach((toggle) => {
      const menu = toggle.nextElementSibling;
      if (menu && menu.classList.contains("dropdown-menu")) {
        dropdowns.push(new Dropdown(toggle, menu));
      }
    });
  });

  // Share

  window.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".share a");
    links.forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.open(anchor.href, "", "height = 500, width = 500");
      });
    });
  });

  // Vanilla JS debounce function, by Josh W. Comeau:
  // https://www.joshwcomeau.com/snippets/javascript/debounce/
  function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, wait);
    };
  }

  // Define variables for search field
  let searchFormFilledClassName = "search-has-value";
  let searchFormSelector = "form[role='search']";

  // Clear the search input, and then return focus to it
  function clearSearchInput(event) {
    event.target
      .closest(searchFormSelector)
      .classList.remove(searchFormFilledClassName);

    let input;
    if (event.target.tagName === "INPUT") {
      input = event.target;
    } else if (event.target.tagName === "BUTTON") {
      input = event.target.previousElementSibling;
    } else {
      input = event.target.closest("button").previousElementSibling;
    }
    input.value = "";
    input.focus();
  }

  // Have the search input and clear button respond
  // when someone presses the escape key, per:
  // https://twitter.com/adambsilver/status/1152452833234554880
  function clearSearchInputOnKeypress(event) {
    const searchInputDeleteKeys = ["Delete", "Escape"];
    if (searchInputDeleteKeys.includes(event.key)) {
      clearSearchInput(event);
    }
  }

  // Create an HTML button that all users -- especially keyboard users --
  // can interact with, to clear the search input.
  // To learn more about this, see:
  // https://adrianroselli.com/2019/07/ignore-typesearch.html#Delete
  // https://www.scottohara.me/blog/2022/02/19/custom-clear-buttons.html
  function buildClearSearchButton(inputId) {
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("aria-controls", inputId);
    button.classList.add("clear-button");
    const buttonLabel = window.searchClearButtonLabelLocalized;
    const icon = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' focusable='false' role='img' viewBox='0 0 12 12' aria-label='${buttonLabel}'><path stroke='currentColor' stroke-linecap='round' stroke-width='2' d='M3 9l6-6m0 6L3 3'/></svg>`;
    button.innerHTML = icon;
    button.addEventListener("click", clearSearchInput);
    button.addEventListener("keyup", clearSearchInputOnKeypress);
    return button;
  }

  // Append the clear button to the search form
  function appendClearSearchButton(input, form) {
    const searchClearButton = buildClearSearchButton(input.id);
    form.append(searchClearButton);
    if (input.value.length > 0) {
      form.classList.add(searchFormFilledClassName);
    }
  }

  // Add a class to the search form when the input has a value;
  // Remove that class from the search form when the input doesn't have a value.
  // Do this on a delay, rather than on every keystroke.
  const toggleClearSearchButtonAvailability = debounce((event) => {
    const form = event.target.closest(searchFormSelector);
    form.classList.toggle(
      searchFormFilledClassName,
      event.target.value.length > 0
    );
  }, 200);

  // Strip the category segment from instant search breadcrumbs.
  // Zendesk renders breadcrumbs as "Help Center > Category > Section";
  // this removes the middle (category) segment leaving "Help Center > Section".
  function stripCategoryFromBreadcrumbNode(node) {
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null);
    var textNode;
    while ((textNode = walker.nextNode())) {
      var parts = textNode.textContent.split(" > ");
      if (parts.length >= 3) {
        parts.splice(1, 1);
        textNode.textContent = parts.join(" > ");
      }
    }
  }

  // Search

  window.addEventListener("DOMContentLoaded", () => {
    // Set up clear functionality for the search field
    const searchForms = [...document.querySelectorAll(searchFormSelector)];
    const searchInputs = searchForms.map((form) =>
      form.querySelector("input[type='search']")
    );
    searchInputs.forEach((input) => {
      appendClearSearchButton(input, input.closest(searchFormSelector));
      input.addEventListener("keyup", clearSearchInputOnKeypress);
      input.addEventListener("keyup", toggleClearSearchButtonAvailability);
    });

    // Watch for instant search dropdown nodes and strip category breadcrumb segment
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            stripCategoryFromBreadcrumbNode(node);
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  });

  // Custom instant search with full-text article search and body snippets.
  // Replaces Zendesk's native instant search (instant=false in templates).

  var sectionsCache = null;
  var sectionsFetchPromise = null;

  function getSections(locale) {
    if (sectionsCache) return Promise.resolve(sectionsCache);
    if (!sectionsFetchPromise) {
      sectionsFetchPromise = fetch('/api/v2/help_center/sections.json?per_page=100&locale=' + locale)
        .then(function(res) { return res.json(); })
        .then(function(data) {
          sectionsCache = {};
          (data.sections || []).forEach(function(s) {
            sectionsCache[s.id] = s.name;
          });
          return sectionsCache;
        })
        .catch(function() {
          sectionsCache = {};
          return sectionsCache;
        });
    }
    return sectionsFetchPromise;
  }

  function stripHtml(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  }

  function extractSnippet(bodyText, query, maxLen) {
    maxLen = maxLen || 220;
    var text = bodyText.replace(/\s+/g, ' ').trim();
    if (!query || !text) return text.slice(0, maxLen);

    // Try to match the full query phrase first, then fall back to individual words
    var escapedFull = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var bestPos = text.search(new RegExp(escapedFull, 'i'));

    if (bestPos === -1) {
      // Fall back: find the first match of any individual word
      var terms = query.trim().split(/\s+/).filter(function(t) { return t.length > 2; });
      for (var i = 0; i < terms.length; i++) {
        var escaped = terms[i].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var m = text.search(new RegExp('\\b' + escaped, 'i'));
        if (m !== -1 && (bestPos === -1 || m < bestPos)) {
          bestPos = m;
        }
      }
    }

    if (bestPos === -1) return text.slice(0, maxLen);

    // Center a window around the match
    var half = Math.floor(maxLen / 2);
    var start = Math.max(0, bestPos - half);
    var end = Math.min(text.length, start + maxLen);
    // Adjust start if end is at text boundary
    start = Math.max(0, end - maxLen);

    // Snap to word boundaries to avoid cutting mid-word
    if (start > 0) {
      var wordStart = text.indexOf(' ', start);
      if (wordStart !== -1 && wordStart < bestPos) start = wordStart + 1;
    }
    if (end < text.length) {
      var wordEnd = text.lastIndexOf(' ', end);
      if (wordEnd !== -1 && wordEnd > bestPos) end = wordEnd;
    }

    var snippet = text.slice(start, end);
    if (start > 0) snippet = '\u2026' + snippet;
    if (end < text.length) snippet = snippet + '\u2026';
    return snippet;
  }

  function buildHighlightedText(text, query) {
    // Returns a DocumentFragment with query terms wrapped in <mark>
    var fragment = document.createDocumentFragment();
    if (!query) {
      fragment.appendChild(document.createTextNode(text));
      return fragment;
    }
    var escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Try full phrase first; fall back to individual terms with \b so we only
    // match at word-start boundaries (catches "porting", "port-in" but not "important").
    // Filter out short terms (<=2 chars) like "a", "to", "in" to avoid noise.
    var fullPhrase = escapedQuery.trim();
    var terms = fullPhrase.split(/\s+/).filter(function(t) { return t.length > 2; });
    var alternatives = terms.map(function(t) { return '\\b' + t; });
    if (fullPhrase.indexOf(' ') !== -1) alternatives.unshift(fullPhrase);
    if (!alternatives.length) {
      // All terms were too short — nothing to highlight
      fragment.appendChild(document.createTextNode(text));
      return fragment;
    }
    var regex = new RegExp('(' + alternatives.join('|') + ')', 'gi');
    var parts = text.split(regex);
    parts.forEach(function(part, i) {
      if (i % 2 === 1) {
        var mark = document.createElement('mark');
        mark.className = 'custom-search-highlight';
        mark.textContent = part;
        fragment.appendChild(mark);
      } else {
        fragment.appendChild(document.createTextNode(part));
      }
    });
    return fragment;
  }

  function initSearchContainer(container, locale) {
    var dropdown = null;
    var activeIndex = -1;
    var pendingRequest = null;
    var debounceTimer = null;
    var resultItems = [];

    var input = container.querySelector('input[type="search"]');
    if (!input) return;

    function getOrCreateDropdown() {
      if (dropdown) return dropdown;
      dropdown = document.createElement('div');
      dropdown.className = 'custom-search-dropdown';
      dropdown.setAttribute('role', 'listbox');

      var loading = document.createElement('div');
      loading.className = 'custom-search-loading';
      loading.setAttribute('aria-live', 'polite');
      var spinner = document.createElement('div');
      spinner.className = 'custom-search-spinner';
      loading.appendChild(spinner);
      dropdown.appendChild(loading);

      var list = document.createElement('ul');
      list.className = 'custom-search-results';
      dropdown.appendChild(list);

      var footer = document.createElement('div');
      footer.className = 'custom-search-footer';
      var viewAll = document.createElement('a');
      viewAll.className = 'custom-search-view-all';
      footer.appendChild(viewAll);
      dropdown.appendChild(footer);

      var empty = document.createElement('div');
      empty.className = 'custom-search-empty';
      dropdown.appendChild(empty);

      container.appendChild(dropdown);
      return dropdown;
    }

    function closeDropdown() {
      if (!dropdown) return;
      dropdown.classList.remove('is-open', 'is-loading', 'is-empty');
      activeIndex = -1;
      resultItems = [];
      input.removeAttribute('aria-activedescendant');
    }

    function setActiveIndex(idx) {
      resultItems.forEach(function(item, i) {
        if (i === idx) {
          item.classList.add('is-active');
          input.setAttribute('aria-activedescendant', item.id);
        } else {
          item.classList.remove('is-active');
        }
      });
      activeIndex = idx;
    }

    function renderResults(articles, sections, q) {
      var dd = getOrCreateDropdown();
      var list = dd.querySelector('.custom-search-results');
      dd.querySelector('.custom-search-footer');
      var viewAll = dd.querySelector('.custom-search-view-all');
      var empty = dd.querySelector('.custom-search-empty');

      list.innerHTML = '';
      resultItems = [];
      activeIndex = -1;
      input.removeAttribute('aria-activedescendant');

      dd.classList.remove('is-loading');

      var searchUrl = '/hc/' + locale + '/search?utf8=%E2%9C%93&query=' + encodeURIComponent(q);
      viewAll.href = searchUrl;
      viewAll.textContent = 'View all results for "' + q + '"';

      if (articles.length === 0) {
        dd.classList.add('is-empty');
        empty.textContent = 'No results for \u201c' + q + '\u201d';
        return;
      }

      dd.classList.remove('is-empty');

      articles.forEach(function(article, i) {
        var li = document.createElement('li');
        li.setAttribute('role', 'presentation');

        var a = document.createElement('a');
        a.className = 'custom-search-result-link';
        a.href = article.html_url;
        a.setAttribute('role', 'option');
        a.id = 'custom-search-item-' + i;

        var titleDiv = document.createElement('div');
        titleDiv.className = 'custom-search-result-title';
        titleDiv.appendChild(buildHighlightedText(article.title || '', q));
        a.appendChild(titleDiv);

        var sectionName = sections && article.section_id ? sections[article.section_id] : null;
        if (sectionName) {
          var breadcrumb = document.createElement('div');
          breadcrumb.className = 'custom-search-result-breadcrumb';
          breadcrumb.textContent = sectionName;
          a.appendChild(breadcrumb);
        }

        var bodyText = extractSnippet(stripHtml(article.body || ''), q);
        if (bodyText) {
          var snippet = document.createElement('div');
          snippet.className = 'custom-search-result-snippet';
          snippet.appendChild(buildHighlightedText(bodyText, q));
          a.appendChild(snippet);
        }

        li.appendChild(a);
        list.appendChild(li);
        resultItems.push(a);
      });
    }

    function doSearch(q) {
      if (pendingRequest) {
        pendingRequest.abort();
        pendingRequest = null;
      }

      var dd = getOrCreateDropdown();
      dd.classList.add('is-open', 'is-loading');
      dd.classList.remove('is-empty');

      var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      pendingRequest = controller;

      var searchUrl = '/api/v2/help_center/articles/search.json?query=' + encodeURIComponent(q) + '&per_page=8&locale=' + locale;
      var fetchOptions = controller ? { signal: controller.signal } : {};

      Promise.all([
        fetch(searchUrl, fetchOptions).then(function(res) { return res.json(); }),
        getSections(locale)
      ]).then(function(results) {
        pendingRequest = null;
        var data = results[0];
        var sections = results[1];
        renderResults(data.results || [], sections, q);
      }).catch(function(err) {
        if (err && err.name === 'AbortError') return;
        pendingRequest = null;
        var dd2 = getOrCreateDropdown();
        dd2.classList.remove('is-loading');
        dd2.classList.add('is-empty');
        var empty = dd2.querySelector('.custom-search-empty');
        if (empty) empty.textContent = 'Search unavailable. Please try again.';
      });
    }

    input.addEventListener('input', function() {
      var q = input.value.trim();
      clearTimeout(debounceTimer);

      if (q.length < 2) {
        closeDropdown();
        return;
      }
      debounceTimer = setTimeout(function() {
        doSearch(q);
      }, 300);
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeDropdown();
        // Do not stopPropagation — search.js clears input on keyup Escape
        return;
      }

      if (!dropdown || !dropdown.classList.contains('is-open')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var next = activeIndex < resultItems.length - 1 ? activeIndex + 1 : 0;
        setActiveIndex(next);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prev = activeIndex > 0 ? activeIndex - 1 : resultItems.length - 1;
        setActiveIndex(prev);
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        window.location.href = resultItems[activeIndex].href;
      }
    });

    // Close when clear button is clicked
    container.addEventListener('click', function(e) {
      if (e.target.closest('.clear-button')) {
        closeDropdown();
      }
    });

    // Close when clicking outside
    document.addEventListener('click', function(e) {
      if (!container.contains(e.target)) {
        closeDropdown();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    var locale = (document.documentElement.lang || 'en-us').toLowerCase();
    var containers = document.querySelectorAll('.search-container');
    containers.forEach(function(c) {
      initSearchContainer(c, locale);
    });
  });

  const key = "returnFocusTo";

  function saveFocus() {
    const activeElementId = document.activeElement.getAttribute("id");
    sessionStorage.setItem(key, "#" + activeElementId);
  }

  function returnFocus() {
    const returnFocusTo = sessionStorage.getItem(key);
    if (returnFocusTo) {
      sessionStorage.removeItem("returnFocusTo");
      const returnFocusToEl = document.querySelector(returnFocusTo);
      returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
    }
  }

  // Forms

  window.addEventListener("DOMContentLoaded", () => {
    // In some cases we should preserve focus after page reload
    returnFocus();

    // show form controls when the textarea receives focus or back button is used and value exists
    const commentContainerTextarea = document.querySelector(
      ".comment-container textarea"
    );
    const commentContainerFormControls = document.querySelector(
      ".comment-form-controls, .comment-ccs"
    );

    if (commentContainerTextarea) {
      commentContainerTextarea.addEventListener(
        "focus",
        function focusCommentContainerTextarea() {
          commentContainerFormControls.style.display = "block";
          commentContainerTextarea.removeEventListener(
            "focus",
            focusCommentContainerTextarea
          );
        }
      );

      if (commentContainerTextarea.value !== "") {
        commentContainerFormControls.style.display = "block";
      }
    }

    // Expand Request comment form when Add to conversation is clicked
    const showRequestCommentContainerTrigger = document.querySelector(
      ".request-container .comment-container .comment-show-container"
    );
    const requestCommentFields = document.querySelectorAll(
      ".request-container .comment-container .comment-fields"
    );
    const requestCommentSubmit = document.querySelector(
      ".request-container .comment-container .request-submit-comment"
    );

    if (showRequestCommentContainerTrigger) {
      showRequestCommentContainerTrigger.addEventListener("click", () => {
        showRequestCommentContainerTrigger.style.display = "none";
        Array.prototype.forEach.call(requestCommentFields, (element) => {
          element.style.display = "block";
        });
        requestCommentSubmit.style.display = "inline-block";

        if (commentContainerTextarea) {
          commentContainerTextarea.focus();
        }
      });
    }

    // Mark as solved button
    const requestMarkAsSolvedButton = document.querySelector(
      ".request-container .mark-as-solved:not([data-disabled])"
    );
    const requestMarkAsSolvedCheckbox = document.querySelector(
      ".request-container .comment-container input[type=checkbox]"
    );
    const requestCommentSubmitButton = document.querySelector(
      ".request-container .comment-container input[type=submit]"
    );

    if (requestMarkAsSolvedButton) {
      requestMarkAsSolvedButton.addEventListener("click", () => {
        requestMarkAsSolvedCheckbox.setAttribute("checked", true);
        requestCommentSubmitButton.disabled = true;
        requestMarkAsSolvedButton.setAttribute("data-disabled", true);
        requestMarkAsSolvedButton.form.submit();
      });
    }

    // Change Mark as solved text according to whether comment is filled
    const requestCommentTextarea = document.querySelector(
      ".request-container .comment-container textarea"
    );

    const usesWysiwyg =
      requestCommentTextarea &&
      requestCommentTextarea.dataset.helper === "wysiwyg";

    function isEmptyPlaintext(s) {
      return s.trim() === "";
    }

    function isEmptyHtml(xml) {
      const doc = new DOMParser().parseFromString(`<_>${xml}</_>`, "text/xml");
      const img = doc.querySelector("img");
      return img === null && isEmptyPlaintext(doc.children[0].textContent);
    }

    const isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;

    if (requestCommentTextarea) {
      requestCommentTextarea.addEventListener("input", () => {
        if (isEmpty(requestCommentTextarea.value)) {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute("data-solve-translation");
          }
        } else {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute(
                "data-solve-and-submit-translation"
              );
          }
        }
      });
    }

    const selects = document.querySelectorAll(
      "#request-status-select, #request-organization-select"
    );

    selects.forEach((element) => {
      element.addEventListener("change", (event) => {
        event.stopPropagation();
        saveFocus();
        element.form.submit();
      });
    });

    // Submit requests filter form on search in the request list page
    const quickSearch = document.querySelector("#quick-search");
    if (quickSearch) {
      quickSearch.addEventListener("keyup", (event) => {
        if (event.keyCode === ENTER) {
          event.stopPropagation();
          saveFocus();
          quickSearch.form.submit();
        }
      });
    }

    // Submit organization form in the request page
    const requestOrganisationSelect = document.querySelector(
      "#request-organization select"
    );

    if (requestOrganisationSelect) {
      requestOrganisationSelect.addEventListener("change", () => {
        requestOrganisationSelect.form.submit();
      });

      requestOrganisationSelect.addEventListener("click", (e) => {
        // Prevents Ticket details collapsible-sidebar to close on mobile
        e.stopPropagation();
      });
    }

    // If there are any error notifications below an input field, focus that field
    const notificationElm = document.querySelector(".notification-error");
    if (
      notificationElm &&
      notificationElm.previousElementSibling &&
      typeof notificationElm.previousElementSibling.focus === "function"
    ) {
      notificationElm.previousElementSibling.focus();
    }
  });

  async function fetchAllArticles(sectionId) {
    const articles = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const response = await fetch(
        `/api/v2/help_center/sections/${sectionId}/articles.json?per_page=${perPage}&page=${page}&sort_by=position&sort_order=asc`
      );
      if (!response.ok) break;
      const data = await response.json();
      articles.push(...data.articles);
      if (!data.next_page) break;
      page++;
    }

    return articles;
  }

  function buildArticleItems(articles, currentArticleId) {
    return articles.map(function(article) {
      const isCurrent = String(article.id) === String(currentArticleId);
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = article.html_url;
      a.textContent = article.title;
      a.className = "sidenav-item" + (isCurrent ? " current-article" : "");
      if (isCurrent) a.setAttribute("aria-current", "page");
      li.appendChild(a);
      return li;
    });
  }

  document.addEventListener("DOMContentLoaded", function() {
    var list = document.querySelector("ul[data-section-id]");
    if (!list) return;

    var sectionId = list.getAttribute("data-section-id");
    var currentArticleId = list.getAttribute("data-current-article-id");

    fetchAllArticles(sectionId).then(function(articles) {
      if (articles.length <= list.querySelectorAll("li").length) return;
      list.innerHTML = "";
      buildArticleItems(articles, currentArticleId).forEach(function(li) {
        list.appendChild(li);
      });
    });
  });

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

  document.addEventListener("DOMContentLoaded", function () {
    const articleBody = document.querySelector(".article-body");
    const tocNav = document.querySelector(".article-toc-nav");
    document.querySelector(".article-toc");
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
      scrollLockId = id;
      clearTimeout(scrollLockTimer);
      scrollLockTimer = setTimeout(() => { scrollLockId = null; }, 1000);
      setActive(id);
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
    let scrollLockId = null;
    let scrollLockTimer = null;

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
      if (scrollLockId !== null) {
        setActive(scrollLockId);
        return;
      }
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

    // Correct scroll position when page loads with a hash (browser scrolls to top of element
    // without accounting for sticky header/subnav).
    if (location.hash) {
      const id = location.hash.slice(1);
      const target = document.getElementById(id);
      if (target) {
        // Use requestAnimationFrame to run after the browser's initial hash scroll settles.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const top = target.getBoundingClientRect().top + window.scrollY - getStickyOffset();
            window.scrollTo({ top, behavior: "instant" });
            setActive(id);
          });
        });
      }
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

})();
