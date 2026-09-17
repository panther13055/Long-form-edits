// Advanced animation, transition, styling, intro/outro and motion controls for Longform Studio
(() => {
  if (typeof sections === 'undefined' || typeof canvas === 'undefined') return;

  const TRANSITIONS = [
    ['none','None'],['fade','Fade In'],['dissolve','Soft Dissolve'],['pop','Pop In'],['zoom','Zoom In'],['zoom-blur','Zoom Blur'],
    ['slide-left','Slide From Left'],['slide-right','Slide From Right'],['slide-up','Slide From Bottom'],['slide-down','Slide From Top'],
    ['wipe-left','Wipe Left'],['wipe-right','Wipe Right'],['wipe-up','Wipe Up'],['wipe-down','Wipe Down'],['diagonal','Diagonal Wipe'],
    ['circle','Circle Reveal'],['spin','Spin In'],['flip-x','Flip Horizontal'],['flip-y','Flip Vertical'],['blur','Blur Dissolve'],
    ['flash','Flash Reveal'],['glitch','Glitch Reveal'],['bounce','Bounce In'],['curtain','Curtain Open']
  ];
  const TEXT_ANIMS = [
    ['none','None'],['fade','Fade'],['fade-up','Fade Up'],['fade-down','Fade Down'],['slide-left','Slide Left'],['slide-right','Slide Right'],
    ['pop','Pop In'],['zoom','Zoom In'],['bounce','Bounce'],['rotate','Rotate In'],['typewriter','Typewriter']
  ];
  const MOTIONS = [
    ['none','None'],['zoom-in','Slow Zoom In'],['zoom-out','Slow Zoom Out'],['pan-left','Pan Left'],['pan-right','Pan Right'],
    ['pan-up','Pan Up'],['pan-down','Pan Down'],['drift','Cinematic Drift'],['push-left','Push + Left'],['push-right','Push + Right']
  ];
  const FILTERS = [
    ['none','None'],['cinematic','Cinematic'],['vivid','Vivid'],['warm','Warm'],['cool','Cool'],['mono','Black & White'],
    ['faded','Faded Film'],['contrast','High Contrast'],['soft','Soft Glow']
  ];
  const PALETTES = [
    ['custom','Custom Solid'],['gold','Premium Gold'],['platinum','Platinum'],['rose-gold','Rose Gold'],['royal','Royal Purple'],
    ['neon-cyan','Neon Cyan'],['neon-pink','Neon Pink'],['sunset','Sunset Glow'],['emerald','Emerald'],['ocean','Ocean Blue'],
    ['fire','Fire Boost'],['candy','Candy Pop'],['ice','Ice Blue'],['chrome','Chrome Shine'],['rainbow','Rainbow'],['night-gold','Night Gold']
  ];

  const optionHtml = list => list.map(([v,l]) => `<option value="${v}">${l}</option>`).join('');

  const defaultSection = {
    textPalette:'custom', textScale:1, textOpacity:1, textOutline:2, textShadow:12, textBgStyle:'none',
    introTextAnimation:'fade-up', image2TextAnimation:'fade-up', image3TextAnimation:'fade-up',
    introTextDelay:.1, image2TextDelay:.25, image3TextDelay:.25,
    introTextAnimDuration:.7, image2TextAnimDuration:.7, image3TextAnimDuration:.7,
    image2Entrance:'pop', image3Entrance:'zoom-blur', image2EntranceDuration:.8, image3EntranceDuration:.8,
    image2Motion:'zoom-in', image3Motion:'zoom-in', image2Filter:'none', image3Filter:'cinematic',
    sameEntrance:false
  };
  const applyDefaults = s => { Object.entries(defaultSection).forEach(([k,v]) => { if (!(k in s)) s[k]=v; }); return s; };
  sections.forEach(applyDefaults);
  const originalCreateSection = createSection;
  createSection = n => applyDefaults(originalCreateSection(n));

  const extras = {
    opening: { enabled:false, media:null, mediaUrl:null, mediaKind:'image', mediaName:'', text:'WATCH TILL THE END', duration:2.5, fit:'cover', textColor:'#ffffff', bg:'#0b0d14', transition:'fade', textAnimation:'pop' },
    ending: { enabled:false, media:null, mediaUrl:null, mediaKind:'image', mediaName:'', text:'SUBSCRIBE FOR MORE', duration:3, fit:'cover', textColor:'#ffffff', bg:'#0b0d14', transition:'zoom', textAnimation:'pop' }
  };

  const css = document.createElement('style');
  css.textContent = `
    .advanced-panel{margin-top:16px}.advanced-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .advanced-section-title{font-size:12px;letter-spacing:.09em;opacity:.72;margin:14px 0 8px;font-weight:800;text-transform:uppercase}
    .advanced-row{display:flex;gap:10px;align-items:end;flex-wrap:wrap}.advanced-row>*{flex:1;min-width:130px}
    .advanced-note{font-size:12px;opacity:.67;line-height:1.45;margin-top:8px}.same-transition-toggle{display:flex!important;align-items:center;gap:8px}.same-transition-toggle input{width:auto!important}
    .global-bookends{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0}.global-bookends .drop-zone{min-height:120px}
    .global-bookends video{width:100%;height:100%;object-fit:cover;border-radius:14px}.global-bookends .drop-preview{min-height:110px}
    .safe-area-overlay{position:absolute;inset:7%;border:1px dashed rgba(255,255,255,.34);pointer-events:none;border-radius:4px;display:none;z-index:4}
    .safe-area-overlay::after{content:'YouTube safe area';position:absolute;top:6px;left:8px;font-size:10px;color:rgba(255,255,255,.55)}
    .canvas-wrap.show-safe .safe-area-overlay{display:block}
    .quick-preset-row{display:flex;gap:8px;align-items:end;flex-wrap:wrap}.quick-preset-row label{min-width:180px;flex:1}
    @media(max-width:1000px){.global-bookends{grid-template-columns:1fr}.advanced-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(css);

  function hideLegacyTransition(id){ const el=document.getElementById(id); const lab=el?.closest('label'); if(lab) lab.style.display='none'; }
  ['transition1','transitionDuration1','transition2','transitionDuration2'].forEach(hideLegacyTransition);

  const meta = document.querySelector('.character-meta');
  if (meta && !document.getElementById('advancedAnimationPanel')) {
    const panel=document.createElement('div'); panel.id='advancedAnimationPanel'; panel.className='advanced-panel';
    panel.innerHTML=`
      <div class="advanced-section-title">Premium Text & Animation</div>
      <div class="advanced-grid">
        <label>Premium text color<select id="advTextPalette">${optionHtml(PALETTES)}</select></label>
        <label>Text background<select id="advTextBg"><option value="none">None</option><option value="dark-box">Dark Box</option><option value="accent-pill">Accent Pill</option><option value="glass">Glass</option></select></label>
        <label>Text size <span id="advTextScaleLabel">100%</span><input id="advTextScale" type="range" min="0.7" max="1.5" step="0.05" value="1"></label>
        <label>Text opacity <span id="advTextOpacityLabel">100%</span><input id="advTextOpacity" type="range" min="0.3" max="1" step="0.05" value="1"></label>
        <label>Outline <span id="advOutlineLabel">2px</span><input id="advOutline" type="range" min="0" max="10" step="1" value="2"></label>
        <label>Shadow <span id="advShadowLabel">12</span><input id="advShadow" type="range" min="0" max="35" step="1" value="12"></label>
      </div>
      <div class="advanced-section-title">Quick Animation Preset</div>
      <div class="quick-preset-row"><label>Preset<select id="advQuickPreset"><option value="smooth">Smooth</option><option value="cinematic">Cinematic</option><option value="energetic">Energetic</option><option value="dramatic">Dramatic</option><option value="minimal">Minimal</option></select></label><button id="applyQuickPreset" class="btn tiny ghost" type="button">Apply to character</button></div>
    `;
    meta.appendChild(panel);
  }

  function addTextControls(card, prefix, defaultsLabel='Text animation'){
    if(!card || card.querySelector(`[data-adv-text="${prefix}"]`)) return;
    const d=document.createElement('div'); d.dataset.advText=prefix; d.innerHTML=`
      <div class="advanced-section-title">${defaultsLabel}</div>
      <div class="form-grid two-col compact">
        <label>Animation<select id="${prefix}TextAnim">${optionHtml(TEXT_ANIMS)}</select></label>
        <label>Delay (sec)<input id="${prefix}TextDelay" type="number" min="0" max="10" step="0.1"></label>
        <label>Animation duration<input id="${prefix}TextDuration" type="number" min="0.1" max="5" step="0.1"></label>
      </div>`;
    card.appendChild(d);
  }
  function addImageControls(card, prefix, number){
    if(!card || card.querySelector(`[data-adv-image="${prefix}"]`)) return;
    const d=document.createElement('div'); d.dataset.advImage=prefix; d.innerHTML=`
      <div class="advanced-section-title">Image ${number} Entrance — transition happens before reveal</div>
      <div class="form-grid two-col compact">
        <label>Entrance transition<select id="${prefix}Entrance">${optionHtml(TRANSITIONS)}</select></label>
        <label>Entrance duration (sec)<input id="${prefix}EntranceDuration" type="number" min="0.1" max="3" step="0.1"></label>
        <label>Motion / Ken Burns<select id="${prefix}Motion">${optionHtml(MOTIONS)}</select></label>
        <label>Filter<select id="${prefix}Filter">${optionHtml(FILTERS)}</select></label>
      </div>`;
    card.appendChild(d);
  }
  const card0=document.querySelector('.stage-card[data-stage="0"]'), card1=document.querySelector('.stage-card[data-stage="1"]'), card2=document.querySelector('.stage-card[data-stage="2"]');
  addTextControls(card0,'intro','Intro text animation');
  addImageControls(card1,'image2',1); addTextControls(card1,'image2','Image 1 text animation');
  addImageControls(card2,'image3',2); addTextControls(card2,'image3','Image 2 text animation');
  if(card1 && !document.getElementById('sameEntrance')){
    const lab=document.createElement('label'); lab.className='same-transition-toggle advanced-note'; lab.innerHTML='<input id="sameEntrance" type="checkbox"> Use the same entrance transition for Image 1 and Image 2'; card1.appendChild(lab);
  }

  const editorCol=document.querySelector('.editor-column');
  const stageGrid=document.querySelector('.stage-grid');
  if(editorCol && stageGrid && !document.getElementById('globalBookends')){
    const wrap=document.createElement('div'); wrap.id='globalBookends'; wrap.className='global-bookends';
    wrap.innerHTML=['opening','ending'].map(kind=>{
      const title=kind==='opening'?'Starting Section':'Ending / CTA Section';
      const message=kind==='opening'?'Shown before every character':'Shown after the last character';
      return `<article class="panel stage-card"><div class="stage-heading"><h3>${title}</h3><span>${message}</span></div>
        <label class="same-transition-toggle"><input id="${kind}Enabled" type="checkbox"> Enable ${kind==='opening'?'starting':'ending'} section</label>
        <label class="drop-zone"><input id="${kind}Media" type="file" accept="image/*,video/*"><div class="drop-preview" id="${kind}Preview"><span>Drop image/video or click to upload</span></div></label>
        <label>Message<textarea id="${kind}Text" rows="2"></textarea></label>
        <div class="form-grid two-col compact">
          <label>Duration<input id="${kind}Duration" type="number" min="0.5" max="30" step="0.5"></label>
          <label>Fit<select id="${kind}Fit"><option value="cover">Cover</option><option value="contain">Contain</option></select></label>
          <label>Background<input id="${kind}Bg" type="color"></label>
          <label>Text color<input id="${kind}TextColor" type="color"></label>
          <label>Media entrance<select id="${kind}Transition">${optionHtml(TRANSITIONS)}</select></label>
          <label>Text animation<select id="${kind}TextAnimation">${optionHtml(TEXT_ANIMS)}</select></label>
        </div>
        <button id="${kind}Clear" type="button" class="btn tiny ghost">Clear media</button>
      </article>`;
    }).join('');
    stageGrid.before(wrap);
  }

  const canvasWrap=document.querySelector('.canvas-wrap');
  if(canvasWrap && !document.getElementById('safeAreaOverlay')){
    const safe=document.createElement('div'); safe.id='safeAreaOverlay'; safe.className='safe-area-overlay'; canvasWrap.appendChild(safe);
    const toolbar=document.querySelector('.preview-toolbar');
    if(toolbar){ const lab=document.createElement('label'); lab.className='same-transition-toggle'; lab.innerHTML='<input id="showSafeArea" type="checkbox"> Safe area'; toolbar.appendChild(lab); document.getElementById('showSafeArea').onchange=e=>canvasWrap.classList.toggle('show-safe',e.target.checked); }
  }

  const map = {
    advTextPalette:'textPalette', advTextBg:'textBgStyle', advTextScale:'textScale', advTextOpacity:'textOpacity', advOutline:'textOutline', advShadow:'textShadow',
    introTextAnim:'introTextAnimation', introTextDelay:'introTextDelay', introTextDuration:'introTextAnimDuration',
    image2TextAnim:'image2TextAnimation', image2TextDelay:'image2TextDelay', image2TextDuration:'image2TextAnimDuration',
    image3TextAnim:'image3TextAnimation', image3TextDelay:'image3TextDelay', image3TextDuration:'image3TextAnimDuration',
    image2Entrance:'image2Entrance', image2EntranceDuration:'image2EntranceDuration', image2Motion:'image2Motion', image2Filter:'image2Filter',
    image3Entrance:'image3Entrance', image3EntranceDuration:'image3EntranceDuration', image3Motion:'image3Motion', image3Filter:'image3Filter', sameEntrance:'sameEntrance'
  };
  Object.entries(map).forEach(([id,key])=>{
    const el=document.getElementById(id); if(!el) return;
    const evt=el.type==='checkbox'?'change':'input';
    el.addEventListener(evt,e=>{
      let v=el.type==='checkbox'?el.checked:el.value;
      if(['textScale','textOpacity','textOutline','textShadow','introTextDelay','image2TextDelay','image3TextDelay','introTextAnimDuration','image2TextAnimDuration','image3TextAnimDuration','image2EntranceDuration','image3EntranceDuration'].includes(key)) v=Number(v);
      current()[key]=v;
      if(key==='sameEntrance' && v){ current().image3Entrance=current().image2Entrance; current().image3EntranceDuration=current().image2EntranceDuration; }
      if(current().sameEntrance && (key==='image2Entrance'||key==='image2EntranceDuration')){ current().image3Entrance=current().image2Entrance; current().image3EntranceDuration=current().image2EntranceDuration; }
      syncAdvancedForm(); renderAtTime(playback.offset);
    });
  });

  function syncAdvancedForm(){
    const s=applyDefaults(current());
    Object.entries(map).forEach(([id,key])=>{ const el=document.getElementById(id); if(!el)return; if(el.type==='checkbox')el.checked=!!s[key]; else el.value=s[key]; });
    if(document.getElementById('advTextScaleLabel')) document.getElementById('advTextScaleLabel').textContent=Math.round(s.textScale*100)+'%';
    if(document.getElementById('advTextOpacityLabel')) document.getElementById('advTextOpacityLabel').textContent=Math.round(s.textOpacity*100)+'%';
    if(document.getElementById('advOutlineLabel')) document.getElementById('advOutlineLabel').textContent=s.textOutline+'px';
    if(document.getElementById('advShadowLabel')) document.getElementById('advShadowLabel').textContent=s.textShadow;
  }
  const baseLoadForm=loadForm;
  loadForm=function(){ baseLoadForm(); syncAdvancedForm(); syncExtrasForm(); };

  document.getElementById('applyQuickPreset')?.addEventListener('click',()=>{
    const s=current(), p=document.getElementById('advQuickPreset').value;
    const presets={
      smooth:{image2Entrance:'dissolve',image3Entrance:'dissolve',image2Motion:'zoom-in',image3Motion:'zoom-in',image2TextAnimation:'fade-up',image3TextAnimation:'fade-up',textPalette:'custom'},
      cinematic:{image2Entrance:'zoom-blur',image3Entrance:'diagonal',image2Motion:'drift',image3Motion:'zoom-in',image2TextAnimation:'fade-up',image3TextAnimation:'pop',textPalette:'gold'},
      energetic:{image2Entrance:'bounce',image3Entrance:'glitch',image2Motion:'push-right',image3Motion:'push-left',image2TextAnimation:'pop',image3TextAnimation:'bounce',textPalette:'neon-cyan'},
      dramatic:{image2Entrance:'curtain',image3Entrance:'flash',image2Motion:'zoom-in',image3Motion:'zoom-in',image2TextAnimation:'zoom',image3TextAnimation:'zoom',textPalette:'night-gold'},
      minimal:{image2Entrance:'fade',image3Entrance:'fade',image2Motion:'none',image3Motion:'none',image2TextAnimation:'fade',image3TextAnimation:'fade',textPalette:'custom'}
    };
    Object.assign(s,presets[p]||presets.smooth); syncAdvancedForm(); renderAtTime(playback.offset); toast(`${p[0].toUpperCase()+p.slice(1)} preset applied`);
  });

  function syncExtrasForm(){
    ['opening','ending'].forEach(kind=>{ const c=extras[kind];
      const set=(suffix,val,checked=false)=>{const el=document.getElementById(kind+suffix);if(!el)return;if(checked)el.checked=!!val;else el.value=val;};
      set('Enabled',c.enabled,true);set('Text',c.text);set('Duration',c.duration);set('Fit',c.fit);set('Bg',c.bg);set('TextColor',c.textColor);set('Transition',c.transition);set('TextAnimation',c.textAnimation);
      const prev=document.getElementById(kind+'Preview'); if(prev){ prev.innerHTML=c.mediaUrl?(c.mediaKind==='video'?`<video src="${c.mediaUrl}" muted loop playsinline autoplay></video>`:`<img src="${c.mediaUrl}" alt="preview">`):'<span>Drop image/video or click to upload</span>'; }
    });
  }
  ['opening','ending'].forEach(kind=>{
    const c=extras[kind];
    const bind={Enabled:'enabled',Text:'text',Duration:'duration',Fit:'fit',Bg:'bg',TextColor:'textColor',Transition:'transition',TextAnimation:'textAnimation'};
    Object.entries(bind).forEach(([suffix,key])=>{ const el=document.getElementById(kind+suffix); if(!el)return; const evt=el.type==='checkbox'?'change':'input'; el.addEventListener(evt,()=>{c[key]=el.type==='checkbox'?el.checked:(key==='duration'?Number(el.value):el.value); updateAdvancedMeta(); renderAtTime(playback.offset);}); });
    document.getElementById(kind+'Media')?.addEventListener('change',e=>{const f=e.target.files?.[0];if(!f)return;revoke(c.mediaUrl);c.media=f;c.mediaUrl=URL.createObjectURL(f);c.mediaName=f.name;c.mediaKind=f.type.startsWith('video/')?'video':'image';c.enabled=true;syncExtrasForm();updateAdvancedMeta();renderAtTime(playback.offset);toast(`${kind==='opening'?'Starting':'Ending'} media added`);});
    document.getElementById(kind+'Clear')?.addEventListener('click',()=>{revoke(c.mediaUrl);c.media=null;c.mediaUrl=null;c.mediaName='';const inp=document.getElementById(kind+'Media');if(inp)inp.value='';syncExtrasForm();renderAtTime(playback.offset);});
  });

  function characterDuration(){ return sections.reduce((sum,s)=>sum+s.duration1+s.duration2+s.duration3,0); }
  function openingDuration(){ return extras.opening.enabled?Number(extras.opening.duration||0):0; }
  function endingDuration(){ return extras.ending.enabled?Number(extras.ending.duration||0):0; }
  const baseResolveTime=resolveTime;
  const baseSectionStart=sectionStartTime;
  totalDuration=function(){ return openingDuration()+characterDuration()+endingDuration(); };
  sectionStartTime=function(index){ return openingDuration()+baseSectionStart(index); };
  resolveTime=function(t){
    const open=openingDuration(), chars=characterDuration(), end=endingDuration(); t=clamp(t,0,Math.max(0,totalDuration()-.001));
    if(open && t<open) return {kind:'opening',stage:-1,local:t,stageDuration:open,sectionIndex:-1};
    if(t<open+chars || !end){ const r=baseResolveTime(clamp(t-open,0,Math.max(0,chars-.001))); return {...r,kind:'character'}; }
    return {kind:'ending',stage:-2,local:t-open-chars,stageDuration:end,sectionIndex:sections.length};
  };

  function paletteFill(palette,fallback,y,size){
    if(!palette||palette==='custom') return fallback;
    const colors={
      gold:['#fff8cf','#ffd166','#f59e0b'],platinum:['#ffffff','#dbe4ee','#94a3b8'],'rose-gold':['#fff1f2','#fda4af','#b76e79'],royal:['#f5e9ff','#a855f7','#5b21b6'],
      'neon-cyan':['#e6ffff','#22d3ee','#06b6d4'],'neon-pink':['#fff0fb','#f472b6','#d946ef'],sunset:['#fff2d8','#ff8a5c','#ff3d81'],emerald:['#ecfdf5','#34d399','#047857'],
      ocean:['#e0f2fe','#38bdf8','#1d4ed8'],fire:['#fff7ed','#fb923c','#dc2626'],candy:['#ffe4f1','#fb7185','#a855f7'],ice:['#ffffff','#bae6fd','#38bdf8'],
      chrome:['#ffffff','#d1d5db','#64748b'],rainbow:['#ff4d6d','#ffd166','#22d3ee'], 'night-gold':['#fff4bd','#d4af37','#7c5b12']
    };
    const c=colors[palette]||[fallback,fallback,fallback], g=ctx.createLinearGradient(canvas.width*.25,y-size,canvas.width*.75,y+size); g.addColorStop(0,c[0]);g.addColorStop(.5,c[1]);g.addColorStop(1,c[2]);return g;
  }
  function textFx(type,p){
    p=easeInOut(clamp(p,0,1)); const f={alpha:1,x:0,y:0,scale:1,rot:0};
    if(type==='fade')f.alpha=p; else if(type==='fade-up'){f.alpha=p;f.y=36*(1-p);} else if(type==='fade-down'){f.alpha=p;f.y=-36*(1-p);} else if(type==='slide-left'){f.alpha=p;f.x=-80*(1-p);} else if(type==='slide-right'){f.alpha=p;f.x=80*(1-p);} else if(type==='pop'){f.alpha=p;f.scale=.72+.28*p;} else if(type==='zoom'){f.alpha=p;f.scale=.5+.5*p;} else if(type==='bounce'){f.alpha=p;f.scale=1+Math.sin(p*Math.PI*2.4)*(1-p)*.18;} else if(type==='rotate'){f.alpha=p;f.rot=(-12*(1-p))*Math.PI/180;} return f;
  }
  function drawAdvancedText(s,stage,local,forceFull=false,overrideText=null,overrideColor=null,overrideAnim=null){
    const intro=stage===0||stage<0;
    const anim=overrideAnim || (stage===0?s.introTextAnimation:stage===1?s.image2TextAnimation:s.image3TextAnimation);
    const delay=stage===0?s.introTextDelay:stage===1?s.image2TextDelay:s.image3TextDelay;
    const dur=stage===0?s.introTextAnimDuration:stage===1?s.image2TextAnimDuration:s.image3TextAnimDuration;
    const p=forceFull?1:clamp((local-delay)/Math.max(.1,dur),0,1); if(!forceFull && local<delay)return;
    const fx=textFx(anim,p), pos=s.textPosition||'bottom'; let y=pos==='top'?canvas.height*.17:pos==='center'?canvas.height*.5:canvas.height*.80; let size=Math.round(canvas.width*(intro?.052:.05)*(s.textScale||1));
    let family='Arial Black,Arial,sans-serif',weight=900;if(s.textStyle==='minimal'){family='Arial,sans-serif';weight=700;size=Math.round(size*.88);}if(s.textStyle==='retro')family='Georgia,serif';
    let main=overrideText??(intro?(s.introText||' '):(s.name||' ')); if(anim==='typewriter'&&!forceFull) main=main.slice(0,Math.max(1,Math.ceil(main.length*p)));
    ctx.save();ctx.globalAlpha*=fx.alpha*(s.textOpacity??1);ctx.translate(canvas.width/2+fx.x,y+fx.y);ctx.rotate(fx.rot);ctx.scale(fx.scale,fx.scale);ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${weight} ${size}px ${family}`;
    const lines=wrapText(main,canvas.width*.78,ctx),lh=size*1.1,start=-(lines.length-1)*lh/2;
    if(s.textBgStyle&&s.textBgStyle!=='none'){
      const widths=lines.map(l=>ctx.measureText(l).width),w=Math.max(...widths,1)+size*.75,h=lines.length*lh+size*.45;ctx.beginPath();const rr=Math.min(size*.35,28);ctx.roundRect(-w/2,start-size*.65,w,h,rr);
      if(s.textBgStyle==='accent-pill')ctx.fillStyle=(s.accentColor||'#7c5cff')+'cc';else if(s.textBgStyle==='glass')ctx.fillStyle='rgba(15,18,28,.58)';else ctx.fillStyle='rgba(0,0,0,.68)';ctx.fill();
    }
    ctx.fillStyle=paletteFill(s.textPalette,overrideColor||s.textColor||'#fff',0,size);ctx.shadowColor='rgba(0,0,0,.9)';ctx.shadowBlur=s.textShadow??12;ctx.lineWidth=Math.max(0,Number(s.textOutline??2));ctx.strokeStyle='rgba(0,0,0,.82)';
    lines.forEach((line,i)=>{if((s.textOutline??2)>0)ctx.strokeText(line,0,start+i*lh);ctx.fillText(line,0,start+i*lh);});
    if(!intro && s.subtitle){const sy=start+lines.length*lh/2+size*.72;ctx.font=`700 ${Math.round(size*.34)}px Arial,sans-serif`;ctx.fillStyle=paletteFill(s.textPalette,s.accentColor||'#7c5cff',sy,Math.round(size*.34));ctx.fillText(s.subtitle.toUpperCase(),0,sy);}
    ctx.restore();
  }
  drawText=function(s,intro=false,stage=0,progress=1){ drawAdvancedText(s,intro?0:stage,progress,progress>=1); };

  function filterString(name){return {none:'none',cinematic:'contrast(1.12) saturate(.9) brightness(.92)',vivid:'contrast(1.12) saturate(1.35)',warm:'sepia(.16) saturate(1.15) brightness(1.04)',cool:'hue-rotate(8deg) saturate(1.08) brightness(1.02)',mono:'grayscale(1) contrast(1.08)',faded:'contrast(.9) saturate(.75) brightness(1.08)',contrast:'contrast(1.35) saturate(1.05)',soft:'brightness(1.08) contrast(.94) saturate(.95)'}[name]||'none';}
  function motionTransform(name,p){p=clamp(p,0,1);const w=canvas.width,h=canvas.height;switch(name){case'zoom-in':return{x:0,y:0,scale:1+.09*p};case'zoom-out':return{x:0,y:0,scale:1.09-.09*p};case'pan-left':return{x:-w*.045*p,y:0,scale:1.06};case'pan-right':return{x:w*.045*p,y:0,scale:1.06};case'pan-up':return{x:0,y:-h*.045*p,scale:1.06};case'pan-down':return{x:0,y:h*.045*p,scale:1.06};case'drift':return{x:w*.025*Math.sin(p*Math.PI),y:-h*.02*p,scale:1.03+.05*p};case'push-left':return{x:-w*.035*p,y:0,scale:1+.07*p};case'push-right':return{x:w*.035*p,y:0,scale:1+.07*p};default:return{x:0,y:0,scale:1};}}
  function drawImageWithFilter(url,fit,filter,alpha=1,tr={x:0,y:0,scale:1},clipFn=null){
    const im=getImage(url);if(!im||!im.complete)return;ctx.save();ctx.filter=filterString(filter);ctx.globalAlpha*=alpha;if(clipFn){ctx.save();clipFn();ctx.clip();drawImageCover(im,fit,1,tr);ctx.restore();}else drawImageCover(im,fit,1,tr);ctx.restore();
  }
  function drawStableStage(s,stage){
    if(stage===0){drawBackground(s.introBg);if(s.introImageUrl){drawImageWithFilter(s.introImageUrl,s.fit1||'cover','none');ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(0,0,canvas.width,canvas.height);drawVignette();}else{const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,s.introBg);g.addColorStop(1,(s.accentColor||'#7c5cff')+'28');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);}drawAdvancedText({...s,textPosition:'center'},0,999,true);return;}
    const url=stage===1?s.image2Url:s.image3Url,fit=stage===1?s.fit2:s.fit3,filter=stage===1?s.image2Filter:s.image3Filter,motion=stage===1?s.image2Motion:s.image3Motion;drawBackground('#05070c');drawImageWithFilter(url,fit,filter,1,motionTransform(motion,1));drawVignette();drawAdvancedText(s,stage,999,true);
  }
  function transitionDraw(url,fit,filter,type,p,motion){
    p=easeInOut(clamp(p,0,1));let alpha=1,tr=motionTransform(motion,p),clip=null;const w=canvas.width,h=canvas.height;
    if(type==='none'){alpha=1;}else if(type==='fade'||type==='dissolve'){alpha=p;}else if(type==='pop'){alpha=p;tr.scale*=.65+.35*p;}else if(type==='zoom'){alpha=p;tr.scale*=.55+.45*p;}else if(type==='zoom-blur'){alpha=p;tr.scale*=1.28-.28*p;}
    else if(type==='slide-left'){alpha=p;tr.x+=-w*(1-p);}else if(type==='slide-right'){alpha=p;tr.x+=w*(1-p);}else if(type==='slide-up'){alpha=p;tr.y+=h*(1-p);}else if(type==='slide-down'){alpha=p;tr.y+=-h*(1-p);}
    else if(type==='wipe-left')clip=()=>ctx.rect(0,0,w*p,h);else if(type==='wipe-right')clip=()=>ctx.rect(w*(1-p),0,w*p,h);else if(type==='wipe-up')clip=()=>ctx.rect(0,h*(1-p),w,h*p);else if(type==='wipe-down')clip=()=>ctx.rect(0,0,w,h*p);
    else if(type==='diagonal')clip=()=>{ctx.moveTo(0,0);ctx.lineTo(w*p*1.4,0);ctx.lineTo(w*p*1.4-h*.5,h);ctx.lineTo(0,h);ctx.closePath();};
    else if(type==='circle')clip=()=>{ctx.arc(w/2,h/2,Math.hypot(w,h)*.52*p,0,Math.PI*2);};
    else if(type==='spin'){alpha=p;tr.scale*=.65+.35*p;tr.rot=(1-p)*Math.PI*.55;}else if(type==='flip-x'){alpha=p;tr.scaleX=Math.max(.02,p);}else if(type==='flip-y'){alpha=p;tr.scaleY=Math.max(.02,p);}
    else if(type==='flash'){alpha=p<.35?p/.35:1;}else if(type==='glitch'){alpha=p;tr.x+=(Math.sin(p*55)*w*.018)*(1-p);tr.y+=(Math.cos(p*37)*h*.012)*(1-p);}else if(type==='bounce'){alpha=p;tr.scale*=1+Math.sin(p*Math.PI*3)*(1-p)*.22;}else if(type==='curtain')clip=()=>{ctx.rect(w/2-w*p/2,0,w*p,h);};
    ctx.save();ctx.filter=type==='blur'?`blur(${(1-p)*18}px) ${filterString(filter)}`:type==='zoom-blur'?`blur(${(1-p)*14}px) ${filterString(filter)}`:filterString(filter);ctx.globalAlpha*=alpha;
    const im=getImage(url);if(im&&im.complete){const draw=()=>{ctx.save();if(tr.rot){ctx.translate(w/2,h/2);ctx.rotate(tr.rot);ctx.translate(-w/2,-h/2);}if(tr.scaleX||tr.scaleY){ctx.translate(w/2,h/2);ctx.scale(tr.scaleX||1,tr.scaleY||1);ctx.translate(-w/2,-h/2);}drawImageCover(im,fit,1,{x:tr.x||0,y:tr.y||0,scale:tr.scale||1});ctx.restore();};if(clip){ctx.beginPath();clip();ctx.clip();draw();}else draw();}ctx.restore();
    if(type==='flash'){ctx.fillStyle=`rgba(255,255,255,${Math.max(0,1-Math.abs(p-.45)*3.2)*.65})`;ctx.fillRect(0,0,w,h);}
  }
  function drawCharacterStage(r){
    const s=applyDefaults(r.section),stage=r.stage,local=r.local,dur=r.stageDuration||1;
    if(stage===0){drawBackground(s.introBg);if(s.introImageUrl){drawImageWithFilter(s.introImageUrl,s.fit1||'cover','none');ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(0,0,canvas.width,canvas.height);drawVignette();}else{const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,s.introBg);g.addColorStop(1,(s.accentColor||'#7c5cff')+'28');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);}drawAdvancedText({...s,textPosition:'center'},0,local,false);return;}
    const is1=stage===1,url=is1?s.image2Url:s.image3Url,fit=is1?s.fit2:s.fit3,filter=is1?s.image2Filter:s.image3Filter,motion=is1?s.image2Motion:s.image3Motion;const trans=is1?s.image2Entrance:(s.sameEntrance?s.image2Entrance:s.image3Entrance),td=Math.min(dur,Number(is1?s.image2EntranceDuration:(s.sameEntrance?s.image2EntranceDuration:s.image3EntranceDuration))||.8);
    if(local<td && trans!=='none'){drawStableStage(s,stage-1);transitionDraw(url,fit,filter,trans,local/td,motion);}else{drawBackground('#05070c');drawImageWithFilter(url,fit,filter,1,motionTransform(motion,clamp(local/dur,0,1)));}
    drawVignette();drawAdvancedText(s,stage,local,false);
  }

  const videoCache=new Map();
  function getVideo(url){if(!url)return null;if(!videoCache.has(url)){const v=document.createElement('video');v.src=url;v.muted=true;v.loop=true;v.playsInline=true;v.preload='auto';videoCache.set(url,v);}return videoCache.get(url);}
  function drawVideoCover(v,fit='cover',alpha=1){if(!v||v.readyState<2||!v.videoWidth)return;const cw=canvas.width,ch=canvas.height,iw=v.videoWidth,ih=v.videoHeight,sc=fit==='contain'?Math.min(cw/iw,ch/ih):Math.max(cw/iw,ch/ih),w=iw*sc,h=ih*sc;ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(v,(cw-w)/2,(ch-h)/2,w,h);ctx.restore();}
  function drawExtra(kind,r){const c=extras[kind],p=clamp(r.local/Math.max(.1,Math.min(.8,c.duration*.35)),0,1);drawBackground(c.bg);if(c.mediaUrl){if(c.mediaKind==='video'){const v=getVideo(c.mediaUrl);try{if(v.paused)v.play().catch(()=>{});}catch{}drawVideoCover(v,c.fit,p);}else transitionDraw(c.mediaUrl,c.fit,'none',c.transition,p,'none');ctx.fillStyle='rgba(0,0,0,.28)';ctx.fillRect(0,0,canvas.width,canvas.height);drawVignette();}const fake={...current(),introText:c.text,textColor:c.textColor,textPalette:'custom',textPosition:'center',textScale:1,textOpacity:1,textOutline:2,textShadow:14,textBgStyle:'none',introTextAnimation:c.textAnimation,introTextDelay:0,introTextAnimDuration:.65};drawAdvancedText(fake,0,r.local,false,c.text,c.textColor,c.textAnimation);}

  function updateAdvancedMeta(){const total=totalDuration();const tl=document.getElementById('timeline');if(tl)tl.max=total||1;const label=document.getElementById('timeLabel');if(label)label.textContent=`${fmt(playback.offset)} / ${fmt(total)}`;const sum=document.getElementById('summaryDuration');if(sum)sum.textContent=fmt(total);const scenes=document.getElementById('summaryScenes');if(scenes)scenes.textContent=sections.length*3+(extras.opening.enabled?1:0)+(extras.ending.enabled?1:0);}
  const baseRenderList=renderSectionList; renderSectionList=function(){baseRenderList();updateAdvancedMeta();};
  renderAtTime=function(t){playback.offset=clamp(t,0,totalDuration());const tl=document.getElementById('timeline');if(tl){tl.max=totalDuration()||1;tl.value=playback.offset;}const r=resolveTime(playback.offset);if(!r)return;if(r.kind==='opening')drawExtra('opening',r);else if(r.kind==='ending')drawExtra('ending',r);else drawCharacterStage(r);updateAdvancedMeta();const hint=document.getElementById('emptyHint');if(hint)hint.style.display=(sections.some(s=>s.introImageUrl||s.image2Url||s.image3Url)||extras.opening.mediaUrl||extras.ending.mediaUrl)?'none':'grid';};

  const baseStop=stopPlayback;stopPlayback=function(resetButton=true){baseStop(resetButton);videoCache.forEach(v=>{try{v.pause();}catch{}});};

  const baseSerializable=serializable;serializable=function(){const data=baseSerializable();data.version=3;data.opening={...extras.opening,media:null,mediaUrl:null};data.ending={...extras.ending,media:null,mediaUrl:null};return data;};
  document.getElementById('loadProjectInput')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{const data=JSON.parse(await f.text());if(data.opening)Object.assign(extras.opening,data.opening,{media:null,mediaUrl:null});if(data.ending)Object.assign(extras.ending,data.ending,{media:null,mediaUrl:null});setTimeout(()=>{sections.forEach(applyDefaults);syncExtrasForm();syncAdvancedForm();renderSectionList();renderAtTime(0);},0);}catch{}});

  window.preloadAdvancedMedia=async function(){const jobs=[];['opening','ending'].forEach(k=>{const c=extras[k];if(c.mediaUrl&&c.mediaKind==='image'){jobs.push(new Promise(res=>{const im=getImage(c.mediaUrl);if(im?.complete)return res();im?.addEventListener('load',res,{once:true});im?.addEventListener('error',res,{once:true});setTimeout(res,6000);}));}if(c.mediaUrl&&c.mediaKind==='video'){jobs.push(new Promise(res=>{const v=getVideo(c.mediaUrl);if(v?.readyState>=2)return res();v?.addEventListener('loadeddata',res,{once:true});v?.addEventListener('error',res,{once:true});setTimeout(res,6000);}));}});await Promise.all(jobs);};

  syncAdvancedForm();syncExtrasForm();renderSectionList();updateAdvancedMeta();renderAtTime(0);
})();