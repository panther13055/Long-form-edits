// Multi-resolution export module for Longform Studio
(() => {
  const QUALITY_PRESETS = {
    '480p':  { width: 854,  height: 480,  bitrate: 3_000_000 },
    '720p':  { width: 1280, height: 720,  bitrate: 6_000_000 },
    '1080p': { width: 1920, height: 1080, bitrate: 12_000_000 },
    '2K':    { width: 2560, height: 1440, bitrate: 20_000_000 },
    '4K':    { width: 3840, height: 2160, bitrate: 40_000_000 },
    '8K':    { width: 7680, height: 4320, bitrate: 80_000_000 }
  };

  const exportBtn = document.getElementById('exportBtn');
  if (!exportBtn || typeof renderAtTime !== 'function') return;

  // Add quality selector next to download button.
  const qualityWrap = document.createElement('label');
  qualityWrap.className = 'export-quality-wrap';
  qualityWrap.innerHTML = `
    <span>Download quality</span>
    <select id="exportQuality" aria-label="Download quality">
      <option value="480p">480p</option>
      <option value="720p">720p</option>
      <option value="1080p" selected>1080p</option>
      <option value="2K">2K</option>
      <option value="4K">4K</option>
      <option value="8K">8K</option>
    </select>
  `;
  exportBtn.parentElement?.insertBefore(qualityWrap, exportBtn);
  exportBtn.textContent = 'Download Video';

  const progress = document.createElement('div');
  progress.id = 'exportProgress';
  progress.className = 'export-progress';
  progress.innerHTML = '<div class="export-progress-fill"></div><span></span>';
  exportBtn.parentElement?.parentElement?.appendChild(progress);

  function setProgress(percent, label) {
    const p = Math.max(0, Math.min(100, percent || 0));
    progress.classList.toggle('show', p > 0 && p < 100);
    const fill = progress.querySelector('.export-progress-fill');
    const text = progress.querySelector('span');
    if (fill) fill.style.width = `${p}%`;
    if (text) text.textContent = label || `${Math.round(p)}%`;
  }

  function bestMimeType() {
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm'
    ];
    return candidates.find(t => MediaRecorder.isTypeSupported(t)) || '';
  }

  function safeFileName(label) {
    const base = (sections?.[0]?.name || 'longform-video')
      .toString()
      .trim()
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/^-+|-+$/g, '') || 'longform-video';
    return `${base}-${label}.webm`;
  }

  async function preloadImages() {
    const urls = [];
    sections.forEach(s => {
      if (s.introImageUrl) urls.push(s.introImageUrl);
      if (s.image2Url) urls.push(s.image2Url);
      if (s.image3Url) urls.push(s.image3Url);
    });
    await Promise.all(urls.map(url => new Promise(resolve => {
      const img = getImage(url);
      if (!img || img.complete) return resolve();
      const done = () => resolve();
      img.addEventListener('load', done, { once:true });
      img.addEventListener('error', done, { once:true });
      setTimeout(done, 8000);
    })));
  }

  function validateCanvasSize(width, height) {
    // Browsers/devices differ a lot for very large canvases. Test allocation first.
    try {
      const probe = document.createElement('canvas');
      probe.width = width;
      probe.height = height;
      const pctx = probe.getContext('2d');
      if (!pctx) return false;
      pctx.fillRect(0, 0, 1, 1);
      return probe.width === width && probe.height === height;
    } catch {
      return false;
    }
  }

  async function exportVideo() {
    if (!('MediaRecorder' in window) || !canvas.captureStream) {
      toast('Video download needs Chrome or Edge.');
      return;
    }
    if (!sections.length || totalDuration() <= 0) {
      toast('Add at least one scene before downloading.');
      return;
    }

    const quality = document.getElementById('exportQuality')?.value || '1080p';
    const preset = QUALITY_PRESETS[quality] || QUALITY_PRESETS['1080p'];

    if (!validateCanvasSize(preset.width, preset.height)) {
      toast(`${quality} is too large for this browser/device. Try a lower quality.`);
      return;
    }

    const oldW = canvas.width;
    const oldH = canvas.height;
    const oldOffset = playback.offset;
    let audioCtx = null;
    let musicEl = null;
    let recorder = null;
    const transientAudio = new Set();

    exportBtn.disabled = true;
    document.getElementById('exportQuality').disabled = true;
    exportBtn.textContent = `Preparing ${quality}…`;
    setProgress(1, `Preparing ${quality}…`);
    stopPlayback();

    try {
      await preloadImages();
      canvas.width = preset.width;
      canvas.height = preset.height;
      renderAtTime(0);

      const fps = 30;
      const stream = canvas.captureStream(fps);
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      await audioCtx.resume().catch(() => {});
      const destination = audioCtx.createMediaStreamDestination();
      const audioTrack = destination.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);

      if (music.url) {
        musicEl = new Audio(music.url);
        musicEl.loop = true;
        musicEl.preload = 'auto';
        const source = audioCtx.createMediaElementSource(musicEl);
        const gain = audioCtx.createGain();
        gain.gain.value = Math.max(0, Math.min(1, Number(music.volume) || 0));
        source.connect(gain).connect(destination);
      }

      const mimeType = bestMimeType();
      const options = {
        videoBitsPerSecond: preset.bitrate,
        audioBitsPerSecond: 192_000
      };
      if (mimeType) options.mimeType = mimeType;

      recorder = new MediaRecorder(stream, options);
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((resolve, reject) => {
        recorder.onstop = resolve;
        recorder.onerror = e => reject(e.error || new Error('Recorder error'));
      });

      recorder.start(1000);
      if (musicEl) {
        musicEl.currentTime = 0;
        await musicEl.play().catch(() => {});
      }

      exportBtn.textContent = `Rendering ${quality}…`;
      const duration = totalDuration();
      const started = performance.now();
      let lastReveal = -1;

      await new Promise(resolve => {
        const frame = now => {
          const t = Math.min(duration, (now - started) / 1000);
          renderAtTime(t);

          const r = resolveTime(Math.min(t, Math.max(0, duration - 0.001)));
          if (r?.stage === 2 && lastReveal !== r.sectionIndex && r.section.sfxUrl) {
            lastReveal = r.sectionIndex;
            try {
              const sfx = new Audio(r.section.sfxUrl);
              transientAudio.add(sfx);
              const src = audioCtx.createMediaElementSource(sfx);
              const gain = audioCtx.createGain();
              gain.gain.value = Math.max(0, Math.min(1, Number(r.section.sfxVolume) || 0));
              src.connect(gain).connect(destination);
              sfx.onended = () => transientAudio.delete(sfx);
              sfx.play().catch(() => transientAudio.delete(sfx));
            } catch (err) {
              console.warn('SFX export skipped:', err);
            }
          }

          const pct = duration ? Math.min(99, (t / duration) * 100) : 99;
          setProgress(pct, `Rendering ${quality} • ${Math.round(pct)}%`);
          if (t >= duration) return resolve();
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });

      // Give MediaRecorder a moment to flush the final rendered frame.
      await new Promise(r => setTimeout(r, 180));
      if (musicEl) musicEl.pause();
      transientAudio.forEach(a => a.pause());
      transientAudio.clear();
      recorder.stop();
      await stopped;

      if (!chunks.length) throw new Error('No video data was recorded');
      const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
      if (!blob.size) throw new Error('Exported video is empty');

      setProgress(100, 'Download ready');
      downloadBlob(blob, safeFileName(quality));
      toast(`${quality} video downloaded successfully`);
      setTimeout(() => setProgress(0, ''), 1200);
    } catch (err) {
      console.error('Export error:', err);
      setProgress(0, '');
      const highRes = quality === '4K' || quality === '8K';
      toast(highRes
        ? `${quality} export failed on this device. Try 2K or 1080p.`
        : 'Export failed. Try Chrome/Edge or a lower quality.');
    } finally {
      try { if (recorder?.state === 'recording') recorder.stop(); } catch {}
      try { musicEl?.pause(); } catch {}
      transientAudio.forEach(a => { try { a.pause(); } catch {} });
      try { await audioCtx?.close(); } catch {}
      canvas.width = oldW;
      canvas.height = oldH;
      renderAtTime(Math.min(oldOffset, totalDuration()));
      exportBtn.disabled = false;
      document.getElementById('exportQuality').disabled = false;
      exportBtn.textContent = 'Download Video';
    }
  }

  // Replace the original fixed-720p exporter.
  exportBtn.onclick = exportVideo;
})();
