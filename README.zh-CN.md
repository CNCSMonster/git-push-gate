# git-push-gate: 公开仓推送安全审计门禁

[English](./README.md) | 简体中文

> **AI Agent / 自动化时代的人机分离安全防线**  
> 拦截向公开 Git 托管平台（GitHub、Gitee、GitLab 等）的未授权推送。推送前在屏幕正中偏上弹出自适应卡片，透明审计待推 Commit 列表与文件改动直方图，阻断 Agent 自动偷跑。

---

## 💡 为什么需要它？

在深度使用 Cursor、Pi、Claude Code、Aider 等自主编程智能体（AI Coding Agents）时，智能体拥有极高的终端执行权限。一旦智能体产生幻觉或被 Prompt 注入，可能直接在后台敲下 `git push origin main`，将包含内部凭据、未脱敏内容或未就绪代码直接推上 GitHub 公开仓库。

**`git-push-gate` 在 Git 发起网络传输前设立安全守门员**：
- **私有仓完全免审**：推往内网服务器、本地 bare 仓或私有云时，**0 秒静默放行**，绝不干扰日常心流；
- **公开仓强制审查**：一旦推向 GitHub 等公网平台，**必须由人类在桌面屏幕上亲手点击或按键确认**；
- **拒绝盲审**：弹窗自动提取并滚动呈现**即将推送的 Commit 摘要与行数变动直方图（Diff Stat）**；
- **自适应居中**：根据显示器分辨率动态计算坐标，窗口出现在视线最自然的居中偏上方，避免边角遮挡与多屏迷失。

---

## 🛠️ 系统依赖要求 (Prerequisites)

在准备使用本工具前，请确保系统已安装以下组件：

| 依赖组件 | 必需性 | 作用说明 | 安装指引 |
| :--- | :--- | :--- | :--- |
| **pre-commit** | 必需 | 负责管理与调度 Git 钩子 | `pip install pre-commit` 或 `brew install pre-commit` 或 `sudo apt install pre-commit` |
| **Node.js (>= 18)** | 必需 | 核心门禁脚本调度运行时 | `node -v` 检查版本，[官网下载](https://nodejs.org/) 或通过系统包管理器安装 |
| **Chromium 架构浏览器** | 图形环境必需 | 独立轻量渲染居中模态卡片 | 见下方浏览器安装指引（无图形会话时自动降级为终端 TTY 模式） |
| **xrandr** | 可选（推荐） | 精确探测多显示器分辨率以实现几何居中 | 缺失时自动回退到 1440×900 标准居中坐标 |

### 浏览器安装建议 (支持任一 Chromium 族浏览器)：
- **Ubuntu / Debian**: `sudo apt install -y chromium-browser` 或安装 `google-chrome-stable`
- **Fedora / RHEL**: `sudo dnf install -y chromium`
- **Arch Linux**: `sudo pacman -S --noconfirm chromium`
- **macOS**: 已安装 Google Chrome、Chromium、Brave 或 Edge 均可自动识别。

---

## 🚀 安装与使用方式

推荐通过全球通用的 **`pre-commit`** 框架进行声明式选配。

### 姿势 1：零侵入私有模式（推荐：仅本地生效，绝不污染代码库）
如果您只想在当前电脑的某个私有仓库中启用，且**绝对不希望向代码库提交任何新文件**（因为 `.git/` 目录属于 Git 内部私有区，天然不会被 Git 版本跟踪，绝对不会被提交或泄露）：

#### 【懒人一键命令】直接在终端运行（全自动完成配置与安装）：
```bash
# 1. 自动在本地 .git/ 内部写入锁定 40 位哈希的私有配置：
cat << 'EOF' > .git/pre-commit-config.yaml
repos:
  - repo: https://github.com/CNCSMonster/git-push-gate
    rev: 258340a7510b474402a1093f806a9950c197931e
    hooks:
      - id: public-push-gui-gate
EOF

# 2. 一键激活生效（只写入 .git/hooks/pre-push，工作区 0 文件变动）：
pre-commit install --config .git/pre-commit-config.yaml --hook-type pre-push
```

### 姿势 2：团队共享模式（随项目版本库协同）
如果您希望整个开发团队在克隆项目后都能受到保护：
在项目根目录创建 `.pre-commit-config.yaml`：
```yaml
repos:
  - repo: https://github.com/CNCSMonster/git-push-gate
    rev: 258340a7510b474402a1093f806a9950c197931e
    hooks:
      - id: public-push-gui-gate
```
团队成员克隆后只需执行一次：
```bash
pre-commit install --hook-type pre-push
```

### 姿势 3：自定义私有远端白名单
默认会自动识别常见私有网段（RFC 1918 私有 IP、`localhost`、`.internal`、`.local`、`.lan`）并免审放行。
如果您有团队专属的私有 Git 域名或跳板机，可配置白名单正则：
```bash
# 全局或当前仓库配置私有远端正则：
git config --global pushgate.privatePattern "my-private-host|git\.mycompany\.com"
```

---

## 🧪 安装验证与测试

安装完成后，可通过以下命令测试门禁是否正常工作，无需真正推送到远程：

```bash
# 执行 dry-run 测试推送（不会对远程仓库产生任何实际影响）
git push --dry-run origin <你的分支名>
```
- **预期效果**：若远端是 GitHub 等公网平台，屏幕中央应立即弹出卡片，展示即将推送的 Commit 列表；
- 点击 **“❌ 拒绝拦截”** 或按 **`Esc`** 键，Git 将终止推送并输出安全拦截提示。

---

## 🛡️ 三态多栖自适应降级矩阵

无论在本地开发机、远程云服务器还是后台 CI，本门禁均能自洽运行：

```
[检测到向公开 Git 托管平台发起推送]
                 │
                 ├── 1. 图形桌面 ($DISPLAY / $WAYLAND) ──▶ Chromium 居中卡片 (鼠标/键盘交互)
                 │
                 ├── 2. 远程 SSH 交互终端 (TTY)      ──▶ 终端 ANSI 差异直方图 + 输入 "yes" 确认
                 │
                 └── 3. 后台无头静默 (Agent 偷跑 / CI)──▶ 严格失败安全 (Fail-Closed) 物理退出码 1 阻断
```

---

## 🔒 供应链安全与不可变防篡改说明

许多开发者担心：**“如果未来某个开源 Hook 插件被黑客篡改投毒，会不会偷走我的代码或密钥？”**

为了彻底消除这个顾虑，本项目遵循**零依赖、可速读审查、密码学锁定**原则：

1. **零第三方依赖，几分钟即可读懂全部代码**：
   本工具没有安装任何庞杂的第三方 npm 包，所有逻辑仅位于 [`bin/git-push-gate.mjs`](./bin/git-push-gate.mjs) 单一文件中（约 200 行原生 Node.js）。您可以随时打开逐行检查，确认绝无未经允许的网络请求。
2. **为什么推荐写 40 位 Commit 哈希而非标签？**
   - Git 标签（如 `v1.0.0`）理论上可被上游重新打在被篡改的 Commit 上；
   - 而 40 位的 **Commit SHA（哈希值）** 是由全部代码字节经密码学算出来的。**代码即便改动一个空格，哈希值都会彻底改变**。
   - 直接把具体的 Commit SHA 写死在配置中，就能确保拉取到的代码与您审查时的代码字节级完全一致。
3. **如何自己查出新版本的 40 位哈希？**
   ```bash
   # 无需打开网页，用 Git 原生命令查询任意 Tag 的真实哈希：
   git ls-remote https://github.com/CNCSMonster/git-push-gate.git refs/tags/v1.0.0
   ```
   输出：`258340a7510b474402a1093f806a9950c197931e`，将该哈希填入 `rev:` 即可。

---

## ⚠️ 安全边界与卸载指引

1. **关于 `--no-verify` 参数**：
   本工具基于 Git 原生 Hook 机制。若命令显式指定了 `git push --no-verify`，Git 会跳过包括本工具在内的所有客户端钩子。请在您的 AI Agent 系统规则中禁止使用 `--no-verify` 参数。
2. **卸载 / 临时停用**：
   - **卸载门禁**：
     ```bash
     pre-commit uninstall --hook-type pre-push
     ```
   - **单次临时绕过**（仅限开发者本人紧急情况）：
     ```bash
     git push --no-verify origin <分支名>
     ```

---

## 📄 License
MIT License.
