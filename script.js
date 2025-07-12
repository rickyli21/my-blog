// Blog functionality with shared backend
class SharedBlog {
    constructor() {
        this.posts = [];
        this.editingPostId = null;
        this.apiBase = window.location.origin + '/api';
        this.init();
    }

    async init() {
        this.setupNavigation();
        this.setupFormHandling();
        await this.loadPosts();
        this.updateStats();
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        const sections = document.querySelectorAll('.content-section');

        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetSection = button.getAttribute('data-section');
                
                // Update active button
                navButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Show target section
                sections.forEach(section => {
                    section.classList.remove('active');
                    if (section.id === targetSection) {
                        section.classList.add('active');
                    }
                });
            });
        });
    }

    setupFormHandling() {
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

    async createPost() {
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const tags = document.getElementById('post-tags').value.trim();
        const author = document.getElementById('post-author')?.value.trim() || 'Anonymous';

        if (!title || !content) {
            alert('Please fill in both title and content.');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    tags,
                    author
                })
            });

            if (response.ok) {
                const newPost = await response.json();
                this.posts.unshift(newPost);
                this.displayPosts();
                this.updateStats();
                this.resetForm();
                
                // Switch to timeline view
                document.querySelector('[data-section="timeline"]').click();
                
                this.showNotification('Post published successfully!');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error creating post:', error);
            alert('Failed to create post. Please try again.');
        }
    }

    async updatePost() {
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const tags = document.getElementById('post-tags').value.trim();

        if (!title || !content) {
            alert('Please fill in both title and content.');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/posts/${this.editingPostId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content,
                    tags
                })
            });

            if (response.ok) {
                const updatedPost = await response.json();
                const postIndex = this.posts.findIndex(post => post.id === this.editingPostId);
                if (postIndex !== -1) {
                    this.posts[postIndex] = updatedPost;
                }
                
                this.displayPosts();
                this.updateStats();
                this.resetForm();
                this.editingPostId = null;
                
                // Switch to timeline view
                document.querySelector('[data-section="timeline"]').click();
                
                this.showNotification('Post updated successfully!');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error updating post:', error);
            alert('Failed to update post. Please try again.');
        }
    }

    async editPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        this.editingPostId = postId;
        
        // Fill the form with post data
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-tags').value = post.tags.join(', ');
        if (document.getElementById('post-author')) {
            document.getElementById('post-author').value = post.author;
        }
        
        // Switch to new post section
        document.querySelector('[data-section="new-post"]').click();
        
        // Update button text
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.textContent = 'Update Post';
        
        // Focus on title field
        document.getElementById('post-title').focus();
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/posts/${postId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.posts = this.posts.filter(post => post.id !== postId);
                this.displayPosts();
                this.updateStats();
                this.showNotification('Post deleted successfully!');
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post. Please try again.');
        }
    }

    async loadPosts() {
        try {
            const response = await fetch(`${this.apiBase}/posts`);
            if (response.ok) {
                this.posts = await response.json();
                this.displayPosts();
            } else {
                console.error('Failed to load posts');
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        }
    }

    displayPosts() {
        const container = document.getElementById('posts-container');
        
        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No posts yet</h3>
                    <p>Be the first to create a post and start the conversation!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.posts.map(post => this.createPostHTML(post)).join('');
        
        // Add event listeners to edit and delete buttons
        this.setupPostActions();
    }

    createPostHTML(post) {
        const date = new Date(post.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const tagsHTML = post.tags.length > 0 
            ? `<div class="post-tags">${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
            : '';

        return `
            <article class="post" data-post-id="${post.id}">
                <div class="post-header">
                    <h3 class="post-title">${this.escapeHTML(post.title)}</h3>
                    <div class="post-meta">
                        <span class="post-date">${date}</span>
                        <span class="post-author">by ${this.escapeHTML(post.author)}</span>
                        ${tagsHTML}
                    </div>
                </div>
                <div class="post-content">${this.escapeHTML(post.content)}</div>
                <div class="post-actions">
                    <button class="action-btn edit-btn" data-post-id="${post.id}">Edit</button>
                    <button class="action-btn delete-btn" data-post-id="${post.id}">Delete</button>
                </div>
            </article>
        `;
    }

    setupPostActions() {
        // Edit buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.target.getAttribute('data-post-id'));
                this.editPost(postId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const postId = parseInt(e.target.getAttribute('data-post-id'));
                this.deletePost(postId);
            });
        });
    }

    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async updateStats() {
        try {
            const response = await fetch(`${this.apiBase}/stats`);
            if (response.ok) {
                const stats = await response.json();
                document.getElementById('total-posts').textContent = stats.totalPosts;
                document.getElementById('total-words').textContent = stats.totalWords;
                
                // Add unique authors stat if element exists
                const uniqueAuthorsElement = document.getElementById('unique-authors');
                if (uniqueAuthorsElement) {
                    uniqueAuthorsElement.textContent = stats.uniqueAuthors;
                }
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    resetForm() {
        document.getElementById('post-form').reset();
        this.editingPostId = null;
        
        // Reset button text
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.textContent = 'Publish Post';
    }

    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: #333;
            color: #fff;
            padding: 15px 25px;
            border-radius: 5px;
            font-family: 'Courier Prime', monospace;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize the blog when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new SharedBlog();
});

// Add some keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + N to create new post
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        document.querySelector('[data-section="new-post"]').click();
        document.getElementById('post-title').focus();
    }
    
    // Ctrl/Cmd + T to go to timeline
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        document.querySelector('[data-section="timeline"]').click();
    }
});
