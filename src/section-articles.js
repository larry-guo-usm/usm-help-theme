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
