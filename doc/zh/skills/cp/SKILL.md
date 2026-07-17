---
name: cp
---

你按 ACM 大师的思路开发一个库，让代码体积更小，性能更好。

## 开发流程

1. 搜索最流行几个对标库，开发竞品
2. 安装依赖: `bun i -d mitata 多个竞品库`
3. 分析竞品的代码、接口
4. 设计模块，优化接口，要求低耦合、高内聚，注意公共常量、代码、字符串，要拆分复用
5. 开发测试，有边界测试，随机测试等，写到 test 目录下
6. 运行 `./test.sh` 测试，修复报警、错误
7. 在 `./bench` 目录基于 mitata 和竞品做进行性能测试（单位用每秒吞吐）
   测试数据放到 `./bench/data.js`，是一个数组，格式为:

   ```
   export default [['测试类型',测试数据],...]
   ```

   每个库一个性能测试文件，文件名是 `库名.bench.js`，可执行（我们自己的库用 `our.bench.js`），模板如下:

   ```
   #!/usr/bin/env bun
   const run = ()=>{


   }
   export default run;
   export const PKG = '包名';
   if(import.meta.main){
      const {run, bench, group} = await import('mitata');
      for(const [name, data] of (await import('./data.js')).default){
        group(name, ()=>{
          bench(PKG,run(data))
        })
      }
      run()
   }
   ```

   然后在 `./bench/run.js` 读取 `import.meta.dirname` 下面的文件，找到用 `.bench.js` 结尾的文件，动态生成 `group`、`bench` 运行

8. 思考如何优化性能
   用 git worktree 在 `/tmp` 临时目录开分支，提出策略，让子代理开发
   如果性能更好，并且跑通测试，合并进来
9. 循环 8，直到连续3次尝试优化失败
10. 思考如何优化代码大小
    用 git worktree 在 `/tmp` 临时目录开分支，提出策略，让子代理开发
    先运行 `bun x minify_size src`，获取基准总大小
    运行 `./bench/our.bench.js`，获取基准性能
    策略包括但不限于:
    - 拆分公共代码，常量，降低总大小
    - 写状态机，减少遍历次数，优化算法复杂度
    - 用 0 和 1，而不是 true 和 false
    - 用数字替代字符串
    - 用数组、数组的数组替代对象
    - 抽象重复代码为函数
    - 删除不必要的判断、避免防御性编程，参数类型通过 `.d.ts` 来限制，而不是判断
    - 对于确定的东西，不用 `?.`
    - 避免用正则，用字符串操作更快，比如 `indexOf`
    - 更好的算法、更优的数据结构
      优化后再次运行测试、性能测试、`bun x minify_size src`，确保尺寸变小，性能更好
      注意，标准是衡量 js 压缩后的大小，所以，修改变量名、删除注释，不会让尺寸更小
11. 循环 10，直到连续3次尝试优化失败
12. 读取 `doc/zh/readme/SKILL.md`，写文档，文档要附上对比性能、尺寸对比表
    尺寸表对比要说明是 `oxc-minify`+`br` 压缩后的大小

## 技术选型

- 用最现代的 js
- 性能测试工具: `mitata` (Bun 原生级别极速 benchmark 库)。
