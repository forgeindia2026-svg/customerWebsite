require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    const db = mongoose.connection.db;
    
    // Check if products collection exists before dropping/clearing
    const collections = await db.listCollections({ name: 'products' }).toArray();
    if (collections.length > 0) {
      await db.collection('products').deleteMany({});
      console.log('Successfully deleted all dummy products!');
    } else {
      console.log('Products collection does not exist or is already empty.');
    }
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Connection error:', err);
  });
