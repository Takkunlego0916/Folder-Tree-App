const { parentPort, workerData } = require('worker_threads');
const fs = require('fs/promises');
const path = require('path');

const MAX_CHILDREN_PER_DIR = 2000;
const collator = new Intl.Collator('ja', { numeric: true, sensitivity: 'base' });
const concurrencyLimit = 24;
let activeTasks = 0;
const taskQueue = [];
let progressCount = 0;

function runLimited(task) {
  return new Promise((resolve, reject) => {
    taskQueue.push({ task, resolve, reject });
    drainQueue();
  });
}

function drainQueue() {
  while (activeTasks < concurrencyLimit && taskQueue.length > 0) {
    const item = taskQueue.shift();
    activeTasks += 1;
    Promise.resolve()
      .then(item.task)
      .then(item.resolve, item.reject)
      .finally(() => {
        activeTasks -= 1;
        drainQueue();
      });
  }
}

function postProgress() {
  progressCount += 1;
  if (progressCount === 1 || progressCount % 25 === 0) {
    parentPort.postMessage({ type: 'progress', value: progressCount });
  }
}

async function buildTreeNode(dirPath, depth, options, excludesLower) {
  const node = { name: dirPath, type: 'directory', children: [] };

  if (depth >= options.maxDepth) {
    node.children.push({ name: '…', type: 'truncated' });
    return node;
  }

  let dirents;
  try {
    dirents = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    node.children.push({ name: '読み込み失敗', type: 'truncated' });
    return node;
  }

  dirents.sort((a, b) => collator.compare(a.name, b.name));
  const visible = [];
  for (const entry of dirents) {
    if (entry.isSymbolicLink()) continue;
    if (excludesLower.has(entry.name.toLowerCase())) continue;
    visible.push(entry);
    if (visible.length >= MAX_CHILDREN_PER_DIR) break;
  }

  const children = new Array(visible.length);
  const tasks = [];

  for (let index = 0; index < visible.length; index += 1) {
    const entry = visible[index];
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      tasks.push(runLimited(async () => {
        const child = await buildTreeNode(fullPath, depth + 1, options, excludesLower);
        child.name = entry.name;
        children[index] = child;
        postProgress();
      }));
    } else {
      children[index] = { name: entry.name, type: 'file' };
    }
  }

  await Promise.all(tasks);
  node.children = children.filter(Boolean);

  if (dirents.length > visible.length) {
    node.children.push({
      name: `… (${dirents.length - visible.length} 件省略)`,
      type: 'truncated'
    });
  }

  return node;
}

function treeToText(node) {
  const lines = [`${node.name}/`];
  const walk = (children, prefix = '') => {
    for (let index = 0; index < children.length; index += 1) {
      const child = children[index];
      const last = index === children.length - 1;
      const connector = last ? '└── ' : '├── ';
      lines.push(`${prefix}${connector}${child.name}${child.type === 'directory' ? '/' : ''}`);
      if (child.type === 'directory' && child.children?.length) {
        walk(child.children, prefix + (last ? '    ' : '│   '));
      }
    }
  };
  walk(node.children || []);
  return lines.join('\n');
}

function countTree(node) {
  let folders = node.type === 'directory' ? 1 : 0;
  let files = node.type === 'file' ? 1 : 0;
  let truncated = node.type === 'truncated' ? 1 : 0;
  for (const child of node.children || []) {
    const count = countTree(child);
    folders += count.folders;
    files += count.files;
    truncated += count.truncated;
  }
  return { folders, files, truncated };
}

(async () => {
  try {
    const options = workerData.options;
    const excludesLower = new Set((options.excludes || []).map((item) => item.toLowerCase()));
    const treeData = await buildTreeNode(workerData.folderPath, 0, options, excludesLower);
    const textTree = treeToText(treeData);
    const stats = countTree(treeData);
    parentPort.postMessage({ type: 'result', payload: { treeData, textTree, stats } });
  } catch (error) {
    parentPort.postMessage({ type: 'error', message: error instanceof Error ? error.message : String(error) });
  }
})();
