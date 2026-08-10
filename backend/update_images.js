const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://ficproject26_db_user:eoWUDTe8YNijwWuk@cluster0.bjo0gfj.mongodb.net/cctv-ecommerce?retryWrites=true&w=majority').then(async () => {
    const products = await mongoose.connection.db.collection('products').find().toArray();
    for (let p of products) {
        if (p.image && p.image.startsWith('/') && !p.image.startsWith('/images') && !p.image.startsWith('http')) {
            await mongoose.connection.db.collection('products').updateOne(
                { _id: p._id },
                { $set: { image: 'http://localhost:5000/images' + p.image } }
            );
        }
    }
    console.log('Done updating MongoDB images!');
    process.exit(0);
});
