// 测试需要读取仓库文件做结构性断言。这里只声明用到的最小 API，
// 避免为了一个测试引入 @types/node 依赖。
declare module "node:fs" {
  export function readFileSync(path: string, encoding: "utf8" | "utf-8"): string;
}
