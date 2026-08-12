const mongoose = require('mongoose');
require('dotenv').config({path: '.env'});

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
  const products = await Product.find({});
  for (let p of products) {
    let img = '/images/cctv_accessories.png';
    const title = p.get('title').toLowerCase();
    
    if (title.includes('hdd') || title.includes('hard disk') || title.includes('purple') || title.includes('skyhawk')) 
      img = '/images/surveillance_hdd.png';
    else if (title.includes('dvr')) 
      img = '/images/dvr_system.png';
    else if (title.includes('nvr')) 
      img = '/images/nvr_system.png';
    else if (title.includes('cable') || title.includes('wire')) 
      img = '/images/cctv_cable.png';
    else if (title.includes('wifi') || title.includes('wi-fi')) 
      img = '/images/wifi_camera.png';
    else if (title.includes('ip camera') || title.includes('ptz')) 
      img = '/images/ip_camera.png';
    else if (title.includes('camera') || title.includes('bullet') || title.includes('dome')) 
      img = '/images/cctv_camera.png';
    else if (title.includes('door')) 
      img = '/images/video_door_phone.png';

    await Product.updateOne({_id: p._id}, {$set: {image: img, imageUrl: img}});
  }
  console.log('Images fixed!');
  process.exit(0);
}).catch(console.log);
