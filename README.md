# NOW U C ME

一个基于 Electron 和 LibP2P 的匿名社交应用。

## 功能特点

- 完全匿名：无需注册，无需服务器
- 去中心化：基于 P2P 网络
- 端到端加密：使用 NaCl 加密库确保通信安全
- 本地存储：所有数据使用 LevelDB 存储在本地

## 技术栈

- Electron：跨平台桌面应用框架
- LibP2P：去中心化网络协议
- LevelDB：高性能键值对数据库
- TweetNaCl：轻量级加密库

## 开发环境

- Node.js >= 16
- npm >= 8

## 安装

```bash
# 安装依赖
npm install

# 启动开发环境
npm start

# 构建应用
npm run build
```
## 项目结构
```plaintext
src/
  ├── core/         # 核心功能模块
  ├── storage/      # 数据存储模块
  └── main.js       # 主进程入口
```
## 贡献指南
1. Fork 本仓库
2. 创建新的功能分支
3. 提交你的改动
4. 发起 Pull Request
## 许可证
MIT