const mongoose = require('mongoose'); 
require('dotenv').config({ path: 'src/.env' }); 
require('dotenv').config(); 
mongoose.connect(process.env.MONGO_URI).then(async () => { 
  const db = mongoose.connection.db; 
  await db.collection('orders').deleteOne({ orderNumber: 'ORD-4339' }); 
  await db.collection('jobs').deleteOne({ jobCode: 'ORD-4339' }); 
  const dash = await db.collection('dashboards').findOne({}); 
  if(dash) { 
    const orders = dash.orders.filter(o => o.id !== 'ORD-4339'); 
    await db.collection('dashboards').updateOne({ _id: dash._id }, { $set: { orders } }); 
  } 
  console.log('Deleted ORD-4339'); 
  process.exit(0); 
}).catch(console.error);
