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
  var currentQuery = '';
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
    var footer = dd.querySelector('.custom-search-footer');
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
      currentQuery = '';
      return;
    }

    currentQuery = q;
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
