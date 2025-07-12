const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://rickyli2100:HelloWorld@cluster0.scwe7jv.mongodb.net/blog?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
    const client = new MongoClient(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000,
    });

    try {
        console.log('🔍 Testing MongoDB connection...');
        console.log('Connection string:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
        
        await client.connect();
        console.log('✅ Connected to MongoDB successfully!');
        
        const db = client.db('blog');
        await db.admin().ping();
        console.log('✅ Database ping successful!');
        
        const collection = db.collection('posts');
        const count = await collection.countDocuments();
        console.log(`📊 Found ${count} posts in database`);
        
        console.log('🎉 All tests passed! Your MongoDB connection is working.');
        
    } catch (error) {
        console.error('❌ MongoDB connection failed:');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        
        if (error.message.includes('Authentication failed')) {
            console.error('\n🔐 Authentication Error - Check your username/password');
        } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
            console.error('\n🌐 Network Error - Check your internet connection');
        } else if (error.message.includes('SSL') || error.message.includes('TLS')) {
            console.error('\n🔒 SSL/TLS Error - Network configuration issue');
        }
        
    } finally {
        await client.close();
    }
}

testConnection(); 