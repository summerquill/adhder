import { createConnection } from "node:net";

const PORT = 4173;
const HOST = "127.0.0.1";

function isPortInUse() {
  return new Promise((resolve) => {
    const socket = createConnection({ port: PORT, host: HOST });
    let settled = false;

    function finish(value) {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(value);
    }

    socket.setTimeout(800);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

if (await isPortInUse()) {
  console.error("");
  console.error(`✖ 端口 ${PORT} 已被占用，开发服务器没有启动。`);
  console.error("  最常见的原因是上一次的 npm run dev 还在后台运行。");
  console.error("  浏览器此时打开 http://localhost:4173/ 只会看到空白页或加载失败。");
  console.error("");
  console.error(`  查看占用进程：lsof -nP -iTCP:${PORT} -sTCP:LISTEN`);
  console.error("  结束该进程：  kill <PID>");
  console.error("");
  process.exit(1);
}
