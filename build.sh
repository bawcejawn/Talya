#!/bin/sh
# Builds index.html (GitHub Pages, installable) and dist/artifact.html (Claude preview) from src/.
set -e
cd "$(dirname "$0")"
mkdir -p dist
body() { cat src/ui.html; echo '<script>'; cat src/analysis.js; echo '</script><script>'; cat src/app.js; echo '</script>'; }
{
  echo '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  echo '<meta name="description" content="Talya helps couples hear how their tone of voice comes across. Free, private, and your audio never leaves your device.">'
  echo '<meta name="theme-color" content="#2C6A60"><link rel="manifest" href="manifest.json"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="apple-touch-icon.png">'
  echo '<meta name="apple-mobile-web-app-capable" content="yes"><meta property="og:title" content="Talya"><meta property="og:description" content="Hear how your tone of voice comes across. Audio stays on your device."><meta property="og:image" content="https://bawcejawn.github.io/Talya/icon-512.png">'
  echo '</head><body>'
  body
  echo "<script>if('serviceWorker' in navigator&&location.protocol==='https:'){navigator.serviceWorker.register('sw.js').catch(()=>{})}</script>"
  echo '</body></html>'
} > index.html
body > dist/artifact.html
echo built
