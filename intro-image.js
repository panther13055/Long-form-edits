// Optional image support for Stage 01 / Intro Card
(() => {
  const originalCreateSection = createSection;
  createSection = function(n) {
    const s = originalCreateSection(n);
    s.introImage = null;
    s.introImageUrl = null;
    s.introImageName = '';
    s.fit1 = 'cover';
    return s;
  };

  // The first section was created before this enhancement loaded.
  sections.forEach(s => {
    if (!('introImage' in s)) s.introImage = null;
    if (!('introImageUrl' in s)) s.introImageUrl = null;
    if (!('introImageName' in s)) s.introImageName = '';
    if (!('fit1' in s)) s.fit1 = 'cover';
  });

  const introCard = document.querySelector('.stage-card[data-stage="0"]');
  const introGrid = introCard?.querySelector('.form-grid');
  const introSubtitle = introCard?.querySelector('.stage-heading span');
  if (introSubtitle) introSubtitle.textContent = 'Optional image / text opening';

  if (introCard && introGrid) {
    const uploader = document.createElement('label');
    uploader.className = 'drop-zone';
    uploader.id = 'drop1';
    uploader.innerHTML = `
      <input id="image1" type="file" accept="image/*" />
      <div class="drop-preview" id="preview1"><span>Drop image or click to upload</span></div>
    `;
    introGrid.before(uploader);

    const fitLabel = document.createElement('label');
    fitLabel.innerHTML = `Image fit
      <select id="fit1">
        <option value="cover">Cover</option>
        <option value="contain">Contain</option>
      </select>`;
    introGrid.insertBefore(fitLabel, introGrid.firstChild);
  }

  function updateIntroPreview() {
    const s = current();
    const el = document.getElementById('preview1');
    if (!el) return;
    el.innerHTML = s.introImageUrl
      ? `<img src="${s.introImageUrl}" alt="intro preview">`
      : '<span>Drop image or click to upload</span>';
    const fit = document.getElementById('fit1');
    if (fit) fit.value = s.fit1 || 'cover';
  }

  document.getElementById('image1')?.addEventListener('change', e => {
    const f = e.target.files?.[0];
    if (!f) return;
    const s = current();
    revoke(s.introImageUrl);
    s.introImage = f;
    s.introImageName = f.name;
    s.introImageUrl = URL.createObjectURL(f);
    updateIntroPreview();
    renderAtTime(sectionStartTime(activeIndex));
    toast('Intro image added');
  });

  document.getElementById('fit1')?.addEventListener('input', e => {
    current().fit1 = e.target.value;
    renderAtTime(playback.offset);
  });

  const originalLoadForm = loadForm;
  loadForm = function() {
    originalLoadForm();
    updateIntroPreview();
  };

  const originalSerializable = serializable;
  serializable = function() {
    const data = originalSerializable();
    data.sections = data.sections.map((saved, i) => {
      const clean = {
        ...saved,
        introImageName: sections[i]?.introImageName || '',
        fit1: sections[i]?.fit1 || 'cover'
      };
      delete clean.introImage;
      delete clean.introImageUrl;
      return clean;
    });
    return data;
  };

  const originalDrawStage = drawStage;
  drawStage = function(s, stage) {
    if (stage !== 0) return originalDrawStage(s, stage);

    drawBackground(s.introBg);
    if (s.introImageUrl) {
      drawImageCover(getImage(s.introImageUrl), s.fit1 || 'cover');
      // Keep intro copy readable on bright images.
      ctx.fillStyle = 'rgba(0,0,0,.28)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawVignette();
    } else {
      const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      g.addColorStop(0, s.introBg);
      g.addColorStop(1, s.accentColor + '28');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    drawText({ ...s, textPosition: 'center' }, true);
  };

  // Hide the empty-state message even when only the intro image is present.
  const originalRenderAtTime = renderAtTime;
  renderAtTime = function(t) {
    originalRenderAtTime(t);
    const hint = document.getElementById('emptyHint');
    if (hint && sections.some(s => s.introImageUrl || s.image2Url || s.image3Url)) {
      hint.style.display = 'none';
    }
  };

  // Free the intro image URL when a character is deleted.
  const deleteBtn = document.getElementById('deleteSectionBtn');
  if (deleteBtn) {
    const originalDelete = deleteBtn.onclick;
    deleteBtn.onclick = ev => {
      const url = current()?.introImageUrl;
      if (url) revoke(url);
      originalDelete?.call(deleteBtn, ev);
    };
  }

  updateIntroPreview();
  renderAtTime(playback.offset);
})();