const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function check() {
  const res = await fetch('http://localhost:5000/api/dashboard');
  const data = await res.json();
  console.log('--- DASHBOARD DATA ---');
  console.log('Orders Count:', data.data?.orders?.length);
  console.log('Products Count:', data.data?.products?.length);
  console.log('Customers Count:', data.data?.customers?.length);
  console.log('Technicians Count:', data.data?.technicians?.length);
  if (data.data?.orders?.length > 0) {
    console.log('First Order:', data.data.orders[0]);
  }
}

check().catch(console.error);
