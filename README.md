# jamlab — 把好奇心，折腾成真。

jamlab 首页的首版可交互原型。奶油白的实验室里有机械臂、示波器、探测小车，角落里有一台厚重的未来核心机。包含 LearnEverything 入口、后续项目位置和实验室介绍。

## 本地预览

在此目录运行：

```sh
python3 -m http.server 8770 --bind 0.0.0.0
```

打开 <http://localhost:8770/>。请通过 HTTP 访问，浏览器不允许通过 `file://` 正常加载 ES modules。

- 点击实验室的 `+` 查看装置，或让装置做出回应。
- 「启动核心」改变核心灯光和示波器信号。
- 「关灯看看」切换夜间灯光。
- 「暂停」停止场景动画；系统设置减少动画时默认暂停。
- 装置弹窗支持键盘导航、Esc 关闭及焦点返回。

这是视觉概念稿；CORE.001 和桌面装置不代表已经发布的实体产品。首页使用 `jamlabq/jamlabq.github.io` 仓库的 GitHub Pages 发布，与已有 LearnEverything 项目站点独立。

## 提交与发布

1. 在 GitHub 的 `jamlabq` 账号下创建公开仓库 **`jamlabq.github.io`**。创建时不勾选自动生成 README、许可证或 `.gitignore`，本地已经准备了文件与历史。
2. 将本地 `main` 推送到该仓库：

   ```sh
   cd /work/hua2/projects/jamlabq.github.io
   git push -u origin main
   ```

   本机沿用 LearnEverything 的 SSH 连接别名 `github-jamlabq`。其他电脑可将远程地址换成 `git@github.com:jamlabq/jamlabq.github.io.git`。
3. 打开仓库 **Settings → Pages**，Source 选 **Deploy from a branch**，Branch 选 **main**、目录选 **/ (root)**，保存。
4. 等待 Pages 部署完成，访问 <https://jamlabq.github.io/>。

`.nojekyll` 让 Pages 直接发布静态文件。后续修改后执行 `git add`、`git commit`、`git push`，Pages 会自动更新。

## 页面与依赖

- `index.html`：文案、导航、项目卡和装置弹窗。
- `styles.css`：桌面/手机布局、颜色及静态显示。
- `app.mjs`：控件、弹窗与场景加载降级。
- `lab-scene.mjs`：用几何体创建的 Three.js 实验室、灯光与动画。
- `assets/lab-day.webp`：实际 3D 场景的静态截图，支持无 WebGL 或无 JavaScript 的浏览器。
- `vendor/three.module.min.js`：本地固定版本 Three.js **0.169.0**，MIT 许可证见 `vendor/THREE-LICENSE.txt`。

无需构建步骤、包管理器或运行时 CDN 请求。场景离开视口、页面隐藏或动画暂停时停止渲染。LearnEverything 入口为 <https://jamlabq.github.io/LearnEverything/>。

## 检查

```sh
node --check app.mjs
node --check lab-scene.mjs
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/browser_check.py
```

检查脚本会自动启动临时静态服务器。优先使用 `/opt/google/chrome/chrome`，也可以设置 `CHROME_BIN`，否则使用 Playwright Chromium。通过软件 WebGL 检查实际场景、操作反馈、键盘弹窗、加载期间操作、12 种视口、3D 加载失败及禁用 JavaScript；截图输出到忽略跟踪的 `build/`。

设计说明见 `docs/homepage-plan.md`。
