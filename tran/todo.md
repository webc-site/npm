参考
../i18n_scan/example/run.js
写一个通用的命令行
用 yargs 解析参数，支持 help
@1-/i18n_scan

package.json 命令是 tran 入口是 src/cli.js
用 ./run.sh 调试
可以用 --dir 指定目录，默认是当前目录
会加载工作目录下面的 tran.yml （比如 ../../webc.site/tran.yml ）
格式如下

```
tran:
  from: zh
  to_li: "*"
dir:
  - doc
  - i18n
```

dir 对应的是 ../i18n_scan/example/run.js 的目录参数

to_li 是 `*` 的时候，用 @3-/lang/CODE.js 的所有语言(除了from）
