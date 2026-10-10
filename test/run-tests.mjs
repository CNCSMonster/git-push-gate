#!/usr/bin/env node

import { spawn } from 'node:child_process';
import http from 'node:http';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const gateBinPath = path.resolve(__dirname, '../bin/git-push-gate.mjs');

let passedCount = 0;
let totalCount = 0;

async function runTestCase(name, fn) {
  totalCount++;
  process.stdout.write(`▶ 运行测试 [${totalCount}]: ${name} ... `);
  try {
    await fn();
    passedCount++;
    console.log('\x1b[32m✔ 通过\x1b[0m');
  } catch (err) {
    console.log('\x1b[31m✖ 失败\x1b[0m');
    console.error(err);
    process.exitCode = 1;
  }
}

function runProcess(args, env = {}, stdinInput = null) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [gateBinPath, ...args], {
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    if (stdinInput !== null) {
      child.stdin.write(stdinInput);
      child.stdin.end();
    } else {
      child.stdin.end();
    }

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', reject);
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

console.log('\n========================================');
console.log('🧪 开始运行 git-push-gate 自动化测试套件');
console.log('========================================\n');

// -------------------------------------------------------------
// 测试 1：私有远端免审放行 (RFC 1918 / localhost / .internal)
// -------------------------------------------------------------
await runTestCase('私有仓免审放行 (192.168.x.x 内网)', async () => {
  const res = await runProcess(['origin', 'git@192.168.1.50:org/repo.git']);
  assert.strictEqual(res.code, 0, `私有仓应该以 0 退出，实际退出码: ${res.code}`);
});

await runTestCase('私有仓免审放行 (localhost)', async () => {
  const res = await runProcess(['origin', 'ssh://git@localhost:2222/repo.git']);
  assert.strictEqual(res.code, 0, `localhost 应该以 0 退出，实际退出码: ${res.code}`);
});

await runTestCase('私有仓免审放行 (.internal 域名)', async () => {
  const res = await runProcess(['origin', 'https://git.company.internal/core.git']);
  assert.strictEqual(res.code, 0, `.internal 应该以 0 退出，实际退出码: ${res.code}`);
});

// -------------------------------------------------------------
// 测试 2：无头 / 非交互环境下向公开远端推送必须安全阻断 (Fail-Closed)
// -------------------------------------------------------------
await runTestCase('无头非交互模式安全阻断 (退出码应为 1)', async () => {
  const res = await runProcess(
    ['origin', 'https://github.com/CNCSMonster/git-push-gate.git'],
    {
      DISPLAY: '',
      WAYLAND_DISPLAY: '',
      SSH_CONNECTION: ''
    }
  );
  assert.strictEqual(res.code, 1, `无头模式遇到公开仓必须以 1 退出，实际退出码: ${res.code}`);
  assert.ok(res.stderr.includes('SECURITY BLOCKED'), '应输出安全阻断提示');
});

// -------------------------------------------------------------
// 测试 3：GUI 模式端到端自动化测试 (真实拉起 HTTP 与浏览器，测试授权放行)
// -------------------------------------------------------------
const hasDisplay = Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);

if (!hasDisplay) {
  console.log('\nℹ️ 当前环境无图形会话 ($DISPLAY)，跳过真实 GUI 交互测试。');
  console.log('  （提示：CI 环境中通过 xvfb-run 会自动启用完整 GUI 交互测试）');
} else {
  await runTestCase('GUI 模式端到端：弹窗页面内容渲染与授权放行 (/allow)', async () => {
    const child = spawn(process.execPath, [gateBinPath, 'origin', 'https://github.com/CNCSMonster/git-push-gate.git'], {
      env: {
        ...process.env,
        PUSHGATE_TEST_MODE: '1'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let port = null;

    const readyPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('等待 GUI 弹窗就绪超时 (10s)'));
      }, 10000);

      child.stdout.on('data', (d) => {
        stdout += d.toString();
        const match = stdout.match(/\[PUSHGATE_READY\] port=(\d+)/);
        if (match && !port) {
          port = parseInt(match[1], 10);
          clearTimeout(timeout);
          resolve(port);
        }
      });
      child.on('error', reject);
    });

    const serverPort = await readyPromise;
    assert.ok(serverPort > 0, '未成功获取本地服务端口');

    // 验证页面内容
    const pageRes = await httpGet(`http://127.0.0.1:${serverPort}/`);
    assert.strictEqual(pageRes.statusCode, 200);
    assert.ok(pageRes.body.includes('公开仓推送安全审计门禁'), '页面应包含审计标题');
    assert.ok(pageRes.body.includes('即将同步推向公开仓的内容'), '页面应包含审查区域');

    // 模拟用户点击“授权推送”
    const allowRes = await httpGet(`http://127.0.0.1:${serverPort}/allow`);
    assert.strictEqual(allowRes.statusCode, 200);

    // 验证进程以 0 退出
    const exitCode = await new Promise((resolve) => {
      child.on('close', resolve);
    });
    assert.strictEqual(exitCode, 0, `点击授权推送后，退出码应为 0，实际退出码: ${exitCode}`);
  });

  await runTestCase('GUI 模式端到端：用户点击拒绝拦截 (/deny)', async () => {
    const child = spawn(process.execPath, [gateBinPath, 'origin', 'https://github.com/CNCSMonster/git-push-gate.git'], {
      env: {
        ...process.env,
        PUSHGATE_TEST_MODE: '1'
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let port = null;

    const readyPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('等待 GUI 弹窗就绪超时 (10s)'));
      }, 10000);

      child.stdout.on('data', (d) => {
        stdout += d.toString();
        const match = stdout.match(/\[PUSHGATE_READY\] port=(\d+)/);
        if (match && !port) {
          port = parseInt(match[1], 10);
          clearTimeout(timeout);
          resolve(port);
        }
      });
      child.on('error', reject);
    });

    const serverPort = await readyPromise;
    assert.ok(serverPort > 0, '未成功获取本地服务端口');

    // 模拟用户点击“拒绝拦截”
    const denyRes = await httpGet(`http://127.0.0.1:${serverPort}/deny`);
    assert.strictEqual(denyRes.statusCode, 200);

    // 验证进程以 1 退出
    const exitCode = await new Promise((resolve) => {
      child.on('close', resolve);
    });
    assert.strictEqual(exitCode, 1, `点击拒绝拦截后，退出码应为 1，实际退出码: ${exitCode}`);
  });
}

console.log('\n----------------------------------------');
console.log(`🎉 测试完成: ${passedCount}/${totalCount} 通过`);
console.log('----------------------------------------\n');

if (passedCount !== totalCount) {
  process.exit(1);
}
