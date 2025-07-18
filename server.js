const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rickyli2100:HelloWorld@cluster0.scwe7jv.mongodb.net/blog?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 45000,
    maxPoolSize: 5,
    minPoolSize: 1,
});

// Database and collection names
const DB_NAME = 'blog';
const COLLECTION_NAME = 'posts';

// Fallback in-memory storage for when MongoDB is not available
let inMemoryPosts = [
    {
        id: Date.now() - 2,
        title: "Welcome to Our Shared Blog",
        content: "This is a shared blog where everyone can post and see each other's posts.\n\nFeel free to share your thoughts, experiences, and ideas here. This is a community space for everyone to contribute to.\n\nHappy blogging!",
        author: "Admin",
        tags: ["welcome", "community", "blogging"],
        date: new Date(Date.now() - 86400000).toISOString(),
        wordCount: 45
    },
    {
        id: Date.now() - 1,
        title: "The Power of Shared Stories",
        content: "When we share our stories, we create connections that transcend boundaries.\n\nThis blog is a space where diverse voices can come together, share experiences, and learn from each other.\n\nWhat story will you share today?",
        author: "Admin",
        tags: ["stories", "community", "connection"],
        date: new Date(Date.now() - 43200000).toISOString(),
        wordCount: 38
    }
];
let isMongoConnected = false;

// Connect to MongoDB
async function connectToMongo() {
    let retries = 3;
    while (retries > 0) {
        try {
            console.log(`Attempting to connect to MongoDB (attempt ${4 - retries}/3)...`);
            console.log('Connection string:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
            
            await client.connect();
            console.log('Connected to MongoDB successfully!');
            isMongoConnected = true;
            
            // Test the connection
            const db = client.db(DB_NAME);
            await db.admin().ping();
            console.log('Database ping successful!');
            
            // Create database and collection if they don't exist
            const collection = db.collection(COLLECTION_NAME);
            
            // Check if collection is empty and add sample posts
            const count = await collection.countDocuments();
            console.log(`Found ${count} existing posts in database`);
            
            if (count === 0) {
                const samplePosts = [
                    {
                        id: Date.now() - 2,
                        title: "Welcome to Our Shared Blog",
                        content: "This is a shared blog where everyone can post and see each other's posts.\n\nFeel free to share your thoughts, experiences, and ideas here. This is a community space for everyone to contribute to.\n\nHappy blogging!",
                        author: "Admin",
                        tags: ["welcome", "community", "blogging"],
                        date: new Date(Date.now() - 86400000).toISOString(),
                        wordCount: 45
                    },
                    {
                        id: Date.now() - 1,
                        title: "The Power of Shared Stories",
                        content: "When we share our stories, we create connections that transcend boundaries.\n\nThis blog is a space where diverse voices can come together, share experiences, and learn from each other.\n\nWhat story will you share today?",
                        author: "Admin",
                        tags: ["stories", "community", "connection"],
                        date: new Date(Date.now() - 43200000).toISOString(),
                        wordCount: 38
                    }
                ];
                
                await collection.insertMany(samplePosts);
                console.log('Added sample posts to database');
            }
            return; // Success, exit the retry loop
        } catch (error) {
            console.error(`MongoDB connection attempt ${4 - retries} failed:`);
            console.error('Error type:', error.constructor.name);
            console.error('Error message:', error.message);
            console.error('Error code:', error.code);
            console.error('Full error:', error);
            retries--;
            
            if (retries === 0) {
                console.error('Failed to connect to MongoDB after all retries. Starting server without database connection.');
                console.error('The blog will work but posts will not be saved permanently.');
                console.error('Using fallback in-memory storage.');
            } else {
                console.log(`Retrying in 3 seconds... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }
}

// API Routes

// Get all posts
app.get('/api/posts', async (req, res) => {
    try {
        if (isMongoConnected) {
            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);
            const posts = await collection.find({}).sort({ date: -1 }).toArray();
            res.json(posts);
        } else {
            // Use fallback storage
            res.json(inMemoryPosts.sort((a, b) => new Date(b.date) - new Date(a.date)));
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        // Fallback to in-memory storage if MongoDB fails
        res.json(inMemoryPosts.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
});

// Create a new post
app.post('/api/posts', async (req, res) => {
    try {
        const { title, content, tags, author } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const newPost = {
            id: Date.now(),
            title: title.trim(),
            content: content.trim(),
            author: author || 'Anonymous',
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            date: new Date().toISOString(),
            wordCount: content.trim().split(/\s+/).length
        };

        if (isMongoConnected) {
            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);
            await collection.insertOne(newPost);
        } else {
            // Use fallback storage
            inMemoryPosts.push(newPost);
        }
        
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update a post
app.put('/api/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, tags } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        if (isMongoConnected) {
            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);
            
            const result = await collection.findOneAndUpdate(
                { id: parseInt(id) },
                {
                    $set: {
                        title: title.trim(),
                        content: content.trim(),
                        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                        wordCount: content.trim().split(/\s+/).length
                    }
                },
                { returnDocument: 'after' }
            );

            if (!result.value) {
                return res.status(404).json({ error: 'Post not found' });
            }

            res.json(result.value);
        } else {
            // Use fallback storage
            const postIndex = inMemoryPosts.findIndex(post => post.id === parseInt(id));
            if (postIndex === -1) {
                return res.status(404).json({ error: 'Post not found' });
            }
            
            inMemoryPosts[postIndex] = {
                ...inMemoryPosts[postIndex],
                title: title.trim(),
                content: content.trim(),
                tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
                wordCount: content.trim().split(/\s+/).length
            };
            
            res.json(inMemoryPosts[postIndex]);
        }
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete a post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        if (isMongoConnected) {
            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);
            
            const result = await collection.deleteOne({ id: parseInt(id) });
            
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Post not found' });
            }
        } else {
            // Use fallback storage
            const postIndex = inMemoryPosts.findIndex(post => post.id === parseInt(id));
            if (postIndex === -1) {
                return res.status(404).json({ error: 'Post not found' });
            }
            inMemoryPosts.splice(postIndex, 1);
        }

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Get blog statistics
app.get('/api/stats', async (req, res) => {
    try {
        let posts;
        
        if (isMongoConnected) {
            const db = client.db(DB_NAME);
            const collection = db.collection(COLLECTION_NAME);
            
            const totalPosts = await collection.countDocuments();
            posts = await collection.find({}).toArray();
            const totalWords = posts.reduce((sum, post) => sum + post.wordCount, 0);
            const uniqueAuthors = [...new Set(posts.map(post => post.author))].length;
            
            res.json({
                totalPosts,
                totalWords,
                uniqueAuthors
            });
        } else {
            // Use fallback storage
            posts = inMemoryPosts;
            const totalPosts = posts.length;
            const totalWords = posts.reduce((sum, post) => sum + post.wordCount, 0);
            const uniqueAuthors = [...new Set(posts.map(post => post.author))].length;
            
            res.json({
                totalPosts,
                totalWords,
                uniqueAuthors
            });
        }
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        mongoConnected: isMongoConnected,
        postsInMemory: inMemoryPosts.length
    });
});

// Initialize database and start server
connectToMongo().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 MongoDB Status: ${isMongoConnected ? '✅ Connected' : '❌ Using Fallback Storage'}`);
        console.log(`🌐 Your shared blog is now live!`);
        console.log(`🔍 Health check available at: http://localhost:${PORT}/health`);
        console.log(`📝 API endpoints:`);
        console.log(`   GET  /api/posts - Get all posts`);
        console.log(`   POST /api/posts - Create new post`);
        console.log(`   PUT  /api/posts/:id - Update post`);
        console.log(`   DELETE /api/posts/:id - Delete post`);
        console.log(`   GET  /api/stats - Get blog statistics`);
    });
}).catch(error => {
    console.error('❌ Failed to connect to MongoDB:', error);
    // Start server anyway with fallback storage
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT} (Fallback Mode)`);
        console.log(`⚠️  Using in-memory storage - posts will be lost on restart`);
        console.log(`🌐 Your blog is still functional!`);
    });
}); 