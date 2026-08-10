require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const schema = new mongoose.Schema({ name: String, image: String }, { strict: false });
  const Product = mongoose.models.Product || mongoose.model('Product', schema);
  
  const p = await Product.find({}, 'name image');
  console.log(JSON.stringify(p, null, 2));
  process.exit(0);
});
