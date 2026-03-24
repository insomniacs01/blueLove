# blueLove

一个基于 `Vite` 和 `Three.js` 的浪漫粒子场景实验项目，围绕爱心主体、碎裂重组、能量流带和梦幻后期构建动态影像效果。

## 技术栈

- `Vite`
- `Three.js`
- 自定义场景模块
- Bloom / Afterimage / 自定义梦幻后期

## 本地运行

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm run build
npm run preview
```

## 项目结构

```text
src/
  main.js                 场景入口与时间轴调度
  style.css               页面样式
  post/                   后期处理
  scene/                  粒子、背景、光带、能量底座等场景模块
tools/
  extract_frames.swift    参考视频导帧工具
```

## 说明

- 仓库只保留源码和工具脚本，不提交本地生成物。
- 参考视频与分析过程文件不包含在公开仓库中。
