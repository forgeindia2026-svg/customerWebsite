const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://ficproject26_db_user:eoWUDTe8YNijwWuk@cluster0.bjo0gfj.mongodb.net/cctv-ecommerce?retryWrites=true&w=majority').then(async () => {
    const products = await mongoose.connection.db.collection('products').find().toArray();
    for (let p of products) {
        if (p.title.includes('Switch')) {
            await mongoose.connection.db.collection('products').updateOne(
                { _id: p._id },
                { $set: { image: 'http://localhost:5000/images/poe_switch.png' } }
            );
        }
    }
    console.log('Done updating MongoDB switch images!');
    process.exit(0);
});
