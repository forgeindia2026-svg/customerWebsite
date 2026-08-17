const mongoose = require('mongoose');

async function clean() {
  try {
    await mongoose.connect('mongodb+srv://cctvappdatabase:2JhhMOTXf7iIVQ53@cluster0.nqenjqu.mongodb.net/cctv-ecommerce?retryWrites=true&w=majority&appName=Cluster0');
    const db = mongoose.connection.db;
    const res = await db.collection('products').deleteMany({
      $or: [
        { title: /ert/i },
        { name: /ert/i }
      ]
    });
    console.log('Deleted ' + res.deletedCount + ' items directly from MongoDB Atlas');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

clean();
