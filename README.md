# 网络与新媒体专业课程导航系统

一个用于管理和导航网络与新媒体专业课程的 Web 应用系统。

## 项目概述

本项目从培养方案文档中提取课程信息，提供可视化的课程导航、筛选和统计功能，帮助学生更好地了解专业课程体系和学习路径。

## 在线访问

🔗 [https://icgma.github.io/new-media-curriculum-navigator/](https://icgma.github.io/new-media-curriculum-navigator/)

> 访问需要输入授权密码。

## 文件结构

```
├── index.html                      # 主页面（含密码验证门控）
├── app.js                          # 核心应用逻辑（含 AES-256-CBC 浏览器端解密）
├── curriculum_data_real.json.enc   # 加密课程数据
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署
├── LICENSE
└── README.md
```

## 功能特性

- **课程展示**: 以卡片和学期视图展示 120 门课程
- **多维筛选**: 按课程类型、学分、学期、课程子组等条件筛选
- **学期视图**: 按学期展示课程分布
- **学分统计**: 按子组分类显示学分汇总
- **搜索功能**: 快速查找特定课程
- **数据安全**: SHA-256 密码门控 + AES-256-CBC 数据加密
- **响应式设计**: 适配不同设备屏幕

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+), Web Crypto API
- **数据加密**: AES-256-CBC (PBKDF2-HMAC-SHA256 密钥派生)
- **认证**: SHA-256 哈希密码验证
- **部署**: GitHub Pages + GitHub Actions

## 数据来源

课程数据解析自《网络与新媒体专业培养方案》（2024版），包含：
- 120 门课程（44 门必修 + 76 门选修）
- 14 个课程子组分类
- 5 组先修课程关系
- 覆盖 8 个学期完整培养方案

## 浏览器兼容性

- Chrome (推荐)
- Firefox
- Safari
- Edge

> 需要浏览器支持 Web Crypto API（所有现代浏览器均支持）。

## 版权信息

© 2024-2026 汕头大学长江新闻与传播学院 网络与新媒体专业

本项目由汕头大学长江新闻与传播学院网络与新媒体专业开发维护，用于辅助学生课程规划。项目中的课程数据版权归汕头大学所有，仅供教学参考使用，未经授权不得用于商业用途。

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件