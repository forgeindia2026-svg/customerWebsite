require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const schema = new mongoose.Schema({ name: String, image: String }, { strict: false });
  const Product = mongoose.models.Product || mongoose.model('Product', schema);
  
  // Set all to default placeholder first if they start with local:
  await Product.updateMany(
    { image: 'local:ip_camera.png', name: { $not: /Dahua|Hikvision/i } },
    { $set: { image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80' } }
  );

  console.log('Restored dummy products to placeholder image.');
  process.exit(0);
});
