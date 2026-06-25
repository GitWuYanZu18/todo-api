// server/server.js - Railway 入口
// Railpack 检测到 server/ 下有 package.json 时，会自动选这个文件作为启动命令
// 它只是代理到根目录的 server.js，保持 __dirname 不变

require('../server.js');
