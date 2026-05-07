/**
 * Responsive Design Screenshot Capture Tool
 *
 * Config-driven Playwright screenshot capture for responsive design QA.
 * Reads configuration from .claude-project/config/screenshot-config.json
 *
 * Usage:
 *   node capture.js                          # Capture all pages
 *   node capture.js --context admin          # Capture admin pages only
 *   node capture.js --viewport mobile        # Capture mobile only
 *   node capture.js --page 01-admin-dashboard # Capture specific page
 *   node capture.js --changed-only           # Capture pages with recently modified files
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// --- Config Loading ---

function loadConfig(projectDir) {
  const configPath = path.join(projectDir, '.claude-project', 'config', 'screenshot-config.json');
  if (!fs.existsSync(configPath)) {
    console.error(`No screenshot config found at ${configPath}`);
    console.error('Create one using the template or run the agent setup.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}

function findProjectDir() {
  // Walk up from script location or CWD to find .claude-project/
  let dir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, '.claude-project'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback to CWD
  return process.cwd();
}

// --- Auth ---

async function login(page, config, credentials) {
  const auth = config.auth;
  if (!auth || !credentials) return;

  console.log(`  Logging in as ${credentials.email}...`);
  const baseUrl = config.baseUrl;

  await page.goto(`${baseUrl}${auth.loginPath}`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(500);

  await page.fill(auth.emailSelector, credentials.email);
  await page.fill(auth.passwordSelector, credentials.password);
  await page.waitForTimeout(300);
  await page.click(auth.submitSelector);

  try {
    // Try URL-based wait first, then fall back to timeout
    await page.waitForURL(auth.successUrlPattern, { timeout: 10000 });
    console.log(`  Login successful (URL matched)`);
  } catch (e) {
    // SPA might not change URL via navigation - wait and check
    await page.waitForTimeout(3000);
    console.log(`  Login wait complete, current URL: ${page.url()}`);
  }

  // Wait for post-login data to load
  const postLoginWait = auth.postLoginWaitMs || 3000;
  await page.waitForTimeout(postLoginWait);
}

// --- Capture ---

async function capturePage(page, baseUrl, pageConfig, outputDir, label) {
  const url = `${baseUrl}${pageConfig.path}`;
  const filename = `${pageConfig.name}.png`;
  const filepath = path.join(outputDir, filename);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(pageConfig.waitMs || 2000);
    await page.screenshot({ path: filepath, fullPage: true });
    console.log(`  + ${label}/${filename}`);
    return { success: true, path: filepath };
  } catch (e) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: filepath, fullPage: true });
      console.log(`  + ${label}/${filename} (fallback)`);
      return { success: true, path: filepath };
    } catch (e2) {
      console.log(`  x ${label}/${filename} - ${e2.message?.slice(0, 80)}`);
      return { success: false, error: e2.message };
    }
  }
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const argMap = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace('--', '');
      argMap[key] = args[i + 1] || true;
      i++;
    }
  }

  const projectDir = findProjectDir();
  const config = loadConfig(projectDir);
  const outputDir = path.join(projectDir, config.outputDir || 'screenshots');

  // Filter options
  const filterContext = argMap.context;
  const filterViewport = argMap.viewport;
  const filterPage = argMap.page;

  // Ensure output directories
  for (const vp of Object.keys(config.viewports)) {
    if (filterViewport && vp !== filterViewport) continue;
    for (const ctx of Object.keys(config.contexts)) {
      if (filterContext && ctx !== filterContext) continue;
      const dir = path.join(outputDir, vp, ctx);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
  }

  const browser = await chromium.launch({ headless: true });
  const results = { total: 0, success: 0, failed: 0, screenshots: [] };

  for (const [vpName, vpSize] of Object.entries(config.viewports)) {
    if (filterViewport && vpName !== filterViewport) continue;

    console.log(`\n=== ${vpName} (${vpSize.width}x${vpSize.height}) ===`);

    for (const [ctxName, ctxConfig] of Object.entries(config.contexts)) {
      if (filterContext && ctxName !== filterContext) continue;

      console.log(`\n--- ${ctxName} pages ---`);

      const context = await browser.newContext({
        viewport: vpSize,
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();

      // Login if credentials provided
      if (ctxConfig.credentials) {
        await login(page, config, ctxConfig.credentials);
      }

      // Capture pages
      const pages = ctxConfig.pages || [];
      for (const pageConfig of pages) {
        if (filterPage && pageConfig.name !== filterPage) continue;

        results.total++;
        const label = `${vpName}/${ctxName}`;
        const result = await capturePage(
          page,
          config.baseUrl,
          pageConfig,
          path.join(outputDir, vpName, ctxName),
          label
        );

        if (result.success) {
          results.success++;
          results.screenshots.push(result.path);
        } else {
          results.failed++;
        }
      }

      await context.close();
    }
  }

  await browser.close();

  // Write results manifest for agent consumption
  const manifestPath = path.join(outputDir, 'capture-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: { viewports: config.viewports },
    results,
  }, null, 2));

  console.log(`\nDone! ${results.success}/${results.total} captured. Manifest: ${manifestPath}`);
}

main().catch(console.error);
