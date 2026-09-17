// Separate text for Image 1 (cartoon/original) and Image 2 (final/reveal)
(() => {
  if (typeof sections === 'undefined' || typeof drawText !== 'function') return;

  function ensureStageText(s) {
    if (!s) return s;
    if (!('image2Title' in s)) s.image2Title = s.name || '';
    if (!('image2Subtitle' in s)) s.image2Subtitle = '';
    if (!('image2ShowText' in s)) s.image2ShowText = true;
    if (!('image3Title' in s)) s.image3Title = s.name || '';
    if (!('image3Subtitle' in s)) s.image3Subtitle = s.subtitle || 'In Real Life';
    if (!('image3ShowText' in s)) s.image3ShowText = true;
    return s;
  }

  sections.forEach(ensureStageText);
  const previousCreateSection = createSection;
  createSection = function(n) {
    return ensureStageText(previousCreateSection(n));
  };

  const css = document.createElement('style');
  css.textContent = `
    .stage-text-editor{margin:14px 0 4px;padding:12px;border:1px solid rgba(255,255,255,.08);border-radius:14px;background:rgba(255,255,255,.025)}
    .stage-text-title{font-size:11px;letter-spacing:.09em;text-transform:uppercase;font-weight:800;opacity:.72;margin-bottom:10px}
    .stage-text-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;flex-wrap:wrap}
    .stage-text-toggle{display:flex!important;align-items:center;gap:8px;margin:0!important}.stage-text-toggle input{width:auto!important}
  `;
  document.head.appendChild(css);

  function addEditor(card, stageNumber, prefix) {
    if (!card || document.getElementById(`${prefix}Title`)) return;
    const box = document.createElement('div');
    box.className = 'stage-text-editor';
    box.innerHTML = `
      <div class="stage-text-title">Image ${stageNumber} text</div>
      <div class="form-grid two-col compact">
        <label>Title
          <input id="${prefix}Title" type="text" placeholder="e.g. Chhota Bheem" />
        </label>
        <label>Subtitle
          <input id="${prefix}Subtitle" type="text" placeholder="Optional subtitle" />
        </label>
      </div>
      <div class="stage-text-actions">
        <label class="stage-text-toggle"><input id="${prefix}ShowText" type="checkbox" checked /> Show text on this image</label>
        <button id="${prefix}CopyShared" type="button" class="btn tiny ghost">Copy shared text</button>
      </div>`;

    const drop = card.querySelector('.drop-zone');
    if (drop) drop.after(box); else card.appendChild(box);
  }

  const card1 = document.querySelector('.stage-card[data-stage="1"]');
  const card2 = document.querySelector('.stage-card[data-stage="2"]');
  addEditor(card1, 1, 'image2');
  addEditor(card2, 2, 'image3');

  const fields = [
    ['image2Title','image2Title'],['image2Subtitle','image2Subtitle'],['image2ShowText','image2ShowText'],
    ['image3Title','image3Title'],['image3Subtitle','image3Subtitle'],['image3ShowText','image3ShowText']
  ];

  fields.forEach(([id,key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = el.type === 'checkbox' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      ensureStageText(current());
      current()[key] = el.type === 'checkbox' ? el.checked : el.value;
      renderAtTime(playback.offset);
    });
  });

  function copyShared(prefix) {
    const s = ensureStageText(current());
    s[`${prefix}Title`] = s.name || '';
    s[`${prefix}Subtitle`] = s.subtitle || '';
    s[`${prefix}ShowText`] = true;
    syncStageTextForm();
    renderAtTime(playback.offset);
    toast(`Shared text copied to ${prefix === 'image2' ? 'Image 1' : 'Image 2'}`);
  }

  document.getElementById('image2CopyShared')?.addEventListener('click', () => copyShared('image2'));
  document.getElementById('image3CopyShared')?.addEventListener('click', () => copyShared('image3'));

  function syncStageTextForm() {
    const s = ensureStageText(current());
    for (const [id,key] of fields) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = !!s[key];
      else el.value = s[key] ?? '';
    }
  }

  const previousLoadForm = loadForm;
  loadForm = function() {
    previousLoadForm();
    ensureStageText(current());
    syncStageTextForm();
  };

  // The advanced renderer passes stage=1 for Original/Cartoon and stage=2 for Reveal/Final.
  // Swap in stage-specific title/subtitle only while that scene's text is being drawn.
  const previousDrawText = drawText;
  drawText = function(s, intro=false, stage=0, progress=1) {
    if (intro || (stage !== 1 && stage !== 2)) {
      return previousDrawText(s, intro, stage, progress);
    }

    ensureStageText(s);
    const copy = { ...s };
    if (stage === 1) {
      copy.name = s.image2ShowText ? (s.image2Title ?? '') : '';
      copy.subtitle = s.image2ShowText ? (s.image2Subtitle ?? '') : '';
    } else {
      copy.name = s.image3ShowText ? (s.image3Title ?? '') : '';
      copy.subtitle = s.image3ShowText ? (s.image3Subtitle ?? '') : '';
    }
    return previousDrawText(copy, intro, stage, progress);
  };

  syncStageTextForm();
  renderAtTime(playback.offset);
})();
