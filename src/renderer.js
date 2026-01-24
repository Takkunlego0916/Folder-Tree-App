const { ipcRenderer } = require('electron');

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
  selectFolder: { ja:"フォルダを選択", en:"Select Folder", "zh-CN":"选择文件夹","zh-TW":"選擇資料夾", ko:"폴더 선택", es:"Seleccionar carpeta", fr:"Sélectionner le dossier", de:"Ordner auswählen" },
  copyMarkdown: { ja:"Markdownコピー", en:"Copy Markdown", "zh-CN":"复制Markdown","zh-TW":"複製Markdown", ko:"Markdown 복사", es:"Copiar Markdown", fr:"Copier Markdown", de:"Markdown kopieren" },
  save: { ja:"保存", en:"Save", "zh-CN":"保存","zh-TW":"保存", ko:"저장", es:"Guardar", fr:"Enregistrer", de:"Speichern" },
  theme: { ja:"モード切替", en:"Theme", "zh-CN":"切换模式","zh-TW":"切換模式", ko:"모드 전환", es:"Modo", fr:"Thème", de:"Modus" },
  copySuccess: { ja:"Markdown形式でコピーしました！", en:"Copied in Markdown!", "zh-CN":"已复制为Markdown！","zh-TW":"已複製為Markdown！", ko:"Markdown로 복사 완료!", es:"¡Copiado en Markdown!", fr:"Copié en Markdown !", de:"Markdown kopiert!" },
  saveSuccess: { ja:"保存しました！", en:"Saved!", "zh-CN":"已保存！","zh-TW":"已保存！", ko:"저장 완료!", es:"¡Guardado!", fr:"Enregistré !", de:"Gespeichert!" }
};

function showToast(message){
  toastEl.textContent = message;
  toastEl.style.opacity = "1";
  setTimeout(()=>toastEl.style.opacity="0",2000);
}

async function loadFolder(folderPath){
  try{
    const { htmlTree, textTree } = await ipcRenderer.invoke('read-folder', folderPath);
    treeEl.innerHTML = htmlTree;
    currentTextTree = textTree;
  }catch(err){ showToast(err.message); }
}

function getLangCode(){
  if(lang==='auto'){
    const navLang = navigator.language;
    return LANG_DICT.selectFolder[navLang]? navLang:'en';
  }
  return lang;
}

function setLang(code){
  selectBtn.textContent = LANG_DICT.selectFolder[code];
  copyBtn.textContent = LANG_DICT.copyMarkdown[code];
  saveBtn.textContent = LANG_DICT.save[code];
  themeBtn.textContent = LANG_DICT.theme[code];
}

async function initTheme(){
  if(theme==='auto') theme = await ipcRenderer.invoke('get-theme');
  document.body.classList.remove('dark','light');
  document.body.classList.add(theme);
}

setLang(getLangCode());
initTheme();

selectBtn.addEventListener('click', async()=>{
  const folderPath = await ipcRenderer.invoke('select-folder');
  if(folderPath) loadFolder(folderPath);
});

copyBtn.addEventListener('click', ()=>{
  if(currentTextTree){
    ipcRenderer.send('copy-to-clipboard', `\`\`\`text\n${currentTextTree}\n\`\`\``);
    showToast(LANG_DICT.copySuccess[getLangCode()]);
  }
});

saveBtn.addEventListener('click', async()=>{
  if(currentTextTree){
    const success = await ipcRenderer.invoke('save-file', currentTextTree);
    if(success) showToast(LANG_DICT.saveSuccess[getLangCode()]);
  }
});

themeBtn.addEventListener('click', ()=>{
  theme = theme==='dark'?'light':'dark';
  document.body.classList.remove('dark','light');
  document.body.classList.add(theme);
});

langSelect.addEventListener('change', ()=>{
  lang = langSelect.value;
  setLang(getLangCode());
});

window.addEventListener('dragover', e=>e.preventDefault());
window.addEventListener('drop', async(e)=>{
  e.preventDefault();
  if(e.dataTransfer.files.length===0) return;
  const folderPath = e.dataTransfer.files[0].path;
  try{
    const { htmlTree, textTree } = await ipcRenderer.invoke('drop-folder', folderPath);
    treeEl.innerHTML = htmlTree;
    currentTextTree = textTree;
  }catch(err){ showToast(err.message); }
});
