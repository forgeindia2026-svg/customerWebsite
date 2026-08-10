const mongoose = require('mongoose');
require('dotenv').config();

const productSchema = new mongoose.Schema({ name: String, image: String }, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

const updates = [
  { name: 'Finolex 3+1 CCTV Cable', image: 'local:accessories.png' },
  { name: 'Seagate SkyHawk 2TB', image: 'local:accessories.png' },
  { name: 'CP Plus 8 Channel NVR', image: 'local:dvr.png' },
  { name: 'Dahua 2MP Bullet', image: 'local:ip_camera.png' },
  { name: 'Hikvision 4MP IP Dome', image: 'local:ip_camera.png' },
  { name: 'yyyy', image: 'local:wifi_camera.png' }
];

async function update() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  
  for (let u of updates) {
    const res = await Product.updateMany(
      { name: { $regex: new RegExp(u.name.split(' ')[0], 'i') } },
      { $set: { image: u.image } }
    );
    console.log('Updated ' + u.name + ':', res.modifiedCount);
  }
  
  // also fix any remaining generic images
  await Product.updateMany(
    { image: { $regex: /1557597774-9d273605dfa9/ } },
    { $set: { image: 'local:ip_camera.png' } }
  );
  
  process.exit(0);
}
update();
