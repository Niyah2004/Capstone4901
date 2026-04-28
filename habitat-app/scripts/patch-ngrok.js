#!/usr/bin/env node
// Patches @expo/cli and @expo/ngrok to use the system ngrok v3 binary.
// Expo SDK 54's built-in ngrok v2 binary is too old for free accounts (ERR_NGROK_121).
// Run automatically via postinstall.
const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..');

function applyPatch(filePath, oldText, newText, label) {
  if (!fs.existsSync(filePath)) {
    console.log(`patch-ngrok: ${label} not found, skipping.`);
    return;
  }
  let src = fs.readFileSync(filePath, 'utf8');
  if (src.includes(oldText)) {
    fs.writeFileSync(filePath, src.replace(oldText, newText));
    console.log(`patch-ngrok: patched ${label}`);
  } else if (src.includes(newText) || src.includes('NGROK_V3_PATH') || src.includes('_useV3')) {
    console.log(`patch-ngrok: ${label} already patched`);
  } else {
    console.log(`patch-ngrok: ${label} pattern not found — expo version may have changed`);
  }
}

// Patch 1: AsyncNgrok.js — skip exp.direct hostname, authtoken, and configPath when using ngrok v3
applyPatch(
  path.join(BASE, 'node_modules/@expo/cli/build/src/start/server/AsyncNgrok.js'),
  `            const urlProps = await this._getConnectionPropsAsync();
            const url = await instance.connect({
                ...urlProps,
                authtoken: NGROK_CONFIG.authToken,
                configPath,
                onStatusChange (status) {`,
  `            const _useV3 = !!process.env.NGROK_V3_PATH;
            const urlProps = _useV3 ? {} : await this._getConnectionPropsAsync();
            const url = await instance.connect({
                ...(_useV3 ? {} : { ...urlProps, authtoken: NGROK_CONFIG.authToken, configPath }),
                onStatusChange (status) {`,
  'AsyncNgrok.js'
);

// Patch 2: @expo/ngrok utils.js — strip the legacy 'port' field (ngrok v3 only accepts 'addr')
applyPatch(
  path.join(BASE, 'node_modules/@expo/ngrok/src/utils.js'),
  `  if (!opts.addr) opts.addr = opts.port || opts.host || 80;
  if (opts.httpauth) opts.auth = opts.httpauth;`,
  `  if (!opts.addr) opts.addr = opts.port || opts.host || 80;
  delete opts.port;
  if (opts.httpauth) opts.auth = opts.httpauth;`,
  '@expo/ngrok/src/utils.js'
);

// Patch 3: @expo/ngrok process.js — use system ngrok v3 binary via NGROK_V3_PATH env
applyPatch(
  path.join(BASE, 'node_modules/@expo/ngrok/src/process.js'),
  'const bin = require("@expo/ngrok-bin");',
  `const _ngrokBinFallback = require("@expo/ngrok-bin");
const bin = process.env.NGROK_V3_PATH || _ngrokBinFallback;`,
  '@expo/ngrok/src/process.js'
);
