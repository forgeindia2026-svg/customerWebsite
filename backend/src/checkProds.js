const http = require('http');

http.get('http://localhost:5000/api/products', (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('Success:', data.success);
      console.log('Count:', data.count || (data.data && data.data.length));
      if (data.data && data.data.length > 0) {
        console.log('First (latest) product:', data.data[0]);
      }
    } catch (e) {
      console.error('Error:', e);
    }
  });
});
