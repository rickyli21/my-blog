// Blog functionality
class RetroBlog {
    constructor() {
        this.posts = JSON.parse(localStorage.getItem('blogPosts')) || [];
        this.editingPostId = null;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupFormHandling();
        this.displayPosts();
        this.updateStats();
        this.addSamplePosts();
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
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.editingPostId) {
                this.updatePost();
            } else {
                this.createPost();
            }
        });
    }

    createPost() {
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const tags = document.getElementById('post-tags').value.trim();

        if (!title || !content) {
            alert('Please fill in both title and content.');
            return;
        }

        const post = {
            id: Date.now(),
            title: title,
            content: content,
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            date: new Date().toISOString(),
            wordCount: content.split(/\s+/).length
        };

        this.posts.unshift(post); // Add to beginning
        this.savePosts();
        this.displayPosts();
        this.updateStats();
        this.resetForm();
        
        // Switch to timeline view
        document.querySelector('[data-section="timeline"]').click();
        
        // Show success message
        this.showNotification('Post published successfully!');
    }

    updatePost() {
        const title = document.getElementById('post-title').value.trim();
        const content = document.getElementById('post-content').value.trim();
        const tags = document.getElementById('post-tags').value.trim();

        if (!title || !content) {
            alert('Please fill in both title and content.');
            return;
        }

        const postIndex = this.posts.findIndex(post => post.id === this.editingPostId);
        if (postIndex === -1) {
            alert('Post not found.');
            return;
        }

        // Update the post
        this.posts[postIndex] = {
            ...this.posts[postIndex],
            title: title,
            content: content,
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            wordCount: content.split(/\s+/).length
        };

        this.savePosts();
        this.displayPosts();
        this.updateStats();
        this.resetForm();
        this.editingPostId = null;
        
        // Switch to timeline view
        document.querySelector('[data-section="timeline"]').click();
        
        // Show success message
        this.showNotification('Post updated successfully!');
    }

    editPost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        this.editingPostId = postId;
        
        // Fill the form with post data
        document.getElementById('post-title').value = post.title;
        document.getElementById('post-content').value = post.content;
        document.getElementById('post-tags').value = post.tags.join(', ');
        
        // Switch to new post section
        document.querySelector('[data-section="new-post"]').click();
        
        // Update button text
        const submitBtn = document.querySelector('.submit-btn');
        submitBtn.textContent = 'Update Post';
        
        // Focus on title field
        document.getElementById('post-title').focus();
    }

    deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            return;
        }

        this.posts = this.posts.filter(post => post.id !== postId);
        this.savePosts();
        this.displayPosts();
        this.updateStats();
        
        this.showNotification('Post deleted successfully!');
    }

    displayPosts() {
        const container = document.getElementById('posts-container');
        
        if (this.posts.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No posts yet</h3>
                    <p>Create your first blog post to get started!</p>
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

    updateStats() {
        const totalPosts = this.posts.length;
        const totalWords = this.posts.reduce((sum, post) => sum + post.wordCount, 0);
        
        document.getElementById('total-posts').textContent = totalPosts;
        document.getElementById('total-words').textContent = totalWords;
    }

    savePosts() {
        localStorage.setItem('blogPosts', JSON.stringify(this.posts));
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

    addSamplePosts() {
        // Only add sample posts if no posts exist
        if (this.posts.length === 0) {
            const samplePosts = [
                {
                    id: Date.now() - 2,
                    title: "Welcome to My Retro Blog",
                    content: "This is my first post on this retro-styled blog. I'm excited to share my thoughts and experiences here.\n\nI've always been drawn to the simplicity and elegance of older web designs. There's something charming about the way things used to be - straightforward, functional, and beautiful in their own way.\n\nI hope you enjoy reading my posts as much as I enjoy writing them.",
                    tags: ["welcome", "first-post", "blogging"],
                    date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
                    wordCount: 67
                },
                {
                    id: Date.now() - 1,
                    title: "The Beauty of Simplicity",
                    content: "In a world of complex interfaces and overwhelming design choices, sometimes the most beautiful solutions are the simplest ones.\n\nThis blog embraces that philosophy. Clean typography, minimal distractions, and content that speaks for itself.\n\nWhat do you think about the retro aesthetic? Does it bring back memories of the early web?",
                    tags: ["design", "simplicity", "retro"],
                    date: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
                    wordCount: 45
                }
            ];
            
            this.posts = samplePosts;
            this.savePosts();
            this.displayPosts();
            this.updateStats();
        }
    }
}

// Initialize the blog when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new RetroBlog();
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
