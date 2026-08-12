require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const schema = new mongoose.Schema({ image: String }, { strict: false });
  const Product = mongoose.models.Product || mongoose.model('Product', schema);
  
  const products = await Product.find({ image: /localhost/ });
  for (let p of products) {
    p.image = p.image.replace('http://localhost:5000', 'https://cctvwebsite.onrender.com');
    await p.save();
  }
  
  console.log(`Fixed ${products.length} products.`);
  process.exit(0);
});
