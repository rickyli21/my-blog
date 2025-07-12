const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database file
const DB_FILE = path.join(__dirname, 'posts.json');

// Initialize database if it doesn't exist
function initializeDB() {
    if (!fs.existsSync(DB_FILE)) {
        const initialData = {
            posts: []
        };
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
    }
}

// Read posts from database
function readPosts() {
    try {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading posts:', error);
        return { posts: [] };
    }
}

// Write posts to database
function writePosts(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing posts:', error);
        return false;
    }
}

// API Routes

// Get all posts
app.get('/api/posts', (req, res) => {
    try {
        const data = readPosts();
        res.json(data.posts);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Create a new post
app.post('/api/posts', (req, res) => {
    try {
        const { title, content, tags, author } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const data = readPosts();
        const newPost = {
            id: Date.now(),
            title: title.trim(),
            content: content.trim(),
            author: author || 'Anonymous',
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            date: new Date().toISOString(),
            wordCount: content.trim().split(/\s+/).length
        };

        data.posts.unshift(newPost);
        
        if (writePosts(data)) {
            res.status(201).json(newPost);
        } else {
            res.status(500).json({ error: 'Failed to save post' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update a post
app.put('/api/posts/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, tags } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const data = readPosts();
        const postIndex = data.posts.findIndex(post => post.id == id);
        
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }

        data.posts[postIndex] = {
            ...data.posts[postIndex],
            title: title.trim(),
            content: content.trim(),
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            wordCount: content.trim().split(/\s+/).length
        };

        if (writePosts(data)) {
            res.json(data.posts[postIndex]);
        } else {
            res.status(500).json({ error: 'Failed to update post' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete a post
app.delete('/api/posts/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = readPosts();
        const postIndex = data.posts.findIndex(post => post.id == id);
        
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }

        data.posts.splice(postIndex, 1);
        
        if (writePosts(data)) {
            res.json({ message: 'Post deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to delete post' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Get blog statistics
app.get('/api/stats', (req, res) => {
    try {
        const data = readPosts();
        const totalPosts = data.posts.length;
        const totalWords = data.posts.reduce((sum, post) => sum + post.wordCount, 0);
        const uniqueAuthors = [...new Set(data.posts.map(post => post.author))].length;
        
        res.json({
            totalPosts,
            totalWords,
            uniqueAuthors
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize database and start server
initializeDB();

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Your shared blog is now live!`);
}); 