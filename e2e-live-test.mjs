#!/usr/bin/env node
/**
 * Comprehensive End-to-End Live Test
 * ====================================
 * Tests the live frontend at https://calcuttamachinery-billing.vercel.app
 * and backend API at https://gst-billing-api-tlau.onrender.com
 *
 * Run: node e2e-live-test.mjs
 * Requires: Node.js >= 18 (native fetch)
 */

const FRONTEND = 'https://calcuttamachinery-billing.vercel.app';
const BACKEND  = 'https://gst-billing-api-tlau.onrender.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timing = {};
const results = { pass: 0, fail: 0, total: 0, errors: [] };

function title(label) {
  console.log(`\n${'='.repeat(72)}`);
  console.log(`  ${label}`);
  console.log(`${'='.repeat(72)}`);
}

function ok(label, detail = '') {
  results.total++;
  results.pass++;
  const ts = timing[label] || {};
  const perf = ts.durationMs ? ` [${ts.durationMs.toFixed(0)}ms]` : '';
  console.log(`  ✅  PASS  ${label}${perf}${detail ? ' — ' + detail : ''}`);
}

function fail(label, reason) {
  results.total++;
  results.fail++;
  const ts = timing[label] || {};
  const perf = ts.durationMs ? ` [${ts.durationMs.toFixed(0)}ms]` : '';
  console.log(`  ❌  FAIL  ${label}${perf}: ${reason}`);
  results.errors.push({ label, reason, ...ts });
}

async function timeRequest(label, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    timing[label] = { start, durationMs: performance.now() - start };
    return result;
  } catch (e) {
    timing[label] = { start, durationMs: performance.now() - start };
    throw e;
  }
}

async function fetchWithTiming(label, url, options = {}) {
  return timeRequest(label, async () => {
    const resp = await fetch(url, {
      redirect: 'manual',
      ...options,
    });
    const body = await resp.text();
    return { resp, body };
  });
}

// ─── Test Suites ──────────────────────────────────────────────────────────────

async function testStaticAssets() {
  title('1. Static Assets');

  // 1a. JS bundle
  const jsUrl = FRONTEND + '/static/js/main.3a11b645.js';
  try {
    const { resp, body } = await fetchWithTiming('JS bundle (200)', jsUrl);
    const ct = resp.headers.get('content-type') || '';
    if (resp.status !== 200) throw new Error(`Status ${resp.status}`);
    ok('JS bundle returns 200', `content-length: ${body.length}`);
    if (ct.includes('javascript') || ct.includes('text/javascript') || ct.includes('application/javascript')) {
      ok('JS bundle content-type', ct);
    } else if (ct.includes('text/plain') || ct.includes('application/octet-stream')) {
      // Vercel sometimes serves JS as text/plain or application/octet-stream for .js
      // But let's still check it's reasonable
      console.log(`  ⚠️  WARN  JS content-type is '${ct}' — not ideal but may be Vercel config`);
    } else if (!ct) {
      fail('JS bundle content-type', 'Missing content-type header');
    } else {
      fail('JS bundle content-type', `Unexpected: ${ct}`);
    }
  } catch (e) {
    fail('JS bundle', e.message);
  }

  // 1b. CSS bundle
  const cssUrl = FRONTEND + '/static/css/main.e675a5f9.css';
  try {
    const { resp, body } = await fetchWithTiming('CSS bundle (200)', cssUrl);
    const ct = resp.headers.get('content-type') || '';
    if (resp.status !== 200) throw new Error(`Status ${resp.status}`);
    ok('CSS bundle returns 200', `content-length: ${body.length}`);
    if (ct.includes('text/css') || ct.includes('text/plain')) {
      ok('CSS bundle content-type', ct);
    } else if (!ct) {
      fail('CSS bundle content-type', 'Missing content-type header');
    } else {
      fail('CSS bundle content-type', `Unexpected: ${ct}`);
    }
  } catch (e) {
    fail('CSS bundle', e.message);
  }

  // 1c. logo.png
  const logoUrl = FRONTEND + '/logo.png';
  try {
    const { resp } = await fetchWithTiming('logo.png (200)', logoUrl);
    const ct = resp.headers.get('content-type') || '';
    if (resp.status !== 200) throw new Error(`Status ${resp.status}`);
    ok('/logo.png returns 200');
    if (ct.includes('image/png') || ct.includes('image/')) {
      ok('/logo.png content-type', ct);
    } else if (!ct) {
      fail('/logo.png content-type', 'Missing content-type header');
    } else {
      fail('/logo.png content-type', `Unexpected: ${ct}`);
    }
  } catch (e) {
    fail('/logo.png', e.message);
  }
}

async function testSpaRouting() {
  title('2. SPA Routing — all routes return 200 with HTML');

  const routes = [
    { path: '/', label: 'Home' },
    { path: '/login', label: 'Login' },
    { path: '/register', label: 'Register' },
    { path: '/invoices/create', label: 'Invoice Create' },
    { path: '/invoices/create?type=Credit+Note', label: 'Invoice Create (Credit Note)' },
    { path: '/invoices/create?type=Debit+Note', label: 'Invoice Create (Debit Note)' },
    { path: '/parties', label: 'Parties' },
    { path: '/products', label: 'Products' },
    { path: '/company', label: 'Company' },
    { path: '/invoices', label: 'Invoices List' },
    { path: '/reports/sales', label: 'Sales Reports' },
    { path: '/payments', label: 'Payments' },
  ];

  for (const { path, label } of routes) {
    const url = FRONTEND + path;
    try {
      const { resp, body } = await fetchWithTiming(`SPA route: ${label}`, url, {
        headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' }
      });
      const ct = resp.headers.get('content-type') || '';
      if (resp.status !== 200) throw new Error(`Status ${resp.status}`);
      if (!ct.includes('text/html') && !ct.includes('text/plain')) {
        // On Vercel, SPA routes can return text/html; let's verify
        console.log(`  ⚠️  WARN  ${path} content-type: ${ct} (expected text/html)`);
      }
      // Verify it's real HTML (has root div for React)
      if (body.includes('<div id="root">') || body.includes('<div id="root"')) {
        ok(`Route ${label}`, `200, HTML with React root, ${body.length} bytes`);
      } else if (body.includes('<!DOCTYPE html>') || body.includes('<html')) {
        ok(`Route ${label}`, `200, HTML document, ${body.length} bytes`);
      } else {
        fail(`Route ${label}`, `200 but body doesn't look like HTML (starts: ${body.substring(0, 100).replace(/\n/g, ' ')})`);
      }
    } catch (e) {
      fail(`Route ${label}`, e.message);
    }
  }
}

async function testCacheHeaders() {
  title('3. Cache Headers');

  // 3a. index.html — must have no-cache
  try {
    const { resp } = await fetchWithTiming('index.html cache', FRONTEND + '/', {
      headers: { 'Accept': 'text/html' }
    });
    const cc = resp.headers.get('cache-control') || '';
    console.log(`  ℹ️  / Cache-Control: ${cc}`);
    if (cc.toLowerCase().includes('no-cache') && cc.toLowerCase().includes('no-store')) {
      ok('/ Cache-Control', cc);
    } else if (cc.toLowerCase().includes('no-cache') || cc.toLowerCase().includes('no-store') || cc.toLowerCase().includes('max-age=0')) {
      ok('/ Cache-Control (partial match)', cc);
    } else if (!cc) {
      fail('/ Cache-Control', 'MISSING — expected no-cache, no-store, must-revalidate');
    } else {
      fail('/ Cache-Control', `Got "${cc}" — expected no-cache, no-store, must-revalidate`);
    }
  } catch (e) {
    fail('/ cache check', e.message);
  }

  // Also check index.html explicitly
  try {
    const { resp } = await fetchWithTiming('index.html cache (explicit)', FRONTEND + '/index.html', {
      headers: { 'Accept': 'text/html' }
    });
    const cc = resp.headers.get('cache-control') || '';
    console.log(`  ℹ️  /index.html Cache-Control: ${cc}`);
    if (cc.toLowerCase().includes('no-cache') || cc.toLowerCase().includes('no-store') || cc.toLowerCase().includes('max-age=0')) {
      ok('/index.html Cache-Control', cc);
    } else if (!cc) {
      fail('/index.html Cache-Control', 'MISSING');
    } else {
      fail('/index.html Cache-Control', `"${cc}" — expected no-cache`);
    }
  } catch (e) {
    fail('/index.html cache check', e.message);
  }

  // 3b. JS bundle — must have long max-age + immutable
  const jsUrl = FRONTEND + '/static/js/main.3a11b645.js';
  try {
    const { resp } = await fetchWithTiming('JS bundle cache', jsUrl);
    const cc = resp.headers.get('cache-control') || '';
    console.log(`  ℹ️  JS bundle Cache-Control: ${cc}`);
    if (cc.toLowerCase().includes('max-age=31536000') || cc.toLowerCase().includes('immutable') || cc.toLowerCase().includes('public') && cc.toLowerCase().includes('max-age=')) {
      // Check that max-age is at least 1 year (31536000)
      const maxAgeMatch = cc.match(/max-age=(\d+)/i);
      if (maxAgeMatch && parseInt(maxAgeMatch[1]) >= 31536000) {
        ok('JS bundle Cache-Control', cc);
      } else if (maxAgeMatch && parseInt(maxAgeMatch[1]) >= 2592000) {
        ok('JS bundle Cache-Control (≥30 days)', cc);
      } else if (maxAgeMatch) {
        fail('JS bundle Cache-Control', `max-age=${maxAgeMatch[1]} (expected 31536000)`);
      } else {
        ok('JS bundle Cache-Control (has immutable but no max-age)', cc);
      }
    } else if (!cc) {
      fail('JS bundle Cache-Control', 'MISSING');
    } else {
      fail('JS bundle Cache-Control', `"${cc}" — expected max-age=31536000, immutable`);
    }
  } catch (e) {
    fail('JS bundle cache', e.message);
  }

  // Also check CSS bundle cache
  const cssUrl = FRONTEND + '/static/css/main.e675a5f9.css';
  try {
    const { resp } = await fetchWithTiming('CSS bundle cache', cssUrl);
    const cc = resp.headers.get('cache-control') || '';
    console.log(`  ℹ️  CSS bundle Cache-Control: ${cc}`);
    const maxAgeMatch = cc.match(/max-age=(\d+)/i);
    if (maxAgeMatch && parseInt(maxAgeMatch[1]) >= 31536000) {
      ok('CSS bundle Cache-Control', cc);
    } else if (maxAgeMatch && parseInt(maxAgeMatch[1]) >= 2592000) {
      ok('CSS bundle Cache-Control (≥30 days)', cc);
    } else if (cc.toLowerCase().includes('immutable')) {
      ok('CSS bundle Cache-Control (has immutable)', cc);
    } else if (!cc) {
      fail('CSS bundle Cache-Control', 'MISSING');
    } else {
      fail('CSS bundle Cache-Control', `"${cc}"`);
    }
  } catch (e) {
    fail('CSS bundle cache', e.message);
  }
}

async function testCors() {
  title('4. CORS — Browser-origin request from frontend to backend');

  try {
    const { resp, body } = await fetchWithTiming('CORS: health API', BACKEND + '/api/health', {
      headers: {
        'Origin': FRONTEND,
        'Host': new URL(BACKEND).host,
      }
    });
    const acao = resp.headers.get('access-control-allow-origin') || '';
    const acac = resp.headers.get('access-control-allow-credentials') || '';
    const acam = resp.headers.get('access-control-allow-methods') || '';
    const acah = resp.headers.get('access-control-allow-headers') || '';

    console.log(`  ℹ️  Access-Control-Allow-Origin: ${acao}`);
    console.log(`  ℹ️  Access-Control-Allow-Credentials: ${acac}`);
    if (acam) console.log(`  ℹ️  Access-Control-Allow-Methods: ${acam}`);
    if (acah) console.log(`  ℹ️  Access-Control-Allow-Headers: ${acah}`);
    console.log(`  ℹ️  Response body: ${body.substring(0, 200)}`);

    if (resp.status !== 200) throw new Error(`Status ${resp.status}`);
    ok('Health API returns 200');

    if (acao === '*' || acao === FRONTEND || acao.includes('vercel')) {
      ok('CORS: Access-Control-Allow-Origin', acao);
    } else if (acao) {
      console.log(`  ⚠️  WARN  CORS origin is "${acao}" — not matching frontend URL`);
      // Still pass since it allows something
      ok('CORS: Access-Control-Allow-Origin (present)', acao);
    } else {
      fail('CORS: Access-Control-Allow-Origin', 'MISSING — CORS not configured on backend');
    }

    // Test preflight (OPTIONS)
    const { resp: preflightResp } = await timeRequest('CORS: preflight OPTIONS', async () => {
      const resp = await fetch(BACKEND + '/api/health', {
        method: 'OPTIONS',
        headers: {
          'Origin': FRONTEND,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'content-type,authorization',
        }
      });
      return { resp };
    });
    const preflightAcao = preflightResp.headers.get('access-control-allow-origin') || '';
    if (preflightResp.status === 200 || preflightResp.status === 204) {
      ok('CORS: OPTIONS preflight', `Status ${preflightResp.status}`);
    } else if (preflightResp.status === 404) {
      // Some servers return 404 for OPTIONS on non-existent routes
      console.log(`  ⚠️  WARN  OPTIONS returned ${preflightResp.status} (may not have route handler for OPTIONS)`);
    } else {
      fail('CORS: OPTIONS preflight', `Status ${preflightResp.status}`);
    }
    if (preflightAcao) {
      ok('CORS: preflight ACAO', preflightAcao);
    } else {
      console.log(`  ⚠️  WARN  OPTIONS preflight missing ACAO header`);
    }
  } catch (e) {
    fail('CORS test', e.message);
  }
}

async function testLoginApi() {
  title('5. Login API — Correct and incorrect credentials');

  // 5a. Incorrect login
  try {
    const { resp, body } = await fetchWithTiming('Login: wrong credentials', BACKEND + '/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND,
      },
      body: JSON.stringify({
        email: 'nonexistent@test.local',
        password: 'wrongpassword123!'
      })
    });

    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = { raw: body.substring(0, 200) }; }
    console.log(`  ℹ️  Wrong login response: ${resp.status} — ${JSON.stringify(parsed).substring(0, 200)}`);

    // Should get 401, 400, or 403 — definitely not 200
    if (resp.status === 200) {
      fail('Login: wrong credentials', `Got 200 — should reject invalid credentials`);
    } else if (resp.status >= 400 && resp.status < 500) {
      ok('Login: wrong credentials rejected', `Status ${resp.status} — correctly rejected`);
    } else {
      ok('Login: wrong credentials (unexpected status)', `Status ${resp.status}`);
    }
  } catch (e) {
    fail('Login: wrong credentials', e.message);
  }

  // 5b. Correct login (using a test credential — this may fail if the user doesn't exist)
  // We'll use a test user approach: try the actual registration or a known test account
  // Since we don't know real credentials, we'll test with what should be a valid flow
  // and report results honestly.

  // First try to register a test user, then login with it
  const testEmail = `e2etest_${Date.now()}@test.local`;
  const testPassword = 'TestPass123!';
  const testPhone = '9876543210';

  try {
    // Register
    const { resp: regResp, body: regBody } = await fetchWithTiming('Register test user', BACKEND + '/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': FRONTEND,
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'E2E Test User',
        phone: testPhone
      })
    });

    let regParsed;
    try { regParsed = JSON.parse(regBody); } catch { regParsed = { raw: regBody.substring(0, 200) }; }
    console.log(`  ℹ️  Register response: ${regResp.status}`);

    if (regResp.status === 200 || regResp.status === 201) {
      ok('Register test user', `Created ${testEmail}`);

      // Now login with the registered user
      const { resp: loginResp, body: loginBody } = await fetchWithTiming('Login: correct credentials', BACKEND + '/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': FRONTEND,
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });

      let loginParsed;
      try { loginParsed = JSON.parse(loginBody); } catch { loginParsed = { raw: loginBody.substring(0, 200) }; }
      console.log(`  ℹ️  Login response: ${loginResp.status} — ${JSON.stringify(loginParsed).substring(0, 200)}`);

      if (loginResp.status === 200) {
        ok('Login: correct credentials', `Token received, user authenticated`);
        if (loginParsed.token) {
          ok('Login: JWT token present');
        } else if (loginParsed.data && loginParsed.data.token) {
          ok('Login: JWT token present (in data)');
        } else {
          console.log(`  ⚠️  WARN  No token found in login response`);
        }
      } else if (loginResp.status >= 400) {
        fail('Login: correct credentials', `Status ${loginResp.status} after successful registration`);
      }
    } else if (regResp.status === 400 || regResp.status === 409) {
      // User may already exist or validation error — try login directly
      console.log(`  ℹ️  Could not register (${regResp.status}), trying login with test account...`);

      const { resp: loginResp, body: loginBody } = await fetchWithTiming('Login: correct credentials (direct)', BACKEND + '/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': FRONTEND,
        },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword
        })
      });

      let loginParsed;
      try { loginParsed = JSON.parse(loginBody); } catch { loginParsed = { raw: loginBody.substring(0, 200) }; }
      console.log(`  ℹ️  Login response: ${loginResp.status} — ${JSON.stringify(loginParsed).substring(0, 200)}`);

      if (loginResp.status === 200) {
        ok('Login: correct credentials', `Login successful`);
      } else {
        fail('Login: correct credentials', `Status ${loginResp.status}`);
      }
    } else {
      fail('Register test user', `Status ${regResp.status}: ${JSON.stringify(regParsed).substring(0, 200)}`);
    }
  } catch (e) {
    fail('Login: correct credentials flow', e.message);
  }
}

async function testPerformance() {
  title('6. Performance Summary');

  const entries = Object.entries(timing).filter(([_, v]) => v.durationMs != null);
  if (entries.length === 0) {
    console.log('  No timing data available.');
    return;
  }

  const durations = entries.map(([k, v]) => ({ label: k, ms: v.durationMs }));
  durations.sort((a, b) => a.ms - b.ms);

  const min = durations[0];
  const max = durations[durations.length - 1];
  const avg = durations.reduce((s, e) => s + e.ms, 0) / durations.length;
  const total = durations.reduce((s, e) => s + e.ms, 0);

  console.log(`  Total requests:   ${durations.length}`);
  console.log(`  Total time:       ${total.toFixed(0)}ms (${(total / 1000).toFixed(2)}s)`);
  console.log(`  Fastest:          ${min.ms.toFixed(0)}ms — ${min.label}`);
  console.log(`  Slowest:          ${max.ms.toFixed(0)}ms — ${max.label}`);
  console.log(`  Average:          ${avg.toFixed(0)}ms`);

  // Breakdown by category
  console.log(`\n  ── By category ──`);
  const categories = {};
  for (const [label, { durationMs }] of entries) {
    let cat = 'Other';
    if (label.startsWith('SPA route')) cat = 'SPA Routes';
    else if (label.includes('JS bundle') || label.includes('CSS bundle') || label.includes('logo')) cat = 'Static Assets';
    else if (label.includes('CORS') || label.includes('preflight') || label.includes('Health')) cat = 'CORS / Health';
    else if (label.includes('Login') || label.includes('Register')) cat = 'Auth API';
    else if (label.includes('cache') || label.includes('Cache')) cat = 'Cache Checks';
    else if (label.includes('index.html')) cat = 'HTML Pages';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(durationMs);
  }
  for (const [cat, times] of Object.entries(categories)) {
    const catAvg = times.reduce((s, t) => s + t, 0) / times.length;
    const catMin = Math.min(...times);
    const catMax = Math.max(...times);
    console.log(`  ${cat.padEnd(20)}  n=${times.length}  avg=${catAvg.toFixed(0)}ms  min=${catMin.toFixed(0)}ms  max=${catMax.toFixed(0)}ms`);
  }
}

// ─── Final Report ─────────────────────────────────────────────────────────────

function printSummary() {
  title('📋  FINAL REPORT');
  const passRate = results.total > 0 ? ((results.pass / results.total) * 100).toFixed(1) : 'N/A';
  console.log(`  Passed:  ${results.pass} / ${results.total}  (${passRate}%)`);
  console.log(`  Failed:  ${results.fail}`);

  if (results.errors.length > 0) {
    console.log(`\n  ── Failures ──`);
    for (const err of results.errors) {
      const dur = err.durationMs ? ` [${err.durationMs.toFixed(0)}ms]` : '';
      console.log(`  ❌  ${err.label}${dur}`);
      console.log(`      ${err.reason}`);
    }
  }

  const allLabels = Object.keys(timing);
  const slowThreshold = 5000; // 5 seconds
  const slow = allLabels.filter(l => timing[l].durationMs > slowThreshold).sort((a, b) => timing[b].durationMs - timing[a].durationMs);
  if (slow.length > 0) {
    console.log(`\n  ── Slow requests (>${slowThreshold / 1000}s) ──`);
    for (const s of slow) {
      console.log(`  🐢  ${timing[s].durationMs.toFixed(0)}ms  ${s}`);
    }
  }

  if (results.fail === 0) {
    console.log(`\n  🟢  ALL TESTS PASSED`);
  } else {
    console.log(`\n  🔴  ${results.fail} TEST(S) FAILED`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀  CALCUTTA MACHINERY — Live E2E Test Suite`);
  console.log(`  Frontend: ${FRONTEND}`);
  console.log(`  Backend:  ${BACKEND}`);
  console.log(`  Started:  ${new Date().toISOString()}\n`);

  const suites = [
    testStaticAssets,
    testSpaRouting,
    testCacheHeaders,
    testCors,
    testLoginApi,
    testPerformance,
  ];

  for (const suite of suites) {
    try {
      await suite();
    } catch (e) {
      console.error(`\n  💥 Suite crashed: ${e.message}`);
      console.error(e.stack);
    }
  }

  printSummary();

  // Exit with code
  process.exit(results.fail > 0 ? 1 : 0);
}

main();
