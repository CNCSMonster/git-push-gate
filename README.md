# git-push-gate: Public Push Safety Gate

English | [简体中文](./README.zh-CN.md)

> **The physical human-in-the-loop firewall for the AI Agent era.**  
> Intercepts unauthorized pushes to public Git remotes (GitHub, Gitee, GitLab). Audits pending commits and diffs in an ergonomically centered modal before network transfer.

---

## 💡 Why git-push-gate?

Autonomous coding agents (Cursor, Pi, Claude Code, Aider) operate with elevated terminal privileges. If an agent hallucinates or encounters prompt injection, it might silently execute `git push origin main` and leak internal credentials or unverified code directly to public GitHub repositories.

**`git-push-gate` establishes a physical safety airgap before Git network requests:**
- **Zero Friction on Private Remotes**: Pushes to internal bare repos, private SSH remotes, or VPN subnets proceed in **0.00s silently** without interrupting flow;
- **Mandatory Review on Public Remotes**: Pushes to public hosts (GitHub, GitLab, etc.) **strictly require physical human confirmation**;
- **Transparent Commits & Diff Stat**: Automatically inspects and displays **pending commit titles and line change histograms** in a scrollable panel;
- **Ergonomic Centering**: Calculates display coordinates via `xrandr` to place the modal in the **horizontal center and 36% downward vertical foveal vision zone**, minimizing eye strain and mouse travel distance.

---

## 🛠️ System Prerequisites

Ensure the following system binaries are installed before using the gate:

| Component | Necessity | Purpose | Behavior When Missing |
| :--- | :--- | :--- | :--- |
| **Node.js (>= 18)** | Required | Core gate runner | Terminal error: `command not found: node` |
| **Chromium-based Browser** | Required in GUI | Renders the centered modal card | Terminal prints clear color-coded installation guidance and safely aborts |
| **xrandr** | Recommended | Detects display resolution for geometric centering | Falls back to standard 1440×900 centered coordinates |

### Browser Installation (Pick any):
- **Ubuntu / Debian**: `sudo apt install -y chromium-browser` or `google-chrome-stable`
- **Fedora / RHEL**: `sudo dnf install -y chromium`
- **Arch Linux**: `sudo pacman -S --noconfirm chromium`

> *Note: Compatible with `google-chrome`, `chromium`, `chromium-browser`, `brave-browser`, and `microsoft-edge`.*

---

## 🚀 Installation & Usage

Declaratively installable via the industry-standard **`pre-commit`** framework.

### Approach 1: Zero-Pollution Private Mode (Recommended)
If you want the gate active in your local project without committing any new files:

1. Create a private config inside the local `.git/` folder (`.git/pre-commit-config.yaml`):
   ```yaml
   repos:
     - repo: https://github.com/CNCSMonster/git-push-gate
       # Recommended: Pin an immutable commit hash to prevent supply chain drift
       rev: v1.0.0
       hooks:
         - id: public-push-gui-gate
   ```

2. Install with the official CLI (only touches `.git/hooks/pre-push`, 0 tracked file changes):
   ```bash
   pre-commit install --config .git/pre-commit-config.yaml --hook-type pre-push
   ```

### Approach 3: Custom Private Remote Whitelist
By default, standard private subnets (RFC 1918 private IPs, `localhost`, `.internal`, `.local`, `.lan`) pass silently without review.
You can configure custom private hosts via Git config:
```bash
# Set global or local regex whitelist:
git config --global pushgate.privatePattern "my-private-host|git\.mycompany\.com"
```

Create `.pre-commit-config.yaml` at your repository root:
```yaml
repos:
  - repo: https://github.com/CNCSMonster/git-push-gate
    rev: v1.0.0
    hooks:
      - id: public-push-gui-gate
```
Team members enable it with a single command:
```bash
pre-commit install --hook-type pre-push
```

---

## 🛡️ Three-Tier Adaptive Fallback Matrix

The gate adapts across workstations, remote SSH sessions, and CI environments:

```
[Push to Public Git Remote Detected]
                 │
                 ├── 1. Graphical Desktop ($DISPLAY / $WAYLAND) ──▶ Ergonomic Centered Modal (Mouse / Keyboard)
                 │
                 ├── 2. Remote SSH Interactive TTY             ──▶ Terminal ANSI Diff Histogram + type "yes"
                 │
                 └── 3. Headless Non-Interactive (Agent / CI)   ──▶ Strict Fail-Closed (exit code 1 block)
```

---

## 🔒 Supply Chain Safety & Auditability

The entire core implementation resides in `bin/git-push-gate.mjs` (~200 lines of pure Node.js) with **zero third-party npm dependencies**.

Developers and security auditors can inspect the code within minutes to verify there are no hidden network calls, then pin it immutably via Git Commit SHA:
```yaml
rev: <your-audited-40-char-commit-hash>
```
Once pinned, it stays physically locked on your machine and will never auto-update without explicit human action.

---

## 📄 License
MIT License.
