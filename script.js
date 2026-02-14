// RetroReddit - Frontend Application
class RetroReddit {
    constructor() {
        this.posts = [];
        this.subreddits = [];
        this.currentSort = 'hot';
        this.currentSubreddit = 'all';
        this.expandedPostId = null;
        this.editingPostId = null;
        this.selectedPostIndex = -1;
        this.apiBase = window.location.origin + '/api';
        this.init();
    }

    async init() {
        this.setupSortTabs();
        this.setupSubmitForm();
        this.setupSearch();
        this.setupKeyboardShortcuts();
        this.setupSubmitButton();

        await Promise.all([
            this.loadSubreddits(),
            this.loadPosts(),
            this.loadStats()
        ]);

        // Random visitor count for retro fun
        const visitor = document.getElementById('visitor-count');
        if (visitor) visitor.textContent = Math.floor(Math.random() * 9000) + 1000;
    }

    // ========================================
    // SETUP
    // ========================================

    setupSortTabs() {
        document.querySelectorAll('.tab-btn[data-sort]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn[data-sort]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSort = btn.dataset.sort;
                this.loadPosts();
            });
        });
    }

    setupSubmitButton() {
        const btn = document.getElementById('show-submit');
        if (btn) {
            btn.addEventListener('click', () => {
                const box = document.getElementById('submit-box');
                if (box) {
                    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setTimeout(() => {
                        document.getElementById('post-title').focus();
                    }, 300);
                }
            });
        }
    }

    setupSubmitForm() {
        const form = document.getElementById('post-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (this.editingPostId) {
                await this.updatePost();
            } else {
                await this.createPost();
            }
        });
    }

    setupSearch() {
        const input = document.getElementById('search-input');
        const btn = document.getElementById('search-btn');
        let debounce;

        const doSearch = () => {
            const query = input.value.trim().toLowerCase();
            this.filterPosts(query);
        };

        input.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(doSearch, 300);
        });

        btn.addEventListener('click', doSearch);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                doSearch();
            }
        });
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'j':
                    e.preventDefault();
                    this.navigatePost(1);
                    break;
                case 'k':
                    e.preventDefault();
                    this.navigatePost(-1);
                    break;
                case 'a':
                    e.preventDefault();
                    this.voteSelectedPost('up');
                    break;
                case 'z':
                    e.preventDefault();
                    this.voteSelectedPost('down');
                    break;
                case 'enter':
                    e.preventDefault();
                    this.toggleSelectedPost();
                    break;
            }

            // Ctrl/Cmd + N to focus new post
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                const box = document.getElementById('submit-box');
                if (box) {
                    box.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => document.getElementById('post-title').focus(), 300);
                }
            }
        });
    }

    // ========================================
    // DATA LOADING
    // ========================================

    async loadSubreddits() {
        try {
            const response = await fetch(`${this.apiBase}/subreddits`);
            if (response.ok) {
                this.subreddits = await response.json();
                this.renderSubreddits();
            }
        } catch (error) {
            console.error('Error loading subreddits:', error);
        }
    }

    async loadPosts() {
        const loading = document.getElementById('loading');
        loading.style.display = 'block';

        try {
            const params = new URLSearchParams({
                sort: this.currentSort,
                subreddit: this.currentSubreddit
            });
            const response = await fetch(`${this.apiBase}/posts?${params}`);
            if (response.ok) {
                this.posts = await response.json();
                this.renderPosts();
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            loading.style.display = 'none';
        }
    }

    async loadStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
            if (response.ok) {
                const stats = await response.json();
                this.setTextContent('total-posts', stats.totalPosts);
                this.setTextContent('total-comments', stats.totalComments || 0);
                this.setTextContent('unique-authors', stats.uniqueAuthors);
                this.setTextContent('total-upvotes', stats.totalUpvotes || 0);
                this.setTextContent('user-karma', `${stats.totalUpvotes || 0} pts`);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // ========================================
    // RENDERING
    // ========================================

    renderSubreddits() {
        const list = document.getElementById('subreddit-list');
        if (!list) return;

        list.innerHTML = this.subreddits.map(sub => `
            <li class="${sub.name === this.currentSubreddit ? 'active' : ''}" data-sub="${sub.name}">
                <span class="sub-name">r/${this.escapeHTML(sub.name)}</span>
                <span class="sub-count">${sub.members}</span>
            </li>
        `).join('');

        list.querySelectorAll('li').forEach(li => {
            li.addEventListener('click', () => {
                this.currentSubreddit = li.dataset.sub;
                this.updateSubredditHeader();
                this.loadPosts();
                this.renderSubreddits();
            });
        });
    }

    updateSubredditHeader() {
        this.setTextContent('current-sub-name', this.currentSubreddit);
        const sub = this.subreddits.find(s => s.name === this.currentSubreddit);
        this.setTextContent('current-sub-desc', sub ? sub.description : '');
    }

    renderPosts() {
        const container = document.getElementById('posts-container');

        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>// NO POSTS FOUND //</h3>
                    <p>This board is empty. Be the first to post something!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.posts.map((post, index) => this.createPostHTML(post, index)).join('');
        this.bindPostEvents();
    }

    createPostHTML(post, index) {
        const timeAgo = this.timeAgo(post.date);
        const commentCount = (post.comments || []).length;
        const score = post.score || 0;

        const tagsHTML = (post.tags || []).length > 0
            ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${this.escapeHTML(tag)}</span>`).join('')}</div>`
            : '';

        const previewText = post.content.length > 200 ? post.content.substring(0, 200) + '...' : post.content;

        return `
            <article class="post ${this.selectedPostIndex === index ? 'selected' : ''}" data-post-id="${post.id}" data-index="${index}">
                <div class="post-rank">${index + 1}</div>
                <div class="vote-column">
                    <button class="vote-btn upvote" data-post-id="${post.id}" data-dir="up" title="Upvote">&#9650;</button>
                    <span class="vote-score" data-score-id="${post.id}">${score}</span>
                    <button class="vote-btn downvote" data-post-id="${post.id}" data-dir="down" title="Downvote">&#9660;</button>
                </div>
                <div class="post-body">
                    <div class="post-meta-line">
                        <span class="post-subreddit" data-sub="${post.subreddit || 'general'}">r/${this.escapeHTML(post.subreddit || 'general')}</span>
                        <span>&bull;</span>
                        <span>Posted by <span class="post-author">${this.escapeHTML(post.author || 'Anonymous')}</span></span>
                        <span class="post-time">${timeAgo}</span>
                    </div>
                    <div class="post-title" data-post-id="${post.id}">${this.escapeHTML(post.title)}</div>
                    <div class="post-preview">${this.escapeHTML(previewText)}</div>
                    ${tagsHTML}
                    <div class="post-actions">
                        <button class="action-link toggle-comments" data-post-id="${post.id}">${commentCount} comment${commentCount !== 1 ? 's' : ''}</button>
                        <button class="action-link edit-btn" data-post-id="${post.id}">edit</button>
                        <button class="action-link delete-btn" data-post-id="${post.id}">delete</button>
                    </div>
                </div>
            </article>
            ${this.expandedPostId === post.id ? this.createExpandedHTML(post) : ''}
        `;
    }

    createExpandedHTML(post) {
        const commentsHTML = (post.comments || []).map(comment => `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-vote">
                    <button class="comment-vote-btn" data-post-id="${post.id}" data-comment-id="${comment.id}" data-dir="up">&#9650;</button>
                    <span class="comment-vote-score">${(comment.upvotes || 0) - (comment.downvotes || 0)}</span>
                    <button class="comment-vote-btn" data-post-id="${post.id}" data-comment-id="${comment.id}" data-dir="down">&#9660;</button>
                </div>
                <div class="comment-body">
                    <div class="comment-meta">
                        <span class="comment-author">${this.escapeHTML(comment.author)}</span>
                        &bull; ${this.timeAgo(comment.date)}
                    </div>
                    <div class="comment-text">${this.escapeHTML(comment.content)}</div>
                </div>
            </div>
        `).join('');

        return `
            <div class="post-expanded" data-expanded-id="${post.id}">
                <div class="post-full-content">${this.escapeHTML(post.content)}</div>
                <div class="comment-form" data-post-id="${post.id}">
                    <textarea placeholder="Write a comment..." rows="3"></textarea>
                    <button class="pixel-btn add-comment-btn" data-post-id="${post.id}">REPLY</button>
                </div>
                <div class="comments-section">
                    <div class="comments-header">${(post.comments || []).length} COMMENTS</div>
                    ${commentsHTML || '<p style="color:var(--text-muted);font-size:13px;padding:8px 0;">No comments yet. Be the first!</p>'}
                </div>
            </div>
        `;
    }

    bindPostEvents() {
        // Vote buttons
        document.querySelectorAll('.vote-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const postId = parseInt(btn.dataset.postId);
                const dir = btn.dataset.dir;
                this.votePost(postId, dir, btn);
            });
        });

        // Post title click -> expand
        document.querySelectorAll('.post-title[data-post-id]').forEach(title => {
            title.addEventListener('click', () => {
                const postId = parseInt(title.dataset.postId);
                this.toggleExpand(postId);
            });
        });

        // Toggle comments
        document.querySelectorAll('.toggle-comments').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = parseInt(btn.dataset.postId);
                this.toggleExpand(postId);
            });
        });

        // Subreddit links in posts
        document.querySelectorAll('.post-subreddit').forEach(link => {
            link.addEventListener('click', (e) => {
                e.stopPropagation();
                this.currentSubreddit = link.dataset.sub;
                this.updateSubredditHeader();
                this.loadPosts();
                this.renderSubreddits();
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = parseInt(btn.dataset.postId);
                this.editPost(postId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = parseInt(btn.dataset.postId);
                this.deletePost(postId);
            });
        });

        // Comment buttons
        document.querySelectorAll('.add-comment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = parseInt(btn.dataset.postId);
                this.addComment(postId);
            });
        });

        // Comment vote buttons
        document.querySelectorAll('.comment-vote-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const postId = parseInt(btn.dataset.postId);
                const commentId = parseInt(btn.dataset.commentId);
                const dir = btn.dataset.dir;
                this.voteComment(postId, commentId, dir);
            });
        });

        // Post selection on click
        document.querySelectorAll('.post').forEach(article => {
            article.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('.post-title') || e.target.closest('.post-subreddit')) return;
                const index = parseInt(article.dataset.index);
                this.selectPost(index);
            });
        });
    }

    // ========================================
    // ACTIONS
    // ========================================

    async votePost(postId, direction, btnElement) {
        try {
            const response = await fetch(`${this.apiBase}/posts/${postId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direction })
            });

            if (response.ok) {
                const result = await response.json();
                const scoreEl = document.querySelector(`[data-score-id="${postId}"]`);
                if (scoreEl) scoreEl.textContent = result.score;

                // Update local data
                const post = this.posts.find(p => p.id === postId);
                if (post) {
                    post.upvotes = result.upvotes;
                    post.downvotes = result.downvotes;
                    post.score = result.score;
                }

                // Visual feedback
                if (btnElement) {
                    btnElement.classList.add('voted');
                    setTimeout(() => btnElement.classList.remove('voted'), 600);
                }

                this.loadStats();
            }
        } catch (error) {
            console.error('Error voting:', error);
        }
    }

    async createPost() {
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const tags = document.getElementById('post-tags').value.trim();
        const author = document.getElementById('post-author').value.trim() || 'Anonymous';
        const subreddit = document.getElementById('post-subreddit').value;

        if (!title || !content) {
            this.showNotification('Title and content are required!');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, tags, author, subreddit })
            });

            if (response.ok) {
                this.resetForm();
                await this.loadPosts();
                this.loadStats();
                this.loadSubreddits();
                this.showNotification('POST SUBMITTED SUCCESSFULLY');
            } else {
                const error = await response.json();
                this.showNotification(`ERROR: ${error.error}`);
            }
        } catch (error) {
            console.error('Error creating post:', error);
            this.showNotification('FAILED TO CREATE POST');
        }
    }

    async updatePost() {
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const tags = document.getElementById('post-tags').value.trim();
        const subreddit = document.getElementById('post-subreddit').value;

        if (!title || !content) {
            this.showNotification('Title and content are required!');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/posts/${this.editingPostId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, content, tags, subreddit })
            });

            if (response.ok) {
                this.editingPostId = null;
                this.resetForm();
                await this.loadPosts();
                this.loadStats();
                this.showNotification('POST UPDATED SUCCESSFULLY');
            } else {
                const error = await response.json();
                this.showNotification(`ERROR: ${error.error}`);
            }
        } catch (error) {
            console.error('Error updating post:', error);
            this.showNotification('FAILED TO UPDATE POST');
        }
    }

    editPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        this.editingPostId = postId;
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-tags').value = (post.tags || []).join(', ');
        document.getElementById('post-author').value = post.author || '';
        document.getElementById('post-subreddit').value = post.subreddit || 'general';

        const btn = document.getElementById('submit-post-btn');
        btn.textContent = 'UPDATE';

        const box = document.getElementById('submit-box');
        box.scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => document.getElementById('post-title').focus(), 300);
    }

    async deletePost(postId) {
        if (!confirm('Delete this post? This cannot be undone.')) return;

        try {
            const response = await fetch(`${this.apiBase}/posts/${postId}`, { method: 'DELETE' });
            if (response.ok) {
                this.posts = this.posts.filter(p => p.id !== postId);
                if (this.expandedPostId === postId) this.expandedPostId = null;
                this.renderPosts();
                this.loadStats();
                this.loadSubreddits();
                this.showNotification('POST DELETED');
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            this.showNotification('FAILED TO DELETE POST');
        }
    }

    async addComment(postId) {
        const form = document.querySelector(`.comment-form[data-post-id="${postId}"]`);
        if (!form) return;

        const textarea = form.querySelector('textarea');
        const content = textarea.value.trim();
        if (!content) return;

        const author = document.getElementById('post-author').value.trim() || 'Anonymous';

        try {
            const response = await fetch(`${this.apiBase}/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ author, content })
            });

            if (response.ok) {
                const newComment = await response.json();
                const post = this.posts.find(p => p.id === postId);
                if (post) {
                    if (!post.comments) post.comments = [];
                    post.comments.push(newComment);
                }
                this.renderPosts();
                this.loadStats();
                this.showNotification('COMMENT ADDED');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            this.showNotification('FAILED TO ADD COMMENT');
        }
    }

    async voteComment(postId, commentId, direction) {
        try {
            const response = await fetch(`${this.apiBase}/posts/${postId}/comments/${commentId}/vote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direction })
            });

            if (response.ok) {
                const result = await response.json();
                const post = this.posts.find(p => p.id === postId);
                if (post) {
                    const comment = (post.comments || []).find(c => c.id === commentId);
                    if (comment) {
                        comment.upvotes = result.upvotes;
                        comment.downvotes = result.downvotes;
                    }
                }
                this.renderPosts();
            }
        } catch (error) {
            console.error('Error voting on comment:', error);
        }
    }

    toggleExpand(postId) {
        if (this.expandedPostId === postId) {
            this.expandedPostId = null;
        } else {
            this.expandedPostId = postId;
        }
        this.renderPosts();
    }

    // ========================================
    // SEARCH & FILTER
    // ========================================

    filterPosts(query) {
        if (!query) {
            this.renderPosts();
            return;
        }

        const filtered = this.posts.filter(post => {
            return post.title.toLowerCase().includes(query) ||
                   post.content.toLowerCase().includes(query) ||
                   (post.author || '').toLowerCase().includes(query) ||
                   (post.tags || []).some(tag => tag.toLowerCase().includes(query));
        });

        const container = document.getElementById('posts-container');
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>// NO RESULTS //</h3>
                    <p>No posts match "${this.escapeHTML(query)}"</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map((post, index) => this.createPostHTML(post, index)).join('');
        this.bindPostEvents();
    }

    // ========================================
    // KEYBOARD NAVIGATION
    // ========================================

    navigatePost(direction) {
        const posts = document.querySelectorAll('.post');
        if (posts.length === 0) return;

        // Remove old selection
        posts.forEach(p => p.classList.remove('selected'));

        this.selectedPostIndex += direction;
        if (this.selectedPostIndex < 0) this.selectedPostIndex = 0;
        if (this.selectedPostIndex >= posts.length) this.selectedPostIndex = posts.length - 1;

        const selected = posts[this.selectedPostIndex];
        selected.classList.add('selected');
        selected.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    selectPost(index) {
        const posts = document.querySelectorAll('.post');
        posts.forEach(p => p.classList.remove('selected'));
        this.selectedPostIndex = index;
        if (posts[index]) posts[index].classList.add('selected');
    }

    voteSelectedPost(direction) {
        if (this.selectedPostIndex < 0 || this.selectedPostIndex >= this.posts.length) return;
        const post = this.posts[this.selectedPostIndex];
        if (post) this.votePost(post.id, direction);
    }

    toggleSelectedPost() {
        if (this.selectedPostIndex < 0 || this.selectedPostIndex >= this.posts.length) return;
        const post = this.posts[this.selectedPostIndex];
        if (post) this.toggleExpand(post.id);
    }

    // ========================================
    // UTILITIES
    // ========================================

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setTextContent(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    timeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
        if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
        return date.toLocaleDateString();
    }

    resetForm() {
        document.getElementById('post-form').reset();
        this.editingPostId = null;
        const btn = document.getElementById('submit-post-btn');
        if (btn) btn.textContent = 'SUBMIT';
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `> ${message}`;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in forwards';
            setTimeout(() => {
                if (notification.parentNode) notification.parentNode.removeChild(notification);
            }, 300);
        }, 2500);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new RetroReddit();
});
