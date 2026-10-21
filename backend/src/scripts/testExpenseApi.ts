import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import expenseRoutes from '../routes/expenseRoutes';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/expenses', expenseRoutes);

async function runApiTests() {
  console.log('=============================================');
  console.log('🧪 RUNNING COMPREHENSIVE EXPENSES API TESTS');
  console.log('=============================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cctv-ecommerce';
  
  try {
    console.log('📡 [1/6] Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('   ✅ MongoDB connected successfully.\n');

    const server = app.listen(5099);
    const baseUrl = 'http://127.0.0.1:5099';

    // TEST 1: GET /api/expenses
    console.log('🧪 [2/6] Testing: GET /api/expenses');
    const getRes = await fetch(`${baseUrl}/api/expenses`);
    const getData = await getRes.json();
    console.log(`   Status: ${getRes.status} ${getRes.statusText}`);
    console.log(`   Success: ${getData.success}, Current Records: ${getData.count}`);
    if (getRes.status === 200 && getData.success) {
      console.log('   ✅ PASS: GET /api/expenses returned 200 OK\n');
    } else {
      throw new Error(`FAIL: Unexpected response ${JSON.stringify(getData)}`);
    }

    // TEST 2: GET /api/expenses/summary
    console.log('🧪 [3/6] Testing: GET /api/expenses/summary');
    const sumRes = await fetch(`${baseUrl}/api/expenses/summary`);
    const sumData = await sumRes.json();
    console.log(`   Status: ${sumRes.status} ${sumRes.statusText}`);
    console.log(`   Month: ${sumData.currentMonth}`);
    console.log(`   Summary Totals:`, JSON.stringify(sumData.summary));
    if (sumRes.status === 200 && sumData.summary !== undefined) {
      console.log('   ✅ PASS: GET /api/expenses/summary returned 200 OK\n');
    } else {
      throw new Error(`FAIL: Unexpected summary response`);
    }

    // TEST 3: POST /api/expenses (Create an expense for GOPINATH.M)
    console.log('🧪 [4/6] Testing: POST /api/expenses (Create new expense)');
    const postPayload = {
      technicianName: 'GOPINATH.M',
      date: new Date().toISOString().split('T')[0],
      time: '11:15 AM',
      category: 'Petrol / Fuel',
      amount: 250,
      notes: 'Automated Test: Petrol claim for Hosur site installation',
      jobCode: 'SK-ORD-TEST',
      status: 'APPROVED'
    };

    const postRes = await fetch(`${baseUrl}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postPayload)
    });
    const postData = await postRes.json();
    console.log(`   Status: ${postRes.status} ${postRes.statusText}`);
    console.log(`   Created ID: ${postData.data?._id}, Amount: ₹${postData.data?.amount}`);
    if (postRes.status === 201 && postData.success && postData.data?._id) {
      console.log('   ✅ PASS: POST /api/expenses created record successfully\n');
    } else {
      throw new Error(`FAIL: POST failed: ${JSON.stringify(postData)}`);
    }

    const createdId = postData.data._id;

    // TEST 4: Query by Technician Name
    console.log('🧪 [5/6] Testing: GET /api/expenses?technicianName=GOPINATH');
    const queryRes = await fetch(`${baseUrl}/api/expenses?technicianName=GOPINATH`);
    const queryData = await queryRes.json();
    console.log(`   Status: ${queryRes.status} ${queryRes.statusText}`);
    console.log(`   Matches Found: ${queryData.count}`);
    const matched = queryData.data?.find((e: any) => e._id === createdId);
    if (matched) {
      console.log(`   Found technician claim: ₹${matched.amount} (${matched.category})`);
      console.log('   ✅ PASS: Query filter returned technician claim\n');
    } else {
      throw new Error('FAIL: Created claim not found in filtered query');
    }

    // TEST 5: DELETE /api/expenses/:id (Cleanup test data)
    console.log(`🧪 [6/6] Testing: DELETE /api/expenses/${createdId} (Cleanup)`);
    const delRes = await fetch(`${baseUrl}/api/expenses/${createdId}`, { method: 'DELETE' });
    const delData = await delRes.json();
    console.log(`   Status: ${delRes.status} ${delRes.statusText}`);
    if (delRes.status === 200 && delData.success) {
      console.log('   ✅ PASS: DELETE /api/expenses cleaned up test record\n');
    } else {
      throw new Error('FAIL: DELETE failed');
    }

    server.close();
    await mongoose.disconnect();

    console.log('=============================================');
    console.log('🎉 ALL 5 EXPENSES API TESTS PASSED WITH 100% SUCCESS!');
    console.log('=============================================');
    process.exit(0);

  } catch (err: any) {
    console.error('❌ API TEST ERROR:', err.message);
    process.exit(1);
  }
}

runApiTests();
