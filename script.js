const API_KEY = 'YOUR_API_KEY';
        let currentCategory = 'technology';
        let bookmarkedArticles = [];

        // Load bookmarks from memory (since localStorage isn't available)
        function loadBookmarks() {
            return bookmarkedArticles;
        }

        function saveBookmarks(bookmarks) {
            bookmarkedArticles = bookmarks;
            updateBookmarkCount();
        }

        function updateBookmarkCount() {
            const count = bookmarkedArticles.length;
            const countElement = document.getElementById('bookmarkCount');
            if (count > 0) {
                countElement.textContent = count;
                countElement.style.display = 'flex';
            } else {
                countElement.style.display = 'none';
            }
        }

        async function loadNews(category = 'technology') {
            const newsGrid = document.getElementById('newsGrid');
            newsGrid.innerHTML = '<div class="loading">Loading latest news...</div>';

            try {
                const apiUrl = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&pageSize=12&apiKey=${API_KEY}`;
                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                window.lastArticles = data.articles;

                if (data.status !== 'ok') {
                    throw new Error(data.message || 'Failed to fetch news');
                }

                newsGrid.innerHTML = '';

                if (data.articles && data.articles.length > 0) {
                    data.articles.forEach((article, index) => {
                        if (article.title && article.title !== '[Removed]') {
                            const card = createNewsCard(article, index);
                            newsGrid.appendChild(card);
                        }
                    });
                } else {
                    newsGrid.innerHTML = '<div class="error">No articles found for this category.</div>';
                }
            } catch (error) {
                console.error('Error fetching news:', error);
                newsGrid.innerHTML = `<div class="error">Failed to load news: ${error.message}</div>`;
            }
        }

        function createNewsCard(article, index, isBookmark = false) {
            const card = document.createElement('div');
            card.className = 'news-card';
            card.onclick = () => openArticle(article);

            const publishedDate = new Date(article.publishedAt);
            const timeAgo = getTimeAgo(publishedDate);
            const sourceName = article.source?.name || 'Unknown Source';
            const sourceInitial = sourceName.charAt(0).toUpperCase();

            const bookmarks = loadBookmarks();
            const isBookmarked = bookmarks.some(a => a.url === article.url);

            const imageUrl = article.urlToImage || '';
            const imageDiv = imageUrl
                ? `<div class="card-image"><img src="${imageUrl}" alt="News image"></div>`
                : `<div class="card-image">📰</div>`;

            card.innerHTML = `
                ${imageDiv}
                <div class="card-content">
                    <h3 class="card-title">${article.title}</h3>
                    <p class="card-summary">${article.description || 'No description available.'}</p>
                    <div class="card-meta">
                        <div class="source-info">
                            <div class="source-logo">${sourceInitial}</div>
                            <span>${sourceName}</span>
                        </div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            <span style="font-size: 12px; color: #9ca3af;">${timeAgo}</span>
                            <button class="bookmark-btn ${isBookmarked ? 'bookmarked' : ''}" 
                                    onclick="event.stopPropagation(); toggleBookmark(${index}, ${isBookmark})" 
                                    title="${isBookmarked ? 'Remove bookmark' : 'Add bookmark'}">
                                <svg width="24" height="24" viewBox="0 0 24 24">
        <use href="#${isBookmarked ? 'icon-bookmarked' : 'icon-bookmark'}"></use>
    </svg>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            return card;
        }

        function openArticle(article) {
            document.getElementById('homepage').style.display = 'none';
            document.getElementById('bookmarksPage').style.display = 'none';
            document.getElementById('articleDetail').style.display = 'block';

            document.getElementById('articleTitle').textContent = article.title;
            document.getElementById('articleSource').textContent = article.source?.name || 'Unknown Source';
            document.getElementById('articleSourceLogo').textContent = (article.source?.name || 'U').charAt(0).toUpperCase();
            document.getElementById('articleDate').textContent = new Date(article.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const articleImage = article.urlToImage
                ? `<img src="${article.urlToImage}" alt="News Image">`
                : `📰`;
            document.getElementById('articleImage').innerHTML = articleImage;

            let content = '';
            if (article.content && article.content !== '[Removed]') {
                content = `<p>${article.content.replace(/\[.*?\]/g, '').trim()}</p>`;
            } else if (article.description) {
                content = `<p>${article.description}</p>`;
            } else {
                content = '<p>Full article content not available. Please visit the original source for more details.</p>';
            }

            if (article.url) {
                content += `
        <iframe src="${article.url}" style="width:100%; height:80vh; border:none; border-radius:12px; margin-top:20px;"></iframe>
        <p style="margin-top: 12px;"><a href="${article.url}" target="_blank" style="color:#667eea; font-weight:600;">Read full article at source →</a></p>
    `;
            }

            document.getElementById('articleContent').innerHTML = `
    <div class="collapsed-content" id="fullContent">${content}</div>
    <div class="read-more-toggle" onclick="toggleReadMore(this)">Read more</div>
`;
            window.scrollTo(0, 0);
        }

        function goBack() {
            document.getElementById('homepage').style.display = 'block';
            document.getElementById('bookmarksPage').style.display = 'none';
            document.getElementById('articleDetail').style.display = 'none';

            // Reset active tab
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('.nav-tab').classList.add('active');

            window.scrollTo(0, 0);
        }

        function toggleBookmark(index, isFromBookmarkPage = false) {
            const bookmarks = loadBookmarks();
            let article;

            if (isFromBookmarkPage) {
                article = bookmarks[index];
            } else {
                article = window.lastArticles[index];
            }

            const existingIndex = bookmarks.findIndex(a => a.url === article.url);

            if (existingIndex !== -1) {
                bookmarks.splice(existingIndex, 1);
                showNotification("Bookmark removed!", "🗑️");
            } else {
                bookmarks.push(article);
                showNotification("Article bookmarked!", "🔖");
            }

            saveBookmarks(bookmarks);

            const allCards = document.querySelectorAll('.news-card');
            const card = allCards[index];
            if (card) {
                const btn = card.querySelector('.bookmark-btn');
                if (btn) {
                    btn.classList.toggle('bookmarked');
                    const useTag = btn.querySelector('use');
                    if (useTag) {
                        useTag.setAttribute('href', btn.classList.contains('bookmarked') ? '#icon-bookmarked' : '#icon-bookmark');
                    }
                }
            }


            // Refresh current view
            if (document.getElementById('bookmarksPage').style.display !== 'none') {
                loadBookmarksPage();
            }
        }

        function showBookmarks(tabElement = null) {
            document.getElementById('homepage').style.display = 'none';
            document.getElementById('bookmarksPage').style.display = 'block';
            document.getElementById('articleDetail').style.display = 'none';

            // Update active tab
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            if (tabElement) {
                tabElement.classList.add('active');
            }

            loadBookmarksPage();
            window.scrollTo(0, 0);
        }

        function loadBookmarksPage() {
            const bookmarksGrid = document.getElementById('bookmarksGrid');
            const bookmarks = loadBookmarks();

            if (bookmarks.length === 0) {
                bookmarksGrid.innerHTML = '<div class="empty-bookmarks">No bookmarked articles yet!<br><span style="font-size:16px; opacity:0.7;">Browse news and bookmark articles you want to read later.</span></div>';
                return;
            }

            bookmarksGrid.innerHTML = '';
            bookmarks.forEach((article, index) => {
                const card = createNewsCard(article, index, true);
                bookmarksGrid.appendChild(card);
            });
        }

        function switchTab(tab, category) {
            if (category === 'bookmarks') {
                showBookmarks(tab);
                return;
            }

            document.getElementById('homepage').style.display = 'block';
            document.getElementById('bookmarksPage').style.display = 'none';
            document.getElementById('articleDetail').style.display = 'none';

            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentCategory = category;

            const categoryTitles = {
                technology: 'Latest Technology News',
                business: 'Business News',
                science: 'Science News',
                general: 'General News',
                sports: 'Sports News',
                entertainment: 'Entertainment News'
            };

            document.querySelector('.section-title').textContent = categoryTitles[category] || 'Latest News';
            loadNews(category);
        }

        function getTimeAgo(date) {
            const now = new Date();
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));

            if (diffInMinutes < 60) {
                return `${diffInMinutes}m ago`;
            } else if (diffInMinutes < 1440) {
                return `${Math.floor(diffInMinutes / 60)}h ago`;
            } else {
                return `${Math.floor(diffInMinutes / 1440)}d ago`;
            }
        }

        function showNotification(message, emoji) {
            // Create notification element
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 100px;
                right: 30px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                color: #333;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                z-index: 1001;
                font-weight: 600;
                transform: translateX(400px);
                transition: all 0.3s ease;
            `;
            notification.innerHTML = `${emoji} ${message}`;

            document.body.appendChild(notification);

            // Animate in
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);

            // Remove after 3 seconds
            setTimeout(() => {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }


        function toggleReadMore(btn) {
            const content = document.getElementById('fullContent');
            const isCollapsed = content.classList.toggle('collapsed-content');
            btn.textContent = isCollapsed ? 'Read more' : 'Read less';
        }


        // Initialize the app
        window.addEventListener('DOMContentLoaded', () => {
            loadNews('technology');
            updateBookmarkCount();
        });

        // Handle browser back button
        window.addEventListener('popstate', (e) => {
            goBack();
        });
