'use strict';
const $ = (selector) => document.querySelector(selector);
const all = (selector) => [...document.querySelectorAll(selector)];
const commands = {
  'main-table': ['configs/paths.local.json', 'Evaluate the three FutureWorlds main-table checkpoints at 10, 20, and 32 frames.'],
  'matched-200': ['configs/paths.local.json', 'Compare SFT, GRPO200, ordinary-beam200, and MemSPO200 under matched evaluation settings.'],
  'memory': ['configs/paths.local.json', 'Compare full, recent, and minimal history with the same MemSPO200 weights and decoding.'],
  'train': ['configs/train-workflow.local.json', 'Prepare data and frozen features, run SFT (optional) and post-training, export the checkpoint, then evaluate. Copy train-workflow.example.json and set its paths first.']
};
function selectTab(button) {
  for (const tab of button.parentElement.querySelectorAll('[role=tab]')) {
    tab.setAttribute('aria-selected', String(tab === button));
    tab.tabIndex = tab === button ? 0 : -1;
  }
  document.getElementById(button.getAttribute('aria-controls')).setAttribute('aria-labelledby', button.id);
}
for (const group of all('[role=tablist]')) group.addEventListener('keydown', event => {
  const tabs = [...group.querySelectorAll('[role=tab]')];
  let index = tabs.indexOf(document.activeElement);
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[index].focus(); tabs[index].click();
});
for (const button of all('[data-command]')) button.addEventListener('click', () => {
  selectTab(button);
  const suite = button.dataset.command;
  $('#command-code').textContent = `./run.sh --config ${commands[suite][0]} \\\n  --suite ${suite}`;
  $('#command-description').textContent = commands[suite][1];
});
$('#copy-command')?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('#command-code').textContent);
    $('#copy-command').textContent = 'Copied ✓';
    $('#feedback').textContent = 'Command copied to clipboard.';
    setTimeout(() => { $('#copy-command').textContent = 'Copy command'; }, 1800);
  } catch (_) {
    const range = document.createRange(); range.selectNodeContents($('#command-code'));
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    $('#feedback').textContent = 'Command selected. Use your system copy shortcut.';
    $('#copy-command').textContent = 'Selected — press copy';
  }
});
const resultData = $('#results-data');
if (resultData) {
  const data = JSON.parse(resultData.textContent);
  function renderResults(dataset) {
    const body = $('#result-rows'); body.replaceChildren();
    for (const row of data.methods) {
      const tr = document.createElement('tr');
      if (row.method === 'FutureWorlds') tr.className = 'ours';
      const name = document.createElement('td'); name.textContent = row.method; tr.append(name);
      for (const metric of ['psnr', 'ssim', 'lpips']) {
        const cell = document.createElement('td');
        cell.textContent = row[dataset][metric].toFixed(metric === 'psnr' ? 2 : 4); tr.append(cell);
      }
      body.append(tr);
    }
    $('table caption').textContent = `32-frame results on ${dataset}`;
    $('#feedback').textContent = `Showing ${dataset}: ${data.methods.length} methods, 128 trajectories.`;
  }
  for (const button of all('[data-dataset]')) button.addEventListener('click', () => {
    selectTab(button); renderResults(button.dataset.dataset);
  });
}
const dialog = $('#figure-dialog');
for (const button of all('[data-zoom]')) button.addEventListener('click', () => {
  $('#figure-full').src = button.dataset.zoom;
  $('#figure-full').alt = button.querySelector('img').alt;
  $('#figure-caption').textContent = button.dataset.caption;
  $('.dialog-image').classList.remove('native-size');
  $('#actual-size').setAttribute('aria-pressed','false');
  $('#actual-size').textContent = 'Actual size';
  dialog.showModal();
});
$('#close-figure')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

$('#actual-size')?.addEventListener('click', () => {
  const native = $('.dialog-image').classList.toggle('native-size');
  $('#actual-size').setAttribute('aria-pressed',String(native));
  $('#actual-size').textContent = native ? 'Fit to window' : 'Actual size';
});
