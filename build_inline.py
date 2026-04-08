#!/usr/bin/env python3
"""Build script: inlines all JS/CSS into a single HTML file."""

import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

# Read all JS files in dependency order
js_files = [
    'js/config.js',
    'js/store.js',
    'js/ai-engine.js',
    'js/affiliate.js',
    'js/components.js',
    'js/i18n.js',
    'js/calendar.js',
    'js/integrations.js',
    'js/firebase-backend.js',
    'js/app.js',
    'js/pages.js'
]

js_content = ""
for f in js_files:
    with open(f) as fh:
        js_content += f"// === {f} ===\n" + fh.read() + "\n\n"

# Read CSS
with open('css/styles.css') as f:
    css_content = f.read()

html = f'''<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>未病ダイアリー 〜慢性疾患の寛解をサポート〜</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"></script>
<style>
{css_content}
</style>
</head>
<body>
<div class="app-container">
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <a class="sidebar-logo" onclick="app.navigate('dashboard')" style="cursor:pointer">
        <div style="width:36px;height:36px;flex-shrink:0;display:flex;align-items:center;justify-content:center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="8" fill="url(#sideGr)"/>
            <path d="M10 16.5C10 12 13 8 16 8C19 8 22 12 22 16.5C22 20 19.5 23 16 23C12.5 23 10 20 10 16.5Z" fill="white" fill-opacity="0.25"/>
            <path d="M16 11L16 20M12 15.5L16 20L20 15.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <defs><linearGradient id="sideGr" x1="0" y1="0" x2="32" y2="32"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>
          </svg>
        </div>
        <div>
          <span class="sidebar-logo-text">未病ダイアリー</span>
          <span class="sidebar-logo-sub">〜慢性疾患の寛解をサポート〜</span>
        </div>
      </a>
    </div>
    <nav class="sidebar-nav">
      <a class="nav-item" data-page="dashboard" onclick="app.navigate('dashboard')"><span class="icon" style="font-style:normal">&#9673;</span> ホーム</a>
      <a class="nav-item" data-page="data-input" onclick="app.navigate('data-input')"><span class="icon" style="font-style:normal">&#9998;</span> 記録</a>
      <a class="nav-item" data-page="actions" onclick="app.navigate('actions')"><span class="icon" style="font-style:normal">&#10003;</span> アクション</a>
      <a class="nav-item" data-page="research" onclick="app.navigate('research')"><span class="icon" style="font-style:normal">&#9878;</span> 研究</a>
      <a class="nav-item" data-page="chat" onclick="app.navigate('chat')"><span class="icon" style="font-style:normal">&#9993;</span> 相談</a>
      <a class="nav-item" data-page="integrations" onclick="app.navigate('integrations')"><span class="icon" style="font-style:normal">&#8644;</span> 連携</a>
      <a class="nav-item" data-page="settings" onclick="app.navigate('settings')"><span class="icon" style="font-style:normal">&#9881;</span> 設定</a>
      <a class="nav-item admin-only" data-page="admin" onclick="app.navigate('admin')"><span class="icon" style="font-style:normal">&#9881;</span> 管理</a>
    </nav>
    <div class="sidebar-user" id="sidebar-user">
      <div class="user-avatar" id="user-avatar">?</div>
      <div class="user-info">
        <div class="user-name" id="user-name">ゲスト</div>
        <div class="user-disease" id="user-disease">未設定</div>
      </div>
    </div>
  </aside>
  <main class="main-content">
    <div class="top-bar" id="top-bar">
      <div class="top-bar-left">
        <button class="btn btn-icon btn-secondary" onclick="app.toggleSidebar()" id="menu-toggle">☰</button>
        <h2 class="top-bar-title" id="top-bar-title">ダッシュボード</h2>
      </div>
      <div class="top-bar-right">
        <button class="btn btn-sm btn-secondary" onclick="app.navigate('settings')" title="設定">⚙️</button>
      </div>
    </div>
    <div class="page-content" id="page-content"></div>
  </main>
</div>
<div class="sidebar-overlay" id="sidebar-overlay" onclick="app.toggleSidebar()"></div>
<div class="modal-overlay" id="modal-overlay" onclick="if(event.target===this)app.closeModal()">
  <div class="modal">
    <div class="modal-header">
      <h3 class="modal-title" id="modal-title">モーダル</h3>
      <button class="modal-close" onclick="app.closeModal()">&times;</button>
    </div>
    <div class="modal-body" id="modal-body"></div>
  </div>
</div>
<div class="toast-container" id="toast-container"></div>
<div style="text-align:center;padding:20px 16px;font-size:10px;color:#94a3b8;border-top:1px solid #e4e7ef;margin-top:20px">&copy; 2025 Shares Inc. All rights reserved.</div>
<script>
{js_content}
document.addEventListener('DOMContentLoaded', function() {{ app.init(); }});
</script>
</body>
</html>'''

with open('dashboard.html', 'w') as f:
    f.write(html)

with open('index.html', 'w') as f:
    f.write(html)

print(f"Built: index.html + dashboard.html ({len(html):,} bytes)")
