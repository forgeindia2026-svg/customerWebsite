require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const schema = new mongoose.Schema({ title: String, image: String }, { strict: false });
  const Product = mongoose.models.Product || mongoose.model('Product', schema);
  
  await Product.updateMany({ title: /Finolex/i }, { $set: { image: 'local:accessories.png' } });
  await Product.updateMany({ title: /Seagate/i }, { $set: { image: 'local:accessories.png' } });
  await Product.updateMany({ title: /CP Plus/i }, { $set: { image: 'local:dvr.png' } });
  await Product.updateMany({ title: /Dahua/i }, { $set: { image: 'local:ip_camera.png' } });
  await Product.updateMany({ title: /Hikvision/i }, { $set: { image: 'local:ip_camera.png' } });
  await Product.updateMany({ title: /yyyy/i }, { $set: { image: 'local:wifi_camera.png' } });

  console.log('Fixed 6 products to use their respective local images.');
  process.exit(0);
});
