# git-push-gate: 公开仓推送安全审计门禁

[English](./README.md) | 简体中文

> **AI Agent / 自动化时代的人机分离最后一道防线**  
> 拦截向公开 Git 托管平台（GitHub、Gitee、GitLab 等）的未授权推送。推送前在屏幕黄金视区弹出居中卡片，透明审计待推 Commit 与文件改动，物理阻断 Agent 偷跑。

---

## 💡 为什么需要它？

在深度使用 Cursor、Pi、Claude Code、Aider 等自主编程智能体（AI Coding Agents）时，智能体拥有极高的终端执行权限。一旦智能体犯迷糊或被 Prompt 注入，可能直接在后台敲下 `git push origin main`，将包含内部凭据、未脱敏内容或未就绪代码直接推上 GitHub 公开仓库。

**`git-push-gate` 在 Git 网络层前设立物理隔离门禁**：
- **私有仓完全免审**：推往内网服务器、本地 bare 仓或私有云时，**0 秒静默放行**，绝不干扰日常心流；
- **公开仓强制审查**：一旦推向 GitHub 等公网平台，**必须由人类在桌面屏幕上亲手点击或按键确认**；
- **拒绝盲审**：弹窗自动提取并滚动呈现**即将推送的 Commit 摘要与行数变动直方图（Diff Stat）**；
- **人体工学居中**：自适应主屏幕分辨率，将窗口精确锚定在**水平绝对正中、垂直 36% 人眼俯视黄金视区**，避免边角遮挡与多屏迷失。

---

## 🛠️ 系统依赖要求 (Prerequisites)

在准备使用本工具前，请确保系统已安装以下基础二进制组件：

| 依赖组件 | 必需性 | 作用说明 | 缺失时表现 |
| :--- | :--- | :--- | :--- |
| **Node.js (>= 18)** | 必需 | 核心门禁调度运行时 | 终端直接报错 `command not found: node` |
| **Chromium 架构浏览器** | 图形环境必需 | 独立轻量渲染居中模态卡片 | 终端抛出带包管理器安装命令的醒目红色排错指引并安全阻断 |
| **xrandr** | 可选（推荐） | 精确探测多显示器分辨率以实现几何居中 | 缺失时回退到 1440×900 标准居中坐标 |

### 浏览器安装建议 (选其一即可)：
- **Ubuntu / Debian**: `sudo apt install -y chromium-browser` 或安装 `google-chrome-stable`
- **Fedora / RHEL**: `sudo dnf install -y chromium`
- **Arch Linux**: `sudo pacman -S --noconfirm chromium`

> *注：支持 `google-chrome`、`chromium`、`chromium-browser`、`brave-browser`、`microsoft-edge` 等任何主流 Chromium 衍生浏览器。*

---

## 🚀 安装与使用方式

推荐通过全球事实标准 **`pre-commit`** 框架进行声明式选配与不可变锁定。

### 姿势 1：零侵入私有模式（推荐：仅本地生效，绝不污染代码库）
如果您只想在当前电脑的某个私有仓库中启用，且**绝对不希望向代码库提交任何新文件**：

1. 在当前仓库的 `.git/` 目录内创建私有配置文件 `.git/pre-commit-config.yaml`：
   ```yaml
   repos:
     - repo: https://github.com/CNCSMonster/git-push-gate
       # 强烈建议锁定不可变 Commit SHA（防供应链投毒与自动漂移）
       rev: v1.0.0
       hooks:
         - id: public-push-gui-gate
   ```

2. 运行官方安装命令（只修改本地 `.git/hooks/pre-push`，工作区 0 文件变动）：
   ```bash
   pre-commit install --config .git/pre-commit-config.yaml --hook-type pre-push
   ```

### 姿势 2：团队共享模式（随项目版本库管理）
在项目根目录创建 `.pre-commit-config.yaml`：
```yaml
repos:
  - repo: https://github.com/CNCSMonster/git-push-gate
    rev: v1.0.0
    hooks:
      - id: public-push-gui-gate
```
团队成员克隆后只需执行：
```bash
pre-commit install --hook-type pre-push
```

---

## 🛡️ 三态多栖自适应降级矩阵

无论在开发机、远程云服务器还是后台 CI，本门禁均能自洽运行：

```
[检测到向公开 Git 托管平台发起推送]
                 │
                 ├── 1. 图形桌面 ($DISPLAY / $WAYLAND) ──▶ 人体工学 Chrome 居中卡片 (鼠标/键盘交互)
                 │
                 ├── 2. 远程 SSH 交互终端 (TTY)      ──▶ 终端 ANSI 差异直方图 + 输入 "yes" 确认
                 │
                 └── 3. 后台无头静默 (Agent 偷跑 / CI)──▶ 严格失败安全 (Fail-Closed) 物理退出码 1 阻断
```

---

## 🔒 供应链安全与代码审查

整个门禁核心实现仅位于 `bin/git-push-gate.mjs`（约 200 行纯原生 Node.js 代码），**零第三方 npm 运行时依赖**，没有动态网络请求与分析收集。

开发者与安全审计人员可在几分钟内通读全部源码，确认无任何外发后门后，使用不可变 Git Commit SHA（40 位哈希）固化引用：
```yaml
rev: <经过你人工安全审计的Commit哈希>
```
除非您显式执行更新，否则它在您的本地永久物理锁死，杜绝任何上游依赖劫持。

---

## 📄 License
MIT License.
