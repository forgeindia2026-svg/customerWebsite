const mongoose = require('mongoose');
require('dotenv').config();

const categorySchema = new mongoose.Schema({ name: String, slug: String, image: String, isFeaturedOnHome: Boolean }, { timestamps: true });
const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

const updates = [
  { name: 'IP Cameras', image: 'local:ip_camera.png' },
  { name: 'DVR', image: 'local:dvr.png' },
  { name: 'WiFi Cameras', image: 'local:wifi_camera.png' },
  { name: 'Accessories', image: 'local:accessories.png' }
];

async function update() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  
  for (let u of updates) {
    const res = await Category.updateMany(
      { name: { $regex: new RegExp(u.name, 'i') } },
      { $set: { image: u.image } }
    );
    console.log('Updated ' + u.name + ':', res.modifiedCount);
  }
  process.exit(0);
}
update();
