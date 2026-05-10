const api = window.folderTreeAPI;

const selectBtn     = document.getElementById('selectBtn');
const copyBtn       = document.getElementById('copyBtn');
const saveBtn       = document.getElementById('saveBtn');
const themeBtn      = document.getElementById('themeBtn');
const langSelect    = document.getElementById('langSelect');
const formatSelect  = document.getElementById('formatSelect');
const depthRange    = document.getElementById('depthRange');
const depthVal      = document.getElementById('depthVal');
const customExclude = document.getElementById('customExclude');
const applyBtn      = document.getElementById('applyBtn');
const treeEl        = document.getElementById('tree');
const toastEl       = document.getElementById('toast');

let currentTextTree   = '';
let currentTreeData   = null;
let currentFolderPath = null;
let theme = 'auto';
let lang  = 'auto';
let reloadTimeout = null;
let loadRequestId = 0;

const LANG_DICT = {
  selectFolder:      { ja:'フォルダを選択', en:'Select Folder',  'zh-CN':'选择文件夹',  'zh-TW':'選擇資料夾', ko:'폴더 선택',  es:'Seleccionar', fr:'Sélectionner', de:'Ordner wählen' },
  copyMarkdown:      { ja:'MDコピー',       en:'Copy MD',        'zh-CN':'复制MD',      'zh-TW':'複製MD',     ko:'MD 복사',    es:'Copiar MD',   fr:'Copier MD',    de:'MD kopieren'   },
  save:              { ja:'保存',            en:'Save',           'zh-CN':'保存',         'zh-TW':'保存',       ko:'저장',       es:'Guardar',     fr:'Enregistrer',  de:'Speichern'     },
  theme:             { ja:'モード切替',       en:'Theme',          'zh-CN':'切换模式',    'zh-TW':'切換模式',   ko:'모드 전환',  es:'Tema',        fr:'Thème',        de:'Modus'         },
  apply:             { ja:'適用',            en:'Apply',          'zh-CN':'应用',         'zh-TW':'套用',       ko:'적용',       es:'Aplicar',     fr:'Appliquer',    de:'Anwenden'      },
  depth:             { ja:'表示階層',         en:'Depth',          'zh-CN':'显示层级',    'zh-TW':'顯示層級',   ko:'표시 깊이',  es:'Profundidad', fr:'Profondeur',   de:'Tiefe'         },
  exclude:           { ja:'除外',            en:'Exclude',        'zh-CN':'排除',         'zh-TW':'排除',       ko:'제외',       es:'Excluir',     fr:'Exclure',      de:'Ausschließen'  },
  customPlaceholder: { ja:'カスタム除外（カンマ区切り）', en:'Custom (comma-separated)', 'zh-CN':'自定义排除（逗号）', 'zh-TW':'自訂排除（逗號）', ko:'사용자 지정 (쉼표)', es:'Excluir (comas)', fr:'Exclure (virgules)', de:'Ausschl. (Komma)' },
  copySuccess:       { ja:'Markdownでコピーしました！', en:'Copied as Markdown!', 'zh-CN':'已复制为Markdown！', 'zh-TW':'已複製為Markdown！', ko:'Markdown 복사 완료!', es:'¡Copiado!', fr:'Copié !', de:'Kopiert!' },
  saveSuccess:       { ja:'保存しました！',   en:'Saved!',         'zh-CN':'已保存！',     'zh-TW':'已保存！',   ko:'저장 완료!', es:'¡Guardado!',  fr:'Enregistré !', de:'Gespeichert!'  }
};

function showToast(message) {
  toastEl.textContent = message;
  toastEl.style.opacity = '1';
  setTimeout(() => { toastEl.style.opacity = '0'; }, 2000);
}

function detectLang() {
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith('ja'))                                return 'ja';
  if (nav.startsWith('zh-cn'))                             return 'zh-CN';
  if (nav.startsWith('zh-tw') || nav.startsWith('zh-hk')) return 'zh-TW';
  if (nav.startsWith('ko'))                                return 'ko';
  if (nav.startsWith('es'))                                return 'es';
  if (nav.startsWith('fr'))                                return 'fr';
  if (nav.startsWith('de'))                                return 'de';
  return 'en';
}

function getLangCode() { return lang === 'auto' ? detectLang() : lang; }

function setLang(code) {
  const t = k => (LANG_DICT[k][code] ?? LANG_DICT[k].en);
  selectBtn.textContent  = t('selectFolder');
  copyBtn.textContent    = t('copyMarkdown');
  saveBtn.textContent    = t('save');
  themeBtn.textContent   = t('theme');
  applyBtn.textContent   = t('apply');
  document.getElementById('depthLabel').textContent   = t('depth') + ':';
  document.getElementById('excludeLabel').textContent = t('exclude') + ':';
  customExclude.placeholder = t('customPlaceholder');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getBasename(p) {
  return p.replace(/\\/g, '/').split('/').filter(Boolean).pop() || p;
}

function wrapAsMarkdownCodeBlock(text) {
  let maxRun = 0;
  for (const m of text.match(/`+/g) || []) maxRun = Math.max(maxRun, m.length);
  const fence = '`'.repeat(Math.max(3, maxRun + 1));
  return `${fence}text\n${text}\n${fence}`;
}

function treeDataToJson(treeData) {
  function clean(node, isRoot = false) {
    const name = isRoot ? getBasename(node.name) : node.name;
    if (node.type === 'file' || node.type === 'truncated') return { name, type: node.type };
    return { name, type: node.type, children: (node.children || []).map(c => clean(c)) };
  }
  return JSON.stringify(clean(treeData, true), null, 2);
}

function renderHtmlNodes(children) {
  return (children || []).map(child => {
    if (child.type === 'truncated') {
      return `<li><span class="trunc">${escapeHtml(child.name)}</span></li>`;
    }
    if (child.type === 'file') {
      return `<li class="file">${escapeHtml(child.name)}</li>`;
    }
    if (child.type === 'directory') {
      const inner = renderHtmlNodes(child.children || []);
      return `<li><details open><summary>${escapeHtml(child.name)}/</summary><ul>${inner}</ul></details></li>`;
    }
    return '';
  }).join('');
}

function treeDataToHtml(treeData) {
  const rootName = escapeHtml(getBasename(treeData.name));
  const inner    = renderHtmlNodes(treeData.children || []);
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<title>${rootName}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Consolas,'Courier New',monospace;background:#1e1e1e;color:#d4d4d4;padding:20px;line-height:1.75}
  h1{font-size:1em;color:#9cdcfe;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #333}
  ul{list-style:none;padding-left:0}
  ul ul{padding-left:1.4em;border-left:1px dotted #444;margin-left:8px}
  details>summary{cursor:pointer;user-select:none;color:#4ec9b0}
  details>summary::-webkit-details-marker{display:none}
  details>summary::before{content:"▶ ";font-size:.65em;color:#555}
  details[open]>summary::before{content:"▼ "}
  li.file{padding-left:1.2em}
  .trunc{color:#666;font-style:italic}
</style>
</head>
<body>
<h1>📁 ${rootName}/</h1>
<ul>
  <li><details open><summary>${rootName}/</summary><ul>${inner}</ul></details></li>
</ul>
</body>
</html>`;
}

function clearTree() { treeEl.replaceChildren(); }

function renderChildren(children, parent) {
  for (const child of children || []) {
    const li = document.createElement('li');

    if (child.type === 'directory') {
      const details = document.createElement('details');
      details.open = true;
      const summary = document.createElement('summary');
      summary.textContent = `${child.name}/`;
      const ul = document.createElement('ul');
      renderChildren(child.children || [], ul);
      details.append(summary, ul);
      li.appendChild(details);
    } else {
      li.textContent = child.name;
      if (child.type === 'truncated') li.style.color = '#888';
    }
    parent.appendChild(li);
  }
}

function renderTree(treeData) {
  clearTree();
  const root    = document.createElement('details');
  root.open = true;
  const summary = document.createElement('summary');
  summary.textContent = `${getBasename(treeData.name)}/`;
  const ul = document.createElement('ul');
  renderChildren(treeData.children || [], ul);
  root.append(summary, ul);
  treeEl.appendChild(root);
}

function getOptions() {
  const checked = [...document.querySelectorAll('.excludeCheck:checked')].map(el => el.value);
  const custom  = customExclude.value.split(',').map(s => s.trim()).filter(Boolean);
  return {
    maxDepth: parseInt(depthRange.value, 10),
    excludes: [...new Set([...checked, ...custom])]
  };
}

async function loadFolder(folderPath) {
  const myId = ++loadRequestId;
  try {
    const { treeData, textTree } = await api.readFolder(folderPath, getOptions());
    if (myId !== loadRequestId) return;
    renderTree(treeData);
    currentTextTree = textTree;
    currentTreeData = treeData;
  } catch (err) {
    if (myId !== loadRequestId) return;
    showToast(err.message || String(err));
  }
}

function scheduleReload() {
  if (!currentFolderPath) return;
  clearTimeout(reloadTimeout);
  reloadTimeout = setTimeout(() => loadFolder(currentFolderPath), 300);
}

async function initTheme() {
  if (theme === 'auto') theme = await api.getTheme();
  document.body.classList.remove('dark', 'light');
  document.body.classList.add(theme);
}

setLang(getLangCode());
initTheme();

selectBtn.addEventListener('click', async () => {
  const folderPath = await api.selectFolder();
  if (folderPath) { currentFolderPath = folderPath; loadFolder(folderPath); }
});

copyBtn.addEventListener('click', () => {
  if (!currentTextTree) return;
  api.copyToClipboard(wrapAsMarkdownCodeBlock(currentTextTree));
  showToast(LANG_DICT.copySuccess[getLangCode()]);
});

saveBtn.addEventListener('click', async () => {
  if (!currentTreeData) return;
  const format = formatSelect.value;
  let content;
  if      (format === 'json') content = treeDataToJson(currentTreeData);
  else if (format === 'html') content = treeDataToHtml(currentTreeData);
  else                        content = currentTextTree;

  const success = await api.saveFile(content, format);
  if (success) showToast(LANG_DICT.saveSuccess[getLangCode()]);
});

themeBtn.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  document.body.classList.remove('dark', 'light');
  document.body.classList.add(theme);
});

langSelect.addEventListener('change', () => {
  lang = langSelect.value;
  setLang(getLangCode());
});

depthRange.addEventListener('input', () => {
  depthVal.textContent = depthRange.value;
  scheduleReload();
});

document.querySelectorAll('.excludeCheck').forEach(cb => {
  cb.addEventListener('change', scheduleReload);
});

applyBtn.addEventListener('click', () => {
  if (currentFolderPath) loadFolder(currentFolderPath);
});

window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', async (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length === 0) return;
  const validated = await api.validateDropPath(e.dataTransfer.files[0].path);
  if (validated) { currentFolderPath = validated; loadFolder(validated); }
  else showToast('有効なフォルダではありません');
});
