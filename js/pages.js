// === js/pages.js ===
/* ============================================================
   Page Renderers - Added to App.prototype
   ============================================================ */

// Login Page - Disease selection first, then login
App.prototype.render_login = function() {
  const cats = CONFIG.DISEASE_CATEGORIES;
  const selected = store.get('selectedDiseases') || [];
  const selectedCount = selected.length;

  const categoryHtml = cats.map(cat => `
    <div style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;cursor:pointer"
        onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'flex':'none';this.querySelector('.toggle').textContent=this.nextElementSibling.style.display==='none'?'+':'-'">
        <span class="toggle" style="font-size:14px;color:var(--accent);font-weight:700;width:16px;text-align:center">+</span>
        <span style="font-size:16px">${cat.icon}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text-primary)">${cat.name}</span>
        <span style="font-size:10px;color:var(--text-muted)">(${cat.diseases.length})</span>
      </div>
      <div style="display:none;flex-wrap:wrap;gap:6px;padding-left:22px">
        ${cat.diseases.map(d => {
          // Surface world/Japan patient counts as a tooltip + a small
          // inline "世界 X・国内 Y" badge. Desktop users see the tooltip
          // on hover, mobile users see the inline badge. Tags without
          // epidemiology data fall back to the original display.
          const epi = CONFIG.DISEASE_EPIDEMIOLOGY?.[d.id];
          const tooltip = epi
            ? `世界: ${epi.label}${epi.japanLabel ? ` ／ 国内: ${epi.japanLabel}` : ''}${epi.source ? ` (${epi.source})` : ''}`
            : '';
          const badge = epi
            ? `<span style="font-size:9px;color:var(--text-muted);margin-left:4px">${Components.escapeHtml(
                epi.world ? '世 ' + (epi.world >= 1e9 ? (epi.world/1e9).toFixed(1) + '億'
                                  : epi.world >= 1e8 ? (epi.world/1e8).toFixed(1) + '億'
                                  : epi.world >= 1e4 ? (epi.world/1e4).toFixed(0) + '万' : '')
                : ''
              )}${epi.japan ? ' ／ 国 ' + Components.escapeHtml(
                epi.japan >= 1e8 ? (epi.japan/1e8).toFixed(1) + '億'
                : epi.japan >= 1e4 ? (epi.japan/1e4).toFixed(0) + '万' : ''
              ) : ''}</span>`
            : '';
          return `
          <label title="${Components.escapeHtml(tooltip)}"
            style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;background:${selected.includes(d.id)?'var(--accent-bg)':'var(--bg-tertiary)'};border:1px solid ${selected.includes(d.id)?'var(--accent-border)':'transparent'};border-radius:20px;cursor:pointer;font-size:12px;color:${selected.includes(d.id)?'var(--accent)':'var(--text-secondary)'};transition:all 0.15s">
            <input type="checkbox" class="disease-checkbox" value="${d.id}" data-name="${d.name}"
              ${selected.includes(d.id) ? 'checked' : ''}
              onchange="app.toggleDiseaseSelection(this);var l=this.closest('label');if(this.checked){l.style.background='var(--accent-bg)';l.style.border='1px solid var(--accent-border)';l.style.color='var(--accent)'}else{l.style.background='var(--bg-tertiary)';l.style.border='1px solid transparent';l.style.color='var(--text-secondary)'}app.updateSelectedDiseaseScale&&app.updateSelectedDiseaseScale();"
              style="display:none">
            ${d.name}${badge}
          </label>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');

  return `
  <div class="login-page" style="align-items:flex-start;padding:0;background:#fff;min-height:100vh">
    <div style="width:100%;max-width:520px;margin:0 auto;padding:0 20px">

      <!-- Hero -->
      <!-- Language Selector -->
      <div style="text-align:right;padding:12px 0 0">
        <select style="font-size:11px;padding:4px 8px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;color:#64748b;cursor:pointer"
          onchange="i18n.setLang(this.value);location.reload()">
          <option value="ja" ${(store.get('userProfile')?.language || 'ja') === 'ja' ? 'selected' : ''}>日本語</option>
          <option value="en" ${(store.get('userProfile')?.language) === 'en' ? 'selected' : ''}>English</option>
          <option value="zh" ${(store.get('userProfile')?.language) === 'zh' ? 'selected' : ''}>中文</option>
          <option value="ko" ${(store.get('userProfile')?.language) === 'ko' ? 'selected' : ''}>한국어</option>
          <option value="es" ${(store.get('userProfile')?.language) === 'es' ? 'selected' : ''}>Español</option>
          <option value="fr" ${(store.get('userProfile')?.language) === 'fr' ? 'selected' : ''}>Français</option>
          <option value="de" ${(store.get('userProfile')?.language) === 'de' ? 'selected' : ''}>Deutsch</option>
          <option value="pt" ${(store.get('userProfile')?.language) === 'pt' ? 'selected' : ''}>Português</option>
          <option value="th" ${(store.get('userProfile')?.language) === 'th' ? 'selected' : ''}>ไทย</option>
          <option value="vi" ${(store.get('userProfile')?.language) === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
          <option value="ar" ${(store.get('userProfile')?.language) === 'ar' ? 'selected' : ''}>العربية</option>
          <option value="hi" ${(store.get('userProfile')?.language) === 'hi' ? 'selected' : ''}>हिन्दी</option>
        </select>
      </div>

      <div style="text-align:center;padding:24px 0 24px">
        <div style="width:48px;height:48px;margin:0 auto 16px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#a855f7);display:flex;align-items:center;justify-content:center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3C12 3 7 8 7 13a5 5 0 0010 0c0-5-5-10-5-10z"/></svg>
        </div>
        <h1 style="font-size:26px;font-weight:800;color:#1e293b;letter-spacing:-0.5px;margin-bottom:6px">健康日記</h1>
        <p style="font-size:14px;color:#64748b;line-height:1.5">体調記録・情報整理ツール</p>
      </div>

      <!-- Today's axis preview + public user count -->
      <!-- The today's-axis widget gives repeat visitors a reason to
           return daily ("今日は何の軸かな?") and builds trust by
           demonstrating that the daily advice genuinely rotates.
           The user-count widget is filled in lazily by JS because
           we need to query Firestore — rendered at 0 on first
           paint, then hydrated. -->
      ${(() => {
        const todayAxis = (typeof aiEngine !== 'undefined' && aiEngine._getTodayPrescriptionAxis)
          ? aiEngine._getTodayPrescriptionAxis() : null;
        if (!todayAxis) return '';
        return `
        <div style="margin-bottom:14px;padding:12px 16px;background:linear-gradient(135deg,#eef2ff 0%,#fdf4ff 100%);border:1.5px solid #6366f1;border-radius:12px">
          <div style="display:flex;align-items:center;gap:10px">
            <div style="font-size:10px;color:#6366f1;font-weight:700;flex-shrink:0">📅 今日の新処方の指定軸</div>
            <div id="public-user-count-inline" style="margin-left:auto;font-size:10px;color:#64748b">読込中…</div>
          </div>
          <div style="font-size:14px;font-weight:700;color:#3730a3;margin-top:4px;line-height:1.4">${todayAxis.icon} ${todayAxis.name}</div>
          <div style="font-size:11px;color:#4338ca;line-height:1.6;margin-top:3px">${Components.escapeHtml((todayAxis.desc || '').substring(0, 100))}${(todayAxis.desc || '').length > 100 ? '…' : ''}</div>
          <div style="font-size:10px;color:#6366f1;margin-top:6px">※ 毎日 14 軸から自動的に 1 つが選ばれます — 2 週間で全ての角度を体験</div>
        </div>`;
      })()}

      <!-- Guest Try Area (no registration required) -->
      <div style="margin-bottom:20px;padding:18px;background:#fff;border-radius:16px;border:2px solid #6366f1;box-shadow:0 2px 12px rgba(99,102,241,0.08)">
        <div style="font-size:14px;font-weight:700;color:#1e293b;margin-bottom:4px">まずはお試しください（登録不要）</div>
        <div style="font-size:12px;color:#64748b;margin-bottom:12px">今の体調や気になること、お薬の写真などを入れてみてください</div>
        <div style="display:flex;gap:8px;align-items:start">
          <div style="flex:1">
            <textarea id="guest-input" rows="2"
              style="width:100%;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px 14px;font-size:14px;resize:none;font-family:inherit;outline:none"
              onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault();app.guestAnalyze();}"
              placeholder="例：最近だるくて眠れない、頭痛がする..."></textarea>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <button onclick="app.guestAnalyze()" style="padding:12px 16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap">聞いてみる</button>
            <label style="padding:8px 12px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;font-size:12px;color:#64748b;cursor:pointer;text-align:center">
              📎 写真
              <input type="file" hidden accept="image/*,.pdf" onchange="app.guestFileAnalyze(event)">
            </label>
          </div>
        </div>

        <!-- Disease hint (gentle) — now shows world patient count
             as a tooltip + a subtle "あなただけじゃない" reassurance
             below the tag row so the scale is visible even on mobile. -->
        <div style="margin-top:10px;padding:8px 12px;background:#f8fafc;border-radius:10px;font-size:11px;color:#64748b;line-height:1.6">
          お持ちの症状を選ぶと、より的確な情報をお伝えできます（任意）
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px" id="guest-disease-tag-row">
            ${['mecfs:慢性疲労', 'depression:うつ', 'fibromyalgia:線維筋痛症', 'long_covid:コロナ後遺症', 'insomnia:不眠', 'pots:起立不耐', 'ibs:おなかの不調', 'hashimoto:甲状腺'].map(item => {
              const [id, label] = item.split(':');
              const epi = CONFIG.DISEASE_EPIDEMIOLOGY?.[id];
              const tooltipLabel = epi ? `世界で ${epi.label}（${epi.source || '統計'}）` : '';
              return `<span class="guest-disease-tag" data-id="${id}" data-world-label="${Components.escapeHtml(epi?.label || '')}" title="${Components.escapeHtml(tooltipLabel)}"
                style="padding:3px 10px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;cursor:pointer;font-size:11px;transition:all 0.15s"
                onclick="this.classList.toggle('selected');if(this.classList.contains('selected')){this.style.background='#ede9fe';this.style.borderColor='#6366f1';this.style.color='#6366f1'}else{this.style.background='#fff';this.style.borderColor='#e2e8f0';this.style.color='#64748b'}app.updateGuestDiseaseScale();">${label}</span>`;
            }).join('')}
          </div>
          <div id="guest-disease-scale" style="margin-top:8px;padding:8px 10px;background:#fafaff;border-left:3px solid #6366f1;border-radius:0 6px 6px 0;font-size:11px;color:#4338ca;line-height:1.6;display:none">
            <strong>あなただけじゃない。</strong>
            <span id="guest-disease-scale-text"></span>
          </div>
        </div>

        <!-- ✨ サンプルで体験 — 登録前の最大コンバージョンドライバー。
             何を書けばいいか迷うユーザーに現実的な記録例を 1 タップで
             入れてもらい、すぐに「AI が効く体験」を見せる。医師提出
             レポートのサンプルは架空 30 日データで生成し、最大差別化
             機能をゲストに無料体験させる。 -->
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
          <button onclick="app.guestSampleSubmit()"
            style="padding:10px 14px;background:#fff;border:1.5px solid #c7d2fe;border-radius:10px;font-size:12px;font-weight:600;color:#4338ca;cursor:pointer">
            📝 サンプル記録で試してみる
          </button>
          <button onclick="app.guestSampleReport()"
            style="padding:10px 14px;background:linear-gradient(135deg,#ecfeff,#cffafe);border:1.5px solid #a5f3fc;border-radius:10px;font-size:12px;font-weight:600;color:#155e75;cursor:pointer">
            🏥 医師提出レポートのサンプルを見る
          </button>
        </div>

        <!-- Guest result area -->
        <div id="guest-result" style="margin-top:12px"></div>
      </div>
      <div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0">
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:10px">このサービスでできること</div>
        <div style="font-size:12px;color:#475569;line-height:1.8">
          <div style="display:flex;gap:8px;margin-bottom:6px"><span style="flex-shrink:0">📝</span><span><strong>体調を記録</strong> — テキスト・写真・ファイルで日々の症状、服薬、食事、気分を記録</span></div>
          <div style="display:flex;gap:8px;margin-bottom:6px"><span style="flex-shrink:0">📊</span><span><strong>経過を可視化</strong> — 記録データの時系列表示と傾向の整理</span></div>
          <div style="display:flex;gap:8px;margin-bottom:6px"><span style="flex-shrink:0">🔬</span><span><strong>研究情報の収集</strong> — 最新の研究情報を疾患別に自動取得（参考情報）</span></div>
          <div style="display:flex;gap:8px"><span style="flex-shrink:0">💡</span><span><strong>情報の整理補助</strong> — 入力内容に基づく参考情報の提示（医療行為ではありません）</span></div>
        </div>
      </div>

      <!-- Important Notice -->
      <div style="margin-bottom:24px;padding:14px 16px;background:#fef2f2;border-radius:14px;border:1px solid #fecaca">
        <div style="font-size:12px;font-weight:700;color:#991b1b;margin-bottom:6px">⚠ 重要なお知らせ</div>
        <div style="font-size:11px;color:#7f1d1d;line-height:1.7">
          本サービスは<strong>医療機器ではなく、医療行為を行うものではありません</strong>。
          提示される情報は参考情報であり、診断・治療・処方の代替にはなりません。
          健康上の判断は必ず医師・医療専門家にご相談ください。
          本サービスの情報に基づく行動はすべてご自身の責任となります。
        </div>
      </div>

      <!-- Login Options -->
      <div id="login-section"></div>
      <div style="margin-bottom:24px">
        <!-- Email Registration/Login (primary for older users) -->
        <form onsubmit="app.loginWithEmail(event)" style="margin-bottom:14px">
          <input type="email" name="email" class="form-input" placeholder="メールアドレス"
            style="border-radius:14px;padding:14px 16px;margin-bottom:8px;border:1.5px solid #e2e8f0;font-size:15px">
          <input type="password" name="password" class="form-input" placeholder="パスワード（6文字以上）"
            style="border-radius:14px;padding:14px 16px;margin-bottom:10px;border:1.5px solid #e2e8f0;font-size:15px">
          <button type="submit" class="btn btn-primary" style="width:100%;border-radius:14px;padding:14px;font-size:15px">メールアドレスではじめる（無料）</button>
          <div style="font-size:11px;color:#94a3b8;text-align:center;margin-top:6px">初回は自動で登録されます。2回目以降は同じメール・パスワードでログイン。</div>
        </form>

        <!-- Divider -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <div style="flex:1;height:1px;background:#e2e8f0"></div>
          <span style="font-size:12px;color:#94a3b8">または</span>
          <div style="flex:1;height:1px;background:#e2e8f0"></div>
        </div>

        <!-- In-app browser warning (LINE / Instagram / Twitter / Facebook) -->
        ${(() => {
          const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
          const isInApp = /Line\//i.test(ua) || /FBAN|FBAV/i.test(ua) ||
            /Instagram/i.test(ua) || /Twitter/i.test(ua) ||
            /MicroMessenger/i.test(ua) || /wv\)/i.test(ua);
          if (!isInApp) return '';
          // Detect LINE specifically for its openExternalBrowser hint.
          const isLine = /Line\//i.test(ua);
          const currentUrl = typeof location !== 'undefined' ? location.href : 'https://cares.advisers.jp';
          // LINE supports a query parameter that forces its in-app
          // browser to open the URL in the system default browser.
          // For other apps this param is just ignored.
          const lineBreakoutUrl = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'openExternalBrowser=1';
          return `
            <div style="margin-bottom:14px;padding:14px 16px;background:#fff7ed;border:1.5px solid #f97316;border-radius:14px">
              <div style="font-size:13px;font-weight:700;color:#9a3412;margin-bottom:6px">⚠ アプリ内ブラウザでは Google ログインが使えません</div>
              <div style="font-size:12px;color:#7c2d12;line-height:1.7;margin-bottom:10px">
                LINE・Instagram 等のアプリ内ブラウザでは、Google のセキュリティポリシーにより OAuth ログインがブロックされます。以下のいずれかをお試しください：
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px">
                ${isLine ? `
                <a href="${Components.escapeHtml(lineBreakoutUrl)}"
                  style="display:block;padding:12px;background:#06c755;color:#fff;border-radius:10px;text-align:center;font-size:13px;font-weight:600;text-decoration:none">
                  Safari/Chrome で開く（LINE 専用）
                </a>` : ''}
                <button onclick="app.openInBrowser()"
                  style="padding:12px;background:#f97316;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">
                  📤 共有メニューから Safari で開く
                </button>
                <button onclick="app.copyCurrentUrl()"
                  style="padding:12px;background:#fff;color:#9a3412;border:1.5px solid #f97316;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer">
                  📋 URLをコピーしてブラウザで開く
                </button>
              </div>
              <details style="font-size:11px;color:#7c2d12;line-height:1.6;margin-bottom:8px">
                <summary style="cursor:pointer;font-weight:600">手動で Safari に切り替える方法</summary>
                <ol style="margin:6px 0 0 20px;padding:0">
                  <li>画面右上または下部の <strong>「⋯」（メニュー）</strong>ボタンをタップ</li>
                  <li>「<strong>Safari で開く</strong>」または「<strong>ブラウザで開く</strong>」を選択</li>
                  <li>開いた Safari でもう一度「Google でログイン」を押す</li>
                </ol>
              </details>
              <div style="font-size:11px;color:#9a3412;line-height:1.6">
                または下の<strong>メールアドレス</strong>で登録すれば、このブラウザでもすぐ使えます ↓
              </div>
            </div>`;
        })()}
        <!-- Google Login -->
        <div id="login-error" style="display:none;margin-bottom:10px;padding:10px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#991b1b;font-size:12px;line-height:1.5;word-break:break-word"></div>
        <button class="google-btn" onclick="app.loginWithGoogle()" style="width:100%;border-radius:14px;padding:14px;font-size:14px;border:1.5px solid #e2e8f0;background:#fff">
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Googleアカウントではじめる
        </button>
      </div>

      <!-- How it works -->
      <div style="margin-bottom:24px">
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:12px">はじめ方（3ステップ）</div>
        <div style="display:flex;gap:12px;margin-bottom:10px">
          <div style="width:28px;height:28px;border-radius:50%;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">1</div>
          <div style="font-size:12px;color:#475569;line-height:1.6"><strong>Googleでログイン</strong> — アカウント作成は不要。Googleアカウントでそのまま開始</div>
        </div>
        <div style="display:flex;gap:12px;margin-bottom:10px">
          <div style="width:28px;height:28px;border-radius:50%;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">2</div>
          <div style="font-size:12px;color:#475569;line-height:1.6"><strong>今日の体調を書く</strong> — テキストでも写真でもOK。1行でもかまいません</div>
        </div>
        <div style="display:flex;gap:12px">
          <div style="width:28px;height:28px;border-radius:50%;background:#6366f1;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0">3</div>
          <div style="font-size:12px;color:#475569;line-height:1.6"><strong>参考情報を確認</strong> — 入力内容に基づく情報整理と関連研究が表示されます</div>
        </div>
      </div>

      <!-- Disease Selection -->
      <div style="margin-bottom:20px;padding:14px;background:#f8fafc;border-radius:14px">
        <div style="cursor:pointer;display:flex;justify-content:space-between;align-items:center"
          onclick="var c=document.getElementById('disease-picker');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'+':'−'">
          <div style="font-size:12px;font-weight:600;color:#1e293b">対象疾患を選択（任意・後から変更可）<span style="font-weight:400;color:#94a3b8;margin-left:4px">${selectedCount > 0 ? selectedCount + '件' : ''}</span></div>
          <span class="arrow" style="font-size:16px;color:#94a3b8">+</span>
        </div>
        <div id="disease-picker" style="display:none;margin-top:10px">
          <input type="text" class="form-input" placeholder="検索..." style="border-radius:10px;padding:9px 12px;margin-bottom:10px;border:1.5px solid #e2e8f0;font-size:12px"
            oninput="document.querySelectorAll('.disease-checkbox').forEach(cb=>{const label=cb.closest('label');const match=label.textContent.toLowerCase().includes(this.value.toLowerCase());label.style.display=match?'':'none'})">
          ${categoryHtml}
          <!-- Scale-of-community reassurance. Populated dynamically by
               app.updateSelectedDiseaseScale() whenever the user ticks
               a checkbox above. Shows the world + Japan patient counts
               for the selected conditions so the visitor immediately
               sees they are not alone. -->
          <div id="selected-disease-scale" style="display:none;margin-top:12px;padding:10px 12px;background:#eef2ff;border-left:3px solid #6366f1;border-radius:0 8px 8px 0"></div>
        </div>
      </div>

      <!-- Testimonial + Developer's note articles -->
      <div style="margin-bottom:24px;padding:16px;border-left:3px solid #6366f1;background:#fafaff;border-radius:0 12px 12px 0">
        <div style="font-size:12px;color:#475569;line-height:1.8;font-style:italic;margin-bottom:8px">
          「2年間のME/CFS闘病の中で、毎日の記録が最大の武器になりました」
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <span style="font-size:11px;color:#64748b">山口揚平 / 開発者（note: @age）</span>
        </div>
        <!-- Featured note articles (newest first) -->
        <div style="display:flex;flex-direction:column;gap:8px">
          <a href="https://note.com/age/n/nc8305ab7c124" target="_blank" rel="noopener"
            style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border:1.5px solid #6366f1;border-radius:8px;text-decoration:none">
            <span style="font-size:18px">📖</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:10px;color:#6366f1;font-weight:700;margin-bottom:2px">最新の闘病記</div>
              <div style="font-size:12px;font-weight:700;color:#3730a3;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">ME/CFS 闘病記（最新） — note で読む</div>
            </div>
            <span style="color:#6366f1;font-size:12px;flex-shrink:0">→</span>
          </a>
          <a href="https://note.com/age/n/n4f373bc7415a" target="_blank" rel="noopener"
            style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:#fff;border:1px solid #e4e7ef;border-radius:8px;text-decoration:none">
            <span style="font-size:18px">📗</span>
            <div style="flex:1;min-width:0">
              <div style="font-size:10px;color:#64748b;font-weight:700;margin-bottom:2px">原点の記事</div>
              <div style="font-size:12px;font-weight:700;color:#334155;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">2 年間の ME/CFS 闘病記 — 毎日の記録が最大の武器</div>
            </div>
            <span style="color:#64748b;font-size:12px;flex-shrink:0">→</span>
          </a>
          <a href="https://note.com/age" target="_blank" rel="noopener" style="font-size:11px;color:#6366f1;text-decoration:none;font-weight:600;text-align:center;padding:4px">note @age の全記事を見る →</a>
          <!-- X (Twitter) posts by the developer. Linked without
               re-captioning — the original post title/context is
               preserved by letting the user tap through to X. -->
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e4e7ef">
            <div style="font-size:10px;color:#64748b;font-weight:700;margin-bottom:6px">𝕏 開発者の発信</div>
            <a href="https://x.com/yamaguchiyohei/status/2040128976199602391" target="_blank" rel="noopener"
              style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border:1px solid #e4e7ef;border-radius:8px;text-decoration:none;color:#1e293b;margin-bottom:6px">
              <span style="font-size:14px;flex-shrink:0">𝕏</span>
              <div style="flex:1;font-size:11px;color:#475569;line-height:1.5;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">@yamaguchiyohei のポストを見る</div>
              <span style="color:#64748b;font-size:11px;flex-shrink:0">→</span>
            </a>
            <a href="https://x.com/yamaguchiyohei/status/2021985306959089778" target="_blank" rel="noopener"
              style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:#fff;border:1px solid #e4e7ef;border-radius:8px;text-decoration:none;color:#1e293b">
              <span style="font-size:14px;flex-shrink:0">𝕏</span>
              <div style="flex:1;font-size:11px;color:#475569;line-height:1.5;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">@yamaguchiyohei のポストを見る</div>
              <span style="color:#64748b;font-size:11px;flex-shrink:0">→</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Data Handling & Privacy -->
      <div style="margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0">
        <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:10px">データの取り扱い</div>
        <div style="font-size:11px;color:#475569;line-height:1.8">
          <div style="margin-bottom:4px">🔒 <strong>暗号化保存</strong> — データはGoogle Firebase上に暗号化して保存されます</div>
          <div style="margin-bottom:4px">👤 <strong>本人のみアクセス</strong> — ログインしたユーザー本人のみが自分のデータにアクセスできます</div>
          <div style="margin-bottom:4px">🚫 <strong>第三者提供なし</strong> — ユーザーの健康データを第三者に提供・販売することはありません</div>
          <div style="margin-bottom:4px">🗑️ <strong>削除可能</strong> — 設定画面からすべてのデータを削除できます。退会も自由です</div>
          <div>📋 <strong>要配慮個人情報</strong> — 健康情報は要配慮個人情報として、個人情報保護法に基づき適切に管理します</div>
        </div>
      </div>

      <!-- Trust banner: primary privacy assurance. Placed above the
           dense legal-links strip so it's the first thing users see
           when scrolling for reassurance. -->
      <div style="margin-bottom:14px;padding:12px 16px;background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%);border:1.5px solid #6366f1;border-radius:12px;text-align:center;cursor:pointer"
        onclick="app.navigate('privacy')">
        <div style="font-size:13px;font-weight:700;color:#3730a3;margin-bottom:4px">🔒 あなたの記録は、あなたのものです</div>
        <div style="font-size:11px;color:#4338ca;line-height:1.7">
          AI 学習には使われません ・ いつでも完全削除可能 ・ プライバシーマーク取得準備中
        </div>
        <div style="font-size:10px;color:#6366f1;margin-top:6px;text-decoration:underline">詳しくはプライバシーと安全のページへ →</div>
      </div>

      <!-- Legal Links -->
      <div style="margin-bottom:24px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
        <a href="#" onclick="app.navigate('privacy');return false" style="font-size:11px;color:#6366f1;text-decoration:none">プライバシーと安全</a>
        <span style="color:#cbd5e1">|</span>
        <a href="#" onclick="app.showLegalPage('privacy');return false" style="font-size:11px;color:#6366f1;text-decoration:none">プライバシーポリシー</a>
        <span style="color:#cbd5e1">|</span>
        <a href="#" onclick="app.showLegalPage('terms');return false" style="font-size:11px;color:#6366f1;text-decoration:none">利用規約</a>
        <span style="color:#cbd5e1">|</span>
        <a href="#" onclick="app.showLegalPage('disclaimer');return false" style="font-size:11px;color:#6366f1;text-decoration:none">免責事項</a>
        <span style="color:#cbd5e1">|</span>
        <a href="mailto:${CONFIG.CONTACT_EMAIL}" style="font-size:11px;color:#6366f1;text-decoration:none">お問い合わせ</a>
      </div>

      <!-- Footer -->
      <div style="text-align:center;padding:0 0 32px;color:#94a3b8;font-size:10px;line-height:2">
        <div>運営: シェアーズ株式会社 &nbsp;·&nbsp; 🇯🇵 Made in Japan</div>
        <div>本サービスは医療機器ではありません &nbsp;·&nbsp; 無料</div>
        <div style="margin-top:4px;color:#cbd5e1">&copy; 2025 Shares Inc. All rights reserved.</div>
      </div>

    </div>
  </div>`;
};

// Disease Selection (for changing diseases later, from settings)
App.prototype.render_disease_select = function() {
  // Disease selection is now part of the login page and also available
  // in settings. For authed users landing here (e.g. first login without
  // a cached disease) we fall through to the dashboard. For unauth users
  // we render the login page HTML directly — never call navigate() from a
  // renderer, which blanks the page via a race with the caller's
  // innerHTML assignment.
  if (store.get('isAuthenticated')) {
    return this.render_dashboard();
  }
  return this.render_login();
};

// Dashboard Page
// Compute the current consecutive-day recording streak from
// textEntries. Returns { streak: N, longest: N, totalDays: N }.
// The streak increments for each day where AT LEAST ONE entry
// exists, ending at today (or yesterday if no entry today yet).
App.prototype._computeStreak = function() {
  const entries = (store.get('textEntries') || []).concat(store.get('symptoms') || []);
  if (entries.length === 0) return { streak: 0, longest: 0, totalDays: 0 };

  // Collect unique YYYY-MM-DD days with at least one entry.
  const days = new Set();
  entries.forEach(e => {
    const ts = e.timestamp || e.createdAt;
    if (!ts) return;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return;
    days.add(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'));
  });
  const sortedDays = Array.from(days).sort();
  if (sortedDays.length === 0) return { streak: 0, longest: 0, totalDays: 0 };

  // Compute longest streak and current streak.
  let longest = 1, current = 1, running = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1]);
    const curr = new Date(sortedDays[i]);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      running++;
      if (running > longest) longest = running;
    } else {
      running = 1;
    }
  }

  // Current streak: walk backwards from today, counting consecutive days.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let cursor = new Date(today);
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  // If today isn't recorded yet, we allow yesterday to still count as "current streak"
  // — this matches user intuition ("I'm on a 5-day streak, just haven't logged today").
  if (!days.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  current = 0;
  for (;;) {
    const key = cursor.getFullYear() + '-' + String(cursor.getMonth() + 1).padStart(2, '0') + '-' + String(cursor.getDate()).padStart(2, '0');
    if (!days.has(key)) break;
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { streak: current, longest, totalDays: days.size };
};

// Build the list of badges the user has earned based on their
// streak, total days, and other milestones. Used by the dashboard
// streak widget and for future achievement surfaces.
App.prototype._getEarnedBadges = function(stats) {
  const badges = [];
  if (stats.totalDays >= 1)   badges.push({ icon: '🌱', name: '最初の一歩',   desc: '初めての記録' });
  if (stats.streak >= 3)      badges.push({ icon: '🔥', name: '3日連続',       desc: '3日連続で記録' });
  if (stats.streak >= 7)      badges.push({ icon: '⚡', name: '1週間連続',     desc: '1週間の継続' });
  if (stats.streak >= 14)     badges.push({ icon: '🌊', name: '2週間連続',     desc: '全 14 軸を体験' });
  if (stats.streak >= 30)     badges.push({ icon: '🏔', name: '30日連続',      desc: '1 ヶ月の継続' });
  if (stats.streak >= 100)    badges.push({ icon: '🏆', name: '100日連続',     desc: '驚異の継続力' });
  if (stats.totalDays >= 7)   badges.push({ icon: '📚', name: '1週間の記録',   desc: '通算 7 日分' });
  if (stats.totalDays >= 30)  badges.push({ icon: '📖', name: '1ヶ月の記録',   desc: '通算 30 日分' });
  if (stats.totalDays >= 100) badges.push({ icon: '🎓', name: '100日の記録',   desc: '通算 100 日分' });
  return badges;
};

App.prototype.render_dashboard = function() {
  try {
  const disease = store.get('selectedDisease') || { name: 'ME/CFS', icon: '🧠' };
  const score = store.get('healthScore') || 50;
  const symptoms = store.get('symptoms') || [];
  const latest = symptoms[symptoms.length - 1] || {};
  const recs = store.get('recommendations') || [];
  const textEntries = store.get('textEntries') || [];
  const conversations = store.get('conversationHistory') || [];
  const latestAnalysis = store.get('latestAnalysis');
  const streakStats = this._computeStreak();
  const earnedBadges = this._getEarnedBadges(streakStats);

  // Real data counts
  const totalEntries = textEntries.length;
  const totalSymptoms = symptoms.length;
  const lastEntry = textEntries[textEntries.length - 1];
  const lastUpdate = lastEntry ? new Date(lastEntry.timestamp).toLocaleString('ja-JP') : (symptoms.length ? new Date(latest.timestamp).toLocaleString('ja-JP') : '未記録');

  // Calculate real stats from symptom data
  const recent7 = symptoms.filter(s => (Date.now() - new Date(s.timestamp)) < 7 * 86400000);
  const avgField = (arr, f) => { const v = arr.map(s => s[f]).filter(x => x != null); return v.length ? (v.reduce((a,b) => a+b, 0) / v.length).toFixed(1) : '--'; };
  const changeField = (arr, f) => {
    if (arr.length < 2) return 0;
    const half = Math.floor(arr.length / 2);
    const first = arr.slice(0, half).map(s => s[f]).filter(x => x != null);
    const second = arr.slice(half).map(s => s[f]).filter(x => x != null);
    if (!first.length || !second.length) return 0;
    const avg1 = first.reduce((a,b) => a+b, 0) / first.length;
    const avg2 = second.reduce((a,b) => a+b, 0) / second.length;
    return avg1 === 0 ? 0 : Math.round(((avg2 - avg1) / avg1) * 100);
  };

  const fatigueAvg = avgField(recent7, 'fatigue_level');
  const painAvg = avgField(recent7, 'pain_level');
  const fogAvg = avgField(recent7, 'brain_fog');
  const sleepAvg = avgField(recent7, 'sleep_quality');
  const fatigueChange = changeField(recent7, 'fatigue_level');
  const painChange = changeField(recent7, 'pain_level');
  const fogChange = changeField(recent7, 'brain_fog');
  const sleepChange = changeField(recent7, 'sleep_quality');

  // Latest text entries for dashboard
  const recentTexts = textEntries.slice(-3).reverse();

  // Show all selected diseases
  const selectedDiseases = store.get('selectedDiseases') || [];
  const diseaseNames = [];
  selectedDiseases.forEach(id => {
    if (id === 'custom') { diseaseNames.push(store.get('customDiseaseName') || 'その他'); return; }
    for (const cat of CONFIG.DISEASE_CATEGORIES) {
      const found = cat.diseases.find(d => d.id === id);
      if (found) { diseaseNames.push(found.name); break; }
    }
  });
  const diseaseTagsHtml = diseaseNames.length > 0
    ? diseaseNames.map(n => `<span class="tag tag-accent" style="font-size:10px">${n}</span>`).join(' ')
    : `<span class="tag tag-accent" style="font-size:10px">${disease.name}</span>`;

  const latestParsed = latestAnalysis?.parsed || latestAnalysis?.result || {};
  const latestAlerts = latestParsed.riskAlerts || [];
  const allRecs = recs.length > 0 ? recs : (latestParsed.recommendations || []);
  const hasData = totalEntries > 0 || totalSymptoms > 0;

  // Build AI-enriched recent entries (last 10). Dedup by id first because
  // Firebase sync occasionally replays the same doc as multiple store.set
  // rounds land; without this, the same entry renders 2-3 times in a row.
  const seenIds = new Set();
  const uniqueTextEntries = textEntries.filter(e => {
    const id = e && e.id;
    if (!id) return true;
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });
  const recentAll = uniqueTextEntries.slice(-10).reverse();
  const enrichedEntries = recentAll.map(e => {
    const insight = app.generateQuickInsight(e.content || '');
    return { ...e, _insight: insight };
  });

  // Welcome card for new users — shown only while 0 records exist.
  // The goal is to convert "just registered" to "first entry submitted"
  // in under 60 seconds. Three concrete example prompts lower the
  // blank-page anxiety that blocks first-time use.
  const diseaseLabel = (() => {
    const ids = store.get('selectedDiseases') || [];
    if (!ids.length) return '慢性疾患';
    try {
      const all = CONFIG.DISEASE_CATEGORIES || [];
      for (const cat of all) {
        const d = cat.diseases && cat.diseases.find(x => x.id === ids[0]);
        if (d) return d.name;
      }
    } catch (_) {}
    return '慢性疾患';
  })();
  const examplePrompts = [
    `今日は朝から頭が重くて、${diseaseLabel}の疲労が強い。昨夜の睡眠は5時間くらい`,
    '昼食後から少し楽になった。血圧を測ったら上が105/下が68',
    '頓服薬を1錠飲んだ。飲んでから40分で痛みが6→3に減った'
  ];
  const welcomeHtml = !hasData ? `
    <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,#f0fdf4 0%,#eff6ff 100%);border:1.5px solid #86efac">
      <div class="card-body" style="padding:16px 18px">
        <div style="font-size:14px;font-weight:700;color:#166534;margin-bottom:6px">🎉 ようこそ！まず最初の一言を書いてみましょう</div>
        <div style="font-size:12px;color:#15803d;margin-bottom:12px;line-height:1.6">体調・症状・服薬・気分、なんでも OK。一言でも書くと AI が毎日の新しい処方を提案します。</div>
        <div style="font-size:11px;font-weight:600;color:#64748b;margin-bottom:6px">例えばこんな感じで書きます：</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          ${examplePrompts.map(p => `
            <button onclick="var t=document.getElementById('dash-quick-input');if(t){t.value=${JSON.stringify(p)};t.focus();}"
              style="text-align:left;padding:8px 12px;background:#fff;border:1px solid #d1fae5;border-radius:10px;font-size:12px;color:#374151;cursor:pointer;line-height:1.5">
              ${Components.escapeHtml(p)}
            </button>`).join('')}
        </div>
        <div style="margin-top:10px;font-size:11px;color:#16a34a">
          ↑ タップして編集して「送信」、または上の入力欄に直接書いて送信してください
        </div>
      </div>
    </div>` : '';

  // Today's rotating prescription axis — shown on the dashboard as a
  // curiosity-driving widget. Repeat visitors see "today's focus"
  // changing daily which reinforces the habit of returning.
  const todayAxis = (typeof aiEngine !== 'undefined' && aiEngine._getTodayPrescriptionAxis)
    ? aiEngine._getTodayPrescriptionAxis()
    : null;

  return `
  <!-- 1. Quick Input Area (always top) -->
  <div class="card" style="margin-bottom:16px;border-color:var(--accent-border)">
    <div class="card-body" style="padding:14px 18px">
      <div style="display:flex;gap:12px;align-items:start">
        <div style="flex:1">
          <textarea class="form-textarea" id="dash-quick-input" rows="5"
            style="border:none;background:transparent;resize:vertical;font-size:14px;padding:0;min-height:96px;line-height:1.6"
            placeholder="体調・食事・薬・検査結果など何でも記録（📎で写真も添付可）"></textarea>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <button class="btn btn-primary btn-sm" onclick="app.dashQuickSubmit()" ${store.get('isAnalyzing') ? 'disabled' : ''}>送信</button>
          <label class="btn btn-secondary btn-sm" style="cursor:pointer;text-align:center">
            📎
            <input type="file" hidden multiple accept="image/*,.pdf,.csv,.json,.xml,.txt" onchange="app.dashQuickFile(event)">
          </label>
        </div>
      </div>
      <div id="dash-quick-preview" style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"></div>
    </div>
  </div>

  <!-- Deep-analysis trigger sits directly below the input so the button is
       reachable without scrolling past the feedback card. Always rendered
       when a textEntry exists; after today's run it stays visible but
       grayed out so the user knows "also tomorrow" rather than wondering
       where the button went. The daily-limit check uses a JST calendar
       date (new Date().toLocaleDateString('ja-JP',{timeZone:'Asia/Tokyo'}))
       so the reset happens at local midnight everywhere. -->
  ${(() => {
    const hasEntry = (store.get('textEntries') || []).length > 0;
    if (!hasEntry) return '';
    if (store.get('isAnalyzing')) return '';
    const deepRunning = !!store.get('isDeepAnalyzing');
    if (deepRunning) {
      return `
        <div style="margin:-4px 0 16px;text-align:center;font-size:12px;color:var(--text-muted)">
          ${Components.loading('構造化分析中...（最大 60 秒）')}
        </div>`;
    }
    const todayJst = new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });
    const lastRun = store.get('deepAnalysisLastRun');
    const usedToday = lastRun === todayJst;
    const archiveHref = `<a onclick="app.navigate('data-input');setTimeout(function(){var el=document.getElementById('deep-analyses-archive');if(el)el.scrollIntoView({behavior:'smooth'});},120);return false;" href="#" style="display:inline-block;margin-left:12px;font-size:11px;color:var(--accent);cursor:pointer">過去の本格分析を見る →</a>`;
    if (usedToday) {
      return `
        <div style="margin:-4px 0 16px;text-align:center">
          <button class="btn btn-secondary btn-sm" onclick="Components.showToast('本格的な分析は明日から再度ご利用いただけます','info')"
            style="padding:8px 18px;font-size:12px;font-weight:600;opacity:0.5;cursor:not-allowed" aria-disabled="true">
            🔍 本日の本格分析は完了しています
          </button>
          ${archiveHref}
        </div>`;
    }
    return `
      <div style="margin:-4px 0 16px;text-align:center">
        <button class="btn btn-secondary btn-sm" onclick="app.runDeepAnalysis()"
          style="padding:8px 18px;font-size:12px;font-weight:600">
          🔍 本格的な分析をする（構造化レポート・最大60秒）
        </button>
        ${archiveHref}
      </div>`;
  })()}

  <!-- AI Instant Feedback — moved up from later in the dashboard so the
       analysis result appears directly under the input + deep-analysis
       button. Priority order: in-flight spinner > explicit error > latest
       result. isAnalyzing must take precedence so the scheduleDashRefresh
       listener attached to textEntries doesn't wipe the loading state
       200 ms after dashQuickSubmit injects it. -->
  <div id="dash-ai-feedback" style="margin-bottom:16px">
    ${(() => {
      if (store.get('isAnalyzing')) {
        const startTs = store.get('analyzeStartedAt') || Date.now();
        const elapsed = Math.floor((Date.now() - startTs) / 1000);
        let msg = '入力内容を認識中...';
        if (elapsed > 40) msg = '少し時間がかかっています。処理中です (最大 60 秒でタイムアウト)';
        else if (elapsed > 20) msg = 'AI が分析中です。もう少しお待ちください';
        else if (elapsed > 8) msg = '処方を組み立てています...';
        return Components.loading(msg);
      }
      const err = store.get('latestFeedbackError');
      if (err) {
        return `
          <div class="card" style="border-left:4px solid var(--danger);margin-bottom:12px">
            <div class="card-body" style="padding:12px 16px">
              <div style="font-size:13px;font-weight:600;color:var(--danger);margin-bottom:6px">分析中にエラーが発生しました</div>
              <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap;word-break:break-word">${Components.escapeHtml(err)}</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:6px">記録は保存済みです。もう一度送信するとリトライできます。</div>
            </div>
          </div>`;
      }
      const fb = store.get('latestFeedback');
      if (!fb) return '';
      try { return app.renderAnalysisCard(fb); } catch(e) { return ''; }
    })()}
  </div>

  <!-- Streak + Badges + Today's Axis widget -->
  ${streakStats.totalDays > 0 || todayAxis ? `
  <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,#eef2ff 0%,#fdf4ff 100%);border:1px solid #c7d2fe">
    <div class="card-body" style="padding:14px 18px">
      <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
        ${streakStats.streak > 0 ? `
        <div style="flex:0 0 auto;text-align:center;padding:4px 12px;background:#fff;border-radius:10px;min-width:80px">
          <div style="font-size:10px;color:#6366f1;font-weight:700;margin-bottom:2px">🔥 連続記録</div>
          <div style="font-size:24px;font-weight:800;color:#4338ca;line-height:1">${streakStats.streak}</div>
          <div style="font-size:10px;color:#6366f1">日</div>
        </div>` : ''}
        ${streakStats.totalDays > 0 ? `
        <div style="flex:0 0 auto;text-align:center;padding:4px 12px;background:#fff;border-radius:10px;min-width:80px">
          <div style="font-size:10px;color:#6366f1;font-weight:700;margin-bottom:2px">📚 通算</div>
          <div style="font-size:24px;font-weight:800;color:#4338ca;line-height:1">${streakStats.totalDays}</div>
          <div style="font-size:10px;color:#6366f1">日分</div>
        </div>` : ''}
        <div style="flex:1;min-width:180px">
          ${todayAxis ? `
          <div style="font-size:10px;color:#6366f1;font-weight:700;margin-bottom:3px">📅 今日の新処方の指定軸</div>
          <div style="font-size:14px;font-weight:700;color:#3730a3;line-height:1.4">${todayAxis.icon} ${todayAxis.name}</div>
          <div style="font-size:10px;color:#4338ca;line-height:1.5;margin-top:3px">${Components.escapeHtml((todayAxis.desc || '').substring(0, 80))}${(todayAxis.desc || '').length > 80 ? '…' : ''}</div>
          ` : `<div style="font-size:12px;color:#4338ca">記録を続けて、毎日の処方を受け取りましょう</div>`}
        </div>
      </div>
      ${earnedBadges.length > 0 ? `
      <div style="margin-top:10px;padding-top:10px;border-top:1px solid #c7d2fe;display:flex;gap:6px;flex-wrap:wrap">
        ${earnedBadges.map(b => `
          <span title="${Components.escapeHtml(b.desc)}"
            style="display:inline-flex;align-items:center;gap:3px;padding:3px 9px;background:#fff;border:1px solid #c7d2fe;border-radius:14px;font-size:10px;color:#4338ca">
            <span style="font-size:12px">${b.icon}</span>${Components.escapeHtml(b.name)}
          </span>
        `).join('')}
      </div>` : ''}
    </div>
  </div>` : ''}

  <!-- Daily tracking hint (disease-specific, minimal) -->
  ${(() => {
    const diseases = store.get('selectedDiseases') || [];
    const hints = {
      mecfs: ['体調(1-10)', '睡眠時間', 'PEMの有無'],
      depression: ['気分(1-10)', '睡眠', '外出したか'],
      fibromyalgia: ['痛み(1-10)', '睡眠', 'こわばり'],
      long_covid: ['疲労(1-10)', '呼吸', '活動量'],
      pots: ['水分量', '立ちくらみ', '心拍数'],
      diabetes_t2: ['食事内容', '運動', '体重'],
      hashimoto: ['体調', '体重', '冷え'],
      ibs: ['お腹の調子', '食事内容', 'ストレス'],
      insomnia: ['就寝/起床時刻', '睡眠の質', '日中の眠気'],
      bipolar: ['気分(1-10)', '睡眠時間', '活動量'],
      ptsd: ['気分', '睡眠', 'フラッシュバック'],
      adhd: ['集中力', '睡眠', 'タスク達成'],
    };
    const items = new Set();
    diseases.forEach(d => (hints[d] || []).forEach(h => items.add(h)));
    if (items.size === 0) ['体調(1-10)', '睡眠', '食事'].forEach(h => items.add(h));
    const uniqueItems = [...items].slice(0, 4);
    return `<div style="padding:0 4px 8px;font-size:11px;color:var(--text-muted)">
      今日の記録: ${uniqueItems.map(h => `<span style="display:inline-block;padding:2px 8px;background:var(--bg-tertiary);border-radius:10px;margin:2px;cursor:pointer" onclick="document.getElementById('dash-quick-input').value+=' ${h}：';document.getElementById('dash-quick-input').focus()">${h}</span>`).join('')}
    </div>`;
  })()}

  <!-- 💰 Subsidy / Financial Support matched to the user's diseases.
       Top 3 programs shown as compact cards with 申請する buttons that
       open the existing openFinancialSupportForm modal. Full list lives
       on the actions page (「すべて見る」). Hidden entirely when no
       selectedDiseases are set so guests aren't overwhelmed. -->
  ${(() => {
    const matched = (app.matchFinancialSupport && app.matchFinancialSupport()) || [];
    if (!matched.length) return '';
    const top = matched.slice(0, 3);
    return `
    <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,#fefce8 0%,#fef3c7 100%);border:1px solid #fde68a">
      <div class="card-body" style="padding:14px 18px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <h3 style="font-size:14px;font-weight:700;color:#78350f">💰 あなたが使える補助金・支援制度</h3>
          <a onclick="app.navigate('actions')" style="font-size:11px;color:#b45309;cursor:pointer;font-weight:600">すべて見る →</a>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${top.map(p => `
            <div style="padding:10px 12px;background:#fff;border-radius:10px;border:1px solid #fef3c7">
              <div style="display:flex;justify-content:space-between;align-items:start;gap:8px">
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:700;color:#1f2937;margin-bottom:2px">${p.icon || '📄'} ${Components.escapeHtml(p.name)}</div>
                  <div style="font-size:11px;color:#78350f;margin-bottom:3px">${Components.escapeHtml(p.amount || '')}</div>
                  <div style="font-size:10px;color:var(--text-muted);line-height:1.5">${Components.escapeHtml((p.description || '').substring(0, 80))}${(p.description || '').length > 80 ? '…' : ''}</div>
                </div>
                <button class="btn btn-primary btn-sm" onclick="app.openFinancialSupportForm('${p.id}')" style="flex:0 0 auto;padding:6px 12px;font-size:11px;background:#f59e0b;border-color:#d97706">申請する</button>
              </div>
            </div>`).join('')}
        </div>
        <div style="margin-top:8px;font-size:10px;color:#92400e">※ 該当疾患に基づいて自動マッチング。選択疾患を追加すると候補が増えます。</div>
      </div>
    </div>`;
  })()}

  <!-- 🏥 Doctor submission report — single-click generator. Aggregates
       up to 90 days of textEntries, symptoms, meds, labs, sleep and
       activity into a structured Markdown report the user can copy,
       download (.md), or print before their next appointment. Streams
       through the same SSE pipeline as deep analysis so generation
       surface the output live. Hidden until 1+ textEntry exists so
       an empty account can't spin up a pointless AI call. -->
  ${(() => {
    if ((store.get('textEntries') || []).length === 0) return '';
    return `
    <div class="card" style="margin-bottom:16px;background:linear-gradient(135deg,#ecfeff 0%,#cffafe 100%);border:1px solid #a5f3fc">
      <div class="card-body" style="padding:14px 18px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <div style="flex:1;min-width:180px">
            <div style="font-size:14px;font-weight:700;color:#155e75;margin-bottom:2px">🏥 医師提出用レポートを作成</div>
            <div style="font-size:11px;color:#0e7490;line-height:1.6">過去 90 日の記録を AI が統合し、受診時に持参できる形式でまとめます。</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="app.generateDoctorReport()"
            style="padding:10px 18px;font-size:12px;font-weight:700;background:#0891b2;border-color:#0e7490;flex:0 0 auto">
            レポート作成
          </button>
        </div>
      </div>
    </div>`;
  })()}

  <!-- 🔬 Latest Research widget — moved from the dashboard's deep-scroll
       region so users see relevant new papers without scrolling past
       integrations / charts / timeline first. Content is lazily loaded
       by app.loadDashResearch() scheduled after navigate('dashboard'). -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-body" style="padding:14px 18px">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer"
        onclick="var c=document.getElementById('dash-research');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
        <h3 style="font-size:14px;font-weight:700;color:#1e3a8a">🔬 あなたの疾患に関する最新研究</h3>
        <span class="arrow" style="font-size:14px;color:var(--text-muted)">▾</span>
      </div>
      <div id="dash-research" style="display:block;margin-top:8px"></div>
    </div>
  </div>

  <!-- AI Instant Feedback moved up right under the input + deep-analysis
       button (see block earlier in this template). -->

  <!-- 3. Welcome for new users OR Enriched Data Feed -->
  ${welcomeHtml}

  <!-- Integration sync status — shows last received data per source -->
  ${(() => {
    const syncs = store.get('integrationSyncs') || {};
    const sourceMeta = {
      plaud: { icon: '🎙️', label: 'Plaud' },
      apple_health: { icon: '🍎', label: 'Apple Health' },
      fitbit: { icon: '⌚', label: 'Fitbit' },
      csv_import: { icon: '📊', label: 'CSV取込' },
      json_import: { icon: '📦', label: 'JSON取込' },
    };
    const items = Object.entries(syncs)
      .filter(([k]) => sourceMeta[k])
      .sort((a, b) => new Date(b[1]) - new Date(a[1]))
      .slice(0, 4);
    if (items.length === 0) return '';
    const formatRel = (ts) => {
      const diff = Date.now() - new Date(ts).getTime();
      if (diff < 60000) return 'たった今';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}時間前`;
      return `${Math.floor(diff / 86400000)}日前`;
    };
    return `
    <div style="margin-bottom:16px;padding:10px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);font-size:11px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <strong style="color:var(--text-muted)">📡 連携データ</strong>
        <a onclick="app.navigate('integrations')" style="color:var(--accent);text-decoration:none;cursor:pointer">設定 →</a>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px">
        ${items.map(([k, ts]) => `
          <span style="display:inline-flex;align-items:center;gap:4px;padding:3px 8px;background:var(--bg-primary);border-radius:10px">
            <span>${sourceMeta[k].icon}</span>
            <span>${sourceMeta[k].label}</span>
            <span style="color:var(--text-muted)">${formatRel(ts)}</span>
          </span>
        `).join('')}
      </div>
    </div>`;
  })()}

  ${enrichedEntries.length > 0 ? `
  <div style="margin-bottom:20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <h3 style="font-size:15px;font-weight:600">あなたの記録</h3>
      <button class="btn btn-outline btn-sm" onclick="app.navigate('timeline')">すべて見る（${totalEntries}件）</button>
    </div>
    ${enrichedEntries.map((e, i) => {
      // Escape user-supplied text BEFORE inserting into innerHTML —
      // otherwise malicious HTML/JS in a record could execute on render.
      const rawContent = e.content || '';
      const content = Components.escapeHtml(rawContent);
      const isLong = rawContent.length > 100;
      const preview = Components.escapeHtml(rawContent.substring(0, 100).replace(/\n/g, ' '));
      const safeTitle = Components.escapeHtml(e.title || new Date(e.timestamp).toLocaleDateString('ja-JP'));
      const previewImage = e.previewImage || '';
      const eid = 'rec-' + (e.id || i);
      // Source badge — show where the data came from for imported entries
      const sourceLabels = {
        plaud: { icon: '🎙️', label: 'Plaud', color: '#8b5cf6' },
        apple_health: { icon: '🍎', label: 'Apple Health', color: '#ef4444' },
        fitbit: { icon: '⌚', label: 'Fitbit', color: '#22c55e' },
        csv_import: { icon: '📊', label: 'CSV', color: '#3b82f6' },
        json_import: { icon: '📦', label: 'JSON', color: '#f59e0b' },
        file_import: { icon: '📎', label: 'ファイル', color: '#64748b' },
      };
      const src = sourceLabels[e.source];
      const sourceBadge = src
        ? `<span class="tag" style="font-size:9px;background:${src.color}22;color:${src.color};padding:1px 6px">${src.icon} ${src.label}</span>`
        : '';
      // Border color: highlight integration imports so they pop on the feed
      const borderColor = src ? src.color : 'var(--accent)';
      return `
      <div class="card" style="margin-bottom:8px;border-left:3px solid ${borderColor}">
        <div style="padding:10px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center"
          onclick="var b=document.getElementById('${eid}');b.style.display=b.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=b.style.display==='none'?'▸':'▾'">
          <div style="flex:1;min-width:0;display:flex;gap:10px;align-items:center">
            ${previewImage ? `<img class="record-thumbnail" style="width:40px;height:40px" src="${previewImage}" alt="${safeTitle}" onclick="event.stopPropagation();app.openImagePreview(this.src, this.alt)">` : ''}
            <div style="min-width:0;flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;flex-wrap:wrap">
              <span style="font-size:12px;font-weight:600">${safeTitle}</span>
              ${sourceBadge}
              <span style="font-size:10px;color:var(--text-muted)">${new Date(e.timestamp).toLocaleDateString('ja-JP', {month:'short',day:'numeric',weekday:'short'})}</span>
            </div>
            <div style="font-size:11px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${preview}${isLong ? '...' : ''}</div>
            </div>
          </div>
          <span class="arrow" style="font-size:12px;color:var(--text-muted);margin-left:8px;flex-shrink:0">▸</span>
        </div>
        <div id="${eid}" style="display:none;padding:0 16px 12px">
          ${previewImage ? `<div style="margin-bottom:8px"><img class="record-thumbnail" src="${previewImage}" alt="${safeTitle}" onclick="app.openImagePreview(this.src, this.alt)"></div>` : ''}
          <div style="font-size:13px;color:var(--text-primary);line-height:1.7;white-space:pre-wrap">${content}</div>
          ${(() => {
            const comment = app.getAIComment(e.id);
            if (!comment) return e._insight ? `<div style="padding:6px 10px;background:var(--accent-bg);border-radius:var(--radius-sm);font-size:11px;color:var(--accent);margin-top:8px"><strong>分析:</strong> ${e._insight}</div>` : '';
            const r = comment.result || {};

            // Detect legacy-demo-shaped results and reject them. The old
            // generateDemoAnalysis() returned objects with a `healthScore`
            // + `trends.fatigue.direction` shape that the current prompt
            // schema does not produce. If we see that shape — or we see
            // a raw JSON-looking string in any text field — treat the
            // comment as corrupt and show a friendly placeholder instead
            // of dumping the object to the user.
            const looksLikeLegacyDemo = (obj) => {
              if (!obj || typeof obj !== 'object') return false;
              if (typeof obj.healthScore === 'number' && obj.trends && obj.trends.fatigue && obj.trends.fatigue.direction) return true;
              if (Array.isArray(obj.actionItems) && Array.isArray(obj.researchUpdates)) return true;
              return false;
            };
            const looksLikeRawJsonString = (s) => {
              if (typeof s !== 'string') return false;
              const t = s.trimStart();
              if (!t.startsWith('{') && !t.startsWith('[')) return false;
              if (/"healthScore"\s*:|"trends"\s*:\s*\{|入力データ\s*\d+\s*件を分析/.test(t)) return true;
              if (/^\{\s*"[a-zA-Z_]+"\s*:/.test(t) && (t.match(/"[a-zA-Z_]+"\s*:/g) || []).length >= 3) return true;
              return false;
            };

            if (looksLikeLegacyDemo(r)) {
              return `<div style="margin-top:8px;padding:10px 12px;background:var(--warning-bg);border-radius:var(--radius-sm);border-left:3px solid var(--warning);font-size:11px;color:var(--text-muted)">古い分析データが残っています。この記録を再送信すると新しい分析が保存されます。</div>`;
            }

            const pickString = (v) => {
              if (typeof v !== 'string' || !v.trim()) return '';
              if (looksLikeRawJsonString(v)) return '';
              return v;
            };
            let text = pickString(r.summary) || pickString(r.findings) || pickString(r._raw);
            if (!text) text = '分析結果を取得できませんでした。再度記録を送信してください。';
            const display = text.substring(0, 500);
            const actions = Array.isArray(r.actions) ? r.actions.filter(a => typeof a === 'string').slice(0, 3) : [];
            return `<div style="margin-top:8px;padding:10px 12px;background:var(--accent-bg);border-radius:var(--radius-sm);border-left:3px solid var(--accent)">
              <div style="font-size:10px;font-weight:600;color:var(--accent);margin-bottom:4px">分析結果（${new Date(comment.timestamp).toLocaleString('ja-JP')}）</div>
              <div style="font-size:11px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">${Components.formatMarkdown(display)}</div>
              ${actions.length ? '<div style="margin-top:6px;font-size:11px">' + actions.map(a => '<div style="color:var(--accent)">→ ' + Components.escapeHtml(a) + '</div>').join('') + '</div>' : ''}
            </div>`;
          })()}
        </div>
      </div>`;
    }).join('')}
  </div>` : ''}

  <!-- 4. Calendar Widget -->
  ${CalendarIntegration.renderWidget()}

  <!-- 4b. Plaud 禅トラック analysis widget (if any analyses exist) -->
  ${app.renderPlaudWidget()}

  <!-- 5. Recommendations (collapsible) -->
  ${allRecs.length > 0 ? `
  <div style="margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0"
      onclick="var c=document.getElementById('dash-recs');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
      <h3 style="font-size:15px;font-weight:600">あなたへの推奨（${allRecs.length}件）</h3>
      <span class="arrow" style="font-size:14px;color:var(--text-muted)">▾</span>
    </div>
    <div id="dash-recs">
      ${allRecs.slice(0, 3).map(r => Components.recommendationCard(r)).join('')}
      ${allRecs.length > 3 ? `<button class="btn btn-outline btn-sm" onclick="app.navigate('actions')">すべて見る →</button>` : ''}
    </div>
  </div>` : ''}

  <!-- 5. Dynamic Recommendations (based on user data) -->
  <div style="margin-bottom:20px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:10px">あなたへのおすすめ</h3>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px" class="grid-recs">
      ${app.generateDynamicRecommendations().map(item => `
        <a href="${item.url}" target="_blank" rel="noopener"
          onclick="affiliateEngine.trackClick('${item.id}','${item.store === 'iherb' ? 'iherb' : 'amazon_jp'}','supplement')"
          class="card" style="text-decoration:none;color:inherit">
          <div class="card-body" style="padding:10px;text-align:center">
            <div style="font-size:18px;margin-bottom:2px">${item.icon}</div>
            <div style="font-size:11px;font-weight:600;line-height:1.3">${item.name}</div>
            <div style="font-size:9px;color:var(--text-muted)">${item.desc}</div>
            <div style="font-size:9px;color:var(--accent);margin-top:2px">${item.store === 'iherb' ? 'iHerb' : 'Amazon'} →</div>
          </div>
        </a>
      `).join('')}
      <div class="card" style="cursor:pointer" onclick="app.navigate('actions')">
        <div class="card-body" style="padding:10px;text-align:center">
          <div style="font-size:18px;margin-bottom:2px">→</div>
          <div style="font-size:12px;font-weight:600">もっと見る</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 6. Clinics / Workshops / Events (auto-loaded) -->
  <div style="margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0"
      onclick="var c=document.getElementById('dash-actions-live');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
      <h3 style="font-size:15px;font-weight:600">クリニック・イベント・セルフケア</h3>
      <span class="arrow" style="font-size:14px;color:var(--text-muted)">▾</span>
    </div>
    <div id="dash-actions-live" style="display:block"></div>
  </div>

  <!-- 7. Latest Research — widget was moved higher up (right below the
       subsidy card), so the deep-scroll placeholder has been removed. -->

  <!-- 8. Nutrition / BMR / PFC (collapsible) -->
  ${(() => {
    const log = store.get('nutritionLog') || [];
    const hasLog = log.length > 0;
    const bmr = store.calculateBMR();
    const bmrText = bmr != null ? bmr + ' kcal' : '--';
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = log.find(e => e.date === today);
    const todayCal = todayEntry ? Math.round(todayEntry.calories || 0) : null;
    const todayDiffText = (todayCal != null && bmr != null)
      ? (todayCal - bmr > 0 ? '+' : '') + (todayCal - bmr) + ' kcal'
      : '--';
    const recent7Log = log.slice(-7);
    const avg7 = recent7Log.length
      ? Math.round(recent7Log.reduce((s, e) => s + (e.calories || 0), 0) / recent7Log.length)
      : null;
    const initiallyOpen = hasLog ? 'block' : 'none';
    const initialArrow = hasLog ? '▾' : '▸';
    return `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0"
        onclick="var c=document.getElementById('dash-nutrition');var open=c.style.display==='none';c.style.display=open?'block':'none';this.querySelector('.arrow').textContent=open?'▾':'▸';if(open)setTimeout(()=>app.initNutritionCharts(),30)">
        <h3 style="font-size:15px;font-weight:600">栄養 / PFCバランス</h3>
        <span class="arrow" style="font-size:14px;color:var(--text-muted)">${initialArrow}</span>
      </div>
      <div id="dash-nutrition" style="display:${initiallyOpen}">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px" class="grid-nutrition">
          <div class="card"><div class="card-body" style="padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">基礎代謝 BMR</div>
            <div style="font-size:16px;font-weight:700">${bmrText}</div>
            ${bmr == null ? '<div style="font-size:9px;color:var(--text-muted);margin-top:2px">設定→身長/体重/年齢を入力</div>' : ''}
          </div></div>
          <div class="card"><div class="card-body" style="padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">今日の摂取</div>
            <div style="font-size:16px;font-weight:700">${todayCal != null ? todayCal + ' kcal' : '--'}</div>
            <div style="font-size:9px;color:var(--text-muted);margin-top:2px">BMR差 ${todayDiffText}</div>
          </div></div>
          <div class="card"><div class="card-body" style="padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">7日平均</div>
            <div style="font-size:16px;font-weight:700">${avg7 != null ? avg7 + ' kcal' : '--'}</div>
          </div></div>
          <div class="card"><div class="card-body" style="padding:10px;text-align:center">
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:2px">記録日数</div>
            <div style="font-size:16px;font-weight:700">${log.length}</div>
          </div></div>
        </div>
        <div class="card" style="margin-bottom:8px">
          <div class="card-header" style="padding:8px 14px;display:flex;justify-content:space-between;align-items:center">
            <span class="card-title" style="font-size:13px">摂取カロリー vs 基礎代謝</span>
            <div style="display:flex;gap:6px">
              <button class="btn btn-primary btn-sm" style="font-size:11px;padding:4px 10px" onclick="app.extractTodayNutrition()">今日の記録から集計</button>
              ${hasLog ? `<button class="btn btn-outline btn-sm" style="font-size:11px;padding:4px 10px" onclick="app.clearNutritionLog()">クリア</button>` : ''}
            </div>
          </div>
          <div class="card-body" style="height:200px;padding:10px 14px"><canvas id="nutrition-calorie-chart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header" style="padding:8px 14px"><span class="card-title" style="font-size:13px">PFCバランス（g）</span></div>
          <div class="card-body" style="height:200px;padding:10px 14px"><canvas id="nutrition-pfc-chart"></canvas></div>
        </div>
        ${!hasLog ? `<div style="font-size:11px;color:var(--text-muted);padding:10px 2px;text-align:center">「今日の記録から集計」を押すと、今日書いた食事記録から摂取カロリー・PFCを自動計算します。</div>` : ''}
      </div>
    </div>`;
  })()}

  <!-- 7. Stats + Chart (collapsible) -->
  ${hasData ? `
  <div style="margin-bottom:16px">
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0"
      onclick="var c=document.getElementById('dash-stats');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:24px;font-weight:800;color:${score >= 60 ? 'var(--success)' : score >= 35 ? 'var(--warning)' : 'var(--danger)'}">${score}</span>
        <span style="font-size:13px;color:var(--text-secondary)">体調スコア・${totalEntries + totalSymptoms}件記録済</span>
      </div>
      <span class="arrow" style="font-size:14px;color:var(--text-muted)">▸</span>
    </div>
    <div id="dash-stats" style="display:none">
      <div class="card" style="margin-bottom:8px">
        <div class="card-body" style="padding:12px 16px;font-size:13px;color:var(--text-secondary);line-height:1.7">
          ${score >= 60 ? '比較的安定した状態です。この調子を維持しましょう。' :
            score >= 35 ? '少し注意が必要な状態です。無理せず休息を取ってください。' :
            '体調が優れない状態です。安静を優先し、必要であれば医療機関に相談してください。'}
        </div>
      </div>
      ${symptoms.length > 0 ? `
      <div class="card" style="margin-bottom:8px">
        <div class="card-header" style="padding:8px 14px"><span class="card-title" style="font-size:13px">トレンド</span></div>
        <div class="card-body" style="height:200px"><canvas id="symptom-chart"></canvas></div>
      </div>` : ''}
    </div>
  </div>
  ` : ''}

  <!-- 7. Full Timeline (collapsible) -->
  ${totalEntries > 0 ? (() => {
    const allTL = (store.get('textEntries') || []).slice().reverse();
    const byDate = {};
    allTL.forEach(e => {
      const dk = e.timestamp ? new Date(e.timestamp).toLocaleDateString('ja-JP', {year:'numeric',month:'short',day:'numeric',weekday:'short'}) : '不明';
      if (!byDate[dk]) byDate[dk] = [];
      byDate[dk].push(e);
    });
    const dateKeys = Object.keys(byDate);
    return `
    <div style="margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:10px 0"
        onclick="var c=document.getElementById('dash-timeline');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
        <h3 style="font-size:15px;font-weight:600">全記録（${allTL.length}件）</h3>
        <span class="arrow" style="font-size:14px;color:var(--text-muted)">▸</span>
      </div>
      <div id="dash-timeline" style="display:none">
        ${dateKeys.slice(0, 30).map(dk => `
          <div style="margin-bottom:12px">
            <div style="font-size:12px;font-weight:600;color:var(--accent);margin-bottom:6px">${dk}（${byDate[dk].length}件）</div>
            ${byDate[dk].map(e => {
              const rawContent = e.content || '';
              const content = Components.escapeHtml(rawContent);
              const preview = Components.escapeHtml(rawContent.substring(0, 80).replace(/\n/g, ' '));
              const eid = 'tl-' + (e.id || Math.random().toString(36).substr(2));
              return `
              <div style="margin-bottom:4px;border-left:2px solid var(--border);padding-left:10px">
                <div style="cursor:pointer;display:flex;align-items:center;gap:6px"
                  onclick="var b=document.getElementById('${eid}');b.style.display=b.style.display==='none'?'block':'none'">
                  <span style="font-size:10px;color:var(--text-muted)">${e.timestamp ? new Date(e.timestamp).toLocaleTimeString('ja-JP',{hour:'2-digit',minute:'2-digit'}) : ''}</span>
                  <span style="font-size:11px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${preview}${rawContent.length > 80 ? '...' : ''}</span>
                </div>
                <div id="${eid}" style="display:none;padding:6px 0;font-size:12px;color:var(--text-primary);line-height:1.7;white-space:pre-wrap">${content}</div>
              </div>`;
            }).join('')}
          </div>
        `).join('')}
        ${dateKeys.length > 30 ? '<div style="font-size:12px;color:var(--text-muted);text-align:center;padding:8px">さらに古い記録は「記録する」ページで確認できます</div>' : ''}
      </div>
    </div>`;
  })() : ''}

  <div style="display:flex;flex-wrap:wrap;gap:4px">${diseaseTagsHtml}</div>`;
  } catch(err) {
    console.error('Dashboard render error:', err);
    return `<div style="padding:20px"><p>読み込みエラーが発生しました。</p><p style="font-size:12px;color:var(--text-muted)">${err.message}</p><button class="btn btn-primary" onclick="store.clearAll();location.reload()">データをリセットして再読み込み</button></div>`;
  }
};

// Data Input Page
App.prototype.render_data_input = function() {
  const cards = CONFIG.DATA_CATEGORIES.map(c => {
    const key = store.categoryToStateKey(c.id);
    const data = key ? (store.get(key) || []) : [];
    const count = Array.isArray(data) ? data.length : 0;
    return `
    <div class="action-card" onclick="app.openDataInput('${c.id}')">
      <div class="action-card-icon" style="background:var(--accent-bg)">${c.icon}</div>
      <div class="action-card-title">${c.name}</div>
      <div class="action-card-desc">${c.fields.length}項目</div>
      ${count > 0 ? `<span class="tag tag-accent" style="margin-top:8px">${count}件記録済</span>` : ''}
    </div>`;
  }).join('');

  const textEntriesRaw = store.get('textEntries') || [];
  // Dedup by id — same fix as the dashboard path to prevent Firebase sync
  // replays from rendering the same entry multiple times.
  const textSeen = new Set();
  const textEntries = textEntriesRaw.filter(e => {
    const id = e && e.id;
    if (!id) return true;
    if (textSeen.has(id)) return false;
    textSeen.add(id);
    return true;
  });
  // Show ALL entries in the records tab (newest first). Container scrolls
  // when the list grows. Dashboard still caps at 10 for the home glance.
  const recentTexts = textEntries.slice().reverse();
  const categoryLabels = {
    symptoms: '症状', nutrition: '食事・栄養', medication: '服薬・処方',
    mental: '精神状態', activity: '活動', sleep: '睡眠',
    blood_test: '検査結果', doctor: '医師の所見', research: '調査メモ', other: 'その他'
  };

  const recentHtml = recentTexts.length > 0 ? `
    <div style="border-top:1px solid var(--border);padding-top:16px;margin-top:16px">
      <h4 style="font-size:13px;font-weight:600;color:var(--text-secondary);margin-bottom:10px">最近の記録（${textEntries.length}件）</h4>
      <div style="max-height:60vh;overflow-y:auto;padding-right:4px">
      ${recentTexts.map(e => {
        const rawContent = e.content || '';
        const safeContent = Components.escapeHtml(rawContent.length > 300 ? rawContent.substring(0, 300) + '...' : rawContent);
        const safeTitle = e.title ? Components.escapeHtml(e.title) : '';
        const safeCategory = Components.escapeHtml(categoryLabels[e.category] || e.category || '');
        return `
        <div style="padding:10px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:8px;border-left:3px solid var(--accent)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span class="tag tag-accent" style="font-size:10px">${safeCategory}</span>
            <span style="font-size:10px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${new Date(e.timestamp).toLocaleString('ja-JP')}</span>
          </div>
          ${safeTitle ? `<div style="font-size:13px;font-weight:600;margin-bottom:2px">${safeTitle}</div>` : ''}
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;white-space:pre-wrap">${safeContent}</div>
        </div>
      `;
      }).join('')}
      </div>
    </div>` : '';

  // Integration reception history — shows every entry that came in
  // via Plaud / Apple Health / Fitbit / CSV / JSON file imports so the
  // user can confirm their connected data is actually arriving. Each
  // row shows the exact received timestamp and the content that was
  // saved, grouped by source.
  const INTEGRATION_SOURCES = {
    plaud:        { icon: '🎙️', label: 'Plaud',        color: '#8b5cf6' },
    apple_health: { icon: '🍎', label: 'Apple Health', color: '#ef4444' },
    fitbit:       { icon: '⌚', label: 'Fitbit',       color: '#22c55e' },
    csv_import:   { icon: '📊', label: 'CSV取込',      color: '#3b82f6' },
    json_import:  { icon: '📦', label: 'JSON取込',     color: '#f59e0b' },
    file_import:  { icon: '📎', label: 'ファイル取込', color: '#64748b' },
  };
  const integrationEntries = textEntries
    .filter(e => e.source && INTEGRATION_SOURCES[e.source])
    .slice()
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const formatReceivedAt = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    const relative = diffMin < 1 ? 'たった今'
      : diffMin < 60 ? `${diffMin}分前`
      : diffHr < 24 ? `${diffHr}時間前`
      : diffDay < 7 ? `${diffDay}日前`
      : d.toLocaleDateString('ja-JP');
    const absolute = d.toLocaleString('ja-JP', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    return { relative, absolute };
  };

  // Group integration entries by source for a per-source status summary.
  const bySource = {};
  integrationEntries.forEach(e => {
    if (!bySource[e.source]) bySource[e.source] = [];
    bySource[e.source].push(e);
  });

  const integrationHistoryHtml = `
  <div class="card" style="margin-bottom:20px;border:1px solid var(--border)">
    <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
      <span class="card-title">📡 連携データの受信履歴</span>
      <button class="btn btn-outline btn-sm" onclick="app.navigate('integrations')" style="font-size:11px">連携設定 →</button>
    </div>
    <div class="card-body" style="padding:12px 16px">
      ${integrationEntries.length === 0 ? `
        <div style="text-align:center;padding:20px 10px;color:var(--text-muted);font-size:12px;line-height:1.7">
          連携データはまだ届いていません。<br>
          「連携設定」から Plaud / Apple Health / Fitbit 等を設定すると、<br>
          ここに受信したデータの日時と内容が表示されます。
        </div>
      ` : `
        <!-- Per-source summary -->
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;padding-bottom:12px;border-bottom:1px solid var(--border)">
          ${Object.entries(bySource).map(([k, items]) => {
            const meta = INTEGRATION_SOURCES[k];
            const latest = items[0];
            const { relative } = formatReceivedAt(latest.timestamp);
            return `
              <div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;background:${meta.color}15;border:1px solid ${meta.color}44;border-radius:12px;font-size:11px">
                <span>${meta.icon}</span>
                <span style="font-weight:600;color:${meta.color}">${meta.label}</span>
                <span style="color:var(--text-muted)">${items.length}件</span>
                <span style="color:var(--text-muted)">· 最終 ${relative}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Received entries list (newest first, up to 10) -->
        <div style="display:flex;flex-direction:column;gap:8px">
          ${integrationEntries.slice(0, 10).map((e, i) => {
            const meta = INTEGRATION_SOURCES[e.source];
            const { relative, absolute } = formatReceivedAt(e.timestamp);
            const content = e.content || '';
            const contentPreview = content.length > 200 ? content.substring(0, 200) + '…' : content;
            const needsExpand = content.length > 200;
            const eid = 'integ-' + (e.id || i);
            return `
              <div style="padding:10px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);border-left:3px solid ${meta.color}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:6px">
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span style="font-size:14px">${meta.icon}</span>
                    <span style="font-size:12px;font-weight:600;color:${meta.color}">${meta.label}</span>
                    <span class="tag" style="font-size:9px;background:var(--bg-primary);color:var(--text-muted);padding:1px 6px">受信</span>
                  </div>
                  <div style="text-align:right;flex-shrink:0">
                    <div style="font-size:11px;font-weight:600;color:var(--text-primary)">${relative}</div>
                    <div style="font-size:9px;color:var(--text-muted);font-family:'JetBrains Mono',monospace" title="${absolute}">${absolute}</div>
                  </div>
                </div>
                ${e.title ? `<div style="font-size:12px;font-weight:600;margin-bottom:4px;color:var(--text-primary)">${Components.escapeHtml(e.title)}</div>` : ''}
                <div id="${eid}-preview" style="font-size:11px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">${Components.escapeHtml(contentPreview)}</div>
                ${needsExpand ? `
                  <div id="${eid}-full" style="display:none;font-size:11px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">${Components.escapeHtml(content)}</div>
                  <button onclick="var p=document.getElementById('${eid}-preview'),f=document.getElementById('${eid}-full');var showing=f.style.display!=='none';p.style.display=showing?'block':'none';f.style.display=showing?'none':'block';this.textContent=showing?'全文を表示':'折りたたむ'" style="margin-top:4px;background:none;border:none;color:var(--accent);font-size:10px;cursor:pointer;padding:2px 0">全文を表示</button>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
        ${integrationEntries.length > 10 ? `
          <div style="text-align:center;margin-top:10px;font-size:10px;color:var(--text-muted)">他に ${integrationEntries.length - 10} 件の受信データがあります（タイムラインで確認できます）</div>
        ` : ''}
      `}
    </div>
  </div>`;

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">データ入力</h2>
    <p style="font-size:13px;color:var(--text-secondary)">日々の体調や気づきを記録してください。テキストから即座にアドバイスを生成します。</p>
  </div>

  ${integrationHistoryHtml}

  <!-- 1. Free Text Input (Primary) -->
  <div class="card" style="margin-bottom:24px">
    <div class="card-header">
      <span class="card-title">📝 日記・フリーテキスト入力</span>
      <span class="tag tag-accent">メイン</span>
    </div>
    <div class="card-body">
      <div class="form-group">
        <label class="form-label">日付</label>
        <input type="date" class="form-input" id="text-input-date" value="${new Date().toISOString().split('T')[0]}" style="width:200px">
      </div>
      <div class="form-group">
        <div style="display:flex;gap:12px;align-items:end;flex-wrap:wrap">
          <div style="flex:1;min-width:140px">
            <label class="form-label">カテゴリ</label>
            <select class="form-select" id="text-input-category" onchange="app.updateInputHint(this.value)">
              <optgroup label="体調・症状">
                <option value="symptoms">体調・症状</option>
                <option value="mental">気分・メンタル</option>
                <option value="sleep">睡眠</option>
                <option value="pain">痛み・疼痛</option>
              </optgroup>
              <optgroup label="医療">
                <option value="blood_test">検査結果（血液・尿・画像）</option>
                <option value="medication">服薬・処方・漢方</option>
                <option value="supplement">サプリメント</option>
                <option value="doctor">診察・医師の所見</option>
                <option value="allergy">アレルギー検査</option>
                <option value="hormone">ホルモン検査</option>
                <option value="genetic">遺伝子検査</option>
              </optgroup>
              <optgroup label="食事・栄養">
                <option value="nutrition">食事・栄養</option>
                <option value="water">水分摂取</option>
                <option value="alcohol">飲酒</option>
              </optgroup>
              <optgroup label="生活・バイタル">
                <option value="vitals">バイタル（心拍・血圧・体温）</option>
                <option value="weight">体重・体組成</option>
                <option value="activity">運動・活動量</option>
                <option value="menstrual">生理・月経周期</option>
                <option value="weather">天気・気圧</option>
                <option value="environment">住環境（温度・湿度）</option>
              </optgroup>
              <optgroup label="人間関係・生活">
                <option value="conversation">会話・コミュニケーション</option>
                <option value="work">仕事・予定</option>
                <option value="family">家族・人間関係</option>
                <option value="travel">旅行・移動</option>
                <option value="finance">医療費・経済</option>
                <option value="meditation">瞑想・呼吸法</option>
              </optgroup>
              <optgroup label="その他">
                <option value="research">調べたこと・論文</option>
                <option value="other">その他</option>
              </optgroup>
            </select>
          </div>
          <div style="flex:1;min-width:140px">
            <label class="form-label">タイトル（任意）</label>
            <input type="text" class="form-input" id="text-input-title" placeholder="例: 朝の体調、診察メモ...">
          </div>
        </div>
      </div>

      <!-- Input hints by category -->
      <div id="input-hint" style="padding:8px 12px;background:var(--accent-bg);border-radius:var(--radius-sm);margin-bottom:10px;font-size:11px;color:var(--accent);line-height:1.6">
        💡 テキスト入力のほか、📎ボタンで写真を撮影してアップロードできます（血液検査結果、お薬手帳、食事写真など）
      </div>

      <div class="form-group">
        <label class="form-label">内容</label>
        <textarea class="form-textarea" id="text-input-content" rows="6" placeholder="体調や気づきを自由に記録してください..."></textarea>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="app.submitTextEntry()" ${store.get('isAnalyzing') ? 'disabled' : ''}>保存して分析</button>
        <label class="btn btn-secondary" style="cursor:pointer">📎 写真・ファイル<input type="file" hidden multiple accept="image/*,.pdf,.csv,.json,.xml,.txt,.xlsx" onchange="app.dataPageFileUpload(this.files)"></label>
        <button class="btn btn-secondary" onclick="document.getElementById('text-input-content').value='';document.getElementById('text-input-title').value=''">クリア</button>
        <span id="text-save-status" style="font-size:12px;color:var(--text-muted)"></span>
      </div>
      ${recentHtml}
    </div>
  </div>

  <!-- 2. AI Instant Advice (appears after text save) -->
  <div id="instant-advice" style="margin-bottom:24px"></div>

  <!-- 3. File Upload -->
  <div class="card" style="margin-bottom:24px">
    <div class="card-header"><span class="card-title">📎 ファイルアップロード</span></div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">血液検査結果、食事写真、処方箋、遺伝子データなど</p>
      <div class="upload-area" onclick="document.getElementById('data-file-input').click()"
        ondragover="event.preventDefault();this.style.borderColor='var(--accent)'"
        ondragleave="this.style.borderColor='var(--border)'"
        ondrop="event.preventDefault();app.dataPageFileUpload(event.dataTransfer.files)">
        <div class="upload-area-icon">📸</div>
        <div class="upload-area-text">クリックまたはドラッグ&ドロップ</div>
        <div class="upload-area-hint">写真・画像・PDF・CSV・JSON・XML・テキスト</div>
        <input type="file" id="data-file-input" hidden multiple accept="image/*,.pdf,.csv,.json,.xml,.txt,.xlsx"
          onchange="app.dataPageFileUpload(this.files)">
      </div>
      <div id="data-file-result" style="margin-top:12px"></div>
    </div>
  </div>

  <!-- 4. Deep Analysis Archive — stores every「本格的な分析」run so the
       user can revisit past structured reports, bookmark sections, and
       react (F-2-2 / F-2-3). Each entry is rendered with its own reaction
       bar under each section. -->
  ${(() => {
    const archive = (store.get('deepAnalyses') || []).slice().reverse();
    // Keep the div rendered even when empty so the「過去の本格分析を見る」
    // link from the home page (which scrolls to #deep-analyses-archive)
    // has a valid scroll target. Without this the link silently no-op'd
    // and users thought the link was broken (B-6).
    if (archive.length === 0) {
      return `
      <div id="deep-analyses-archive" style="margin-bottom:24px;padding:20px;background:var(--bg-tertiary);border-radius:10px;text-align:center">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:6px">📊 本格分析アーカイブ</h3>
        <p style="font-size:12px;color:var(--text-muted);line-height:1.8">
          まだ本格分析の履歴がありません。<br>
          ホーム画面の「🔍 本格的な分析をする」ボタンから分析を実行すると、<br>
          ここに履歴が貯まっていきます。
        </p>
      </div>`;
    }
    const REACTIONS = [
      { key: 'like',        emoji: '👍', label: 'いいかも' },
      { key: 'heart',       emoji: '❤️', label: 'やってみたい' },
      { key: 'todo',        emoji: '✅', label: '今日やる' },
      { key: 'dislike',     emoji: '👎', label: '興味ない' },
      { key: 'refuse',      emoji: '🚫', label: 'やりたくない' },
      { key: 'ineffective', emoji: '❌', label: '効果なかった' }
    ];
    const SECTIONS = [
      { key: 'summary',      title: '要約' },
      { key: 'findings',     title: '所見' },
      { key: 'actions',      title: 'アクション' },
      { key: 'new_approach', title: '新しいアプローチ' },
      { key: 'trend',        title: 'トレンド' },
      { key: 'next_check',   title: '次に記録すること' }
    ];
    const renderReactionBar = (id, section, current) => REACTIONS.map(r => {
      const selected = current === r.key;
      return `<button title="${r.label}" onclick="app.setReaction('${id}','${section}','${r.key}')"
        style="padding:4px 8px;border:1px solid ${selected ? '#6366f1' : 'var(--border)'};background:${selected ? '#eef2ff' : '#fff'};border-radius:8px;cursor:pointer;font-size:13px;margin:2px">${r.emoji}</button>`;
    }).join('');
    const renderBookmark = (id, section, isOn) => `<button onclick="app.toggleBookmark('${id}','${section}')"
      title="ブックマーク" style="padding:4px 6px;border:none;background:transparent;cursor:pointer;font-size:14px;opacity:${isOn ? 1 : 0.35}">⭐</button>`;

    const cardsHtml = archive.map(a => {
      const parsed = a.parsed || {};
      const sectionsHtml = SECTIONS.map(s => {
        const val = parsed[s.key];
        if (!val) return '';
        const text = Array.isArray(val) ? val.map(v => '・' + v).join('\n') : String(val);
        return `
          <div style="margin-top:10px;padding:10px 12px;background:var(--bg-tertiary);border-radius:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:12px;font-weight:700;color:var(--accent)">${s.title}</span>
              ${renderBookmark(a.id, s.key, !!(a.bookmarks && a.bookmarks[s.key]))}
            </div>
            <div style="font-size:12px;line-height:1.7;white-space:pre-wrap;color:var(--text-primary)">${Components.escapeHtml(text)}</div>
            <div style="margin-top:6px">${renderReactionBar(a.id, s.key, (a.reactions || {})[s.key])}</div>
          </div>`;
      }).join('');
      const dateLabel = new Date(a.timestamp).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      return `
        <details style="margin-bottom:10px;background:#fff;border:1px solid var(--border);border-radius:10px;padding:10px 14px">
          <summary style="cursor:pointer;font-size:13px;font-weight:600;color:var(--text-primary)">
            📊 ${dateLabel}
            <span style="font-size:11px;font-weight:400;color:var(--text-muted);margin-left:6px">${Components.escapeHtml((a.sourceContent || '').substring(0, 40))}${(a.sourceContent || '').length > 40 ? '…' : ''}</span>
          </summary>
          ${sectionsHtml}
        </details>`;
    }).join('');

    return `
      <div id="deep-analyses-archive" style="margin-bottom:24px">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:8px">📊 本格分析アーカイブ（${archive.length}件）</h3>
        <p style="font-size:11px;color:var(--text-muted);margin-bottom:10px">各セクションに ⭐ でブックマーク、絵文字でリアクションを付けられます。次回の本格分析がリアクションを参考にしてパーソナライズされます。</p>
        ${cardsHtml}
      </div>`;
  })()}

  <!-- 5. Structured Data Entry (bottom) -->
  <div style="margin-bottom:12px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:4px">指標データ入力</h3>
    <p style="font-size:12px;color:var(--text-muted)">数値で記録したい項目はこちらから</p>
  </div>
  <div class="grid-auto" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(170px,1fr))">
    ${cards}
  </div>`;
};

// AI Analysis Page
App.prototype.render_analysis = function() {
  const prompts = store.get('customPrompts') || DEFAULT_PROMPTS;
  const model = store.get('selectedModel') || 'claude-opus-4-6';
  const isAnalyzing = store.get('isAnalyzing');

  const modelOpts = CONFIG.AI_MODELS.map(m =>
    `<option value="${m.id}" ${m.id === model ? 'selected' : ''}>${m.name} (${m.provider})</option>`
  ).join('');

  const promptBtns = Object.entries(prompts).map(([key, p]) => `
    <button class="btn ${p.active ? 'btn-outline' : 'btn-secondary'} btn-sm"
      onclick="app.runAnalysis('${key}')" ${isAnalyzing ? 'disabled' : ''}>
      ${p.name}
    </button>
  `).join('');

  return `
  <div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:12px">
    <div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">AI分析</h2>
      <p style="font-size:13px;color:var(--text-secondary)">あなたの健康データをAIが分析し、最適な提案を生成します</p>
    </div>
    <div style="display:flex;align-items:center;gap:10px">
      <select class="form-select" style="width:auto" onchange="app.setModel(this.value)">
        ${modelOpts}
      </select>
    </div>
  </div>

  <!-- Prompt Selection -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-header"><span class="card-title">分析プロンプト</span></div>
    <div class="card-body" style="display:flex;flex-wrap:wrap;gap:8px">
      ${promptBtns}
    </div>
  </div>

  <!-- Analysis Result -->
  <div id="analysis-result">
    ${store.get('latestAnalysis')
      ? ''
      : Components.emptyState('🤖', 'AI分析を実行してください', '上のボタンからプロンプトを選択して分析を開始します')}
  </div>`;
};

// Action Center
// Match financial support programs to the user's selected diseases.
// A program is matched when either:
//   • its `applicable` array contains '*' (everyone qualifies), or
//   • at least one of the user's selectedDiseases appears in `applicable`.
// When the user has no disease selected, only universal ('*') programs
// are shown so we don't advertise irrelevant disease-specific subsidies.
App.prototype.matchFinancialSupport = function() {
  const programs = CONFIG.FINANCIAL_SUPPORT || [];
  const selected = store.get('selectedDiseases') || [];
  const selSet = new Set(selected);
  return programs.filter(p => {
    const app = p.applicable || [];
    if (app.includes('*')) return true;
    return app.some(id => selSet.has(id));
  });
};

// Match telehealth providers to the user's selected diseases.
// Returns an array of provider entries whose `categories` field
// overlaps with any of the selectedDiseases' parent category ids.
// If no match, returns an empty array so the caller falls back to
// a general list. Always deduplicates and caps at 6 entries to
// avoid overwhelming the UI.
App.prototype.matchTelehealthToDiseases = function() {
  const providers = CONFIG.TELEHEALTH_PROVIDERS || [];
  const selected = store.get('selectedDiseases') || [];
  if (selected.length === 0) return [];

  // Build a map from disease id → parent category id.
  const diseaseToCat = {};
  (CONFIG.DISEASE_CATEGORIES || []).forEach(cat => {
    (cat.diseases || []).forEach(d => { diseaseToCat[d.id] = cat.id; });
  });
  const userCats = new Set(selected.map(id => diseaseToCat[id]).filter(Boolean));
  if (userCats.size === 0) return [];

  const matched = providers.filter(p => {
    if (!Array.isArray(p.categories) || p.categories.length === 0) return false;
    return p.categories.some(c => userCats.has(c));
  });
  // Return unique, capped at 6
  const seen = new Set();
  const unique = [];
  for (const p of matched) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    unique.push(p);
    if (unique.length >= 6) break;
  }
  return unique;
};

App.prototype.render_actions = function() {
  const recs = store.get('recommendations') || [];
  const analysis = store.get('latestAnalysis');
  const demoRecs = analysis?.parsed?.recommendations || analysis?.result?.recommendations || [];
  const allRecs = recs.length > 0 ? recs : demoRecs;

  const byCategory = {};
  allRecs.forEach(r => {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  });

  let sections = '';
  CONFIG.ACTION_TYPES.forEach(at => {
    const items = byCategory[at.id];
    if (!items) return;
    sections += `
      <div style="margin-bottom:24px">
        <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">${at.icon} ${at.name}</h3>
        ${items.map(r => Components.recommendationCard(r)).join('')}
      </div>`;
  });

  // Match telehealth providers to user's selected diseases
  const telehealthMatched = this.matchTelehealthToDiseases();

  // 🌿 Live clinic/workshop/self-care card — promoted to the top of the
  // actions tab (after financial support) so users actually see today's
  // recommendations without scrolling past 4 other sections. Header
  // surfaces the cache fetchedAt as 最終更新 and explains the trigger
  // (new textEntry invalidates the cache via B-5).
  const cachedActions = store.get('cachedActions') || null;
  const lastUpdatedLabel = cachedActions && cachedActions.fetchedAt
    ? new Date(cachedActions.fetchedAt).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '未生成';
  const selfCareCardHtml = `
  <div class="card" style="margin-bottom:24px;border:1px solid #10b981">
    <div class="card-header" style="background:linear-gradient(135deg,#ecfdf5 0%,#d1fae5 100%)">
      <span class="card-title" style="color:#065f46">🌿 クリニック・イベント・セルフケア</span>
      <span style="font-size:10px;color:#047857">最終更新: ${lastUpdatedLabel}</span>
    </div>
    <div class="card-body" id="action-live-recs"></div>
    <div style="padding:8px 16px 12px;font-size:11px;color:var(--text-muted);border-top:1px solid #d1fae5;background:#f0fdf4">
      💡 今日のコメントを入力すると、あなたの最新状態に合わせて自動で更新されます。
    </div>
  </div>`;

  // 💴 Financial support programs matched to user's selected diseases.
  // Requires authenticated user (programs are sensitive and need a logged-in
  // identity to file an application + receive the professional's email back).
  const user = store.get('user') || {};
  const isLoggedIn = !!(user.uid && !user.isAnonymous);
  const financialPrograms = this.matchFinancialSupport();
  const proTypeMap = {};
  (CONFIG.PROFESSIONAL_TYPES || []).forEach(t => { proTypeMap[t.id] = t; });

  const financialSupportHtml = (isLoggedIn && financialPrograms.length > 0) ? `
  <div class="card" style="margin-bottom:24px;border:1.5px solid #059669;background:linear-gradient(180deg,#f0fdf4 0%, #ffffff 60%)">
    <div class="card-header" style="background:linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)">
      <span class="card-title" style="color:#065f46">💴 あなたが受けられる可能性のある金銭的サポート</span>
      <span class="tag tag-success" style="font-size:10px">${financialPrograms.length}件</span>
    </div>
    <div class="card-body" style="padding:14px 16px">
      <p style="font-size:12px;color:#047857;line-height:1.7;margin-bottom:12px">
        選択された疾患に基づき、国・自治体の補助金・年金・税制優遇の候補を表示しています。<br>
        「申請に必要な情報を入力する」ボタンから必要事項を入力すると、
        登録済みの <strong>社労士・税理士</strong> に直接丁寧なメールが届き、手続きのサポートを受けられます。
      </p>
      <div class="grid-auto" style="display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">
        ${financialPrograms.map(p => {
          const proType = proTypeMap[p.professional] || {};
          return `
          <div class="card" style="background:#fff;border:1px solid #a7f3d0">
            <div class="card-body" style="padding:12px 14px">
              <div style="display:flex;align-items:start;justify-content:space-between;gap:8px;margin-bottom:6px">
                <div style="font-size:13px;font-weight:700;line-height:1.4">${p.icon} ${Components.escapeHtml(p.name)}</div>
                <span class="tag" style="font-size:9px;background:#d1fae5;color:#065f46;white-space:nowrap;flex-shrink:0">${Components.escapeHtml(p.category || '')}</span>
              </div>
              <div style="font-size:11px;color:#047857;font-weight:600;margin-bottom:4px">💰 ${Components.escapeHtml(p.amount || '')}</div>
              <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px"><strong>対象:</strong> ${Components.escapeHtml(p.eligibility || '')}</div>
              <p style="font-size:11px;color:var(--text-secondary);line-height:1.6;margin-bottom:8px">${Components.escapeHtml(p.description || '')}</p>
              ${Array.isArray(p.urls) && p.urls.length > 0 ? `
                <div style="font-size:10px;margin-bottom:8px">
                  ${p.urls.map(u => `<a href="${u.url}" target="_blank" rel="noopener" style="color:#059669;text-decoration:underline;margin-right:8px">${Components.escapeHtml(u.label)} →</a>`).join('')}
                </div>
              ` : ''}
              ${proType.name ? `<div style="font-size:10px;color:var(--text-muted);margin-bottom:8px">🧑‍💼 相談専門家: ${proType.icon} ${Components.escapeHtml(proType.name)}</div>` : ''}
              <button class="btn btn-sm btn-primary" style="width:100%;background:#059669;border-color:#047857" onclick="app.openFinancialSupportForm('${p.id}')">申請に必要な情報を入力する →</button>
            </div>
          </div>
          `;
        }).join('')}
      </div>
      <div style="margin-top:12px;padding:10px 14px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:11px;color:#78350f;line-height:1.7">
        ⚠ <strong>金額・対象は目安です。</strong>実際の受給可否は個別審査です。申請書類の記入・医師の証明・審査には時間がかかるため、早めの相談をおすすめします。
      </div>
    </div>
  </div>` : (financialPrograms.length > 0 ? `
  <div class="card" style="margin-bottom:24px;border:1px dashed #9ca3af">
    <div class="card-body" style="padding:14px 16px;text-align:center">
      <div style="font-size:14px;font-weight:700;margin-bottom:6px">💴 金銭的サポート申請機能</div>
      <p style="font-size:12px;color:var(--text-muted);line-height:1.7;margin-bottom:10px">
        疾患に応じた補助金・年金・傷病手当金などの申請サポート機能は、<br>
        サインイン後にご利用いただけます。
      </p>
      <button class="btn btn-primary btn-sm" onclick="app.navigate('login')">サインインして申請サポートを見る</button>
    </div>
  </div>
  ` : '');

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">アクションセンター</h2>
    <p style="font-size:13px;color:var(--text-secondary)">ワンクリックで健康改善のアクションを実行</p>
  </div>

  ${financialSupportHtml}

  ${selfCareCardHtml}

  ${sections || ''}

  <!-- 🏥 遠隔診療・オンライン診療 -->
  <!-- Matched to user's selected diseases. Shows only providers
       that match at least one of the user's conditions. If none,
       a full general list is shown. Each entry links directly to
       the official provider site so users can verify and book. -->
  <div style="margin-top:24px;margin-bottom:24px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:6px">🏥 オンライン診療で医師に相談する</h3>
    <p style="font-size:11px;color:var(--text-muted);margin-bottom:12px">
      家から受けられるオンライン診療サービス。あなたの疾患に対応した選択肢を表示しています。
      ${telehealthMatched.length > 0 ? '疾患に合わせてマッチしたプロバイダー' : '代表的な総合オンライン診療'}。
    </p>
    <div class="grid-auto" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(300px,1fr))">
      ${(telehealthMatched.length > 0 ? telehealthMatched : CONFIG.TELEHEALTH_PROVIDERS.slice(0, 4)).map(tp => {
        const paymentBadge = { insurance: '保険適用', private: '自費', both: '保険＋自費' }[tp.payment] || tp.payment;
        const formatIcon = { video: '📹', chat: '💬', phone: '📞' }[tp.format] || '📹';
        return `
        <div class="card" style="display:flex;flex-direction:column">
          <div class="card-body" style="padding:14px;flex:1">
            <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;margin-bottom:6px">
              <div class="action-card-title" style="font-size:13px;font-weight:700;line-height:1.4">${formatIcon} ${Components.escapeHtml(tp.name)}</div>
              <span class="tag ${tp.payment === 'insurance' ? 'tag-success' : 'tag-info'}" style="font-size:9px;white-space:nowrap;flex-shrink:0">${paymentBadge}</span>
            </div>
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px">${Components.escapeHtml(tp.provider || '')}</div>
            <div style="font-size:11px;color:var(--accent);font-weight:600;margin-bottom:4px">${Components.escapeHtml(tp.specialty || '')}</div>
            <p style="font-size:11px;color:var(--text-secondary);line-height:1.6;margin-bottom:8px">${Components.escapeHtml(tp.description || '')}</p>
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--text-muted);margin-bottom:8px">${Components.escapeHtml(tp.price || '')}</div>
          </div>
          <div style="padding:10px 14px 14px">
            <a href="${tp.url}" target="_blank" rel="noopener" class="btn btn-sm btn-primary" style="width:100%;text-align:center">公式サイトで予約・相談 →</a>
          </div>
        </div>
        `;
      }).join('')}
    </div>
    <div style="margin-top:10px;padding:10px 14px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:11px;color:#78350f;line-height:1.7">
      ⚠ <strong>選択肢の提示であり推奨ではありません。</strong>各サービスの最新料金・対応範囲は公式サイトでご確認ください。オンライン診療は対面診療の補完であり、急性症状・重症時は必ず対面受診してください。
    </div>
  </div>

  <!-- 🧘 オンラインカウンセリング -->
  <!-- Not medical treatment. Psychological counseling for chronic
       illness loneliness, stress, adjustment disorder. Important
       because chronic disease patients often experience isolation
       that compounds physical symptoms. -->
  <div style="margin-top:24px;margin-bottom:24px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:6px">🧘 オンラインカウンセリング</h3>
    <p style="font-size:11px;color:var(--text-muted);margin-bottom:12px">
      慢性疾患と向き合う日々の心理的負担・孤独・不安に寄り添うカウンセラー。
      医療行為ではなく、専門家との対話による心理サポートです。
    </p>
    <div class="grid-auto" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
      ${CONFIG.COUNSELING_PROVIDERS.map(cp => `
        <div class="card" style="display:flex;flex-direction:column">
          <div class="card-body" style="padding:14px;flex:1">
            <div class="action-card-title" style="font-size:13px;font-weight:700;line-height:1.4;margin-bottom:4px">${Components.escapeHtml(cp.name)}</div>
            <div style="font-size:10px;color:var(--text-muted);margin-bottom:6px">${Components.escapeHtml(cp.provider)}</div>
            <p style="font-size:11px;color:var(--text-secondary);line-height:1.6;margin-bottom:8px">${Components.escapeHtml(cp.description)}</p>
            <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--accent)">${Components.escapeHtml(cp.price)}</div>
          </div>
          <div style="padding:10px 14px 14px">
            <a href="${cp.url}" target="_blank" rel="noopener" class="btn btn-sm btn-secondary" style="width:100%;text-align:center">公式サイトへ →</a>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- 🆘 緊急時の相談窓口 (常時表示) -->
  <!-- 24-hour hotlines shown unconditionally. Critical for users
       experiencing suicidal ideation, acute crisis, or severe
       mental distress. Kept compact but always visible. -->
  <div class="card" style="margin-top:24px;margin-bottom:24px;border:2px solid #fca5a5;background:#fef2f2">
    <div class="card-header" style="background:#fef2f2">
      <span class="card-title" style="color:#991b1b">🆘 つらいとき・死にたい気持ちがあるとき — 無料相談窓口</span>
    </div>
    <div class="card-body" style="padding:14px">
      <p style="font-size:11px;color:#7f1d1d;line-height:1.7;margin-bottom:12px">
        一人で抱え込まないでください。以下の窓口はすべて無料で、専門の相談員があなたの話を聴きます。
        命の危険がある場合は <strong>119 番</strong> にすぐ連絡してください。
      </p>
      <div style="display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">
        ${CONFIG.EMERGENCY_LINES.map(el => `
          <div style="padding:12px 14px;background:#fff;border:1px solid #fecaca;border-radius:10px">
            <div style="font-size:12px;font-weight:700;color:#991b1b;margin-bottom:4px">${Components.escapeHtml(el.name)}</div>
            <div style="font-size:15px;font-weight:800;color:#dc2626;font-family:'JetBrains Mono',monospace;margin-bottom:3px">
              <a href="tel:${el.phone.split(/\s|\(/)[0]}" style="color:#dc2626;text-decoration:none">${Components.escapeHtml(el.phone)}</a>
            </div>
            <div style="font-size:10px;color:#7f1d1d">${Components.escapeHtml(el.hours)} ・ ${Components.escapeHtml(el.price)}</div>
            <div style="font-size:10px;color:#7f1d1d;line-height:1.5;margin-top:4px">${Components.escapeHtml(el.description)}</div>
            ${el.url ? `<a href="${el.url}" target="_blank" rel="noopener" style="font-size:10px;color:#dc2626;font-weight:600;text-decoration:underline;display:inline-block;margin-top:4px">詳細 →</a>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- Live Clinic/Workshop/Event Recommendations —
       Moved up to right after financialSupportHtml. See selfCareCardHtml
       earlier in render_actions. -->

  <!-- Recommended Test Kits -->
  <div style="margin-top:24px;margin-bottom:24px">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:12px">🧪 推奨検査キット・ラボ</h3>
    <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">あなたの疾患プロファイルに基づく検査推奨</p>
    <div class="grid-auto" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
      ${CONFIG.TEST_KITS.map(tk => `
        <div class="card">
          <div class="card-body" style="padding:16px">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
              <div class="action-card-title" style="font-size:13px">${tk.name}</div>
              <span class="tag tag-info" style="font-size:10px;white-space:nowrap">${tk.where}</span>
            </div>
            <p style="font-size:12px;color:var(--text-secondary);margin-bottom:8px">${tk.description}</p>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--accent)">${tk.price}</span>
              ${tk.url ? `<a href="${tk.url}" target="_blank" rel="noopener" class="btn btn-sm btn-primary"
                onclick="affiliateEngine.trackClick('${tk.id}','amazon_jp','test_kit')">購入・予約</a>` : `<span style="font-size:11px;color:var(--text-muted)">医師に相談</span>`}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Dynamic Product Recommendations (same as dashboard) -->
  <div style="margin-top:24px;margin-bottom:24px">
    <div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0"
      onclick="var c=document.getElementById('action-recs');c.style.display=c.style.display==='none'?'block':'none';this.querySelector('.arrow').textContent=c.style.display==='none'?'▸':'▾'">
      <h3 style="font-size:15px;font-weight:600">あなたへのおすすめ</h3>
      <span class="arrow" style="font-size:14px;color:var(--text-muted)">▾</span>
    </div>
    <div id="action-recs">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px" class="grid-recs">
        ${app.generateDynamicRecommendations().map(item => `
          <a href="${item.url}" target="_blank" rel="noopener"
            onclick="affiliateEngine.trackClick('${item.id}','${item.store === 'iherb' ? 'iherb' : 'amazon_jp'}','supplement')"
            class="card" style="text-decoration:none;color:inherit">
            <div class="card-body" style="padding:10px;text-align:center">
              <div style="font-size:18px;margin-bottom:2px">${item.icon}</div>
              <div style="font-size:11px;font-weight:600;line-height:1.3">${item.name}</div>
              <div style="font-size:9px;color:var(--text-muted)">${item.desc}</div>
              <div style="font-size:9px;color:var(--accent);margin-top:2px">${item.store === 'iherb' ? 'iHerb' : 'Amazon'} →</div>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  </div>

  <!-- Latest Feedback Actions (from dashboard analysis) -->
  ${(() => {
    const fb = store.get('latestFeedback');
    if (!fb || !fb.sections) return '';
    const actionSection = fb.sections.find(s => s.title.includes('今すぐ'));
    const findingSection = fb.sections.find(s => s.title.includes('詳細'));
    if (!actionSection && !findingSection) return '';
    return '<div style="margin-top:24px;margin-bottom:24px">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;cursor:pointer;padding:8px 0" onclick="var c=document.getElementById(\\x27action-insights\\x27);c.style.display=c.style.display===\\x27none\\x27?\\x27block\\x27:\\x27none\\x27;this.querySelector(\\x27.arrow\\x27).textContent=c.style.display===\\x27none\\x27?\\x27▸\\x27:\\x27▾\\x27">' +
      '<h3 style="font-size:15px;font-weight:600">最新の分析からのアクション</h3>' +
      '<span class="arrow" style="font-size:14px;color:var(--text-muted)">▾</span></div>' +
      '<div id="action-insights"><div class="card" style="border-left:4px solid var(--accent)">' +
      (actionSection ? '<div style="padding:12px 16px;border-bottom:1px solid var(--border)"><div style="font-size:12px;font-weight:600;margin-bottom:4px">' + actionSection.icon + ' ' + actionSection.title + '</div><div style="font-size:12px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">' + actionSection.content + '</div></div>' : '') +
      (findingSection ? '<div style="padding:12px 16px"><div style="font-size:12px;font-weight:600;margin-bottom:4px">' + findingSection.icon + ' ' + findingSection.title + '</div><div style="font-size:12px;color:var(--text-secondary);line-height:1.7;white-space:pre-wrap">' + findingSection.content + '</div></div>' : '') +
      '</div></div></div>';
  })()}`;
};

// Research Page
App.prototype.render_research = function() {
  const analysis = store.get('latestAnalysis');
  const updates = analysis?.parsed?.researchUpdates || analysis?.result?.researchUpdates || [];

  // Restore the user's last keyword / day range / results from store
  // so tab switches don't wipe them (B-2 / B-3). Cached result HTML
  // is only reused when the profile language still matches — cached
  // translated titles would be in the wrong language otherwise.
  const savedQuery = store.get('researchQuery') || '';
  const savedDays = Number(store.get('researchDays') || 90);
  const savedResults = store.get('researchResults');
  const currentLang = (store.get('userProfile') || {}).language || 'ja';
  const resultsHtml = (savedResults && savedResults.html && savedResults.lang === currentLang)
    ? savedResults.html
    : (updates.length > 0
      ? '<h3 style="font-size:15px;font-weight:600;margin-bottom:12px">研究レポート</h3>' + updates.map(r => Components.researchCard(r)).join('')
      : Components.emptyState('🔬', '論文を検索を実行してください', '上の「論文を検索」ボタンをクリックするとME/CFSの最新論文が表示されます。'));
  const dayOpt = (v, label) => `<option value="${v}"${savedDays === v ? ' selected' : ''}>${label}</option>`;

  return `
  <div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:12px">
    <div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">最新研究</h2>
      <p style="font-size:13px;color:var(--text-secondary)">あなたの疾患に関連する最新の研究論文</p>
    </div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary btn-sm" onclick="app.searchPubMedLive()">論文を検索</button>
      <button class="btn btn-outline btn-sm" onclick="app.runAnalysis('mecfs_research')">研究スキャン</button>
    </div>
  </div>

  <!-- Search Bar. State is persisted to store so re-rendering (tab
       switches) restores what the user typed, not a disease-derived
       auto-query (B-2 / B-3). -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-body" style="padding:14px 20px">
      <div style="display:flex;gap:10px">
        <input type="text" class="form-input" id="pubmed-search-query" value="${Components.escapeHtml(savedQuery)}" placeholder="検索キーワード（未入力なら疾患に合わせて自動生成）" style="flex:1">
        <select class="form-select" id="pubmed-search-days" style="width:120px">
          ${dayOpt(7, '過去7日')}
          ${dayOpt(30, '過去30日')}
          ${dayOpt(90, '過去90日')}
          ${dayOpt(365, '過去1年')}
        </select>
        <button class="btn btn-primary" onclick="app.searchPubMedLive()">論文を検索</button>
      </div>
    </div>
  </div>

  <!-- PubMed Results -->
  <div id="pubmed-results">
    ${resultsHtml}
  </div>`;
};

// Chat Page
App.prototype.render_chat = function() {
  const history = store.get('conversationHistory') || [];
  const messages = history.map(m => Components.chatMessage(m)).join('');

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">相談する</h2>
    <p style="font-size:13px;color:var(--text-secondary)">あなたの健康データに基づいて質問にお答えします</p>
  </div>
  <div class="card">
    <div class="chat-container">
      <div class="chat-messages" id="chat-messages">
        ${messages || `
          <div style="text-align:center;padding:40px;color:var(--text-muted)">
            <div style="font-size:40px;margin-bottom:12px">💬</div>
            <p>ME/CFSについて何でも質問してください</p>
            <p style="font-size:12px;margin-top:8px">例：「今日の体調データから気をつけることは？」</p>
          </div>
        `}
      </div>
      <div class="chat-input-area">
        <input type="text" class="chat-input" id="chat-input" placeholder="メッセージを入力..."
          onkeydown="if(event.key==='Enter')app.sendChat()">
        <button class="btn btn-primary" onclick="app.sendChat()">送信</button>
      </div>
    </div>
  </div>`;
};

// Timeline Page
App.prototype.render_timeline = function() {
  // Collect ALL data sources
  const allEntries = [];
  const photos = store.get('photos') || [];
  const photoById = new Map(photos.filter(p => p?.id).map(p => [p.id, p]));

  // Text entries (diary, notes)
  (store.get('textEntries') || []).forEach(d => allEntries.push({
    ...d, _type: 'text', _icon: '📝', _label: d.title || '日記',
    _category: d.category || 'other'
  }));

  // Symptoms
  (store.get('symptoms') || []).forEach(d => {
    if (d.text_note) {
      allEntries.push({ ...d, _type: 'symptom_note', _icon: '📝', _label: d.title || '症状メモ' });
    } else {
      allEntries.push({ ...d, _type: 'symptom_data', _icon: '📊', _label: '症状スコア' });
    }
  });

  // Vitals
  (store.get('vitals') || []).forEach(d => allEntries.push({
    ...d, _type: 'vitals', _icon: '💓', _label: 'バイタル'
  }));

  // Blood tests
  (store.get('bloodTests') || []).forEach(d => allEntries.push({
    ...d, _type: 'blood', _icon: '🩸', _label: '血液検査'
  }));

  // Medications
  (store.get('medications') || []).forEach(d => allEntries.push({
    ...d, _type: 'medication', _icon: '💊', _label: '服薬記録'
  }));

  // Sleep
  (store.get('sleepData') || []).forEach(d => allEntries.push({
    ...d, _type: 'sleep', _icon: '😴', _label: '睡眠'
  }));

  // Activity
  (store.get('activityData') || []).forEach(d => allEntries.push({
    ...d, _type: 'activity', _icon: '🚶', _label: '活動量'
  }));

  // Photos
  photos.forEach(d => allEntries.push({
    ...d, _type: 'photo', _icon: '📸', _label: d.filename || '写真'
  }));

  // Supplements
  (store.get('supplements') || []).forEach(d => allEntries.push({
    ...d, _type: 'supplement', _icon: '💊', _label: d.text_note || d.title || 'サプリメント'
  }));

  // Meals / nutrition
  (store.get('meals') || []).forEach(d => allEntries.push({
    ...d, _type: 'meal', _icon: '🥗', _label: d.text_note || d.title || '食事記録'
  }));

  // Nutrition log (BMR / PFC / calorie)
  (store.get('nutritionLog') || []).forEach(d => allEntries.push({
    ...d, timestamp: d.timestamp || (d.date ? d.date + 'T12:00:00Z' : null),
    _type: 'nutrition', _icon: '🔥',
    _label: `${d.calories || 0} kcal (P${d.protein_g || 0} F${d.fat_g || 0} C${d.carbs_g || 0})`
  }));

  // Plaud analyses (禅トラック)
  (store.get('plaudAnalyses') || []).forEach(d => allEntries.push({
    ...d, _type: 'plaud', _icon: '🧘',
    _label: d.title || '禅トラック分析',
    content: d.fullText || ''
  }));

  // Calendar events (today and future)
  (store.get('calendarEvents') || []).forEach(d => allEntries.push({
    ...d, timestamp: d.start || d.timestamp,
    _type: 'calendar', _icon: '📅',
    _label: d.title || d.summary || 'カレンダー'
  }));

  // Sort by timestamp (newest first)
  allEntries.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

  // Group by date
  const byDate = {};
  allEntries.forEach(e => {
    const dateKey = e.timestamp ? new Date(e.timestamp).toLocaleDateString('ja-JP', { year:'numeric', month:'long', day:'numeric', weekday:'short' }) : '日付不明';
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(e);
  });

  // Category labels for filter
  const categoryLabels = {
    text: '日記・メモ', symptom_note: '症状メモ', symptom_data: '症状スコア',
    vitals: 'バイタル', blood: '血液検査', medication: '服薬',
    supplement: 'サプリ', meal: '食事', nutrition: '栄養',
    sleep: '睡眠', activity: '活動', photo: '写真',
    plaud: '禅トラック', calendar: 'カレンダー'
  };

  // Render entries
  const renderEntry = (e) => {
    const time = e.timestamp ? new Date(e.timestamp).toLocaleTimeString('ja-JP', { hour:'2-digit', minute:'2-digit' }) : '';
    const skipKeys = ['id', 'timestamp', 'category', '_type', '_icon', '_label', '_category', 'createdAt', '_synced', 'type', 'source', 'dataUrl'];

    // Text entries - show formatted content
    if (e._type === 'text' || e._type === 'symptom_note') {
      const rawContent = e.content || e.text_note || '';
      const content = Components.escapeHtml(rawContent);
      const aiInsight = Components.escapeHtml(app.generateQuickInsight(rawContent) || '');
      const safeLabel = Components.escapeHtml(e._label || '');
      const safeCategory = e._category ? Components.escapeHtml(e._category) : '';
      const previewPhoto = e.photoId ? photoById.get(e.photoId) : null;
      const previewImage = e.previewImage || previewPhoto?.dataUrl || '';
      const safeFileName = Components.escapeHtml(e.title || previewPhoto?.filename || '画像');
      return `
        <div class="card" style="margin-bottom:10px;border-left:3px solid var(--accent)">
          <div class="card-body" style="padding:12px 16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
              <div style="display:flex;align-items:center;gap:8px">
                <span>${e._icon}</span>
                <span style="font-size:12px;font-weight:600">${safeLabel}</span>
                ${safeCategory ? `<span class="tag tag-accent" style="font-size:9px">${safeCategory}</span>` : ''}
              </div>
              <span style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace">${time}</span>
            </div>
            <div style="font-size:13px;color:var(--text-primary);line-height:1.8;white-space:pre-wrap;margin-bottom:8px">${content}</div>
            ${previewImage ? `<div style="margin-bottom:8px"><img class="record-thumbnail" src="${previewImage}" alt="${safeFileName}" onclick="app.openImagePreview(this.src, this.alt)"></div>` : ''}
            ${aiInsight ? `<div style="padding:8px 12px;background:var(--accent-bg);border-radius:var(--radius-sm);font-size:11px;color:var(--accent)"><strong>分析:</strong> ${aiInsight}</div>` : ''}
          </div>
        </div>`;
    }

    // Symptom scores
    if (e._type === 'symptom_data') {
      const fields = [];
      if (e.fatigue_level != null) fields.push(`疲労: ${e.fatigue_level}/7`);
      if (e.pain_level != null) fields.push(`痛み: ${e.pain_level}/7`);
      if (e.brain_fog != null) fields.push(`脳霧: ${e.brain_fog}/7`);
      if (e.sleep_quality != null) fields.push(`睡眠: ${e.sleep_quality}/7`);
      if (e.pem_status) fields.push('PEM: あり');
      const avgScore = fields.length > 0 ? '（平均 ' + (((e.fatigue_level||0)+(e.pain_level||0)+(e.brain_fog||0))/3).toFixed(1) + '/7）' : '';
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:6px">
          <span>${e._icon}</span>
          <span style="font-size:12px;flex:1">${fields.join(' | ')}</span>
          <span style="font-size:11px;color:var(--text-muted)">${avgScore} ${time}</span>
        </div>`;
    }

    // Vitals
    if (e._type === 'vitals') {
      const fields = [];
      if (e.heart_rate) fields.push(`HR: ${e.heart_rate}bpm`);
      if (e.temperature) fields.push(`体温: ${e.temperature}°C`);
      if (e.spo2) fields.push(`SpO2: ${e.spo2}%`);
      if (e.bp_systolic) fields.push(`BP: ${e.bp_systolic}/${e.bp_diastolic}`);
      if (e.hrv) fields.push(`HRV: ${e.hrv}ms`);
      if (e.weight) fields.push(`体重: ${e.weight}kg`);
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:6px">
          <span>💓</span>
          <span style="font-size:12px;flex:1">${fields.join(' | ') || 'バイタルデータ'}</span>
          <span style="font-size:11px;color:var(--text-muted)">${time}</span>
        </div>`;
    }

    // Photos
    if (e._type === 'photo') {
      const safeFileName = Components.escapeHtml(e.filename || '画像');
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:6px">
          <span>📸</span>
          ${e.dataUrl ? `<img class="record-thumbnail" src="${e.dataUrl}" alt="${safeFileName}" onclick="app.openImagePreview(this.src, this.alt)">` : ''}
          <span style="font-size:12px;flex:1">${safeFileName} (${e.type || ''}, ${e.size ? (e.size/1024).toFixed(0)+'KB' : ''})</span>
          <span style="font-size:11px;color:var(--text-muted)">${time}</span>
        </div>`;
    }

    // Generic data entry
    const dataFields = Object.entries(e)
      .filter(([k, v]) => !skipKeys.includes(k) && v != null && v !== '' && !k.startsWith('_'))
      .map(([k, v]) => `<span style="margin-right:12px"><strong style="color:var(--text-muted)">${Components.escapeHtml(String(k))}:</strong> ${Components.escapeHtml(String(v))}</span>`)
      .join('');
    return `
      <div style="display:flex;align-items:start;gap:10px;padding:8px 14px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:6px">
        <span>${e._icon}</span>
        <div style="font-size:12px;flex:1;line-height:1.6">${dataFields || e._label}</div>
        <span style="font-size:11px;color:var(--text-muted);white-space:nowrap">${time}</span>
      </div>`;
  };

  // Render by date
  const dateGroups = Object.entries(byDate).map(([dateStr, entries]) => `
    <div style="margin-bottom:24px">
      <div style="font-size:14px;font-weight:700;color:var(--text-primary);margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid var(--accent);display:inline-block">${dateStr}</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;display:inline;margin-left:10px">${entries.length}件</div>
      ${entries.map(renderEntry).join('')}
    </div>
  `).join('');

  return `
  <div style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
    <div>
      <h2 style="font-size:18px;font-weight:700;margin-bottom:4px">経過・データ一覧</h2>
      <p style="font-size:12px;color:var(--text-muted)">${allEntries.length}件のデータ（日記・検査・薬剤・バイタル・写真）</p>
    </div>
    <div style="display:flex;gap:8px">
      <select class="form-select" style="width:auto;font-size:12px" onchange="app.filterTimeline(this.value)">
        <option value="">すべて表示</option>
        ${Object.entries(categoryLabels).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}
      </select>
    </div>
  </div>
  <div id="timeline-content">
    ${allEntries.length > 0 ? dateGroups : Components.emptyState('📅', 'データがありません', 'ダッシュボードから体調を記録すると、ここに時系列で表示されます。')}
  </div>
  <div id="image-preview-modal" class="image-preview-modal" hidden onclick="if(event.target===this)app.closeImagePreview()">
    <div class="image-preview-content">
      <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
        <button class="btn btn-outline btn-sm" onclick="app.closeImagePreview()">閉じる</button>
      </div>
      <img id="image-preview-img" src="" alt="拡大画像">
    </div>
  </div>`;
};

// Integrations Page — simple, glanceable connection status dashboard
// plus per-device cards with one-screen setup instructions.
App.prototype.render_integrations = function() {
  const textEntries = store.get('textEntries') || [];
  const syncs = store.get('integrationSyncs') || {};
  const calendarEvents = store.get('calendarEvents') || [];
  const fitbitConnected = Integrations.fitbit.connected;
  const hasIcsUrl = !!localStorage.getItem('ics_calendar_url');
  const hadOauthOnce = !!localStorage.getItem('google_calendar_oauth_connected');
  const gcalConnected = hasIcsUrl || hadOauthOnce;
  // OAuth tokens expire after 1 hour and we don't store them, so
  // OAuth-only connections are "one-shot" — user must re-authenticate
  // to sync again. Show a re-auth hint when OAuth was used but no
  // ICS URL is set (ICS URL is stateless and doesn't expire).
  const gcalNeedsReauth = hadOauthOnce && !hasIcsUrl;
  const now = Date.now();

  const countSource = (s) => textEntries.filter(e => e.source === s).length;
  const formatRel = (ts) => {
    if (!ts) return '';
    const diff = now - new Date(ts).getTime();
    if (isNaN(diff)) return '';
    if (diff < 60000) return 'たった今';
    if (diff < 3600000) return Math.floor(diff / 60000) + '分前';
    if (diff < 86400000) return Math.floor(diff / 3600000) + '時間前';
    return Math.floor(diff / 86400000) + '日前';
  };

  // Connection status per integration
  const statuses = [
    { key: 'apple_watch',      icon: '⌚', name: 'iPhone & Apple Watch', color: '#ef4444', count: countSource('apple_health'), lastSync: syncs.apple_health, anchor: 'apple-section' },
    { key: 'plaud',            icon: '🎙️', name: 'Plaud (会話録音)',     color: '#8b5cf6', count: countSource('plaud'),        lastSync: syncs.plaud,        anchor: 'plaud-section' },
    { key: 'fitbit',           icon: '🏃', name: 'Fitbit',              color: '#22c55e', count: countSource('fitbit'),       lastSync: syncs.fitbit,       anchor: 'fitbit-section' },
    { key: 'google_calendar',  icon: '📅', name: 'Googleカレンダー',     color: '#3b82f6', count: calendarEvents.length,       lastSync: syncs.google_calendar, anchor: 'gcal-section' },
  ];

  const lastAutoSync = syncs._lastAutoRun;
  const autoSyncActive = !!(Integrations.fitbit.accessToken || localStorage.getItem('ics_calendar_url'));

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">連携設定</h2>
    <p style="font-size:13px;color:var(--text-secondary)">一度連携すれば、アプリを開いている間は自動で同期され続けます。手動の取り込み作業は不要です。</p>
  </div>

  <!-- Auto-sync status banner — always visible so users know it's running -->
  <div style="margin-bottom:16px;padding:12px 16px;background:${autoSyncActive ? '#f0fdf4' : 'var(--bg-tertiary)'};border:1px solid ${autoSyncActive ? '#86efac' : 'var(--border)'};border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
    <div style="display:flex;align-items:center;gap:10px">
      <span style="font-size:20px">${autoSyncActive ? '🔄' : '⏸️'}</span>
      <div>
        <div style="font-size:13px;font-weight:700;color:${autoSyncActive ? '#166534' : 'var(--text-secondary)'}">
          ${autoSyncActive ? '自動同期: 有効' : '自動同期: 未設定'}
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:2px">
          ${autoSyncActive
            ? `Fitbit・Googleカレンダーは30分ごと + タブを開くたびに自動更新${lastAutoSync ? ' · 最終 ' + formatRel(lastAutoSync) : ''}`
            : '下のカードから連携を設定すると、以降は自動で同期されます'}
        </div>
      </div>
    </div>
    ${autoSyncActive ? `
      <button class="btn btn-sm btn-primary" onclick="Integrations.autoSync.runNow()" style="font-size:11px;white-space:nowrap">🔄 今すぐ同期</button>
    ` : ''}
  </div>

  <!-- Connection status grid — glanceable overview -->
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:24px">
    ${statuses.map(s => {
      const connected = s.count > 0 || (s.key === 'fitbit' && fitbitConnected) || (s.key === 'google_calendar' && gcalConnected);
      // Mark which sources are in the auto-sync loop
      const autoSynced = (s.key === 'fitbit' && fitbitConnected) || (s.key === 'google_calendar' && !!localStorage.getItem('ics_calendar_url'));
      return `
      <a onclick="document.getElementById('${s.anchor}').scrollIntoView({behavior:'smooth',block:'start'})"
         style="display:block;padding:14px 12px;background:var(--bg-primary);border:1.5px solid ${connected ? s.color : 'var(--border)'};border-radius:var(--radius-sm);cursor:pointer;text-decoration:none;color:inherit;transition:all 0.15s">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:20px">${s.icon}</span>
          <span style="font-size:12px;font-weight:600">${s.name}</span>
        </div>
        <div style="font-size:11px;color:${connected ? s.color : 'var(--text-muted)'};font-weight:600">
          ${connected ? '✓ 接続済' : '未設定'}
        </div>
        ${autoSynced ? `<div style="font-size:9px;color:${s.color};margin-top:2px;font-weight:600">🔄 自動同期中</div>` : ''}
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px">
          ${s.count > 0 ? s.count + '件' : ''}${s.count > 0 && s.lastSync ? ' · ' : ''}${s.lastSync ? formatRel(s.lastSync) : ''}
        </div>
      </a>`;
    }).join('')}
  </div>

  <!-- ═══ iPhone & Apple Watch ═══ -->
  <div class="card" style="margin-bottom:20px" id="apple-section">
    <div class="card-header">
      <span class="card-title">⌚🍎 iPhone & Apple Watch</span>
      <span class="tag ${countSource('apple_health') > 0 ? 'tag-success' : 'tag-warning'}" style="font-size:10px">
        ${countSource('apple_health') > 0 ? countSource('apple_health') + '件取込済' : '未接続'}
      </span>
    </div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;line-height:1.7">
        <strong>取り込めるデータ:</strong> 心拍数・安静時心拍・HRV (自律神経)・血中酸素・歩数・活動時間・睡眠・マインドフルネス・体温・体重・血圧・VO2Max。
        <br><span style="color:var(--accent)">💡 Apple Watchのデータも自動で取り込まれます（同じヘルスケアアプリに保存されるため）。</span>
      </p>

      <!-- Method 1: iOS Shortcut (recommended for daily sync) -->
      <div style="background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);padding:14px 16px;border-radius:var(--radius-sm);margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="font-size:18px">⚡</span>
          <span style="font-size:13px;font-weight:700;color:#92400e">方法1: iOSショートカット（推奨・毎日自動）</span>
        </div>
        <ol style="font-size:12px;color:#78350f;line-height:1.9;padding-left:20px;margin-bottom:10px">
          <li>iPhoneで「ショートカット」アプリを開く</li>
          <li>「+」で新規ショートカット作成</li>
          <li>アクション「<strong>ヘルスケアサンプルを検索</strong>」を追加<br>
            →「心拍数」「歩数」「睡眠分析」などを選択</li>
          <li>アクション「<strong>テキスト</strong>」で以下を貼り付け：<br>
            <code style="display:block;background:#fff7ed;padding:6px 8px;border-radius:4px;font-size:10px;margin-top:4px;color:#9a3412;word-break:break-all">{"source":"apple_watch","items":[{"type":"heart_rate","value":[検索結果]}]}</code></li>
          <li>アクション「<strong>Base64エンコード</strong>」を追加</li>
          <li>アクション「<strong>URLを開く</strong>」を追加 → URLに以下を入力：<br>
            <code id="shortcut-url-prefix" style="display:block;background:#fff7ed;padding:6px 8px;border-radius:4px;font-size:10px;margin-top:4px;color:#9a3412;word-break:break-all">${window.location.origin}${window.location.pathname}#import=</code>
            <span style="font-size:10px">（上のURL末尾に Base64エンコードの結果を連結）</span>
          </li>
          <li><strong>オートメーションで毎日自動実行 ←★ ここが重要</strong><br>
            ショートカットアプリ下部「オートメーション」タブ → 「+」<br>
            → 「個人用オートメーションを作成」<br>
            → 「時刻」を選択 → 21:00（就寝前など）→ 「毎日」<br>
            → 作成したショートカットを選択 → 「実行前に尋ねる」を<strong>オフ</strong>にする<br>
            <span style="color:#dc2626;font-weight:600">→ これで毎日21時に自動的にデータがアプリに送信されます。ユーザーは何もしなくてOK。</span>
          </li>
        </ol>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <button class="btn btn-sm btn-primary" onclick="app.copyShortcutUrlPrefix()" style="font-size:11px">URLをコピー</button>
          <button class="btn btn-sm btn-secondary" onclick="var u=app.buildSampleShortcutUrl();Components.showToast('サンプルURLをコピー。新しいタブで開くとデモデータが取り込まれます','info')" style="font-size:11px">サンプルURLをテスト</button>
        </div>
        <div style="margin-top:10px;padding:8px 10px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:11px;color:#78350f">
          <strong>💡 一度設定すれば、以降は完全自動</strong>。毎日同じ時刻に iOS が自動でショートカットを実行し、心拍数・歩数・睡眠などをこのアプリに送信します。アプリを開く必要すらありません。
        </div>
      </div>

      <!-- Method 2: XML file upload (for bulk / historical data) -->
      <div style="background:var(--bg-tertiary);padding:14px 16px;border-radius:var(--radius-sm);margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="font-size:18px">📂</span>
          <span style="font-size:13px;font-weight:700">方法2: ファイルアップロード（過去データを一括取込）</span>
        </div>
        <ol style="font-size:12px;color:var(--text-secondary);line-height:1.9;padding-left:20px;margin-bottom:10px">
          <li>iPhoneの「ヘルスケア」アプリ → 右上プロフィール → 「すべてのヘルスケアデータを書き出す」</li>
          <li>生成されたZIPを解凍し、中の<code>export.xml</code>を取り出す</li>
          <li>下のエリアにドラッグ＆ドロップ</li>
        </ol>
        <div class="upload-area" style="padding:20px;background:var(--bg-primary);border:2px dashed var(--border);border-radius:var(--radius-sm);text-align:center;cursor:pointer"
          onclick="document.getElementById('apple-health-file').click()"
          ondragover="event.preventDefault();this.style.borderColor='var(--accent)';this.style.background='var(--accent-bg)'"
          ondragleave="this.style.borderColor='var(--border)';this.style.background='var(--bg-primary)'"
          ondrop="event.preventDefault();this.style.borderColor='var(--border)';this.style.background='var(--bg-primary)';app.importAppleHealthFile(event.dataTransfer.files[0])">
          <div style="font-size:28px;margin-bottom:6px">📄</div>
          <div style="font-size:13px;font-weight:600">export.xml をドロップ</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px">またはクリックして選択</div>
          <input type="file" id="apple-health-file" hidden accept=".xml" onchange="app.importAppleHealthFile(this.files[0])">
        </div>
      </div>

      <div id="apple-import-status" style="margin-top:10px"></div>
    </div>
  </div>

  <!-- ═══ Plaud ═══ -->
  <div class="card" style="margin-bottom:20px" id="plaud-section">
    <div class="card-header">
      <span class="card-title">🎙️ Plaud (会話録音 → 文字起こし)</span>
      <span class="tag ${countSource('plaud') > 0 ? 'tag-success' : 'tag-warning'}" style="font-size:10px">
        ${countSource('plaud') > 0 ? countSource('plaud') + '件取込済' : '未接続'}
      </span>
    </div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;line-height:1.7">
        <strong>取り込めるデータ:</strong> 医師との診察会話、家族との会話、独り言、音声メモ。文字起こしされた内容を「禅トラック」プロンプトで自動分析し、健康・時間配分・意識の焦点・カロリー収支などをグラフで表示します。
      </p>

      <!-- ★ Primary: per-user Plaud email address ★ -->
      <div style="background:linear-gradient(135deg,#faf5ff 0%,#f3e8ff 100%);padding:16px;border:1.5px solid #8b5cf6;border-radius:var(--radius-sm);margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <span style="font-size:18px">📧</span>
          <span style="font-size:13px;font-weight:700;color:#6b21a8">あなた専用のPlaud受信アドレス（推奨）</span>
        </div>
        <div style="font-size:11px;color:#6b21a8;margin-bottom:10px;line-height:1.7">
          Plaudアプリの「オートフロー」に下のメールアドレスを登録してください。録音→文字起こし完了時に自動でこのアドレスへ送信され、受信したテキストはこのアプリで「禅トラック」分析され、ホーム画面にグラフが自動表示されます。
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:12px;background:#fff;border:1px solid #d8b4fe;border-radius:6px">
          <code id="plaud-email-display" style="flex:1;font-size:13px;font-weight:600;color:#6b21a8;font-family:'JetBrains Mono',monospace;word-break:break-all">${Integrations.generatePlaudEmail() || '未ログイン'}</code>
          <button class="btn btn-sm btn-primary" onclick="app.copyPlaudEmail()" style="font-size:11px;white-space:nowrap">コピー</button>
        </div>
        <div style="margin-top:10px;padding:8px 10px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:10px;color:#78350f;line-height:1.6">
          <strong>Plaud側の設定:</strong> アプリ → オートフロー → 新規作成 → トリガー「文字起こし完了」 → アクション「メール送信」 → 宛先に上記アドレスを設定。一度設定すれば、以降は録音するたびに自動でこちらに届きます。
        </div>
        ${(() => {
          const s = store.get('inboxStatus');
          if (!s) {
            return `<div style="margin-top:8px;padding:8px 10px;background:#f1f5f9;border-left:3px solid #94a3b8;border-radius:4px;font-size:10px;color:#475569;line-height:1.6">
              <strong>受信リスナー:</strong> 未起動（ログイン後に自動で接続されます）
            </div>`;
          }
          if (s.state === 'error') {
            return `<div style="margin-top:8px;padding:8px 10px;background:#fef2f2;border-left:3px solid #ef4444;border-radius:4px;font-size:10px;color:#991b1b;line-height:1.6">
              <strong>受信リスナー:</strong> エラー<br>
              <span style="font-family:monospace;word-break:break-all">${Components.escapeHtml(s.error || '')}</span><br>
              <span style="color:#7f1d1d">※ Firestore rules / Cloudflare Worker / Email Routing の設定を確認してください</span>
            </div>`;
          }
          if (s.state === 'live') {
            const pendText = (s.pending > 0) ? `（未処理 ${s.pending} 件を処理中...）` : '（待機中）';
            return `<div style="margin-top:8px;padding:8px 10px;background:#f0fdf4;border-left:3px solid #22c55e;border-radius:4px;font-size:10px;color:#14532d;line-height:1.6">
              <strong>受信リスナー:</strong> 接続中 hash=<code>${Components.escapeHtml(s.hash || '')}</code> ${pendText}
            </div>`;
          }
          return `<div style="margin-top:8px;padding:8px 10px;background:#fff7ed;border-left:3px solid #f97316;border-radius:4px;font-size:10px;color:#9a3412;line-height:1.6">
            <strong>受信リスナー:</strong> 接続中...
          </div>`;
        })()}
        <!-- Diagnostic panel: shows the 10 most recent inbox docs
             regardless of processed state. This is the fastest way
             to answer "did anything actually arrive?" without going
             into the Firebase Console. -->
        <div style="margin-top:10px">
          <button class="btn btn-outline btn-sm"
            style="font-size:10px;padding:4px 10px"
            onclick="app.loadPlaudInboxDiagnostic()">
            🔍 最近の受信メッセージを確認
          </button>
          <div id="plaud-inbox-diagnostic" style="margin-top:8px"></div>
        </div>
      </div>

      <!-- Fallback: manual paste for one-off / older recordings -->
      <details style="margin-bottom:8px">
        <summary style="cursor:pointer;font-size:12px;color:var(--text-secondary);padding:6px 0">📋 手動ペースト（メール連携前にすぐ試したい場合）</summary>
        <div style="background:var(--bg-tertiary);padding:14px 16px;border-radius:var(--radius-sm);margin-top:8px">
          <div class="form-group">
            <label class="form-label" style="font-size:11px">会話の日付</label>
            <input type="date" class="form-input" id="plaud-date" value="${new Date().toISOString().split('T')[0]}" style="width:200px;padding:8px 10px">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:11px">タイトル（例: 山村先生診察, 妻との会話）</label>
            <input type="text" class="form-input" id="plaud-title" placeholder="会話のタイトル..." style="padding:8px 10px">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-size:11px">文字起こしテキスト</label>
            <textarea class="form-textarea" id="plaud-transcript" rows="6" placeholder="Plaudの文字起こし結果をここにペーストしてください...&#10;&#10;[00:00] 先生: 最近の体調はいかがですか？&#10;[00:05] 自分: 倦怠感が続いていて..." style="padding:8px 10px"></textarea>
          </div>
          <button class="btn btn-primary" onclick="app.importPlaudTranscript()">取り込み＆禅トラック分析</button>
        </div>
      </details>
    </div>
  </div>

  <!-- ═══ Fitbit ═══ -->
  <div class="card" style="margin-bottom:20px" id="fitbit-section">
    <div class="card-header">
      <span class="card-title">🏃 Fitbit</span>
      <span class="tag ${fitbitConnected ? 'tag-success' : 'tag-warning'}" style="font-size:10px">${fitbitConnected ? '✓ 接続中' : '未接続'}</span>
    </div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;line-height:1.7">
        <strong>取り込めるデータ:</strong> 心拍数・安静時心拍・歩数・活動時間・消費カロリー・睡眠時間・睡眠ステージ。
      </p>
      ${fitbitConnected ? `
        <div style="padding:12px;background:#f0fdf4;border:1px solid #86efac;border-radius:var(--radius-sm);margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <div style="font-size:13px;color:#166534;font-weight:700">✓ Fitbitに接続されています</div>
            <span style="font-size:10px;background:#166534;color:#fff;padding:2px 8px;border-radius:10px;font-weight:600">🔄 自動同期中</span>
          </div>
          <div style="font-size:11px;color:#166534;margin-bottom:10px;line-height:1.6">
            アプリを開いている間、30分ごとに自動で今日のデータが更新されます。手動で取り込む必要はありません。
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-outline btn-sm" onclick="app.importFitbitHistory()" style="font-size:11px">過去7日分を一括取得</button>
            <button class="btn btn-outline btn-sm" onclick="Integrations.autoSync.runNow()" style="font-size:11px">🔄 今すぐ同期</button>
            <button class="btn btn-outline btn-sm" style="color:var(--danger);font-size:11px" onclick="Integrations.fitbit.disconnect();app.navigate('integrations')">接続解除</button>
          </div>
          <div id="fitbit-import-status" style="margin-top:10px"></div>
        </div>
      ` : `
        <div style="background:var(--bg-tertiary);padding:14px 16px;border-radius:var(--radius-sm);margin-bottom:12px">
          <div style="font-size:12px;color:var(--text-secondary);line-height:1.9">
            <strong>接続手順 (5分):</strong>
            <ol style="padding-left:20px;margin-top:6px">
              <li><a href="https://dev.fitbit.com/apps/new" target="_blank" rel="noopener" style="color:var(--accent)">Fitbit開発者ポータル</a> で「Personal」アプリを登録</li>
              <li>Redirect URL に <code style="background:var(--bg-primary);padding:2px 6px;border-radius:4px;font-size:10px">${window.location.origin + window.location.pathname}</code> を設定</li>
              <li>取得した Client ID を下に入力 →「Fitbitに接続」</li>
            </ol>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:11px">Fitbit OAuth2 Client ID</label>
          <input type="text" class="form-input" id="fitbit-client-id" value="${localStorage.getItem('fitbit_client_id') || ''}" placeholder="23XXXX" style="padding:8px 10px">
        </div>
        <button class="btn btn-primary" onclick="app.connectFitbit()">Fitbitに接続</button>
      `}
    </div>
  </div>

  <!-- ═══ Google Calendar ═══ -->
  <div class="card" style="margin-bottom:20px" id="gcal-section">
    <div class="card-header">
      <span class="card-title">📅 Googleカレンダー</span>
      <span class="tag ${gcalNeedsReauth ? 'tag-warning' : (gcalConnected ? 'tag-success' : 'tag-warning')}" style="font-size:10px">
        ${gcalNeedsReauth ? '⚠ 再認証が必要' : (gcalConnected ? '✓ 接続済み' : '未接続')}
      </span>
    </div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;line-height:1.7">
        <strong>取り込めるデータ:</strong> 予定・会議・通院。ダッシュボードで今日のスケジュールを自動表示し、活動負荷を可視化します。
      </p>
      ${gcalConnected ? `
        <div style="padding:12px;background:#eff6ff;border:1px solid #93c5fd;border-radius:var(--radius-sm);margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <div style="font-size:13px;color:#1e40af;font-weight:700">✓ カレンダーに接続されています</div>
            ${localStorage.getItem('ics_calendar_url')
              ? '<span style="font-size:10px;background:#1e40af;color:#fff;padding:2px 8px;border-radius:10px;font-weight:600">🔄 自動同期中</span>'
              : '<span style="font-size:10px;background:#1e40af;color:#fff;padding:2px 8px;border-radius:10px;font-weight:600">🪪 Google許可済み</span>'}
          </div>
          <div style="font-size:11px;color:#1e40af;margin-bottom:10px;line-height:1.6">
            ${localStorage.getItem('ics_calendar_url')
              ? 'アプリを開いている間、30分ごとに自動でイベントが更新されます。Googleカレンダーで予定を追加・変更すると、次の同期時に自動反映されます。'
              : 'Googleアカウントで読み取り許可済みです。予定を更新したら「今すぐ同期」を押すだけで最新イベントを再取り込みできます。'}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button class="btn btn-outline btn-sm" onclick="${localStorage.getItem('ics_calendar_url') ? 'Integrations.autoSync.runNow()' : 'app.connectGoogleCalendarWithGoogle()'}" style="font-size:11px">🔄 今すぐ同期</button>
            <button class="btn btn-outline btn-sm" style="color:var(--danger);font-size:11px" onclick="app.disconnectGoogleCalendar()">接続解除</button>
          </div>
        </div>
      ` : ''}
      <div style="background:#eef2ff;padding:14px 16px;border-radius:var(--radius-sm);margin-bottom:12px;border:1px solid #c7d2fe">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px">✅ かんたん連携（推奨）</div>
        <div style="font-size:12px;color:var(--text-secondary);line-height:1.9;margin-bottom:10px">
          「Googleで連携」を押して、Googleの画面で「カレンダーの閲覧を許可」をOKするだけで取り込みできます。
        </div>
        <button class="btn btn-primary" onclick="app.connectGoogleCalendarWithGoogle()">🔐 Googleで連携して取り込む</button>
        <div style="margin-top:10px;padding:8px 10px;background:#fff7ed;border-left:3px solid #f97316;border-radius:4px;font-size:11px;color:#9a3412;line-height:1.7">
          <strong>※ 「このアプリは Google で確認されていません」という警告が出た場合</strong>：<br>
          画面下の <b>「詳細」</b> をタップ → <b>「cares.advisers.jp（安全でないページ）に移動」</b> をタップしてそのまま進めてください。健康日記は本人のカレンダーを読み取るだけで、パスワードや書き込み権限は一切要求しません。
        </div>
      </div>
      <div style="background:var(--bg-tertiary);padding:14px 16px;border-radius:var(--radius-sm);margin-bottom:12px">
        <div style="font-size:13px;font-weight:700;margin-bottom:8px">📋 iCal URL を貼り付け（従来方式）</div>
        <ol style="font-size:12px;color:var(--text-secondary);line-height:1.9;padding-left:20px;margin-bottom:10px">
          <li>Googleカレンダーを開く → 右上の⚙️ → 「設定」</li>
          <li>左側メニューで同期したいカレンダーを選択</li>
          <li>「カレンダーの統合」セクション → 「<strong>iCal 形式の秘密アドレス</strong>」をコピー<br>
            <span style="font-size:10px;color:var(--text-muted)">（URLは <code>https://calendar.google.com/calendar/ical/.../basic.ics</code> の形式）</span></li>
          <li>下に貼り付け →「${localStorage.getItem('ics_calendar_url') ? '更新' : '接続'}」</li>
        </ol>
        <div class="form-group">
          <input type="text" class="form-input" id="gcal-ics-url" value="${Components.escapeHtml(localStorage.getItem('ics_calendar_url') || '')}" placeholder="https://calendar.google.com/calendar/ical/.../basic.ics" style="padding:8px 10px;font-size:11px">
        </div>
        <button class="btn btn-outline" onclick="app.connectGoogleCalendar()">📅 ${localStorage.getItem('ics_calendar_url') ? 'URLを更新' : 'URLで接続'}</button>
        <div id="gcal-import-status" style="margin-top:10px"></div>
      </div>
      <div style="margin-top:10px;padding:8px 10px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:11px;color:#78350f">
        <strong>💡 一度接続すれば、以降は自動</strong>。Googleカレンダーのパスワードは一切送信されません。「iCal 形式の秘密アドレス」は読み取り専用URLです。
      </div>
    </div>
  </div>

  <!-- Generic file fallback -->
  <div class="card">
    <div class="card-header"><span class="card-title">📁 その他のファイル取込</span></div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">CSV, JSON, XML, テキストファイルを自動判別して取り込みます。</p>
      <div class="upload-area" style="padding:20px;border:2px dashed var(--border);border-radius:var(--radius-sm);text-align:center;cursor:pointer"
        onclick="document.getElementById('generic-import-file').click()"
        ondragover="event.preventDefault();this.style.borderColor='var(--accent)'"
        ondragleave="this.style.borderColor='var(--border)'"
        ondrop="event.preventDefault();this.style.borderColor='var(--border)';Array.from(event.dataTransfer.files).forEach(f=>Integrations.importFile(f))">
        <div style="font-size:24px;margin-bottom:6px">📁</div>
        <div style="font-size:13px">ファイルをドロップまたはクリック</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:4px">対応: XML (Apple Health) · CSV · JSON · TXT (Plaud形式)</div>
        <input type="file" id="generic-import-file" hidden multiple accept=".xml,.csv,.json,.txt" onchange="Array.from(this.files).forEach(f=>Integrations.importFile(f))">
      </div>
    </div>
  </div>`;
};

// Admin Page
App.prototype.render_admin = function() {
  const model = store.get('selectedModel') || 'claude-opus-4-6';
  // Merge: DEFAULT_PROMPTS as base, user customPrompts override
  const userPrompts = store.get('customPrompts') || {};
  const prompts = { ...DEFAULT_PROMPTS, ...userPrompts };

  const modelCards = CONFIG.AI_MODELS.map(m => `
    <div class="action-card ${m.id === model ? 'selected' : ''}"
      onclick="app.setModel('${m.id}')"
      style="${m.id === model ? 'border-color:var(--accent);background:var(--accent-bg)' : ''}">
      <div class="action-card-title">${m.name}</div>
      <div class="action-card-desc">${m.provider} - ${m.description}</div>
      ${m.id === model ? '<span class="tag tag-accent">使用中</span>' : ''}
    </div>
  `).join('');

  // Group prompts by disease
  const promptsByDisease = {};
  Object.entries(prompts).forEach(([key, p]) => {
    const group = p.disease || '_universal';
    if (!promptsByDisease[group]) promptsByDisease[group] = [];
    promptsByDisease[group].push({ key, ...p });
  });

  const diseaseLabels = { '_universal': '共通（全疾患・健常者）' };
  CONFIG.DISEASE_CATEGORIES.forEach(cat => {
    cat.diseases.forEach(d => { diseaseLabels[d.id] = d.name; });
  });

  const promptEditors = Object.entries(promptsByDisease).map(([diseaseId, promptList]) => `
    <div style="margin-bottom:24px">
      <h4 style="font-size:13px;font-weight:600;color:var(--accent);margin-bottom:10px;padding:6px 12px;background:var(--accent-bg);border-radius:var(--radius-xs);display:inline-block">${diseaseLabels[diseaseId] || diseaseId}（${promptList.length}件）</h4>
      ${promptList.map(p => `
        <div class="card" style="margin-bottom:16px">
          <div class="card-header" style="padding:14px 20px">
            <div style="flex:1">
              <input class="form-input" data-prompt-name="${p.key}" value="${p.name}"
                style="font-weight:600;border:none;background:transparent;padding:0;font-size:14px;color:var(--text-primary);width:100%">
              <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${p.description || ''}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
              <select class="form-select" data-prompt-disease="${p.key}" style="font-size:11px;padding:4px 8px;width:auto">
                <option value="_universal" ${(p.disease||'_universal')==='_universal'?'selected':''}>共通</option>
                ${CONFIG.DISEASE_CATEGORIES.map(cat => `<optgroup label="${cat.name}">${cat.diseases.map(d => `<option value="${d.id}" ${p.disease===d.id?'selected':''}>${d.name}</option>`).join('')}</optgroup>`).join('')}
              </select>
              <select class="form-select" data-prompt-schedule="${p.key}" style="font-size:11px;padding:4px 8px;width:auto">
                <option value="daily" ${p.schedule==='daily'?'selected':''}>毎日</option>
                <option value="weekly" ${p.schedule==='weekly'?'selected':''}>毎週</option>
                <option value="on_data_update" ${p.schedule==='on_data_update'?'selected':''}>データ更新時</option>
                <option value="manual" ${p.schedule==='manual'?'selected':''}>手動</option>
              </select>
              <button class="btn btn-primary btn-sm" onclick="app.savePrompt('${p.key}')" style="padding:5px 12px">保存</button>
              <button class="btn btn-danger btn-sm" onclick="app.confirmAction(this,'削除',()=>app.deletePrompt('${p.key}'))" style="padding:5px 10px">×</button>
            </div>
          </div>
          <div class="card-body" style="padding:0">
            <textarea class="form-textarea" data-prompt-text="${p.key}"
              style="min-height:300px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.7;border:none;border-radius:0;border-top:1px solid var(--border);resize:vertical">${p.prompt}</textarea>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');

  const affConfig = store.get('affiliateConfig') || {};
  const affFields = CONFIG.AFFILIATE_NETWORKS.map(n => `
    <div class="form-group" style="display:flex;align-items:center;gap:12px">
      <label style="min-width:120px;font-size:13px;font-weight:500">${n.name}</label>
      <input class="form-input" name="aff_${n.id}" value="${affConfig[n.id]?.tag || n.tag || n.code || ''}" placeholder="タグ/コード" style="flex:1">
    </div>
  `).join('');

  // Flat list of all prompts for table view
  const allPromptsList = Object.entries(prompts);
  const totalPrompts = allPromptsList.length;

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">管理パネル</h2>
  </div>

  <!-- Admin Tabs -->
  <div class="tabs" id="admin-tabs">
    <div class="tab active" onclick="app.switchAdminTab('prompts')">プロンプト管理（${totalPrompts}）</div>
    <div class="tab" onclick="app.switchAdminTab('models')">AIモデル</div>
    <div class="tab" onclick="app.switchAdminTab('api')">APIキー</div>
    <div class="tab" onclick="app.switchAdminTab('usage')">📊 使用量</div>
    <div class="tab" onclick="app.switchAdminTab('users')">👥 ユーザ管理</div>
    <div class="tab" onclick="app.switchAdminTab('priority')">📈 事業優先度</div>
    <div class="tab" onclick="app.switchAdminTab('affiliate')">アフィリエイト</div>
    <div class="tab" onclick="app.switchAdminTab('professionals')">👔 専門家登録</div>
    <div class="tab" onclick="app.switchAdminTab('firebase')">Firebase</div>
    <div class="tab" onclick="app.switchAdminTab('data')">データ管理</div>
  </div>

  <!-- TAB: Prompts -->
  <div class="admin-tab-content" id="admin-tab-prompts">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div>
        <h3 style="font-size:15px;font-weight:600">全プロンプト一覧</h3>
        <p style="font-size:12px;color:var(--text-muted)">疾患別に分類されたAI分析プロンプト。クリックして編集。</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary btn-sm" onclick="app.addNewPrompt()">+ 新規プロンプト</button>
        <button class="btn btn-secondary btn-sm" onclick="app.resetPromptsToDefault()">デフォルトに戻す</button>
      </div>
    </div>

    <!-- Prompt Filter -->
    <div style="display:flex;gap:10px;margin-bottom:16px">
      <input type="text" class="form-input" placeholder="プロンプト名で検索..."
        style="flex:1" oninput="app.filterPrompts(this.value)">
      <select class="form-select" style="width:auto" onchange="app.filterPromptsByDisease(this.value)">
        <option value="">すべての疾患</option>
        <option value="_universal">共通</option>
        ${CONFIG.DISEASE_CATEGORIES.map(cat => `<optgroup label="${cat.name}">${cat.diseases.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}</optgroup>`).join('')}
      </select>
    </div>

    <!-- Prompt List -->
    <div id="prompt-list">
      ${allPromptsList.map(([key, p], idx) => `
        <div class="card prompt-item" data-prompt-key="${key}" data-disease="${p.disease || '_universal'}" style="margin-bottom:12px">
          <div class="card-header" style="padding:12px 16px;cursor:pointer" onclick="app.togglePromptEdit('${key}')">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
              <span style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono',monospace;min-width:24px">${idx+1}</span>
              <span style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.name}</span>
              <span class="tag tag-accent" style="font-size:9px;flex-shrink:0">${diseaseLabels[p.disease || '_universal'] || p.disease || '共通'}</span>
              <span class="tag ${p.schedule==='daily'?'tag-success':p.schedule==='weekly'?'tag-info':'tag-warning'}" style="font-size:9px;flex-shrink:0">${p.schedule || 'manual'}</span>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();app.savePrompt('${key}')" style="padding:3px 10px;font-size:11px">保存</button>
              <button class="btn btn-sm btn-danger" onclick="event.stopPropagation();app.confirmAction(this,'削除',()=>app.deletePrompt('${key}'))" style="padding:3px 8px;font-size:11px">×</button>
            </div>
          </div>
          <div class="card-body" id="prompt-edit-${key}" style="padding:0;display:none">
            <div style="display:flex;gap:10px;padding:12px 16px;background:var(--bg-tertiary);border-bottom:1px solid var(--border);flex-wrap:wrap">
              <div style="flex:1;min-width:200px">
                <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px">名前</label>
                <input class="form-input" data-prompt-name="${key}" value="${p.name}" style="font-size:13px">
              </div>
              <div style="min-width:160px">
                <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px">対象疾患</label>
                <select class="form-select" data-prompt-disease="${key}" style="font-size:12px">
                  <option value="_universal" ${(p.disease||'_universal')==='_universal'?'selected':''}>共通（全疾患）</option>
                  ${CONFIG.DISEASE_CATEGORIES.map(cat => `<optgroup label="${cat.name}">${cat.diseases.map(d => `<option value="${d.id}" ${p.disease===d.id?'selected':''}>${d.name}</option>`).join('')}</optgroup>`).join('')}
                </select>
              </div>
              <div style="min-width:120px">
                <label style="font-size:10px;color:var(--text-muted);display:block;margin-bottom:2px">スケジュール</label>
                <select class="form-select" data-prompt-schedule="${key}" style="font-size:12px">
                  <option value="daily" ${p.schedule==='daily'?'selected':''}>毎日</option>
                  <option value="weekly" ${p.schedule==='weekly'?'selected':''}>毎週</option>
                  <option value="on_data_update" ${p.schedule==='on_data_update'?'selected':''}>データ更新時</option>
                  <option value="manual" ${p.schedule==='manual'?'selected':''}>手動</option>
                </select>
              </div>
            </div>
            <textarea class="form-textarea" data-prompt-text="${key}"
              style="min-height:400px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.8;border:none;border-radius:0;resize:vertical;padding:16px">${p.prompt}</textarea>
            <div style="padding:10px 16px;background:var(--bg-tertiary);border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:11px;color:var(--text-muted)">${(p.prompt || '').length}文字</span>
              <button class="btn btn-primary btn-sm" onclick="app.savePrompt('${key}')">保存</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- TAB: Models -->
  <div class="admin-tab-content" id="admin-tab-models" style="display:none">
    <h3 style="font-size:15px;font-weight:600;margin-bottom:8px">AIモデル選択</h3>
    <div style="padding:10px 12px;background:var(--info-bg,#eef2ff);border-left:3px solid #6366f1;border-radius:var(--radius-sm);font-size:11px;color:#4338ca;margin-bottom:12px">
      <b>全ユーザー共通設定:</b> ここで選んだモデルは、サインインしているすべての利用者に共通で適用されます。
    </div>
    <div class="grid-auto" style="display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))">
      ${modelCards}
    </div>
  </div>

  <!-- TAB: API Keys -->
  <div class="admin-tab-content" id="admin-tab-api" style="display:none">
  <div class="card" style="margin-bottom:28px">
    <div class="card-header">
      <span class="card-title">APIキー設定</span>
      <span class="tag" id="api-key-status">確認中...</span>
    </div>
    <div class="card-body">
      <p style="font-size:12px;color:var(--text-muted);margin-bottom:8px">APIキーを設定すると、Claudeによるリアルタイム分析が有効になります。</p>
      <div style="padding:10px 12px;background:var(--info-bg,#eef2ff);border-left:3px solid #6366f1;border-radius:var(--radius-sm);font-size:11px;color:#4338ca;margin-bottom:16px">
        <b>全ユーザー共通設定:</b> ここで保存したAPIキー・プロキシURLは、サインインしているすべての利用者に共通で適用されます。利用者ごとに個別に設定する必要はありません。
      </div>
      <div style="padding:10px 12px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:var(--radius-sm);font-size:11px;color:#78350f;margin-bottom:16px;line-height:1.7">
        🔒 <b>セキュリティ:</b> すべての Claude API 呼び出しは Cloudflare Worker プロキシを経由します。
        プロンプトインジェクション防御・拒否回避・レスポンス検証はサーバー側で処理されます。
      </div>
      <div class="form-group" id="proxy-url-group">
        <label class="form-label">APIプロキシURL</label>
        <input type="text" class="form-input" id="input-proxy-url" placeholder="https://your-worker.workers.dev" autocomplete="off">
        <span style="font-size:11px;color:var(--text-muted);margin-top:4px;display:block">Cloudflare Worker のデプロイ後にURLを貼り付け。未設定の場合デフォルトの Worker が使われます。</span>
      </div>
      <div class="form-group">
        <label class="form-label">Anthropic API Key</label>
        <input type="text" class="form-input" id="input-apikey-anthropic" placeholder="sk-ant-api03-..." autocomplete="off">
        <span style="font-size:11px;color:var(--text-muted);margin-top:4px;display:block">console.anthropic.com でキーを取得</span>
      </div>
      <div class="form-group">
        <label class="form-label">OpenAI API Key（GPT-4o）</label>
        <input type="text" class="form-input" id="input-apikey-openai" placeholder="sk-proj-..." autocomplete="off">
      </div>
      <div class="form-group">
        <label class="form-label">Google AI API Key（Gemini 2.5 Pro）</label>
        <input type="text" class="form-input" id="input-apikey-google" placeholder="AIza..." autocomplete="off">
      </div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" onclick="app.saveApiKeys()">APIキーを保存</button>
        <button class="btn btn-secondary" onclick="app.testApiKey()" style="margin-left:8px">接続テスト</button>
        <div id="api-test-result" style="margin-top:8px"></div>
        <button class="btn btn-danger btn-sm" onclick="app.clearApiKeys()">すべて削除</button>
      </div>
    </div>
  </div>

  </div>

  <!-- TAB: Usage Dashboard -->
  <div class="admin-tab-content" id="admin-tab-usage" style="display:none">
    ${app.renderUsageDashboard()}
  </div>

  <!-- TAB: User Management -->
  <div class="admin-tab-content" id="admin-tab-users" style="display:none">
    <div style="margin-bottom:16px">
      <h3 style="font-size:16px;font-weight:700;margin-bottom:4px">👥 ユーザ管理</h3>
      <p style="font-size:12px;color:var(--text-muted)">登録ユーザー数とそれぞれの利用状況を把握し、サービス改善に活用します。</p>
    </div>
    <div id="users-dashboard-content">
      <div class="card"><div class="card-body" style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">
        タブを開くと読み込みます…
      </div></div>
    </div>
  </div>

  <!-- TAB: Business Priority Matrix -->
  <div class="admin-tab-content" id="admin-tab-priority" style="display:none">
    <div style="margin-bottom:16px">
      <h3 style="font-size:16px;font-weight:700;margin-bottom:4px">📈 事業優先度マトリクス</h3>
      <p style="font-size:12px;color:var(--text-muted)">
        対応疾患を <strong>患者数ボリューム（横軸）</strong> × <strong>管理密度（縦軸）</strong> で 2 次元プロットし、事業投資の優先順位を判断するツールです。
      </p>
    </div>
    <div id="priority-matrix-container">
      <div class="card"><div class="card-body" style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">
        タブを開くと読み込みます…
      </div></div>
    </div>
  </div>

  <!-- TAB: Affiliate -->
  <div class="admin-tab-content" id="admin-tab-affiliate" style="display:none">
  <div class="card" style="margin-bottom:28px">
    <div class="card-header"><span class="card-title">アフィリエイト設定</span></div>
    <div class="card-body">
      <form onsubmit="app.saveAffiliateConfig(event)">
        ${affFields}
        <button type="submit" class="btn btn-primary btn-sm" style="margin-top:12px">設定を保存</button>
      </form>
    </div>
  </div>
  </div>

  <!-- TAB: Professionals -->
  <div class="admin-tab-content" id="admin-tab-professionals" style="display:none">
    <div style="margin-bottom:16px">
      <h3 style="font-size:16px;font-weight:700;margin-bottom:4px">👔 専門家登録</h3>
      <p style="font-size:12px;color:var(--text-muted);line-height:1.7">
        利用者が自立支援・障害年金・傷病手当金などの金銭的サポートを申請する際、入力された内容がここで登録された専門家（社労士・税理士・弁護士・医療ソーシャルワーカー・FP）へ直接メールで送信されます。<br>
        各制度に対応する専門家を1名以上登録してください。
      </p>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header"><span class="card-title">メール送信設定</span></div>
      <div class="card-body" style="padding:14px 16px">
        <div class="form-group">
          <label class="form-label">メール送信Worker URL（任意）</label>
          <input type="text" class="form-input" id="input-mailer-url" placeholder="https://professional-mailer.your-account.workers.dev" autocomplete="off">
          <span style="font-size:11px;color:var(--text-muted);margin-top:4px;display:block">
            未設定の場合は利用者の端末の mailto: リンクが開きます。Worker を設定すると Resend 等を経由して自動送信されます。
          </span>
        </div>
        <div class="form-group">
          <label class="form-label">差出人表示名</label>
          <input type="text" class="form-input" id="input-mailer-sender-name" placeholder="健康日記 申請サポート" autocomplete="off">
        </div>
        <button class="btn btn-primary btn-sm" onclick="app.saveMailerConfig()">メール設定を保存</button>
      </div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-header">
        <span class="card-title">登録済み専門家</span>
        <button class="btn btn-primary btn-sm" onclick="app.addProfessionalRow()">＋ 追加</button>
      </div>
      <div class="card-body" style="padding:14px 16px">
        <div id="professionals-list">
          <div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px">タブを開くと読み込みます…</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px">
          <button class="btn btn-primary btn-sm" onclick="app.saveProfessionalsFromUI()">すべての専門家を保存</button>
          <span style="font-size:11px;color:var(--text-muted);align-self:center">保存すると全利用者の「サポート申請」画面に反映されます</span>
        </div>
      </div>
    </div>
  </div>

  <!-- TAB: Firebase -->
  <div class="admin-tab-content" id="admin-tab-firebase" style="display:none">
  <div class="card" style="margin-bottom:28px">
    <div class="card-header">
      <span class="card-title">Firebase設定</span>
      <span class="tag" id="firebase-status">確認中...</span>
    </div>
    <div class="card-body">
      <div class="form-group"><label class="form-label">API Key</label><input type="text" class="form-input" id="fb-apiKey" placeholder="AIzaSy..." autocomplete="off"></div>
      <div class="form-group"><label class="form-label">Auth Domain</label><input type="text" class="form-input" id="fb-authDomain" placeholder="your-project.firebaseapp.com" autocomplete="off"></div>
      <div class="form-group"><label class="form-label">Project ID</label><input type="text" class="form-input" id="fb-projectId" placeholder="your-project-id" autocomplete="off"></div>
      <div class="form-group"><label class="form-label">Storage Bucket</label><input type="text" class="form-input" id="fb-storageBucket" placeholder="your-project.appspot.com" autocomplete="off"></div>
      <div class="form-group"><label class="form-label">Messaging Sender ID</label><input type="text" class="form-input" id="fb-messagingSenderId" placeholder="123456789" autocomplete="off"></div>
      <div class="form-group"><label class="form-label">App ID</label><input type="text" class="form-input" id="fb-appId" placeholder="1:123456789:web:abc123" autocomplete="off"></div>
      <div style="display:flex;gap:10px">
        <button class="btn btn-primary" onclick="app.saveFirebaseConfig()">保存して接続</button>
        <button class="btn btn-danger btn-sm" onclick="app.clearFirebaseConfig()">削除</button>
      </div>
    </div>
  </div>
  </div>

  <!-- TAB: Data -->
  <div class="admin-tab-content" id="admin-tab-data" style="display:none">
  <!-- Admin Users -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-header"><span class="card-title">管理者ユーザー</span></div>
    <div class="card-body">
      <div id="admin-list" style="margin-bottom:12px">
        ${app.ADMIN_EMAILS.map(e => `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)">
            <span style="font-size:13px">${e}</span>
            ${e === 'agewaller@gmail.com' ? '<span style="font-size:10px;color:var(--text-muted)">オーナー</span>' : `<button class="btn btn-sm btn-danger" onclick="app.removeAdmin('${e}')">削除</button>`}
          </div>
        `).join('')}
      </div>
      <div style="display:flex;gap:8px">
        <input type="email" class="form-input" id="new-admin-email" placeholder="追加するメールアドレス" style="flex:1">
        <button class="btn btn-primary btn-sm" onclick="app.addAdmin()">追加</button>
      </div>
    </div>
  </div>

  <!-- Data Management -->
  <div class="card">
    <div class="card-header"><span class="card-title">データ管理</span></div>
    <div class="card-body" style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn btn-primary" onclick="app.generateDemoData()">デモデータ生成</button>
      <button class="btn btn-secondary" onclick="app.exportData()">データエクスポート</button>
      <button class="btn btn-warning" onclick="app.deduplicateRecords()">重複レコード削除</button>
      <button class="btn btn-warning" onclick="app.cleanupLegacyAIComments()">旧分析データ削除</button>
      <button class="btn btn-danger" onclick="app.confirmAction(this,'データ全削除',()=>{store.clearAll();location.reload()})">データ全削除</button>
    </div>
    <div style="padding:8px 16px 0;font-size:11px;color:var(--text-muted)">「重複レコード削除」は同じ内容のレコードを統合します。「旧分析データ削除」は過去の不正な形式のAI分析結果（生JSONとして表示されるもの）を消去します。どちらも一度だけ実行すれば十分です。</div>
  </div>
  </div>`;
};

// Settings Page
App.prototype.render_settings = function() {
  const user = store.get('user') || {};
  const selected = store.get('selectedDiseases') || [];

  // Build disease checkboxes
  const diseaseSections = CONFIG.DISEASE_CATEGORIES.map(cat => `
    <div style="margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:6px">${cat.icon} ${cat.name}</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${cat.diseases.map(d => `
          <label style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:${selected.includes(d.id)?'var(--accent-bg)':'var(--bg-tertiary)'};border:1px solid ${selected.includes(d.id)?'var(--accent-border)':'var(--border)'};border-radius:16px;cursor:pointer;font-size:11px">
            <input type="checkbox" class="settings-disease-cb" value="${d.id}" ${selected.includes(d.id)?'checked':''}
              style="width:12px;height:12px;accent-color:var(--accent)"
              onchange="var l=this.closest('label');if(this.checked){l.style.background='var(--accent-bg)';l.style.borderColor='var(--accent-border)'}else{l.style.background='var(--bg-tertiary)';l.style.borderColor='var(--border)'}">
            ${d.name}
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');

  return `
  <div style="margin-bottom:20px">
    <h2 style="font-size:18px;font-weight:700;margin-bottom:6px">設定</h2>
  </div>

  <!-- Disease Selection -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-header">
      <span class="card-title">対象疾患</span>
      <span class="tag tag-accent" id="settings-disease-count">${selected.length}件選択</span>
    </div>
    <div class="card-body" style="padding:12px 16px">
      ${diseaseSections}
      <button class="btn btn-primary btn-sm" onclick="app.saveDiseaseSettings()" style="margin-top:8px">疾患を保存</button>
    </div>
  </div>

  <!-- Profile -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-header"><span class="card-title">プロフィール</span></div>
    <div class="card-body" style="padding:12px 16px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div class="user-avatar" style="width:40px;height:40px;font-size:16px">${user.displayName?.[0] || '?'}</div>
        <div>
          <div style="font-size:14px;font-weight:600">${Components.escapeHtml(user.displayName || 'ゲスト')}</div>
          <div style="font-size:12px;color:var(--text-muted)">${Components.escapeHtml(user.email || '')}</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div class="form-group" style="margin:0"><label class="form-label">年齢</label><input type="number" class="form-input" id="profile-age" placeholder="50" min="0" max="120" style="padding:8px 10px"></div>
        <div class="form-group" style="margin:0"><label class="form-label">性別</label><select class="form-select" id="profile-gender" style="padding:8px 10px"><option value="">未選択</option><option value="male">男性</option><option value="female">女性</option><option value="other">その他</option></select></div>
        <div class="form-group" style="margin:0"><label class="form-label">身長(cm)</label><input type="number" class="form-input" id="profile-height" placeholder="170" style="padding:8px 10px"></div>
        <div class="form-group" style="margin:0"><label class="form-label">体重(kg)</label><input type="number" class="form-input" id="profile-weight" placeholder="65" style="padding:8px 10px"></div>
      </div>

      <div class="form-group"><label class="form-label">居住地</label><input type="text" class="form-input" id="profile-location" placeholder="神奈川県秦野市" style="padding:8px 10px"></div>
      <div class="form-group"><label class="form-label">通院範囲</label><select class="form-select" id="profile-travel-range" style="padding:8px 10px"><option value="local">近隣</option><option value="prefecture">県内</option><option value="region" selected>関東圏</option><option value="national">国内全域</option><option value="international">海外含</option></select></div>
      <div class="form-group"><label class="form-label">言語</label><select class="form-select" id="profile-language" style="padding:8px 10px"><option value="ja" selected>日本語</option><option value="en">English</option><option value="zh">中文</option><option value="ko">한국어</option></select></div>
      <div class="form-group"><label class="form-label">備考</label><textarea class="form-textarea" id="profile-notes" rows="2" placeholder="アレルギー、既往歴、家族歴..." style="padding:8px 10px"></textarea></div>

      <button class="btn btn-primary btn-sm" onclick="app.saveProfile()">プロフィールを保存</button>
    </div>
  </div>

  <!-- Daily Reminder -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-header"><span class="card-title">🔔 毎日のお知らせ</span></div>
    <div class="card-body" style="padding:14px 16px">
      <label style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:var(--bg-tertiary);border-radius:8px;cursor:pointer;margin-bottom:10px">
        <input type="checkbox" id="toggle-reminder"
          ${store.get('reminderEnabled') ? 'checked' : ''}
          onchange="app.toggleReminder(this.checked)"
          style="margin-top:2px;width:16px;height:16px;accent-color:var(--accent);flex-shrink:0">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:2px">今日未記録の場合にお知らせ</div>
          <div style="font-size:11px;color:var(--text-muted);line-height:1.7">指定の時刻にまだ記録していない場合、ブラウザ通知でお知らせします。連続記録を続けるサポートになります。</div>
        </div>
      </label>
      <div style="display:flex;align-items:center;gap:10px;padding:8px 4px">
        <label style="font-size:12px;color:var(--text-muted);white-space:nowrap">通知時刻</label>
        <input type="time" id="reminder-time" value="${store.get('reminderTime') || '20:00'}"
          onchange="app.saveReminderTime(this.value)"
          style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:13px;background:var(--bg-primary)">
        <div id="reminder-status" style="font-size:11px;color:var(--text-muted)"></div>
      </div>
    </div>
  </div>

  <!-- Privacy Settings -->
  <div class="card" style="margin-bottom:16px">
    <div class="card-header">
      <span class="card-title">🔒 プライバシー設定</span>
      <a href="#" onclick="app.navigate('privacy');return false" style="font-size:10px;color:#6366f1">プライバシーと安全ページ →</a>
    </div>
    <div class="card-body" style="padding:14px 16px">
      <label style="display:flex;align-items:flex-start;gap:10px;padding:10px;background:var(--bg-tertiary);border-radius:8px;cursor:pointer">
        <input type="checkbox" id="toggle-privacy-anonymize"
          ${Privacy.isEnabled() ? 'checked' : ''}
          onchange="Privacy.setEnabled(this.checked);Components.showToast(this.checked?'AI送信前の匿名化を有効にしました':'AI送信前の匿名化を無効にしました','success')"
          style="margin-top:2px;width:16px;height:16px;accent-color:var(--accent);flex-shrink:0">
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text-primary);margin-bottom:2px">AI 送信前の匿名化</div>
          <div style="font-size:11px;color:var(--text-muted);line-height:1.7">
            AI に送る前に、メールアドレス・電話番号・郵便番号・住所・人名 (〜さん/〜先生) を自動的に <code>[メール]</code>・<code>[電話]</code> 等のラベルに置き換えます。分析の精度がやや下がる可能性がありますが、万一の漏洩リスクを下げたい方におすすめです。
          </div>
        </div>
      </label>
    </div>
  </div>

  <!-- Data Export -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-header"><span class="card-title">データ管理</span></div>
    <div class="card-body" style="display:flex;flex-direction:column;gap:12px">
      <div>
        <label class="form-label">データインポート（JSONファイル）</label>
        <input type="file" class="form-input" accept=".json" onchange="app.importDataFile(this.files[0])">
      </div>
      <button class="btn btn-secondary" onclick="app.exportData()">すべてのデータをエクスポート (JSON)</button>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
        <button class="btn btn-danger" style="width:100%;padding:14px;font-size:14px" id="logout-btn" onclick="app.confirmLogout()">ログアウト</button>
      </div>
      <!-- Account deletion (退会) — last resort, hard delete from
           Firestore and Firebase Auth. Users must explicitly confirm
           by pressing the inline confirmAction button twice. -->
      <div style="margin-top:4px;padding-top:12px;border-top:1px dashed var(--danger,#dc2626)">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;line-height:1.7">
          ⚠ アカウントを完全に削除するとクラウド上のデータも全て消去され、復元できません。削除前にエクスポートをおすすめします。
        </div>
        <button class="btn btn-danger btn-sm" style="width:100%"
          onclick="app.confirmAction(this,'アカウントを完全削除する',()=>app.deleteAccount())">
          🗑 アカウントを完全削除（退会）
        </button>
      </div>
    </div>
  </div>`;
};

// Export Data utility
// Export ALL user data — every collection the app stores. No data
// should ever be silently omitted. Users must be able to retrieve
// In-app browser breakout helpers. iOS WebViews (LINE, Instagram,
// Facebook, etc.) block Google OAuth, so the login screen offers
// these buttons to nudge users into Safari/Chrome where the redirect
// flow works. `x-safari-` URL schemes only function from the
// Shortcuts app, not from anchor tags inside a WebView, so we use
// navigator.share + clipboard fallbacks instead.
App.prototype.openInBrowser = async function() {
  const url = (typeof location !== 'undefined') ? location.href : 'https://cares.advisers.jp';
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: '健康日記', url });
    } catch (e) {
      // User canceled — fall back to clipboard so they can still proceed.
      this.copyCurrentUrl();
    }
  } else {
    Components.showToast('お使いのブラウザは共有メニューに対応していません。URLをコピーします。', 'info');
    this.copyCurrentUrl();
  }
};

App.prototype.copyCurrentUrl = function() {
  const url = (typeof location !== 'undefined') ? location.href : 'https://cares.advisers.jp';
  const fallback = () => {
    try {
      window.prompt('以下のURLをコピーしてSafari/Chromeで開いてください:', url);
    } catch (_) {
      Components.showToast('URLのコピーに失敗しました', 'error');
    }
  };
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      Components.showToast('URLをコピーしました。Safari/Chromeのアドレスバーに貼り付けてください', 'success');
    }).catch(fallback);
  } else {
    fallback();
  }
};

// ============================================================
// Privacy & Safety page
// ------------------------------------------------------------
// Stand-alone page (works both pre-login and post-login) that
// explains, in plain language, who can see the user's data,
// what happens when we call AI providers, where the data is
// stored, and how to delete everything. The page also lists the
// certification roadmap so users can see the operator taking
// privacy seriously even before Pマーク審査 is complete.
// ============================================================
App.prototype.render_privacy = function() {
  const loggedIn = !!store.get('isAuthenticated');
  const backTarget = loggedIn ? 'settings' : 'login';
  const contact = (typeof CONFIG !== 'undefined' && CONFIG.CONTACT_EMAIL) || 'info@bluemarl.in';

  return `
  <div style="max-width:880px;margin:0 auto;padding:20px 16px 60px">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px">
      <button class="btn btn-outline btn-sm" onclick="app.navigate('${backTarget}')"
        style="padding:6px 12px;font-size:12px">← 戻る</button>
      <h1 style="font-size:22px;font-weight:800;margin:0">🔒 プライバシーと安全</h1>
    </div>

    <div style="padding:18px 20px;background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%);border:1.5px solid #6366f1;border-radius:14px;margin-bottom:20px">
      <div style="font-size:14px;font-weight:700;color:#3730a3;margin-bottom:6px">あなたのデータはあなたのものです。</div>
      <div style="font-size:12px;color:#4338ca;line-height:1.8">
        健康日記は、慢性疾患と日々向き合う方が安心して記録を残せるように作られています。
        運営者であっても、本人の明示的な許可なく中身を閲覧することはありません。
        このページでは、多くの方が不安に感じる点を一つずつお答えします。
      </div>
    </div>

    <!-- ① 誰が見られるか -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-header"><span class="card-title">❓ 誰があなたのデータを見られますか？</span></div>
      <div class="card-body" style="padding:16px 20px;font-size:13px;line-height:1.9;color:var(--text-primary)">
        <strong style="color:#16a34a">本人のみ</strong>です。
        データは Google Cloud の Firestore に「ユーザーごとに完全に分離」された形で保存されており、
        セキュリティルール (<code>firestore.rules</code>) でログイン中の本人しか読み書きできないようにしています。
        <div style="margin-top:10px;padding:10px 14px;background:var(--bg-tertiary);border-radius:6px;font-size:11px;font-family:'JetBrains Mono',monospace;color:var(--text-secondary);line-height:1.6">
          allow read, write: if request.auth.uid == userId;
        </div>
        <div style="margin-top:10px;font-size:12px;color:var(--text-muted)">
          ※ 運営者アカウント (agewaller@gmail.com) は「ユーザー数」と「最終アクセス日時」だけを集計閲覧できます。記録本文は見ません。見る権限が必要になる場合 (本人の要望によるサポート等) は、事前に本人の許可を取ります。
        </div>
      </div>
    </div>

    <!-- ② AI と学習 -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-header"><span class="card-title">❓ AI に送ったデータは、学習に使われますか？</span></div>
      <div class="card-body" style="padding:16px 20px;font-size:13px;line-height:1.9">
        <strong style="color:#16a34a">使われません。</strong>
        健康日記が呼び出している 3 社 (Anthropic / OpenAI / Google) は、
        いずれも <strong>API 経由で送られたデータをモデル学習には使わない</strong>と公式に明記しています:
        <ul style="margin:10px 0 10px 20px;padding:0;font-size:12px;color:var(--text-secondary);line-height:1.9">
          <li><a href="https://www.anthropic.com/legal/commercial-terms" target="_blank" rel="noopener" style="color:#6366f1">Anthropic Commercial Terms</a> — API 入力・出力はデフォルトでモデル学習に使用しない</li>
          <li><a href="https://openai.com/policies/api-data-usage-policies" target="_blank" rel="noopener" style="color:#6366f1">OpenAI API Data Usage Policies</a> — 2023 年以降、API データは学習に使用しない</li>
          <li><a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener" style="color:#6366f1">Google Gemini API Terms</a> — 有料 API プランで同様の扱い</li>
        </ul>
        <div style="margin-top:10px;padding:10px 14px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:11px;color:#78350f;line-height:1.7">
          <strong>さらに心配な方へ:</strong> 設定画面の「AI 送信前の匿名化」をオンにすると、
          送信前に本文中のメールアドレス・電話番号・郵便番号・住所・人名を自動的にマスクしてから AI に渡します。
          (分析の精度はやや下がる可能性があります)
        </div>
      </div>
    </div>

    <!-- ③ 保存場所 -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-header"><span class="card-title">❓ どこに保存されますか？</span></div>
      <div class="card-body" style="padding:16px 20px;font-size:13px;line-height:1.9">
        <strong>Google Cloud Firestore</strong> に保存されます。Google Cloud はグローバルで以下の認証を取得しています:
        <ul style="margin:10px 0 10px 20px;padding:0;font-size:12px;color:var(--text-secondary);line-height:1.9">
          <li>ISO/IEC 27001 (情報セキュリティマネジメント)</li>
          <li>ISO/IEC 27017 (クラウドサービスセキュリティ)</li>
          <li>ISO/IEC 27018 (クラウド上の個人情報保護)</li>
          <li>ISO/IEC 27701 (プライバシー情報マネジメント)</li>
          <li>SOC 1 / SOC 2 / SOC 3</li>
        </ul>
        <div style="margin-top:8px;font-size:12px;color:var(--text-muted)">
          通信は全て TLS で暗号化され、保存データも Google 側で AES-256 相当の暗号化が適用されます。
          運営者は Firestore への root 権限を持ちません (Firebase のコンソールアクセスのみ)。
        </div>
      </div>
    </div>

    <!-- ④ データを消したいとき -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-header"><span class="card-title">❓ いつでも全データを消せますか？</span></div>
      <div class="card-body" style="padding:16px 20px;font-size:13px;line-height:1.9">
        <strong style="color:#16a34a">はい、いつでも完全に削除できます。</strong>
        3 つの方法をご用意しています:
        <ol style="margin:10px 0 14px 20px;padding:0;font-size:12px;color:var(--text-secondary);line-height:2">
          <li><strong>エクスポート</strong>: 設定 → 「すべてのデータをエクスポート」で JSON ファイルとしてダウンロード</li>
          <li><strong>ブラウザだけ削除</strong>: 管理パネル → データ管理 → 「データ全削除」(クラウドは残ります)</li>
          <li><strong>完全退会</strong>: 下のボタンで Firestore・Firebase Auth 両方からアカウントを削除 (復元不可)</li>
        </ol>
        ${loggedIn ? `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
          <button class="btn btn-secondary btn-sm" onclick="app.exportData()">📥 データをエクスポート</button>
          <button class="btn btn-danger btn-sm" onclick="app.confirmAction(this,'完全退会',()=>app.deleteAccount())">🗑 アカウントを完全削除する</button>
        </div>
        <div style="margin-top:8px;font-size:10px;color:var(--text-muted)">※ 完全削除は取り消せません。エクスポートしてから実行することをおすすめします。</div>
        ` : `
        <div style="font-size:12px;color:var(--text-muted)">※ 退会はログイン後に実行できます。</div>
        `}
      </div>
    </div>

    <!-- ⑤ 漏洩時の対応 -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-header"><span class="card-title">❓ 万が一情報が漏洩したら？</span></div>
      <div class="card-body" style="padding:16px 20px;font-size:13px;line-height:1.9">
        個人情報保護法 (日本) と GDPR (EU) の通知義務に従い、運営者が漏洩を認知した時点から
        <strong>72 時間以内に登録メールアドレス宛てに通知</strong>します。
        影響範囲・原因・対応状況・ユーザーへの推奨措置を含めてお知らせします。
        <div style="margin-top:8px;font-size:12px">
          <strong>運営者連絡先:</strong>
          <a href="mailto:${Components.escapeHtml(contact)}" style="color:#6366f1">${Components.escapeHtml(contact)}</a>
        </div>
      </div>
    </div>

    <!-- ⑥ 認証取得ロードマップ -->
    <div class="card" style="margin-bottom:14px;border:2px solid #6366f1">
      <div class="card-header" style="background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%)">
        <span class="card-title">🏅 認証取得ロードマップ</span>
        <span class="tag tag-accent" style="font-size:10px">透明性宣言</span>
      </div>
      <div class="card-body" style="padding:16px 20px">
        <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;line-height:1.8">
          第三者認証はまだ審査中ですが、運営者は以下の段階で取得を進めています。
          認証取得前の段階でも、実体として同等の運用を目指しています。
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:4px">
            <span style="font-size:18px">✅</span>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:700;color:#14532d">3省2ガイドライン (医療情報) 準拠宣言</div>
              <div style="font-size:10px;color:#15803d">厚労省・総務省・経産省の医療情報システム安全管理ガイドライン。自主的な準拠宣言書を発行・公開しました。</div>
            </div>
            <a href="https://github.com/agewaller/stock-screener/blob/main/docs/3省2GL準拠宣言.md" target="_blank" rel="noopener"
              style="font-size:10px;color:#15803d;text-decoration:underline;white-space:nowrap">全文 →</a>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#fff7ed;border-left:4px solid #f59e0b;border-radius:4px">
            <span style="font-size:18px">🔄</span>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:700;color:#9a3412">プライバシーマーク (JIS Q 15001)</div>
              <div style="font-size:10px;color:#c2410c">JIPDEC 審査。個人情報の取扱い体制を第三者が審査する国内最も認知度の高い認証。</div>
            </div>
            <span style="font-size:10px;color:#c2410c">申請準備中</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:#f1f5f9;border-left:4px solid #94a3b8;border-radius:4px">
            <span style="font-size:18px">⏳</span>
            <div style="flex:1">
              <div style="font-size:12px;font-weight:700;color:#334155">ISO/IEC 27001 + 27701</div>
              <div style="font-size:10px;color:#475569">情報セキュリティ + プライバシー情報マネジメントの国際認証。Pマーク取得後に検討。</div>
            </div>
            <span style="font-size:10px;color:#475569">検討中</span>
          </div>
        </div>
        <div style="margin-top:12px;padding:8px 12px;background:#f8fafc;border-radius:6px;font-size:10px;color:var(--text-muted);line-height:1.7">
          ※ 認証の進捗に応じてこのページを更新します。進捗にご関心のある方は
          <a href="mailto:${Components.escapeHtml(contact)}" style="color:#6366f1">${Components.escapeHtml(contact)}</a>
          までお問い合わせください。
        </div>
      </div>
    </div>

    <!-- ⑦ 脆弱性報告 -->
    <div class="card" style="margin-bottom:14px">
      <div class="card-header"><span class="card-title">🛡 セキュリティ脆弱性の報告</span></div>
      <div class="card-body" style="padding:16px 20px;font-size:13px;line-height:1.9">
        善意のセキュリティ研究者・ユーザーからの脆弱性報告を歓迎しています。
        以下の連絡先までお知らせください。責任ある開示 (Responsible Disclosure) に従って速やかに対応します。
        <div style="margin-top:10px;padding:10px 14px;background:var(--bg-tertiary);border-radius:6px;font-size:12px;font-family:monospace">
          Contact: <a href="mailto:${Components.escapeHtml(contact)}" style="color:#6366f1">${Components.escapeHtml(contact)}</a><br>
          Preferred-Languages: ja, en<br>
          security.txt: <a href="/.well-known/security.txt" target="_blank" style="color:#6366f1">/.well-known/security.txt</a>
        </div>
      </div>
    </div>

    <div style="text-align:center;margin-top:30px;font-size:11px;color:var(--text-muted)">
      最終更新: ${new Date().toISOString().split('T')[0]} ・
      <a href="#" onclick="event.preventDefault();app.navigate('${backTarget}')" style="color:#6366f1">戻る</a>
    </div>
  </div>`;
};

// ============================================================
// Account deletion — hard delete from Firestore + Firebase Auth
// ------------------------------------------------------------
// Implements the "退会" flow required by privacy regulations
// (個人情報保護法 第30条 / GDPR Art. 17 — right to erasure).
// Walks every known subcollection under users/{uid}, deletes
// documents in 400-doc batches, deletes the profile doc itself,
// then deletes the Firebase Auth user so a brand-new sign-up
// could reuse the same email.
// ============================================================
App.prototype.deleteAccount = async function() {
  if (!FirebaseBackend?.initialized || !FirebaseBackend.auth?.currentUser) {
    Components.showToast('ログインしていません', 'error');
    return;
  }
  const authUser = FirebaseBackend.auth.currentUser;
  const uid = authUser.uid;
  const userRef = firebase.firestore().collection('users').doc(uid);

  Components.showToast('アカウントを完全に削除しています…', 'info');

  // Subcollections we know the app writes into. Must match the
  // loadAllData / exportData lists or data may silently remain.
  const subcollections = [
    'textEntries', 'symptoms', 'vitals', 'sleep', 'medications',
    'supplements', 'meals', 'bloodTests', 'photos', 'plaudAnalyses',
    'conversations', 'analysisHistory', 'secrets', 'private'
  ];

  try {
    for (const sub of subcollections) {
      let snap;
      try {
        snap = await userRef.collection(sub).get();
      } catch (e) {
        console.warn('[deleteAccount] read', sub, 'failed:', e.code || e.message);
        continue;
      }
      if (snap.empty) continue;
      const docs = snap.docs;
      // Firestore batch limit is 500; use 400 for safety.
      for (let i = 0; i < docs.length; i += 400) {
        const batch = firebase.firestore().batch();
        docs.slice(i, i + 400).forEach(d => batch.delete(d.ref));
        await batch.commit();
      }
      console.log('[deleteAccount] cleared', sub, docs.length, 'docs');
    }
    // Delete the profile doc itself (email / displayName / lastSeenAt / etc.)
    try { await userRef.delete(); } catch (e) { console.warn('[deleteAccount] profile delete:', e.code); }

    // Finally, delete the Firebase Auth user. This requires a
    // recent sign-in (within ~5 minutes on iOS Safari, longer on
    // desktop). If the session is stale, Firebase throws
    // auth/requires-recent-login — fall back to signOut and
    // instruct the user to re-authenticate then retry.
    try {
      await authUser.delete();
      Components.showToast('アカウントを完全に削除しました。ご利用ありがとうございました。', 'success');
    } catch (authErr) {
      if (authErr.code === 'auth/requires-recent-login') {
        Components.showToast('安全のため、再ログインしてからもう一度「完全削除」を押してください。ログアウトします。', 'info');
        try { await FirebaseBackend.auth.signOut(); } catch (_) {}
      } else {
        console.error('[deleteAccount] auth delete:', authErr);
        Components.showToast('認証アカウントの削除に失敗: ' + authErr.message, 'error');
      }
    }

    // Clear local store (preserving Firebase config per CLAUDE.md)
    // and reload to a clean state. Using store.clearAll() NOT
    // localStorage.clear() — the latter would wipe Firebase config
    // and break the next sign-in.
    try { store.clearAll(); } catch (_) {}
    setTimeout(() => location.reload(), 1500);
  } catch (err) {
    console.error('[deleteAccount]', err);
    Components.showToast('削除エラー: ' + err.message, 'error');
  }
};

// everything they entered in a single download, organized by
// collection with consistent ISO timestamps for chronological
// reconstruction.
// ============================================================
// Data Export — Multi-format, accessible from top bar
// ------------------------------------------------------------
// Users' right to data portability is central to the app's
// privacy promise. This implementation provides:
//   - 4 formats: JSON / Markdown / CSV / Plain text
//   - Period filter: all / 今月 / 過去 3 ヶ月 / 過去 1 年
//   - Content selector: what categories to include
//   - Preview before download (file size, record counts)
//   - One-click access from the top bar on every page
// ============================================================

// Public entry point — opens the export modal. Works from any
// page (top-bar button, settings, privacy page).
App.prototype.openExportModal = function() {
  const modal = document.getElementById('modal-overlay');
  const body = document.getElementById('modal-body');
  const title = document.getElementById('modal-title');
  if (!modal || !body) return;

  // Gather summary stats for all known collections so the user
  // sees what they're about to export before they download.
  const stats = this._computeExportStats('all');
  const latestEntry = (store.get('textEntries') || []).slice(-1)[0];
  const oldestEntry = (store.get('textEntries') || [])[0];
  const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('ja-JP') : '—';

  if (title) title.textContent = '📥 データをダウンロード';
  body.innerHTML = `
    <div style="padding:6px 0 10px">
      <div style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:14px">
        あなたが記録したすべてのデータを、お好きな形式でダウンロードできます。
        いつでも・何度でも・完全無料で。
      </div>

      <!-- Summary stats -->
      <div style="padding:12px 14px;background:var(--bg-tertiary);border-radius:10px;margin-bottom:14px">
        <div style="font-size:11px;color:var(--text-muted);font-weight:700;margin-bottom:6px">📊 エクスポート対象</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px">
          <div>テキスト記録: <strong>${stats.textEntries}</strong> 件</div>
          <div>症状記録: <strong>${stats.symptoms}</strong> 件</div>
          <div>バイタル: <strong>${stats.vitals}</strong> 件</div>
          <div>服薬: <strong>${stats.medications}</strong> 件</div>
          <div>サプリ: <strong>${stats.supplements}</strong> 件</div>
          <div>食事: <strong>${stats.meals}</strong> 件</div>
          <div>睡眠: <strong>${stats.sleepData}</strong> 件</div>
          <div>血液検査: <strong>${stats.bloodTests}</strong> 件</div>
          <div>写真: <strong>${stats.photos}</strong> 件</div>
          <div>AI 分析: <strong>${stats.analysisHistory}</strong> 件</div>
          <div>AI チャット: <strong>${stats.conversationHistory}</strong> 件</div>
          <div>禅トラック: <strong>${stats.plaudAnalyses}</strong> 件</div>
        </div>
        ${stats.totalRecords > 0 ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);font-size:11px;color:var(--text-muted)">
          合計 <strong style="color:var(--accent)">${stats.totalRecords.toLocaleString()}</strong> 件 ・
          ${oldestEntry ? `最古: ${fmtDate(oldestEntry.timestamp)}` : ''}
          ${oldestEntry && latestEntry ? ' 〜 ' : ''}
          ${latestEntry ? `最新: ${fmtDate(latestEntry.timestamp)}` : ''}
        </div>` : `
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);font-size:11px;color:var(--text-muted)">
          まだ記録がありません。記録を始めてからダウンロードできるようになります。
        </div>`}
      </div>

      <!-- Format selector -->
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:6px">📄 ファイル形式</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <label class="export-fmt" style="padding:10px 12px;background:#eef2ff;border:2px solid #6366f1;border-radius:10px;cursor:pointer">
            <input type="radio" name="export-format" value="json" checked style="margin-right:6px">
            <strong style="font-size:12px">JSON</strong>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">再読み込み可能・バックアップ用</div>
          </label>
          <label class="export-fmt" style="padding:10px 12px;background:var(--bg-tertiary);border:2px solid transparent;border-radius:10px;cursor:pointer">
            <input type="radio" name="export-format" value="markdown" style="margin-right:6px">
            <strong style="font-size:12px">Markdown</strong>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">読みやすい日記形式</div>
          </label>
          <label class="export-fmt" style="padding:10px 12px;background:var(--bg-tertiary);border:2px solid transparent;border-radius:10px;cursor:pointer">
            <input type="radio" name="export-format" value="csv" style="margin-right:6px">
            <strong style="font-size:12px">CSV</strong>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">Excel / Numbers で開ける</div>
          </label>
          <label class="export-fmt" style="padding:10px 12px;background:var(--bg-tertiary);border:2px solid transparent;border-radius:10px;cursor:pointer">
            <input type="radio" name="export-format" value="text" style="margin-right:6px">
            <strong style="font-size:12px">プレーンテキスト</strong>
            <div style="font-size:10px;color:var(--text-muted);margin-top:2px">どの環境でも読める</div>
          </label>
        </div>
      </div>

      <!-- Period filter -->
      <div style="margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:6px">📅 期間</div>
        <select id="export-period" class="form-select" style="width:100%">
          <option value="all" selected>すべての記録</option>
          <option value="1m">過去 1 ヶ月</option>
          <option value="3m">過去 3 ヶ月</option>
          <option value="6m">過去 6 ヶ月</option>
          <option value="1y">過去 1 年</option>
        </select>
      </div>

      <!-- Content scope -->
      <div style="margin-bottom:18px">
        <div style="font-size:12px;font-weight:700;color:var(--text-primary);margin-bottom:6px">📦 含めるデータ</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px">
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="textEntries" checked> テキスト記録</label>
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="symptoms" checked> 症状</label>
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="vitals" checked> バイタル</label>
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="medications" checked> 服薬</label>
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="supplements" checked> サプリ</label>
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="meals" checked> 食事</label>
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="sleepData" checked> 睡眠</label>
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="bloodTests" checked> 血液検査</label>
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="photos"> 写真 (容量大)</label>
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="analysisHistory" checked> AI 分析履歴</label>
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="conversationHistory"> AI チャット</label>
          <label style="display:flex;align-items:center;gap:5px"><input type="checkbox" class="export-scope" value="plaudAnalyses"> 禅トラック</label>
        </div>
      </div>

      <!-- Action buttons -->
      <div style="display:flex;gap:8px">
        <button class="btn btn-primary" onclick="app.executeExport()" style="flex:1;padding:12px">📥 ダウンロード</button>
        <button class="btn btn-secondary" onclick="app.closeModal()" style="padding:12px 20px">キャンセル</button>
      </div>

      <div style="margin-top:12px;padding:8px 12px;background:#fef3c7;border-left:3px solid #f59e0b;border-radius:4px;font-size:11px;color:#78350f;line-height:1.6">
        🔒 ダウンロードされたファイルはあなたのデバイスにのみ保存されます。
        サーバーには送信されません。
      </div>
    </div>
  `;
  // Visual feedback when selecting a radio (border highlight)
  body.querySelectorAll('.export-fmt').forEach(label => {
    label.addEventListener('click', () => {
      body.querySelectorAll('.export-fmt').forEach(l => {
        l.style.background = 'var(--bg-tertiary)';
        l.style.border = '2px solid transparent';
      });
      label.style.background = '#eef2ff';
      label.style.border = '2px solid #6366f1';
    });
  });
  // CSS keeps the overlay at visibility:hidden/opacity:0 until .active is
  // applied — setting display:flex alone left the modal invisible, which
  // is why the top-bar 📥 button appeared to do nothing.
  modal.classList.add('active');
};

// Execute the export based on the user's choices in the modal.
App.prototype.executeExport = function() {
  const format = document.querySelector('input[name="export-format"]:checked')?.value || 'json';
  const period = document.getElementById('export-period')?.value || 'all';
  const scopes = Array.from(document.querySelectorAll('.export-scope:checked')).map(c => c.value);
  if (scopes.length === 0) {
    Components.showToast('少なくとも 1 つのデータ種別を選択してください', 'info');
    return;
  }
  // Apply period filter to time-series arrays
  const cutoff = this._periodCutoff(period);
  const filterByDate = (arr) => {
    if (!Array.isArray(arr)) return [];
    if (cutoff === 0) return arr;
    return arr.filter(e => {
      const t = Date.parse(e.timestamp || e.createdAt || e.date || '') || 0;
      return t >= cutoff;
    });
  };
  // Collect data
  const data = {};
  scopes.forEach(key => {
    data[key] = filterByDate(store.get(key) || []);
  });

  // Format and download
  const fmtLabel = { json: 'JSON', markdown: 'MD', csv: 'CSV', text: 'TXT' }[format];
  const dateStr = new Date().toISOString().split('T')[0];
  let content = '';
  let mime = 'text/plain';
  let ext = 'txt';

  if (format === 'json') {
    const profile = store.get('userProfile') || {};
    content = JSON.stringify({
      _meta: {
        exportDate: new Date().toISOString(),
        appVersion: CONFIG.APP_VERSION || '1.0.0',
        format: 'kenkou_nikki_v3',
        period,
        scopes,
        note: 'This file contains your personal health data. Keep it safe.'
      },
      userProfile: profile,
      selectedDiseases: store.get('selectedDiseases') || [],
      ...data
    }, null, 2);
    mime = 'application/json';
    ext = 'json';
  } else if (format === 'markdown') {
    content = this._exportAsMarkdown(data, period);
    mime = 'text/markdown';
    ext = 'md';
  } else if (format === 'csv') {
    content = this._exportAsCSV(data);
    mime = 'text/csv';
    ext = 'csv';
  } else {
    content = this._exportAsPlainText(data, period);
    mime = 'text/plain';
    ext = 'txt';
  }

  const blob = new Blob([content], { type: mime + ';charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kenkou_nikki_${dateStr}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  Components.showToast(`${fmtLabel} 形式でダウンロードを開始しました`, 'success');
  this.closeModal();
};

// Count records in each collection for the summary panel.
App.prototype._computeExportStats = function(period) {
  const cutoff = this._periodCutoff(period);
  const count = (key) => {
    const arr = store.get(key) || [];
    if (cutoff === 0) return arr.length;
    return arr.filter(e => (Date.parse(e.timestamp || e.createdAt || '') || 0) >= cutoff).length;
  };
  const stats = {
    textEntries: count('textEntries'),
    symptoms: count('symptoms'),
    vitals: count('vitals'),
    medications: count('medications'),
    supplements: count('supplements'),
    meals: count('meals'),
    sleepData: count('sleepData'),
    bloodTests: count('bloodTests'),
    photos: count('photos'),
    analysisHistory: count('analysisHistory'),
    conversationHistory: count('conversationHistory'),
    plaudAnalyses: count('plaudAnalyses')
  };
  stats.totalRecords = Object.values(stats).reduce((s, n) => s + n, 0);
  return stats;
};

// Convert a period code into a cutoff timestamp (0 means "all").
App.prototype._periodCutoff = function(period) {
  const now = Date.now();
  const MS_DAY = 86400000;
  switch (period) {
    case '1m': return now - 30 * MS_DAY;
    case '3m': return now - 90 * MS_DAY;
    case '6m': return now - 180 * MS_DAY;
    case '1y': return now - 365 * MS_DAY;
    default:   return 0;
  }
};

// Human-readable Markdown export — perfect for sharing with a
// doctor, importing into Obsidian/Notion, or just reading back.
App.prototype._exportAsMarkdown = function(data, period) {
  const profile = store.get('userProfile') || {};
  const today = new Date().toLocaleDateString('ja-JP');
  const periodLabel = { '1m':'過去1ヶ月', '3m':'過去3ヶ月', '6m':'過去6ヶ月', '1y':'過去1年' }[period] || 'すべての記録';
  let md = `# 健康日記エクスポート\n\n`;
  md += `- エクスポート日: ${today}\n`;
  md += `- 期間: ${periodLabel}\n`;
  md += `- ユーザー: ${profile.nickname || 'ご本人'}\n\n`;
  md += `---\n\n`;

  // Merge time-series records into a single chronological timeline.
  const allEntries = [];
  const pushAll = (key, label, icon) => {
    (data[key] || []).forEach(e => {
      allEntries.push({
        ts: Date.parse(e.timestamp || e.createdAt || e.date || '') || 0,
        key, label, icon, entry: e
      });
    });
  };
  pushAll('textEntries',         'テキスト記録', '📝');
  pushAll('symptoms',            '症状',         '🌡️');
  pushAll('vitals',              'バイタル',     '💓');
  pushAll('medications',         '服薬',         '💊');
  pushAll('supplements',         'サプリ',       '💊');
  pushAll('meals',               '食事',         '🍽️');
  pushAll('sleepData',           '睡眠',         '😴');
  pushAll('bloodTests',          '血液検査',     '🩸');
  pushAll('plaudAnalyses',       '禅トラック',   '🎙️');
  allEntries.sort((a, b) => a.ts - b.ts);

  // Group by date
  const byDate = {};
  allEntries.forEach(e => {
    const dateKey = e.ts ? new Date(e.ts).toISOString().split('T')[0] : 'unknown';
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(e);
  });

  Object.keys(byDate).sort().forEach(date => {
    md += `## ${date}\n\n`;
    byDate[date].forEach(({ icon, label, entry }) => {
      md += `### ${icon} ${label}\n\n`;
      // Special formatting per record type
      if (entry.content) md += entry.content + '\n\n';
      else if (entry.text) md += entry.text + '\n\n';
      else if (entry.note) md += entry.note + '\n\n';
      else {
        // Generic: list all fields except timestamp/id
        const skip = new Set(['id', 'timestamp', 'createdAt', 'updatedAt', '_id']);
        Object.entries(entry).forEach(([k, v]) => {
          if (skip.has(k)) return;
          if (v == null || v === '') return;
          if (typeof v === 'object') return;
          md += `- **${k}**: ${v}\n`;
        });
        md += '\n';
      }
    });
  });

  // Analysis history section
  if (data.analysisHistory && data.analysisHistory.length > 0) {
    md += `\n---\n\n## AI 分析履歴\n\n`;
    data.analysisHistory.forEach(a => {
      const d = a.timestamp ? new Date(a.timestamp).toLocaleDateString('ja-JP') : '';
      md += `### ${d}\n\n`;
      if (a.parsed?.summary) md += `**${a.parsed.summary}**\n\n`;
      if (a.parsed?.findings) md += a.parsed.findings + '\n\n';
      if (a.parsed?.new_approach) md += `**新しい打ち手**: ${a.parsed.new_approach}\n\n`;
    });
  }

  md += `\n---\n\n*このエクスポートは [健康日記 (cares.advisers.jp)](https://cares.advisers.jp/) から作成されました。*\n`;
  return md;
};

// CSV export — one file with a unified schema so it opens
// cleanly in Excel/Numbers/Google Sheets.
App.prototype._exportAsCSV = function(data) {
  const rows = [['日付', '種別', '内容', 'その他']];
  const addRow = (date, type, content, extra) => {
    // CSV escape: wrap in quotes + escape internal quotes
    const esc = (s) => {
      const str = String(s == null ? '' : s).replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return '"' + str + '"';
    };
    rows.push([esc(date), esc(type), esc(content), esc(extra)]);
  };
  const dateOf = (e) => {
    const t = Date.parse(e.timestamp || e.createdAt || e.date || '') || 0;
    return t ? new Date(t).toISOString().split('T')[0] : '';
  };
  (data.textEntries || []).forEach(e => addRow(dateOf(e), 'テキスト', e.content || e.text || '', e.category || ''));
  (data.symptoms || []).forEach(e => addRow(dateOf(e), '症状', `疲労 ${e.fatigue_level ?? '-'}, 痛み ${e.pain_level ?? '-'}, 睡眠 ${e.sleep_quality ?? '-'}`, e.notes || ''));
  (data.vitals || []).forEach(e => addRow(dateOf(e), 'バイタル', `血圧 ${e.bp_sys ?? '-'}/${e.bp_dia ?? '-'}, 脈 ${e.pulse ?? '-'}, 体温 ${e.temperature ?? '-'}`, ''));
  (data.medications || []).forEach(e => addRow(dateOf(e), '服薬', `${e.name || ''} ${e.dose || ''}`, e.notes || ''));
  (data.supplements || []).forEach(e => addRow(dateOf(e), 'サプリ', `${e.name || ''} ${e.dose || ''}`, e.notes || ''));
  (data.meals || []).forEach(e => addRow(dateOf(e), '食事', e.description || e.content || '', `${e.calories || ''} kcal`));
  (data.sleepData || []).forEach(e => addRow(dateOf(e), '睡眠', `${e.hours || '-'} 時間, 質 ${e.quality || '-'}`, e.notes || ''));
  (data.bloodTests || []).forEach(e => addRow(dateOf(e), '血液検査', `${e.name || ''}: ${e.value || ''} ${e.unit || ''}`, ''));
  // BOM + content (Excel で UTF-8 が正しく認識される)
  return '\uFEFF' + rows.map(r => r.join(',')).join('\n');
};

// Plain text export — maximum compatibility, any device/app.
App.prototype._exportAsPlainText = function(data, period) {
  const today = new Date().toLocaleDateString('ja-JP');
  const periodLabel = { '1m':'過去1ヶ月', '3m':'過去3ヶ月', '6m':'過去6ヶ月', '1y':'過去1年' }[period] || 'すべての記録';
  let txt = `健康日記エクスポート\n`;
  txt += `エクスポート日: ${today}\n`;
  txt += `期間: ${periodLabel}\n`;
  txt += `========================================\n\n`;

  const pushSection = (key, label) => {
    const arr = data[key] || [];
    if (arr.length === 0) return;
    txt += `【${label}】\n`;
    arr.forEach(e => {
      const date = e.timestamp ? new Date(e.timestamp).toLocaleDateString('ja-JP') : '';
      const content = e.content || e.text || e.name || JSON.stringify(e);
      txt += `  [${date}] ${content}\n`;
    });
    txt += '\n';
  };
  pushSection('textEntries',  'テキスト記録');
  pushSection('symptoms',     '症状');
  pushSection('vitals',       'バイタル');
  pushSection('medications',  '服薬');
  pushSection('supplements',  'サプリ');
  pushSection('meals',        '食事');
  pushSection('sleepData',    '睡眠');
  pushSection('bloodTests',   '血液検査');

  txt += `========================================\n`;
  txt += `健康日記 (cares.advisers.jp) から作成\n`;
  return txt;
};

// Legacy entry point — keep the old one-click JSON dump working
// for all existing onclick="app.exportData()" references. New
// code should use openExportModal instead.
App.prototype.exportData = function() {
  // Simply open the richer modal; JSON is the default format.
  this.openExportModal();
};

// Import Data from JSON file
App.prototype.importDataFile = function(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      let count = 0;

      // Import ALL keys that exportData writes. Any key added to
      // exportData must also appear here; otherwise data round-trips
      // would silently lose collections.
      const importKeys = [
        'selectedDisease', 'selectedDiseases', 'selectedModel', 'customPrompts',
        'dashboardLayout', 'userProfile',
        'textEntries', 'symptoms', 'vitals', 'bloodTests',
        'medications', 'supplements', 'meals',
        'sleepData', 'activityData', 'photos',
        'analysisHistory', 'aiComments', 'latestFeedback',
        'nutritionLog', 'plaudAnalyses',
        'conversationHistory', 'calendarEvents',
        'integrationSyncs', 'cachedResearch'
      ];

      importKeys.forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          const existing = store.get(key);
          if (Array.isArray(existing) && Array.isArray(data[key])) {
            // Merge arrays (avoid duplicates by id)
            const existingIds = new Set(existing.map(e => e.id).filter(Boolean));
            const newItems = data[key].filter(item => !item.id || !existingIds.has(item.id));
            store.set(key, [...existing, ...newItems]);
            count += newItems.length;
          } else if (!existing || (Array.isArray(existing) && existing.length === 0) || (typeof existing === 'object' && Object.keys(existing).length === 0)) {
            store.set(key, data[key]);
            count++;
          }
        }
      });

      store.calculateHealthScore();
      Components.showToast('データをインポートしました（' + count + '件）', 'success');

      // Sync to Firestore if connected
      if (FirebaseBackend.initialized) {
        FirebaseBackend.loadAllData().then(() => {
          // Re-save all imported data to Firestore
          const textEntries = store.get('textEntries') || [];
          textEntries.forEach(entry => {
            if (!entry._synced) {
              FirebaseBackend.saveHealthEntry('textEntries', entry);
              entry._synced = true;
            }
          });
        });
        Components.showToast('Firestoreに同期中...', 'info');
      }
    } catch (err) {
      Components.showToast('インポートエラー: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
};



document.addEventListener('DOMContentLoaded', function() { app.init(); });

document.addEventListener('DOMContentLoaded', function() { app.init(); });
