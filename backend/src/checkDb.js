const http = require('http');

http.get('http://localhost:5000/api/dashboard', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('=== REAL TIME DASHBOARD DATA ===');
      console.log('Orders:', data.data?.orders?.length);
      console.log('Products:', data.data?.products?.length);
      console.log('Customers:', data.data?.customers?.length);
      console.log('Technicians:', data.data?.technicians?.length);
      if (data.data?.orders?.length > 0) {
        console.log('Sample Order:', data.data.orders[0]);
      }
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});
