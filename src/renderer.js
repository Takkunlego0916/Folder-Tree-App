const api = window.folderTreeAPI;

const selectBtn = document.getElementById('selectBtn');
const copyBtn = document.getElementById('copyBtn');
const saveBtn = document.getElementById('saveBtn');
const themeBtn = document.getElementById('themeBtn');
const langSelect = document.getElementById('langSelect');
const treeEl = document.getElementById('tree');
const toastEl = document.getElementById('toast');

let currentTextTree = '';
let theme = 'auto';
let lang = 'auto';

const LANG_DICT = {
  selectFolder: { ja: "フォルダを選択", en: "Select Folder", "zh-CN": "选择文件夹", "zh-TW": "選擇資料夾", ko: "폴더 선택", es: "Seleccionar carpeta", fr: "Sélectionner le dossier", de: "Ordner auswählen" },
  copyMarkdown: { ja: "Markdownコピー", en: "Copy Markdown", "zh-CN": "复制Markdown", "zh-TW": "複製Markdown", ko: "Markdown 복사", es: "Copiar Markdown", fr: "Copier Markdown", de: "Markdown kopieren" },
  save: { ja: "保存", en: "Save", "zh-CN": "保存", "zh-TW": "保存", ko: "저장", es: "Guardar", fr: "Enregistrer", de: "Speichern" },
  theme: { ja: "モード切替", en: "Theme", "zh-CN": "切换模式", "zh-TW": "切換模式", ko: "모드 전환", es: "Modo", fr: "Thème", de: "Modus" },
  copySuccess: { ja: "Markdown形式でコピーしました！", en: "Copied in Markdown!", "zh-CN": "已复制为Markdown！", "zh-TW": "已複製為Markdown！", ko: "Markdown로 복사 완료!", es: "¡Copiado en Markdown!", fr: "Copié en Markdown !", de: "Markdown kopiert!" },
  saveSuccess: { ja: "保存しました！", en: "Saved!", "zh-CN": "已保存！", "zh-TW": "已保存！", ko: "저장 완료!", es: "¡Guardado!", fr: "Enregistré !", de: "Gespeichert!" }
};

function showToast(message) {
  toastEl.textContent = message;
  toastEl.style.opacity = '1';
  setTimeout(() => {
    toastEl.style.opacity = '0';
  }, 2000);
}

function detectLang() {
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith('ja')) return 'ja';
  if (nav.startsWith('zh-cn')) return 'zh-CN';
  if (nav.startsWith('zh-tw') || nav.startsWith('zh-hk')) return 'zh-TW';
  if (nav.startsWith('ko')) return 'ko';
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('fr')) return 'fr';
  if (nav.startsWith('de')) return 'de';
  return 'en';
}

function getLangCode() {
  return lang === 'auto' ? detectLang() : lang;
}

function setLang(code) {
  selectBtn.textContent = LANG_DICT.selectFolder[code];
  copyBtn.textContent = LANG_DICT.copyMarkdown[code];
  saveBtn.textContent = LANG_DICT.save[code];
  themeBtn.textContent = LANG_DICT.theme[code];
}

function wrapAsMarkdownCodeBlock(text) {
  let maxRun = 0;
  for (const match of text.match(/`+/g) || []) {
    maxRun = Math.max(maxRun, match.length);
  }
  const fence = '`'.repeat(Math.max(3, maxRun + 1));
  return `${fence}text\n${text}\n${fence}`;
}

function clearTree() {
  treeEl.replaceChildren();
}

function renderChildren(children, parent) {
  for (const child of children || []) {
    const li = document.createElement('li');

    if (child.type === 'directory') {
      const details = document.createElement('details');
      details.open = true;

      const summary = document.createElement('summary');
      summary.textContent = `${child.name}/`;
      details.appendChild(summary);

      const ul = document.createElement('ul');
      renderChildren(child.children || [], ul);
      details.appendChild(ul);

      li.appendChild(details);
    } else {
      li.textContent = child.name;
    }

    parent.appendChild(li);
  }
}

function renderTree(treeData) {
  clearTree();

  const root = document.createElement('details');
  root.open = true;

  const summary = document.createElement('summary');
  summary.textContent = `${treeData.name}/`;
  root.appendChild(summary);

  const ul = document.createElement('ul');
  renderChildren(treeData.children || [], ul);
  root.appendChild(ul);

  treeEl.appendChild(root);
}

async function loadFolder(folderPath) {
  try {
    const { treeData, textTree } = await api.readFolder(folderPath);
    renderTree(treeData);
    currentTextTree = textTree;
  } catch (err) {
    showToast(err.message || String(err));
  }
}

async function initTheme() {
  if (theme === 'auto') {
    theme = await api.getTheme();
  }
  document.body.classList.remove('dark', 'light');
  document.body.classList.add(theme);
}

setLang(getLangCode());
initTheme();

selectBtn.addEventListener('click', async () => {
  const folderPath = await api.selectFolder();
  if (folderPath) loadFolder(folderPath);
});

copyBtn.addEventListener('click', () => {
  if (!currentTextTree) return;
  api.copyToClipboard(wrapAsMarkdownCodeBlock(currentTextTree));
  showToast(LANG_DICT.copySuccess[getLangCode()]);
});

saveBtn.addEventListener('click', async () => {
  if (!currentTextTree) return;
  const success = await api.saveFile(currentTextTree);
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

window.addEventListener('dragover', (e) => e.preventDefault());

window.addEventListener('drop', async (e) => {
  e.preventDefault();
  if (e.dataTransfer.files.length === 0) return;

  const folderPath = e.dataTransfer.files[0].path;
  loadFolder(folderPath);
});
