翻译

1. 用 @1-/i18n_scan 扫描需要翻译的文件
2. 用 @1/md/li.js 把 md 拆分为行
3. 用 @1/mdtrim/mdtrimE.js 把行预处理，变为待翻译的行
   如果源语言是中日韩，mdtrimE.js 第二个参数 no_en = 1
4. 用 @1/mdtrim/mdtrimD.js 把待翻译的行还原，然后 join('\n') 输出到译文
5. upsert 更新 scan 的缓存
