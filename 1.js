
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/root/www/Nginx/2_www.easynode.cn.key'),
  cert: fs.readFileSync('/root/www/Nginx/1_www.easynode.cn_bundle.crt')
};

https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('hello world\n');
}).listen(8000);

