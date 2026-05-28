# 云洲无人艇机械臂海洋作业演示

这是一个面向 GitHub Pages 部署的 Web demo。当前版本保留 `/data/private/user2/workspace/2.Ocean/demo/index.html` 的高细节海洋环境作为底层场景，并在页面中接入 MuJoCo/React 机械臂仿真。

## 当前内容

- `public/ocean.html`：保留 Ocean 场景中的海面、海底、光照、粒子、目标物、污染物和云洲无人艇层。
- `src/configs.ts` 与 `src/controllers/`：支持 Franka Panda、SO101、XLeRobot。
- `src/main.tsx`：把 Ocean 场景和真实 MuJoCo 机械臂面板组合到同一个 Web demo。
- `public/ocean.html` 中的无人机外形改为参考 `OlivierB-OB__osm-drone-simulator` 的机体结构，不再使用简化十字模型。
- 左侧状态栏显示无人艇姿态、艇载机械臂关节、无人机位置；艇支持键盘下潜/上浮，水面无人机保持在水面上方跟随。

## 本地运行

```bash
npm install
npm run dev
```

默认访问：

```text
http://127.0.0.1:3000/
```

## 构建

```bash
npm run build
```

构建产物在 `dist/`，GitHub Actions 会自动构建并部署到 GitHub Pages。
