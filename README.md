# 匿名论坛

一个基于 P2P 网络的去中心化匿名论坛系统。用户可以在保护隐私的同时自由发帖和评论。每个用户都拥有独特的加密身份，所有通信都经过加密处理，确保信息安全。

## 特性

- 🔒 完全匿名：使用非对称加密技术保护用户隐私，每个用户都有唯一的加密身份
- 🌐 去中心化：基于 libp2p 的 P2P 网络，无需中心服务器，数据分布式存储
- 💬 实时通讯：帖子和评论通过 P2P 网络实时同步到所有节点
- 🔍 数据持久化：使用 LevelDB 本地存储所有内容，支持离线访问
- ✨ 简洁界面：使用 TailwindCSS 构建的清爽界面，支持响应式布局
- 🔐 签名验证：所有内容都经过数字签名，确保来源可信

## 技术栈

- 前端：原生 JavaScript + TailwindCSS
- 后端：Node.js + Express
- 存储：LevelDB（高性能键值数据库）
- P2P网络：libp2p（去中心化网络协议）
- 加密：TweetNaCl.js（高安全性加密库）

## 项目结构
src/
├── core/           # 核心功能模块
│   └── crypto.js   # 加密、签名和身份管理
├── network/        # 网络通信模块
│   └── p2p.js      # P2P 节点发现和消息传递
├── storage/        # 数据存储模块
│   └── db.js       # LevelDB 数据库操作封装
├── public/         # 静态资源
│   ├── index.html  # 主页面
│   └── js/         # 前端脚本
└── index.js        # 应用入口和API路由

## 快速开始

### 环境要求
- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/MRchenkuan/anonymous.git
cd anonymous


## 开发指南
### 前端开发
前端页面位于 src/public/index.html ，使用原生 JavaScript 开发。主要功能包括：

- 用户身份管理：自动生成和保存用户加密身份
- 帖子列表展示：支持按时间排序和实时更新
- 发帖和评论功能：支持富文本内容
- 实时数据更新：通过 P2P 网络自动同步
### 后端开发
后端使用 Express 框架，主要模块：

1. 加密模块 ( src/core/crypto.js )
- 基于 TweetNaCl.js 的非对称加密
- Ed25519 数字签名
- 用户身份生成和管理
- 消息签名和验证
2. P2P网络 ( src/network/p2p.js )
- 基于 libp2p 的节点发现
- 自动节点连接和断开处理
- 消息广播和接收
- 协议定义和处理
3. 数据存储 ( src/storage/db.js )
- 基于 LevelDB 的数据持久化
- 帖子和评论的增删改查
- 数据索引和查询优化
- 离线数据支持
### API 接口 身份相关
- GET /api/identity - 获取当前用户身份
  - 返回： { address, publicKey } 帖子相关
- GET /api/posts - 获取所有帖子
  - 返回：帖子列表，按时间倒序排列
- POST /api/posts - 发布新帖子
  - 参数： { content }
  - 返回：新帖子完整信息 评论相关
- GET /api/posts/:postId/comments - 获取帖子评论
  - 返回：评论列表，按时间正序排列
- POST /api/posts/:postId/comments - 发表评论
  - 参数： { content }
  - 返回：新评论完整信息
## 安全性说明
- 使用 Ed25519 非对称加密算法
- 所有内容都经过数字签名
- 用户身份完全匿名，仅使用公钥派生的地址
- P2P 通信使用 noise 协议加密
- 本地数据使用 LevelDB 安全存储
## 参与贡献
1. Fork 本仓库
2. 创建特性分支 git checkout -b feature/your-feature
3. 提交更改 git commit -am '添加新功能'
4. 推送分支 git push origin feature/your-feature
5. 提交 Pull Request
### 贡献指南
- 遵循现有的代码风格
- 添加必要的测试用例
- 更新相关文档
- 保持提交信息清晰
## 许可证
MIT License

## 联系方式
- 项目作者：陈宽
- GitHub： @MRchenkuan