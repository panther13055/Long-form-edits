// Premium text palettes + per-scene text/image entrance effects
(() => {
  const defaults = {
    textPalette: 'custom', introTextTransition: 'fade-up', image2TextTransition: 'fade-up', image3TextTransition: 'fade-up',
    image2Entrance: 'pop', image3Entrance: 'pop'
  };
  const applyDefaults = s => { for (const [k,v] of Object.entries(defaults)) if (!(k in s)) s[k] = v; return s; };
  sections.forEach(applyDefaults);
  const originalCreateSection = createSection;
  createSection = n => applyDefaults(originalCreateSection(n));

  const metaGrid = document.querySelector('.character-meta .form-grid');
  if (metaGrid && !document.getElementById('textPalette')) {
    const block = document.createElement('div');
    block.style.display = 'contents';
    block.innerHTML = `
      <label>Premium text palette
        <select id="textPalette">
          <option value="custom">Custom solid</option><option value="gold">Premium Gold</option><option value="royal">Royal Purple</option>
          <option value="sunset">Sunset Glow</option><option value="aqua">Aqua Ice</option><option value="fire">Fire Boost</option>
          <option value="candy">Candy Pop</option><option value="chrome">Chrome Shine</option><option value="neonmix">Neon Mix</option>
        </select>
      </label>
      <label>Intro text transition
        <select id="introTextTransition"><option value="none">None</option><option value="fade">Fade</option><option value="fade-up">Fade Up</option><option value="slide-left">Slide Left</option><option value="pop">Pop In</option><option value="zoom">Zoom In</option></select>
      </label>
      <label>Image 1 text transition
        <select id="image2TextTransition"><option value="none">None</option><option value="fade">Fade</option><option value="fade-up">Fade Up</option><option value="slide-left">Slide Left</option><option value="pop">Pop In</option><option value="zoom">Zoom In</option></select>
      </label>
      <label>Image 2 text transition
        <select id="image3TextTransition"><option value="none">None</option><option value="fade">Fade</option><option value="fade-up">Fade Up</option><option value="slide-left">Slide Left</option><option value="pop">Pop In</option><option value="zoom">Zoom In</option></select>
      </label>`;
    metaGrid.appendChild(block);
  }

  function addEntrance(stage, id, labelText) {
    const card = document.querySelector(`.stage-card[data-stage="${stage}"]`);
    const grid = card?.querySelector('.form-grid');
    if (!grid || document.getElementById(id)) return;
    const label = document.createElement('label');
    label.innerHTML = `${labelText}<select id="${id}"><option value="none">None</option><option value="fade">Fade In</option><option value="pop">Pop In</option><option value="zoom">Zoom In</option><option value="slide-right">Slide Right</option><option value="slide-up">Slide Up</option></select>`;
    grid.insertBefore(label, grid.firstChild);
  }
  addEntrance(1,'image2Entrance','Image 1 entrance effect');
  addEntrance(2,'image3Entrance','Image 2 entrance effect');

  const ids = ['textPalette','introTextTransition','image2TextTransition','image3TextTransition','image2Entrance','image3Entrance'];
  ids.forEach(id => document.getElementById(id)?.addEventListener('input', e => {
    current()[id] = e.target.value;
    renderAtTime(playback.offset);
  }));

  const originalLoadForm = loadForm;
  loadForm = function() {
    applyDefaults(current());
    originalLoadForm();
    ids.forEach(id => { const el = document.getElementById(id); if (el) el.value = current()[id]; });
  };

  const originalSerializable = serializable;
  serializable = function() {
    const data = originalSerializable();
    data.sections = data.sections.map((saved,i) => ({...saved,
      textPalette: sections[i]?.textPalette || 'custom', introTextTransition: sections[i]?.introTextTransition || 'fade-up',
      image2TextTransition: sections[i]?.image2TextTransition || 'fade-up', image3TextTransition: sections[i]?.image3TextTransition || 'fade-up',
      image2Entrance: sections[i]?.image2Entrance || 'pop', image3Entrance: sections[i]?.image3Entrance || 'pop'
    }));
    return data;
  };

  let fxStage = 0, fxProgress = 1;
  function paletteFill(palette, fallback, y, size) {
    if (!palette || palette === 'custom') return fallback;
    const sets = {
      gold:['#fff7c2','#f6c453','#f59e0b'], royal:['#f5e9ff','#c084fc','#6d28d9'], sunset:['#fff1d6','#fb7185','#f43f5e'],
      aqua:['#ecfeff','#67e8f9','#0284c7'], fire:['#fff7ed','#fb923c','#dc2626'], candy:['#ffe4f1','#f472b6','#8b5cf6'],
      chrome:['#ffffff','#d1d5db','#6b7280'], neonmix:['#d9f99d','#22d3ee','#a855f7']
    };
    const c = sets[palette] || [fallback,fallback,fallback];
    const g = ctx.createLinearGradient(canvas.width*.2,y-size,canvas.width*.8,y+size);
    g.addColorStop(0,c[0]); g.addColorStop(.5,c[1]); g.addColorStop(1,c[2]); return g;
  }
  function textFx(type,p) {
    p=easeInOut(clamp(p,0,1)); const f={alpha:1,x:0,y:0,scale:1};
    if(type==='fade') f.alpha=p;
    else if(type==='fade-up'){f.alpha=p;f.y=28*(1-p);}
    else if(type==='slide-left'){f.alpha=p;f.x=-48*(1-p);}
    else if(type==='pop'){f.alpha=p;f.scale=.78+.22*p;}
    else if(type==='zoom'){f.alpha=p;f.scale=.65+.35*p;}
    return f;
  }
  function textType(s,stage){ return stage===0?s.introTextTransition:(stage===1?s.image2TextTransition:s.image3TextTransition); }
  drawText = function(s,intro=false) {
    applyDefaults(s);
    const f=textFx(textType(s,fxStage),fxProgress);
    const baseX=canvas.width/2, baseY=s.textPosition==='top'?canvas.height*.18:s.textPosition==='center'?canvas.height*.5:canvas.height*.80;
    ctx.save(); ctx.globalAlpha*=f.alpha; ctx.translate(baseX+f.x,baseY+f.y); ctx.scale(f.scale,f.scale); ctx.textAlign='center';ctx.textBaseline='middle';
    let size=intro?Math.round(canvas.width*.052):Math.round(canvas.width*.05),weight=900,family='Arial Black,Arial,sans-serif';
    if(s.textStyle==='minimal'){family='Arial,sans-serif';weight=700;size=Math.round(size*.88)} if(s.textStyle==='retro') family='Georgia,serif';
    ctx.font=`${weight} ${size}px ${family}`; ctx.fillStyle=paletteFill(s.textPalette,s.textColor,0,size); ctx.shadowColor=s.textStyle==='neon'?s.accentColor:'rgba(0,0,0,.85)'; ctx.shadowBlur=s.textStyle==='neon'?24:10;ctx.lineWidth=Math.max(2,canvas.width*.003);ctx.strokeStyle=s.textStyle==='comic'?s.accentColor:'rgba(0,0,0,.75)';
    const main=intro?(s.introText||' '):(s.name||' '),lines=wrapText(main,canvas.width*.8,ctx),lh=size*1.1,start=-(lines.length-1)*lh/2;
    lines.forEach((line,i)=>{if(s.textStyle==='comic')ctx.strokeText(line,0,start+i*lh);ctx.fillText(line,0,start+i*lh)});
    if(!intro&&s.subtitle){ctx.font=`700 ${Math.round(size*.34)}px Arial,sans-serif`;ctx.fillStyle=paletteFill(s.textPalette,s.accentColor,start+lines.length*lh/2+size*.72,Math.round(size*.34));ctx.shadowBlur=8;ctx.fillText(s.subtitle.toUpperCase(),0,start+lines.length*lh/2+size*.72)}
    ctx.restore();
  };

  const previousDrawStage = drawStage;
  function imageFx(effect,p){p=easeInOut(clamp(p,0,1));if(effect==='fade')return{alpha:p,tr:{x:0,y:0,scale:1}};if(effect==='pop')return{alpha:p,tr:{x:0,y:0,scale:.82+.18*p}};if(effect==='zoom')return{alpha:p,tr:{x:0,y:0,scale:.7+.3*p}};if(effect==='slide-right')return{alpha:p,tr:{x:canvas.width*.2*(1-p),y:0,scale:1}};if(effect==='slide-up')return{alpha:p,tr:{x:0,y:canvas.height*.12*(1-p),scale:1}};return{alpha:1,tr:{x:0,y:0,scale:1}};}
  drawStage = function(s,stage,local=999,stageDuration=1) {
    applyDefaults(s); fxStage=stage; fxProgress=clamp(local/Math.max(.55,Math.min(1.1,stageDuration*.4)),0,1);
    if(stage===0) return previousDrawStage(s,stage,local,stageDuration);
    drawBackground('#05070c'); const url=stage===1?s.image2Url:s.image3Url,fit=stage===1?s.fit2:s.fit3,effect=stage===1?s.image2Entrance:s.image3Entrance,f=imageFx(effect,fxProgress);
    drawImageCover(getImage(url),fit,f.alpha,f.tr); drawVignette(); drawText(s,false);
  };

  renderAtTime = function(t) {
    playback.offset=clamp(t,0,totalDuration()); $('timeline').value=playback.offset; $('timeLabel').textContent=`${fmt(playback.offset)} / ${fmt(totalDuration())}`;
    const r=resolveTime(playback.offset); if(!r)return; const s=r.section; let transition=null;
    if(r.stage===0){const td=Math.min(s.transitionDuration1,s.duration1);if(r.local>s.duration1-td)transition={to:1,p:(r.local-(s.duration1-td))/td,type:s.transition1};}
    if(r.stage===1){const td=Math.min(s.transitionDuration2,s.duration2);if(r.local>s.duration2-td)transition={to:2,p:(r.local-(s.duration2-td))/td,type:s.transition2};}
    if(transition){fxStage=r.stage;fxProgress=1;drawTransition(r.stage,transition.to,s,transition.p,transition.type);} else drawStage(s,r.stage,r.local,r.stageDuration);
    const hint=$('emptyHint'); if(hint)hint.style.display=sections.some(x=>x.introImageUrl||x.image2Url||x.image3Url)?'none':'grid';
  };

  loadForm(); renderAtTime(playback.offset);
})();
