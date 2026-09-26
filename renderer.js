const api = window.folderTreeAPI;

const els = {
  brandSubtitle: document.getElementById('brandSubtitle'),
  eyebrow: document.getElementById('eyebrow'),
  heroTitle: document.getElementById('heroTitle'),
  heroDescription: document.getElementById('heroDescription'),
  selectBtn: document.getElementById('selectBtn'),
  emptySelectBtn: document.getElementById('emptySelectBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  copyBtn: document.getElementById('copyBtn'),
  saveBtn: document.getElementById('saveBtn'),
  saveText: document.getElementById('saveText'),
  copyText: document.getElementById('copyText'),
  refreshText: document.getElementById('refreshText'),
  themeBtn: document.getElementById('themeBtn'),
  langSelect: document.getElementById('langSelect'),
  formatSelect: document.getElementById('formatSelect'),
  depthRange: document.getElementById('depthRange'),
  depthVal: document.getElementById('depthVal'),
  customExclude: document.getElementById('customExclude'),
  applyBtn: document.getElementById('applyBtn'),
  pathLabel: document.getElementById('pathLabel'),
  pathValue: document.getElementById('pathValue'),
  settingsText: document.getElementById('settingsText'),
  depthLabel: document.getElementById('depthLabel'),
  excludeLabel: document.getElementById('excludeLabel'),
  treeTitle: document.getElementById('treeTitle'),
  treeSubtitle: document.getElementById('treeSubtitle'),
  expandBtn: document.getElementById('expandBtn'),
  collapseBtn: document.getElementById('collapseBtn'),
  expandText: document.getElementById('expandText'),
  collapseText: document.getElementById('collapseText'),
  searchInput: document.getElementById('searchInput'),
  treeStatus: document.getElementById('treeStatus'),
  emptyState: document.getElementById('emptyState'),
  emptyTitle: document.getElementById('emptyTitle'),
  emptyDescription: document.getElementById('emptyDescription'),
  loadingState: document.getElementById('loadingState'),
  loadingTitle: document.getElementById('loadingTitle'),
  loadingSubtitle: document.getElementById('loadingSubtitle'),
  tree: document.getElementById('tree'),
  toast: document.getElementById('toast'),
  dropOverlay: document.getElementById('dropOverlay'),
  dropTitle: document.getElementById('dropTitle')
};

const LANG_DICT = {
  brandSubtitle: { ja:'フォルダ構成を見やすく整理', en:'Organize folder structures clearly', 'zh-CN':'清晰整理文件夹结构', 'zh-TW':'清楚整理資料夾結構', ko:'폴더 구조를 보기 좋게 정리', es:'Organiza estructuras de carpetas', fr:'Organisez vos arborescences', de:'Ordnerstrukturen übersichtlich anzeigen' },
  eyebrow: { ja:'Folder Explorer', en:'Folder Explorer', 'zh-CN':'文件夹浏览器', 'zh-TW':'資料夾瀏覽器', ko:'폴더 탐색기', es:'Explorador de carpetas', fr:'Explorateur de dossiers', de:'Ordner-Explorer' },
  heroTitle: { ja:'フォルダ構成をすばやく可視化', en:'Visualize your folder structure quickly', 'zh-CN':'快速可视化文件夹结构', 'zh-TW':'快速視覺化資料夾結構', ko:'폴더 구조를 빠르게 시각화', es:'Visualiza tu estructura de carpetas', fr:'Visualisez votre arborescence rapidement', de:'Ordnerstruktur schnell visualisieren' },
  heroDescription: { ja:'フォルダを選択するだけで、階層構造を確認できます。大きなプロジェクトでも、必要な部分だけを開いて確認できます。', en:'Select a folder to inspect its hierarchy. Large projects stay easier to navigate because branches are opened only when needed.', 'zh-CN':'选择文件夹即可查看层级结构。大型项目也可以按需展开分支，保持浏览流畅。', 'zh-TW':'選擇資料夾即可查看層級結構。大型專案也能按需展開分支，瀏覽更順暢。', ko:'폴더를 선택하면 계층 구조를 확인할 수 있습니다. 큰 프로젝트도 필요한 가지를 열어서 탐색할 수 있습니다.', es:'Selecciona una carpeta para explorar su jerarquía. Incluso los proyectos grandes se pueden abrir por ramas cuando sea necesario.', fr:'Sélectionnez un dossier pour explorer sa hiérarchie. Même les grands projets restent simples à parcourir en ouvrant les branches à la demande.', de:'Wählen Sie einen Ordner, um seine Hierarchie zu sehen. Auch große Projekte bleiben übersichtlich, weil Verzeichnisse erst bei Bedarf geöffnet werden.' },
  selectFolder: { ja:'フォルダを選択', en:'Select Folder', 'zh-CN':'选择文件夹', 'zh-TW':'選擇資料夾', ko:'폴더 선택', es:'Seleccionar carpeta', fr:'Sélectionner un dossier', de:'Ordner auswählen' },
  refresh: { ja:'更新', en:'Refresh', 'zh-CN':'刷新', 'zh-TW':'重新整理', ko:'새로고침', es:'Actualizar', fr:'Actualiser', de:'Aktualisieren' },
  copyMarkdown: { ja:'Markdownをコピー', en:'Copy Markdown', 'zh-CN':'复制 Markdown', 'zh-TW':'複製 Markdown', ko:'Markdown 복사', es:'Copiar Markdown', fr:'Copier en Markdown', de:'Markdown kopieren' },
  save: { ja:'保存', en:'Save', 'zh-CN':'保存', 'zh-TW':'儲存', ko:'저장', es:'Guardar', fr:'Enregistrer', de:'Speichern' },
  settings: { ja:'表示設定', en:'View settings', 'zh-CN':'显示设置', 'zh-TW':'顯示設定', ko:'표시 설정', es:'Configuración de vista', fr:'Paramètres d’affichage', de:'Anzeigeeinstellungen' },
  depth: { ja:'表示階層', en:'Depth', 'zh-CN':'显示层级', 'zh-TW':'顯示層級', ko:'깊이', es:'Profundidad', fr:'Profondeur', de:'Tiefe' },
  exclude: { ja:'除外する項目', en:'Excluded items', 'zh-CN':'排除项目', 'zh-TW':'排除項目', ko:'제외할 항목', es:'Elementos excluidos', fr:'Éléments exclus', de:'Ausgeschlossene Elemente' },
  customPlaceholder: { ja:'カスタム除外（カンマ区切り）', en:'Custom exclusions (comma-separated)', 'zh-CN':'自定义排除（逗号分隔）', 'zh-TW':'自訂排除（逗號分隔）', ko:'사용자 지정 제외 (쉼표로 구분)', es:'Exclusiones personalizadas (comas)', fr:'Exclusions personnalisées (virgules)', de:'Eigene Ausschlüsse (Kommas)' },
  apply: { ja:'適用', en:'Apply', 'zh-CN':'应用', 'zh-TW':'套用', ko:'적용', es:'Aplicar', fr:'Appliquer', de:'Anwenden' },
  selectedFolder: { ja:'選択中のフォルダ', en:'Selected folder', 'zh-CN':'当前文件夹', 'zh-TW':'目前資料夾', ko:'선택한 폴더', es:'Carpeta seleccionada', fr:'Dossier sélectionné', de:'Ausgewählter Ordner' },
  noFolder: { ja:'まだフォルダが選択されていません', en:'No folder selected yet', 'zh-CN':'尚未选择文件夹', 'zh-TW':'尚未選擇資料夾', ko:'아직 폴더가 선택되지 않았습니다', es:'Aún no se ha seleccionado ninguna carpeta', fr:'Aucun dossier sélectionné', de:'Noch kein Ordner ausgewählt' },
  treeTitle: { ja:'フォルダ構成', en:'Folder structure', 'zh-CN':'文件夹结构', 'zh-TW':'資料夾結構', ko:'폴더 구조', es:'Estructura de carpetas', fr:'Structure des dossiers', de:'Ordnerstruktur' },
  treeSubtitleEmpty: { ja:'フォルダを選択するとここに表示されます', en:'Select a folder to display its structure here', 'zh-CN':'选择文件夹后将在这里显示结构', 'zh-TW':'選擇資料夾後會在這裡顯示結構', ko:'폴더를 선택하면 여기에 구조가 표시됩니다', es:'Selecciona una carpeta para mostrar su estructura aquí', fr:'Sélectionnez un dossier pour afficher sa structure ici', de:'Wählen Sie einen Ordner, um seine Struktur hier anzuzeigen' },
  treeSubtitleReady: { ja:'クリックしてフォルダを展開・折りたたみできます', en:'Click folders to expand or collapse them', 'zh-CN':'点击文件夹即可展开或折叠', 'zh-TW':'點擊資料夾即可展開或摺疊', ko:'폴더를 클릭해 펼치거나 접을 수 있습니다', es:'Haz clic en las carpetas para expandirlas o contraerlas', fr:'Cliquez sur les dossiers pour les ouvrir ou les réduire', de:'Klicken Sie auf Ordner, um sie zu öffnen oder zu schließen' },
  expand: { ja:'すべて展開', en:'Expand all', 'zh-CN':'全部展开', 'zh-TW':'全部展開', ko:'모두 펼치기', es:'Expandir todo', fr:'Tout développer', de:'Alle öffnen' },
  collapse: { ja:'すべて閉じる', en:'Collapse all', 'zh-CN':'全部折叠', 'zh-TW':'全部摺疊', ko:'모두 접기', es:'Contraer todo', fr:'Tout réduire', de:'Alle schließen' },
  searchPlaceholder: { ja:'ファイル名・フォルダ名を検索', en:'Search files and folders', 'zh-CN':'搜索文件名或文件夹名', 'zh-TW':'搜尋檔案或資料夾名稱', ko:'파일 및 폴더 검색', es:'Buscar archivos y carpetas', fr:'Rechercher des fichiers et dossiers', de:'Dateien und Ordner suchen' },
  idle: { ja:'待機中', en:'Ready', 'zh-CN':'就绪', 'zh-TW':'就緒', ko:'준비됨', es:'Listo', fr:'Prêt', de:'Bereit' },
  emptyTitle: { ja:'フォルダを選択してください', en:'Select a folder', 'zh-CN':'请选择文件夹', 'zh-TW':'請選擇資料夾', ko:'폴더를 선택하세요', es:'Selecciona una carpeta', fr:'Sélectionnez un dossier', de:'Wählen Sie einen Ordner' },
  emptyDescription: { ja:'ドラッグ＆ドロップでも選択できます', en:'You can also drag and drop a folder here', 'zh-CN':'也可以直接拖放文件夹', 'zh-TW':'也可以直接拖放資料夾', ko:'폴더를 드래그 앤 드롭해도 됩니다', es:'También puedes arrastrar y soltar una carpeta aquí', fr:'Vous pouvez aussi glisser-déposer un dossier ici', de:'Sie können einen Ordner auch hierher ziehen' },
  loadingTitle: { ja:'フォルダをスキャン中…', en:'Scanning folder…', 'zh-CN':'正在扫描文件夹…', 'zh-TW':'正在掃描資料夾…', ko:'폴더를 스캔하는 중…', es:'Escaneando carpeta…', fr:'Analyse du dossier…', de:'Ordner wird gescannt…' },
  loadingSubtitle: { ja:'大きなフォルダでも画面を固めず処理しています', en:'Large folders are processed without freezing the interface', 'zh-CN':'即使文件夹很大，也不会冻结界面', 'zh-TW':'即使資料夾很大，也不會凍結介面', ko:'큰 폴더도 화면을 멈추지 않고 처리합니다', es:'Las carpetas grandes se procesan sin bloquear la interfaz', fr:'Les grands dossiers sont traités sans bloquer l’interface', de:'Auch große Ordner werden ohne Einfrieren der Oberfläche verarbeitet' },
  dropTitle: { ja:'ここにフォルダをドロップ', en:'Drop a folder here', 'zh-CN':'将文件夹拖放到这里', 'zh-TW':'將資料夾拖放到這裡', ko:'여기에 폴더를 놓으세요', es:'Suelta una carpeta aquí', fr:'Déposez un dossier ici', de:'Ordner hier ablegen' },
  applyDone: { ja:'表示設定を適用しました', en:'View settings applied', 'zh-CN':'显示设置已应用', 'zh-TW':'顯示設定已套用', ko:'표시 설정을 적용했습니다', es:'Configuración aplicada', fr:'Paramètres appliqués', de:'Einstellungen angewendet' },
  copied: { ja:'Markdownをコピーしました', en:'Markdown copied', 'zh-CN':'已复制 Markdown', 'zh-TW':'已複製 Markdown', ko:'Markdown을 복사했습니다', es:'Markdown copiado', fr:'Markdown copié', de:'Markdown kopiert' },
  saved: { ja:'保存しました', en:'Saved', 'zh-CN':'已保存', 'zh-TW':'已儲存', ko:'저장했습니다', es:'Guardado', fr:'Enregistré', de:'Gespeichert' },
  invalidDrop: { ja:'有効なフォルダをドロップしてください', en:'Drop a valid folder', 'zh-CN':'请拖放有效的文件夹', 'zh-TW':'請拖放有效的資料夾', ko:'유효한 폴더를 놓아주세요', es:'Suelta una carpeta válida', fr:'Déposez un dossier valide', de:'Legen Sie einen gültigen Ordner ab' },
  foldersFiles: { ja:(f,fi)=>`${f.toLocaleString()} フォルダ · ${fi.toLocaleString()} ファイル`, en:(f,fi)=>`${f.toLocaleString()} folders · ${fi.toLocaleString()} files`, 'zh-CN':(f,fi)=>`${f.toLocaleString()} 个文件夹 · ${fi.toLocaleString()} 个文件`, 'zh-TW':(f,fi)=>`${f.toLocaleString()} 個資料夾 · ${fi.toLocaleString()} 個檔案`, ko:(f,fi)=>`폴더 ${f.toLocaleString()}개 · 파일 ${fi.toLocaleString()}개`, es:(f,fi)=>`${f.toLocaleString()} carpetas · ${fi.toLocaleString()} archivos`, fr:(f,fi)=>`${f.toLocaleString()} dossiers · ${fi.toLocaleString()} fichiers`, de:(f,fi)=>`${f.toLocaleString()} Ordner · ${fi.toLocaleString()} Dateien` },
  searchCount: { ja:(n)=>`${n.toLocaleString()} 件表示`, en:(n)=>`${n.toLocaleString()} shown`, 'zh-CN':(n)=>`显示 ${n.toLocaleString()} 项`, 'zh-TW':(n)=>`顯示 ${n.toLocaleString()} 項`, ko:(n)=>`${n.toLocaleString()}개 표시`, es:(n)=>`${n.toLocaleString()} mostrados`, fr:(n)=>`${n.toLocaleString()} affichés`, de:(n)=>`${n.toLocaleString()} angezeigt` },
  progress: { ja:(n)=>`スキャン中 · ${n.toLocaleString()} フォルダ`, en:(n)=>`Scanning · ${n.toLocaleString()} folders`, 'zh-CN':(n)=>`扫描中 · ${n.toLocaleString()} 个文件夹`, 'zh-TW':(n)=>`掃描中 · ${n.toLocaleString()} 個資料夾`, ko:(n)=>`스캔 중 · ${n.toLocaleString()}개 폴더`, es:(n)=>`Escaneando · ${n.toLocaleString()} carpetas`, fr:(n)=>`Analyse · ${n.toLocaleString()} dossiers`, de:(n)=>`Scan läuft · ${n.toLocaleString()} Ordner` }
};

let currentTreeData = null;
let currentTextTree = '';
let currentFolderPath = '';
let currentStats = null;
let activeLoadId = 0;
let reloadTimer = 0;
let theme = localStorage.getItem('folder-tree-theme') || 'dark';
let lang = localStorage.getItem('folder-tree-lang') || 'auto';
let toastTimer = 0;

function detectLang() {
  const value = navigator.language.toLowerCase();
  if (value.startsWith('ja')) return 'ja';
  if (value.startsWith('zh-cn')) return 'zh-CN';
  if (value.startsWith('zh-tw') || value.startsWith('zh-hk')) return 'zh-TW';
  if (value.startsWith('ko')) return 'ko';
  if (value.startsWith('es')) return 'es';
  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('de')) return 'de';
  return 'en';
}

function getLangCode() { return lang === 'auto' ? detectLang() : lang; }
function t(key, ...args) {
  const value = LANG_DICT[key]?.[getLangCode()] ?? LANG_DICT[key]?.en ?? '';
  return typeof value === 'function' ? value(...args) : value;
}

function setTheme(value) {
  theme = value === 'light' ? 'light' : 'dark';
  localStorage.setItem('folder-tree-theme', theme);
  document.body.classList.toggle('light', theme === 'light');
  document.body.classList.toggle('dark', theme !== 'light');
}

function applyLanguage() {
  const code = getLangCode();
  document.documentElement.lang = code;
  els.brandSubtitle.textContent = t('brandSubtitle');
  els.eyebrow.textContent = t('eyebrow');
  els.heroTitle.textContent = t('heroTitle');
  els.heroDescription.textContent = t('heroDescription');
  els.selectBtn.querySelector('span:last-child').textContent = t('selectFolder');
  els.emptySelectBtn.textContent = t('selectFolder');
  els.refreshText.textContent = t('refresh');
  els.copyText.textContent = t('copyMarkdown');
  els.saveText.textContent = t('save');
  els.pathLabel.textContent = t('selectedFolder');
  els.settingsText.textContent = t('settings');
  els.depthLabel.textContent = t('depth');
  els.excludeLabel.textContent = t('exclude');
  els.customExclude.placeholder = t('customPlaceholder');
  els.applyBtn.textContent = t('apply');
  els.treeTitle.textContent = t('treeTitle');
  els.treeSubtitle.textContent = currentFolderPath ? t('treeSubtitleReady') : t('treeSubtitleEmpty');
  els.expandText.textContent = t('expand');
  els.collapseText.textContent = t('collapse');
  els.searchInput.placeholder = t('searchPlaceholder');
  els.emptyTitle.textContent = t('emptyTitle');
  els.emptyDescription.textContent = t('emptyDescription');
  els.loadingTitle.textContent = t('loadingTitle');
  els.loadingSubtitle.textContent = t('loadingSubtitle');
  els.dropTitle.textContent = t('dropTitle');
  updateStatus();
}

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add('show');
  toastTimer = window.setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function setLoading(active) {
  els.loadingState.classList.toggle('hidden', !active);
  els.emptyState.classList.toggle('hidden', active || Boolean(currentTreeData));
  els.tree.classList.toggle('hidden', active || !currentTreeData);
  els.selectBtn.disabled = active;
}

function setReadyState(hasTree) {
  els.refreshBtn.disabled = !hasTree;
  els.copyBtn.disabled = !hasTree;
  els.saveBtn.disabled = !hasTree;
  els.expandBtn.disabled = !hasTree;
  els.collapseBtn.disabled = !hasTree;
}

function getOptions() {
  const excludes = [...document.querySelectorAll('.excludeCheck:checked')].map((input) => input.value);
  const custom = els.customExclude.value.split(',').map((item) => item.trim()).filter(Boolean);
  return { maxDepth: Number.parseInt(els.depthRange.value, 10), excludes: [...new Set([...excludes, ...custom])] };
}

function getBasename(value) {
  return value.replace(/\\/g, '/').split('/').filter(Boolean).pop() || value;
}

function wrapAsMarkdownCodeBlock(text) {
  let maxRun = 0;
  for (const match of text.match(/`+/g) || []) maxRun = Math.max(maxRun, match.length);
  const fence = '`'.repeat(Math.max(3, maxRun + 1));
  return `${fence}text\n${text}\n${fence}`;
}

function treeDataToJson(treeData) {
  function clean(node, root = false) {
    const name = root ? getBasename(node.name) : node.name;
    if (node.type === 'file' || node.type === 'truncated') return { name, type: node.type };
    return { name, type: node.type, children: (node.children || []).map((child) => clean(child)) };
  }
  return JSON.stringify(clean(treeData, true), null, 2);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char]);
}

function renderTree(treeData, expandDirectories = false) {
  els.tree.replaceChildren();
  const rootDetails = document.createElement('details');
  rootDetails.open = true;
  const rootSummary = document.createElement('summary');
  const rootName = document.createElement('span');
  rootName.className = 'folder-name';
  rootName.textContent = `${getBasename(treeData.name)}/`;
  rootSummary.append(rootName);
  const rootList = document.createElement('ul');
  rootDetails.append(rootSummary, rootList);
  els.tree.append(rootDetails);
  renderChildren(treeData.children || [], rootList, true, expandDirectories);
}


function renderChildren(children, parent, rootLevel = false, expandDirectories = false) {
  const fragment = document.createDocumentFragment();
  for (const child of children) {
    const li = document.createElement('li');
    if (child.type === 'directory') {
      const details = document.createElement('details');
      details.open = rootLevel || expandDirectories;
      details.dataset.rendered = rootLevel || expandDirectories ? 'true' : 'false';
      const summary = document.createElement('summary');
      const label = document.createElement('span');
      label.className = 'folder-name';
      label.textContent = `${child.name}/`;
      summary.append(label);
      details.append(summary);
      if (rootLevel) {
        const list = document.createElement('ul');
        renderChildren(child.children || [], list, false, expandDirectories);
        details.append(list);
      }
      details.addEventListener('toggle', () => {
        if (!details.open || details.dataset.rendered === 'true') return;
        const list = document.createElement('ul');
        renderChildren(child.children || [], list, false, expandDirectories);
        details.append(list);
        details.dataset.rendered = 'true';
      });
      li.append(details);
    } else if (child.type === 'file') {
      const file = document.createElement('span');
      file.className = 'file-name';
      file.textContent = child.name;
      li.append(file);
    } else {
      const truncated = document.createElement('span');
      truncated.className = 'truncated';
      truncated.textContent = child.name;
      li.append(truncated);
    }
    fragment.append(li);
  }
  parent.append(fragment);
}

function countVisibleMatches() {
  const query = els.searchInput.value.trim().toLowerCase();
  if (!query) return currentStats ? currentStats.folders + currentStats.files : 0;
  let count = 0;
  for (const node of currentTreeData ? walkNodes(currentTreeData) : []) {
    if ((node.name || '').toLowerCase().includes(query)) count += 1;
  }
  return count;
}

function* walkNodes(node) {
  yield node;
  for (const child of node.children || []) yield* walkNodes(child);
}

function applySearchFilter() {
  if (!currentTreeData) return;
  const query = els.searchInput.value.trim().toLowerCase();
  if (!query) {
    renderTree(currentTreeData);
    updateStatus();
    return;
  }

  function buildFiltered(node, root = false) {
    if (node.type !== 'directory') return node.name.toLowerCase().includes(query) ? node : null;
    const ownMatch = node.name.toLowerCase().includes(query);
    const children = [];
    for (const child of node.children || []) {
      const result = buildFiltered(child);
      if (result) children.push(result);
    }
    if (!ownMatch && children.length === 0) return null;
    return { ...node, children };
  }

  const filtered = buildFiltered(currentTreeData, true);
  els.tree.replaceChildren();
  if (!filtered) {
    const message = document.createElement('div');
    message.className = 'empty-state';
    message.innerHTML = `<div class="empty-icon">⌕</div><h2>${escapeHtml(t('searchPlaceholder'))}</h2><p>${escapeHtml(t('searchCount', 0))}</p>`;
    els.tree.append(message);
  } else {
    renderTree(filtered, true);
  }
  updateStatus();
}

function updateStatus() {
  if (!currentTreeData || !currentStats) {
    els.treeStatus.textContent = t('idle');
    return;
  }
  const query = els.searchInput.value.trim();
  els.treeStatus.textContent = query ? t('searchCount', countVisibleMatches()) : t('foldersFiles', currentStats.folders, currentStats.files);
}

async function loadFolder(folderPath) {
  const loadId = ++activeLoadId;
  currentFolderPath = folderPath;
  els.pathValue.textContent = folderPath;
  els.pathValue.classList.remove('empty');
  els.treeSubtitle.textContent = t('treeSubtitleReady');
  setReadyState(false);
  setLoading(true);
  els.treeStatus.textContent = t('loadingTitle');

  try {
    const result = await api.readFolder(folderPath, getOptions());
    if (loadId !== activeLoadId) return;
    currentTreeData = result.treeData;
    currentTextTree = result.textTree;
    currentStats = result.stats;
    els.searchInput.value = '';
    renderTree(currentTreeData);
    setLoading(false);
    setReadyState(true);
    updateStatus();
  } catch (error) {
    if (loadId !== activeLoadId) return;
    currentTreeData = null;
    currentTextTree = '';
    currentStats = null;
    setLoading(false);
    setReadyState(false);
    els.emptyState.classList.remove('hidden');
    els.tree.classList.add('hidden');
    showToast(error?.message || String(error));
    updateStatus();
  }
}

function scheduleReload() {
  if (!currentFolderPath) return;
  clearTimeout(reloadTimer);
  reloadTimer = window.setTimeout(() => loadFolder(currentFolderPath), 220);
}

function selectFolder() {
  return api.selectFolder().then((folderPath) => {
    if (folderPath) return loadFolder(folderPath);
    return undefined;
  });
}

function expandAll() {
  if (currentTreeData) renderTree(currentTreeData, true);
}

function collapseAll() {
  if (!currentTreeData) return;
  renderTree(currentTreeData, false);
  const root = els.tree.querySelector('details');
  if (root) root.open = false;
}

els.selectBtn.addEventListener('click', selectFolder);
els.emptySelectBtn.addEventListener('click', selectFolder);
els.refreshBtn.addEventListener('click', () => { if (currentFolderPath) loadFolder(currentFolderPath); });
els.copyBtn.addEventListener('click', async () => {
  if (!currentTextTree) return;
  const success = await api.copyToClipboard(wrapAsMarkdownCodeBlock(currentTextTree));
  if (success) showToast(t('copied'));
});
els.saveBtn.addEventListener('click', async () => {
  if (!currentTreeData) return;
  const format = els.formatSelect.value;
  const content = format === 'json' ? treeDataToJson(currentTreeData) : currentTextTree;
  const success = await api.saveFile(format === 'html' ? buildStandaloneHtml(currentTreeData) : content, format);
  if (success) showToast(t('saved'));
});
els.themeBtn.addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
els.langSelect.addEventListener('change', () => {
  lang = els.langSelect.value;
  localStorage.setItem('folder-tree-lang', lang);
  applyLanguage();
});
els.depthRange.addEventListener('input', () => {
  els.depthVal.textContent = els.depthRange.value;
  scheduleReload();
});
document.querySelectorAll('.excludeCheck').forEach((checkbox) => checkbox.addEventListener('change', scheduleReload));
els.applyBtn.addEventListener('click', () => {
  if (!currentFolderPath) return;
  loadFolder(currentFolderPath);
  showToast(t('applyDone'));
});
els.expandBtn.addEventListener('click', expandAll);
els.collapseBtn.addEventListener('click', collapseAll);
els.searchInput.addEventListener('input', applySearchFilter);

let dragDepth = 0;
window.addEventListener('dragenter', (event) => {
  event.preventDefault();
  dragDepth += 1;
  els.dropOverlay.classList.remove('hidden');
});
window.addEventListener('dragover', (event) => event.preventDefault());
window.addEventListener('dragleave', (event) => {
  event.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) els.dropOverlay.classList.add('hidden');
});
window.addEventListener('drop', async (event) => {
  event.preventDefault();
  dragDepth = 0;
  els.dropOverlay.classList.add('hidden');
  const file = event.dataTransfer.files[0];
  if (!file?.path) return;
  const validated = await api.validateDropPath(file.path);
  if (!validated) {
    showToast(t('invalidDrop'));
    return;
  }
  await loadFolder(validated);
});

window.addEventListener('keydown', (event) => {
  const mod = event.ctrlKey || event.metaKey;
  if (mod && event.key.toLowerCase() === 'o') {
    event.preventDefault();
    void selectFolder();
  } else if (mod && event.key.toLowerCase() === 's') {
    event.preventDefault();
    if (!els.saveBtn.disabled) els.saveBtn.click();
  } else if (mod && event.shiftKey && event.key.toLowerCase() === 'c') {
    event.preventDefault();
    if (!els.copyBtn.disabled) els.copyBtn.click();
  } else if (event.key === 'F5') {
    event.preventDefault();
    if (!els.refreshBtn.disabled) els.refreshBtn.click();
  }
});

function buildStandaloneHtml(treeData) {
  function renderNodes(children) {
    return (children || []).map((child) => {
      if (child.type === 'file') return `<li class="file">${escapeHtml(child.name)}</li>`;
      if (child.type === 'truncated') return `<li class="trunc">${escapeHtml(child.name)}</li>`;
      return `<li><details open><summary>${escapeHtml(child.name)}/</summary><ul>${renderNodes(child.children)}</ul></details></li>`;
    }).join('');
  }
  const rootName = escapeHtml(getBasename(treeData.name));
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>${rootName}</title><style>body{margin:0;padding:24px;background:#111;color:#e8edf4;font-family:Consolas,"Cascadia Mono",monospace;line-height:1.7}h1{font-size:18px;margin:0 0 18px;color:#79a8ff}ul{list-style:none;margin:0;padding-left:18px;border-left:1px solid #2b3442}summary{cursor:pointer;color:#79a8ff}.file{color:#c2cad6}.trunc{color:#8490a3;font-style:italic}</style></head><body><h1>${rootName}/</h1><ul>${renderNodes(treeData.children)}</ul></body></html>`;
}

api.onScanProgress((count) => {
  els.treeStatus.textContent = t('progress', count);
});

els.langSelect.value = lang;
els.depthVal.textContent = els.depthRange.value;
setTheme(theme);
applyLanguage();
setReadyState(false);
