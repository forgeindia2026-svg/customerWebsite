const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://sktechnology75:Sathish*123@cluster0.bndl2.mongodb.net/test?retryWrites=true&w=majority');
mongoose.connection.on('open', async () => {
  const db = mongoose.connection.db;
  const jobs = await db.collection('jobs').find({jobCode: 'D-1961'}).toArray();
  console.log(JSON.stringify(jobs, null, 2));
  process.exit(0);
});
