[English](#en) | [中文](#zh)

---

<a id="en"></a>

# @1-/md5

- [@1-/md5](#1-md5)
  - [Installation](#installation)
  - [Usage](#usage)
  - [About](#about)

Calculate the MD5 hash of a file at a given path using a read stream.

## Installation

```bash
npm install @1-/md5
```

## Usage

```javascript
import pathMd5 from "@1-/md5/pathMd5.js";

const hash = await pathMd5("/path/to/file");
console.log(hash); // Uint8Array (MD5 binary)
```

## About

This library is developed by [WebC.site](https://webc.site).

[WebC.site](https://webc.site): A new paradigm of web development for AI

---

<a id="zh"></a>

# @1-/md5

- [@1-/md5](#1-md5)
  - [安装](#安装)
  - [使用](#使用)
  - [关于](#关于)

使用文件流计算指定路径文件的 MD5 值。

## 安装

```bash
npm install @1-/md5
```

## 使用

```javascript
import pathMd5 from "@1-/md5/pathMd5.js";

const hash = await pathMd5("/path/to/file");
console.log(hash); // Uint8Array md5 二进制
```

## 关于

本库由 [WebC.site](https://webc.site) 开发。

[WebC.site](https://webc.site) : 面向人工智能的网站开发新范式
