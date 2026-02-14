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

// Available subreddits
const SUBREDDITS = [
    { name: 'all', description: 'All posts from every board', members: 0 },
    { name: 'general', description: 'General discussion and chitchat', members: 0 },
    { name: 'technology', description: 'Tech news, gadgets, and programming', members: 0 },
    { name: 'creative', description: 'Art, writing, music, and creative works', members: 0 },
    { name: 'gaming', description: 'Video games, tabletop, and more', members: 0 },
    { name: 'random', description: 'Anything goes', members: 0 },
    { name: 'meta', description: 'Discussion about this site', members: 0 },
    { name: 'showoff', description: 'Show off your projects and achievements', members: 0 }
];

// Fallback in-memory storage
let inMemoryPosts = [
    {
        id: Date.now() - 3,
        title: "Welcome to RetroReddit -- the front page of the retro internet",
        content: "Welcome to our community! This is a shared space where everyone can post, vote, and comment.\n\nFeel free to share your thoughts, experiences, and ideas here. Use the subreddit boards to find your community.\n\nUpvote what you like, downvote what you don't, and leave comments to join the conversation.\n\nHappy posting!",
        author: "admin",
        tags: ["welcome", "community", "meta"],
        subreddit: "meta",
        date: new Date(Date.now() - 86400000).toISOString(),
        wordCount: 50,
        upvotes: 42,
        downvotes: 3,
        score: 39,
        comments: [
            {
                id: 1,
                author: "retro_fan",
                content: "Love the retro aesthetic! Feels like the good old days of the internet.",
                date: new Date(Date.now() - 80000000).toISOString(),
                upvotes: 12,
                downvotes: 0
            },
            {
                id: 2,
                author: "pixel_pusher",
                content: "This is awesome. Finally a place that doesn't look like every other modern website.",
                date: new Date(Date.now() - 70000000).toISOString(),
                upvotes: 8,
                downvotes: 1
            }
        ]
    },
    {
        id: Date.now() - 2,
        title: "What retro tech do you miss the most?",
        content: "I've been thinking about all the old tech that's disappeared. CRT monitors with that satisfying degauss button, floppy disks, dial-up modems with their beautiful handshake sounds...\n\nWhat piece of retro technology do you miss the most and why?\n\nFor me, it's the tactile feedback of old mechanical keyboards. Nothing today quite compares to a Model M.",
        author: "nostalgia_bytes",
        tags: ["retro", "technology", "discussion"],
        subreddit: "technology",
        date: new Date(Date.now() - 43200000).toISOString(),
        wordCount: 55,
        upvotes: 28,
        downvotes: 2,
        score: 26,
        comments: [
            {
                id: 1,
                author: "dial_up_kid",
                content: "The sound of a 56k modem connecting. Pure music.",
                date: new Date(Date.now() - 40000000).toISOString(),
                upvotes: 15,
                downvotes: 0
            }
        ]
    },
    {
        id: Date.now() - 1,
        title: "Just finished my pixel art game -- check it out!",
        content: "After 6 months of work, I finally finished my retro-style platformer built entirely with pixel art.\n\nIt features:\n- 16-bit style graphics\n- Chiptune soundtrack\n- 30 hand-crafted levels\n- Boss battles\n- Secret areas\n\nWould love to hear your feedback! The game is all about capturing that SNES-era magic.",
        author: "indie_dev_42",
        tags: ["gaming", "pixel-art", "indie"],
        subreddit: "showoff",
        date: new Date(Date.now() - 21600000).toISOString(),
        wordCount: 48,
        upvotes: 55,
        downvotes: 4,
        score: 51,
        comments: [
            {
                id: 1,
                author: "gamer_grrl",
                content: "This looks incredible! The sprite work is top notch.",
                date: new Date(Date.now() - 20000000).toISOString(),
                upvotes: 7,
                downvotes: 0
            },
            {
                id: 2,
                author: "chiptune_fan",
                content: "Did you compose the soundtrack yourself? It sounds authentic!",
                date: new Date(Date.now() - 18000000).toISOString(),
                upvotes: 4,
                downvotes: 0
            },
            {
                id: 3,
                author: "retro_reviewer",
                content: "Wishlisted. Can't wait to play this on my CRT setup.",
                date: new Date(Date.now() - 15000000).toISOString(),
                upvotes: 6,
                downvotes: 0
            }
        ]
    }
];
let isMongoConnected = false;

// Connect to MongoDB
async function connectToMongo() {
    let retries = 3;
    while (retries > 0) {
        try {
            console.log(`Attempting to connect to MongoDB (attempt ${4 - retries}/3)...`);
            console.log('Connection string:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));

            await client.connect();
            console.log('Connected to MongoDB successfully!');
            isMongoConnected = true;

            const db = client.db(DB_NAME);
            await db.admin().ping();
            console.log('Database ping successful!');

            const collection = db.collection(COLLECTION_NAME);
            const count = await collection.countDocuments();
            console.log(`Found ${count} existing posts in database`);

            if (count === 0) {
                await collection.insertMany(inMemoryPosts);
                console.log('Added sample posts to database');
            }
            return;
        } catch (error) {
            console.error(`MongoDB connection attempt ${4 - retries} failed:`);
            console.error('Error message:', error.message);
            retries--;

            if (retries === 0) {
                console.error('Failed to connect to MongoDB. Using fallback in-memory storage.');
            } else {
                console.log(`Retrying in 3 seconds... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }
}

// Helper: get posts collection
function getCollection() {
    return client.db(DB_NAME).collection(COLLECTION_NAME);
}

// Helper: calculate hot score (simplified Reddit algorithm)
function hotScore(upvotes, downvotes, dateStr) {
    const score = upvotes - downvotes;
    const order = Math.log10(Math.max(Math.abs(score), 1));
    const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
    const seconds = (new Date(dateStr).getTime() / 1000) - 1134028003;
    return sign * order + seconds / 45000;
}

// API Routes

// Get subreddits list
app.get('/api/subreddits', async (req, res) => {
    try {
        let posts;
        if (isMongoConnected) {
            posts = await getCollection().find({}).toArray();
        } else {
            posts = inMemoryPosts;
        }

        const subs = SUBREDDITS.map(sub => {
            const count = sub.name === 'all'
                ? posts.length
                : posts.filter(p => p.subreddit === sub.name).length;
            return { ...sub, members: count };
        });

        res.json(subs);
    } catch (error) {
        console.error('Error fetching subreddits:', error);
        res.json(SUBREDDITS);
    }
});

// Get all posts with sorting and filtering
app.get('/api/posts', async (req, res) => {
    try {
        const { sort = 'hot', subreddit = 'all' } = req.query;
        let posts;

        if (isMongoConnected) {
            const query = subreddit && subreddit !== 'all' ? { subreddit } : {};
            posts = await getCollection().find(query).toArray();
        } else {
            posts = subreddit && subreddit !== 'all'
                ? inMemoryPosts.filter(p => p.subreddit === subreddit)
                : [...inMemoryPosts];
        }

        // Sort posts
        switch (sort) {
            case 'hot':
                posts.sort((a, b) => hotScore(b.upvotes || 0, b.downvotes || 0, b.date) - hotScore(a.upvotes || 0, a.downvotes || 0, a.date));
                break;
            case 'new':
                posts.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'top':
                posts.sort((a, b) => (b.score || 0) - (a.score || 0));
                break;
            case 'controversial':
                posts.sort((a, b) => {
                    const aTotal = (a.upvotes || 0) + (a.downvotes || 0);
                    const bTotal = (b.upvotes || 0) + (b.downvotes || 0);
                    const aRatio = aTotal > 0 ? Math.min((a.upvotes || 0), (a.downvotes || 0)) / Math.max((a.upvotes || 0), (a.downvotes || 0)) : 0;
                    const bRatio = bTotal > 0 ? Math.min((b.upvotes || 0), (b.downvotes || 0)) / Math.max((b.upvotes || 0), (b.downvotes || 0)) : 0;
                    return (bRatio * bTotal) - (aRatio * aTotal);
                });
                break;
            default:
                posts.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.json(inMemoryPosts.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
});

// Get single post
app.get('/api/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let post;

        if (isMongoConnected) {
            post = await getCollection().findOne({ id: parseInt(id) });
        } else {
            post = inMemoryPosts.find(p => p.id === parseInt(id));
        }

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Create a new post
app.post('/api/posts', async (req, res) => {
    try {
        const { title, content, tags, author, subreddit } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const newPost = {
            id: Date.now(),
            title: title.trim(),
            content: content.trim(),
            author: (author || 'Anonymous').trim(),
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            subreddit: subreddit || 'general',
            date: new Date().toISOString(),
            wordCount: content.trim().split(/\s+/).length,
            upvotes: 1,
            downvotes: 0,
            score: 1,
            comments: []
        };

        if (isMongoConnected) {
            await getCollection().insertOne(newPost);
        } else {
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
        const { title, content, tags, subreddit } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required' });
        }

        const updates = {
            title: title.trim(),
            content: content.trim(),
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            subreddit: subreddit || 'general',
            wordCount: content.trim().split(/\s+/).length
        };

        if (isMongoConnected) {
            const result = await getCollection().findOneAndUpdate(
                { id: parseInt(id) },
                { $set: updates },
                { returnDocument: 'after' }
            );

            if (!result.value) {
                return res.status(404).json({ error: 'Post not found' });
            }
            res.json(result.value);
        } else {
            const postIndex = inMemoryPosts.findIndex(post => post.id === parseInt(id));
            if (postIndex === -1) {
                return res.status(404).json({ error: 'Post not found' });
            }
            inMemoryPosts[postIndex] = { ...inMemoryPosts[postIndex], ...updates };
            res.json(inMemoryPosts[postIndex]);
        }
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Vote on a post
app.post('/api/posts/:id/vote', async (req, res) => {
    try {
        const { id } = req.params;
        const { direction } = req.body; // 'up' or 'down'

        if (!['up', 'down'].includes(direction)) {
            return res.status(400).json({ error: 'Direction must be "up" or "down"' });
        }

        if (isMongoConnected) {
            const inc = direction === 'up'
                ? { upvotes: 1, score: 1 }
                : { downvotes: 1, score: -1 };

            const result = await getCollection().findOneAndUpdate(
                { id: parseInt(id) },
                { $inc: inc },
                { returnDocument: 'after' }
            );

            if (!result.value) {
                return res.status(404).json({ error: 'Post not found' });
            }
            res.json({ upvotes: result.value.upvotes, downvotes: result.value.downvotes, score: result.value.score });
        } else {
            const post = inMemoryPosts.find(p => p.id === parseInt(id));
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }

            if (direction === 'up') {
                post.upvotes = (post.upvotes || 0) + 1;
            } else {
                post.downvotes = (post.downvotes || 0) + 1;
            }
            post.score = (post.upvotes || 0) - (post.downvotes || 0);

            res.json({ upvotes: post.upvotes, downvotes: post.downvotes, score: post.score });
        }
    } catch (error) {
        console.error('Error voting:', error);
        res.status(500).json({ error: 'Failed to vote' });
    }
});

// Add a comment to a post
app.post('/api/posts/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const { author, content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Comment content is required' });
        }

        const newComment = {
            id: Date.now(),
            author: (author || 'Anonymous').trim(),
            content: content.trim(),
            date: new Date().toISOString(),
            upvotes: 1,
            downvotes: 0
        };

        if (isMongoConnected) {
            const result = await getCollection().findOneAndUpdate(
                { id: parseInt(id) },
                { $push: { comments: newComment } },
                { returnDocument: 'after' }
            );

            if (!result.value) {
                return res.status(404).json({ error: 'Post not found' });
            }
            res.status(201).json(newComment);
        } else {
            const post = inMemoryPosts.find(p => p.id === parseInt(id));
            if (!post) {
                return res.status(404).json({ error: 'Post not found' });
            }
            if (!post.comments) post.comments = [];
            post.comments.push(newComment);
            res.status(201).json(newComment);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Vote on a comment
app.post('/api/posts/:postId/comments/:commentId/vote', async (req, res) => {
    try {
        const { postId, commentId } = req.params;
        const { direction } = req.body;

        if (!['up', 'down'].includes(direction)) {
            return res.status(400).json({ error: 'Direction must be "up" or "down"' });
        }

        if (isMongoConnected) {
            const post = await getCollection().findOne({ id: parseInt(postId) });
            if (!post) return res.status(404).json({ error: 'Post not found' });

            const comment = (post.comments || []).find(c => c.id === parseInt(commentId));
            if (!comment) return res.status(404).json({ error: 'Comment not found' });

            if (direction === 'up') comment.upvotes = (comment.upvotes || 0) + 1;
            else comment.downvotes = (comment.downvotes || 0) + 1;

            await getCollection().updateOne(
                { id: parseInt(postId) },
                { $set: { comments: post.comments } }
            );

            res.json({ upvotes: comment.upvotes, downvotes: comment.downvotes });
        } else {
            const post = inMemoryPosts.find(p => p.id === parseInt(postId));
            if (!post) return res.status(404).json({ error: 'Post not found' });

            const comment = (post.comments || []).find(c => c.id === parseInt(commentId));
            if (!comment) return res.status(404).json({ error: 'Comment not found' });

            if (direction === 'up') comment.upvotes = (comment.upvotes || 0) + 1;
            else comment.downvotes = (comment.downvotes || 0) + 1;

            res.json({ upvotes: comment.upvotes, downvotes: comment.downvotes });
        }
    } catch (error) {
        console.error('Error voting on comment:', error);
        res.status(500).json({ error: 'Failed to vote on comment' });
    }
});

// Delete a post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (isMongoConnected) {
            const result = await getCollection().deleteOne({ id: parseInt(id) });
            if (result.deletedCount === 0) {
                return res.status(404).json({ error: 'Post not found' });
            }
        } else {
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
            posts = await getCollection().find({}).toArray();
        } else {
            posts = inMemoryPosts;
        }

        const totalPosts = posts.length;
        const totalWords = posts.reduce((sum, post) => sum + (post.wordCount || 0), 0);
        const uniqueAuthors = [...new Set(posts.map(post => post.author))].length;
        const totalComments = posts.reduce((sum, post) => sum + (post.comments || []).length, 0);
        const totalUpvotes = posts.reduce((sum, post) => sum + (post.upvotes || 0), 0);

        res.json({
            totalPosts,
            totalWords,
            uniqueAuthors,
            totalComments,
            totalUpvotes
        });
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
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`MongoDB Status: ${isMongoConnected ? 'Connected' : 'Using Fallback Storage'}`);
        console.log(`RetroReddit is now live!`);
    });
}).catch(error => {
    console.error('Failed to connect to MongoDB:', error);
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT} (Fallback Mode)`);
        console.log(`Using in-memory storage - posts will be lost on restart`);
    });
});
