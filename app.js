const $ = (id) => document.getElementById(id);
const canvas = $('previewCanvas');
const ctx = canvas.getContext('2d');
const MAX_SECTIONS = 15;
let sections = [createSection(1)];
let activeIndex = 0;
let music = { file:null, url:null, volume:.65 };
let playback = { playing:false, startedAt:0, offset:0, raf:null, audio:null, sfxAudio:null };

function createSection(n){
  return {
    id: crypto.randomUUID(), name:`Character ${String(n).padStart(2,'0')}`, subtitle:'In Real Life', textColor:'#ffffff', accentColor:'#7c5cff', textStyle:'cinematic', textPosition:'bottom',
    introText:'WHO WOULD THIS CHARACTER BE IN REAL LIFE?', introBg:'#0b0d14',
    image2:null,image2Url:null,image2Name:'',fit2:'cover', image3:null,image3Url:null,image3Name:'',fit3:'cover',
    duration1:2.5,duration2:3,duration3:4,transition1:'fade',transition2:'fade',transitionDuration1:.8,transitionDuration2:.8,
    sfx:null,sfxUrl:null,sfxName:'',sfxVolume:.8
  }
}
function current(){ return sections[activeIndex]; }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function totalDuration(){ return sections.reduce((sum,s)=>sum+s.duration1+s.duration2+s.duration3,0); }
function fmt(sec){ sec=Math.max(0,sec||0); const m=Math.floor(sec/60), s=Math.floor(sec%60); return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`; }
function toast(msg){ const t=$('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }
function revoke(url){ if(url && url.startsWith('blob:')) URL.revokeObjectURL(url); }

function renderSectionList(){
  $('sectionList').innerHTML='';
  sections.forEach((s,i)=>{
    const b=document.createElement('button'); b.className='section-item'+(i===activeIndex?' active':'');
    b.innerHTML=`<span class="section-index">${String(i+1).padStart(2,'0')}</span><span class="section-name">${escapeHtml(s.name||`Character ${i+1}`)}</span>`;
    b.onclick=()=>{ activeIndex=i; stopPlayback(); loadForm(); renderSectionList(); renderAtTime(sectionStartTime(i)); };
    $('sectionList').appendChild(b);
  });
  $('sectionCount').textContent=sections.length; $('summaryCharacters').textContent=sections.length; $('summaryScenes').textContent=sections.length*3; $('summaryDuration').textContent=fmt(totalDuration());
}
function escapeHtml(str=''){ return str.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }

const bindMap = {
  characterName:'name',characterSubtitle:'subtitle',textColor:'textColor',accentColor:'accentColor',textStyle:'textStyle',textPosition:'textPosition',introText:'introText',introBg:'introBg',fit2:'fit2',fit3:'fit3',
  duration1:'duration1',duration2:'duration2',duration3:'duration3',transition1:'transition1',transition2:'transition2',transitionDuration1:'transitionDuration1',transitionDuration2:'transitionDuration2',sfxVolume:'sfxVolume'
};
for(const [id,key] of Object.entries(bindMap)){
  $(id).addEventListener('input',e=>{
    let v=e.target.value; if(['duration1','duration2','duration3','transitionDuration1','transitionDuration2','sfxVolume'].includes(key)) v=Number(v);
    current()[key]=v; if(key==='name') renderSectionList(); updateMeta(); renderAtTime(playback.offset); 
  });
}
function loadForm(){
  const s=current();
  for(const [id,key] of Object.entries(bindMap)) $(id).value=s[key];
  $('activeTitle').textContent=s.name||`Character ${activeIndex+1}`;
  setImagePreview('preview2',s.image2Url); setImagePreview('preview3',s.image3Url);
  $('sfxInput').value='';
  updateMeta();
}
function updateMeta(){ $('activeTitle').textContent=current().name||`Character ${activeIndex+1}`; $('summaryDuration').textContent=fmt(totalDuration()); $('timeline').max=totalDuration()||1; $('timeLabel').textContent=`${fmt(playback.offset)} / ${fmt(totalDuration())}`; }
function setImagePreview(id,url){ const el=$(id); el.innerHTML=url?`<img src="${url}" alt="preview">`:'<span>Drop image or click to upload</span>'; }

function handleImageInput(inputId, prop, urlProp, nameProp, previewId){
  $(inputId).addEventListener('change',e=>{ const f=e.target.files[0]; if(!f)return; const s=current(); revoke(s[urlProp]); s[prop]=f; s[nameProp]=f.name; s[urlProp]=URL.createObjectURL(f); setImagePreview(previewId,s[urlProp]); renderAtTime(sectionStartTime(activeIndex)+(inputId==='image2'?s.duration1:s.duration1+s.duration2)); });
}
handleImageInput('image2','image2','image2Url','image2Name','preview2');
handleImageInput('image3','image3','image3Url','image3Name','preview3');
$('sfxInput').addEventListener('change',e=>{ const f=e.target.files[0]; if(!f)return; const s=current(); revoke(s.sfxUrl); s.sfx=f; s.sfxName=f.name; s.sfxUrl=URL.createObjectURL(f); toast('Reveal SFX added'); });
$('musicInput').addEventListener('change',e=>{ const f=e.target.files[0]; if(!f)return; revoke(music.url); music.file=f; music.url=URL.createObjectURL(f); toast('Background music added'); });
$('musicVolume').addEventListener('input',e=>{music.volume=Number(e.target.value);$('musicVolumeLabel').textContent=Math.round(music.volume*100)+'%'; if(playback.audio) playback.audio.volume=music.volume;});
$('clearMusicBtn').onclick=()=>{revoke(music.url);music={file:null,url:null,volume:Number($('musicVolume').value)};$('musicInput').value='';toast('Music cleared');};

$('addSectionBtn').onclick=()=>{ if(sections.length>=MAX_SECTIONS)return toast('Maximum 15 characters reached'); sections.push(createSection(sections.length+1)); activeIndex=sections.length-1; stopPlayback(); renderSectionList(); loadForm(); renderAtTime(sectionStartTime(activeIndex)); };
$('duplicateSectionBtn').onclick=()=>{ if(sections.length>=MAX_SECTIONS)return toast('Maximum 15 characters reached'); const src=current(); const copy={...src,id:crypto.randomUUID(),name:`${src.name} Copy`}; sections.splice(activeIndex+1,0,copy); activeIndex++; renderSectionList(); loadForm(); toast('Character duplicated'); };
$('deleteSectionBtn').onclick=()=>{ if(sections.length===1)return toast('Keep at least one character'); const s=current(); revoke(s.image2Url);revoke(s.image3Url);revoke(s.sfxUrl);sections.splice(activeIndex,1);activeIndex=Math.min(activeIndex,sections.length-1);stopPlayback();renderSectionList();loadForm();renderAtTime(sectionStartTime(activeIndex)); };

function sectionStartTime(index){ let t=0; for(let i=0;i<index;i++){const s=sections[i];t+=s.duration1+s.duration2+s.duration3;} return t; }
function resolveTime(t){
  const total=totalDuration(); if(total<=0)return {section:sections[0],sectionIndex:0,stage:0,local:0}; t=clamp(t,0,Math.max(0,total-.001));
  let cursor=0; for(let i=0;i<sections.length;i++){const s=sections[i], d=[s.duration1,s.duration2,s.duration3]; const secTotal=d[0]+d[1]+d[2]; if(t<cursor+secTotal || i===sections.length-1){let local=t-cursor; let stage=0; if(local>=d[0]){local-=d[0];stage=1;} if(stage===1&&local>=d[1]){local-=d[1];stage=2;} return {section:s,sectionIndex:i,stage,local,stageDuration:d[stage],sectionStart:cursor};} cursor+=secTotal;}
}
function easeInOut(x){ return x<.5?2*x*x:1-Math.pow(-2*x+2,2)/2; }
function drawBackground(color='#080a10'){ctx.fillStyle=color;ctx.fillRect(0,0,canvas.width,canvas.height);}
function drawImageCover(img,fit='cover',alpha=1,transform={x:0,y:0,scale:1},clipProgress=null){
  if(!img||!img.complete)return; const cw=canvas.width,ch=canvas.height, iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height; if(!iw||!ih)return;
  let scale=fit==='contain'?Math.min(cw/iw,ch/ih):Math.max(cw/iw,ch/ih); scale*=transform.scale||1; let w=iw*scale,h=ih*scale,x=(cw-w)/2+(transform.x||0),y=(ch-h)/2+(transform.y||0);
  ctx.save();ctx.globalAlpha=alpha;if(clipProgress!==null){ctx.beginPath();ctx.rect(0,0,cw*clipProgress,ch);ctx.clip();}ctx.drawImage(img,x,y,w,h);ctx.restore();
}
function getImage(url){ if(!url)return null; if(!getImage.cache) getImage.cache=new Map(); if(!getImage.cache.has(url)){const im=new Image();im.src=url;getImage.cache.set(url,im);} return getImage.cache.get(url); }
function drawVignette(){const g=ctx.createRadialGradient(canvas.width/2,canvas.height/2,canvas.height*.08,canvas.width/2,canvas.height/2,canvas.width*.67);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.55)');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);}
function drawText(s, intro=false){
  const x=canvas.width/2; let y=s.textPosition==='top'?canvas.height*.18:s.textPosition==='center'?canvas.height*.5:canvas.height*.80;
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';let size=intro?Math.round(canvas.width*.052):Math.round(canvas.width*.05);let weight=900;let family='Arial Black,Arial,sans-serif';
  if(s.textStyle==='minimal'){family='Arial,sans-serif';weight=700;size=Math.round(size*.88)} if(s.textStyle==='retro'){family='Georgia,serif'}
  ctx.font=`${weight} ${size}px ${family}`;ctx.fillStyle=s.textColor;ctx.shadowColor=s.textStyle==='neon'?s.accentColor:'rgba(0,0,0,.85)';ctx.shadowBlur=s.textStyle==='neon'?24:10;ctx.lineWidth=Math.max(2,canvas.width*.003);ctx.strokeStyle=s.textStyle==='comic'?s.accentColor:'rgba(0,0,0,.75)';
  const main=intro?(s.introText||' '):(s.name||' '); const lines=wrapText(main,canvas.width*.8,ctx); const lh=size*1.1; const start=y-(lines.length-1)*lh/2;
  lines.forEach((line,i)=>{if(s.textStyle==='comic')ctx.strokeText(line,x,start+i*lh);ctx.fillText(line,x,start+i*lh)});
  if(!intro && s.subtitle){ctx.font=`700 ${Math.round(size*.34)}px Arial,sans-serif`;ctx.fillStyle=s.accentColor;ctx.shadowBlur=8;ctx.fillText(s.subtitle.toUpperCase(),x,start+lines.length*lh/2+size*.72)}
  ctx.restore();
}
function wrapText(text,maxWidth,c){const words=text.split(/\s+/),lines=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(c.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test;}if(line)lines.push(line);return lines.slice(0,4);}
function drawStage(s,stage){
  if(stage===0){drawBackground(s.introBg); const g=ctx.createLinearGradient(0,0,canvas.width,canvas.height);g.addColorStop(0,s.introBg);g.addColorStop(1,s.accentColor+'28');ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);drawText({...s,textPosition:'center'},true);return;}
  drawBackground('#05070c'); const url=stage===1?s.image2Url:s.image3Url, fit=stage===1?s.fit2:s.fit3; drawImageCover(getImage(url),fit); drawVignette(); drawText(s,false);
}
function drawTransition(fromStage,toStage,s,p,type){p=easeInOut(clamp(p,0,1)); drawBackground('#05070c');
  const renderOff=(stage,alpha=1,tr={x:0,y:0,scale:1},clip=null)=>{ctx.save();ctx.globalAlpha=alpha;if(stage===0){drawStage(s,0)}else{const url=stage===1?s.image2Url:s.image3Url,fit=stage===1?s.fit2:s.fit3;drawImageCover(getImage(url),fit,1,tr,clip);drawVignette();drawText(s,false)}ctx.restore();};
  if(type==='fade'){renderOff(fromStage,1-p);renderOff(toStage,p)}
  else if(type==='slide-left'){renderOff(fromStage,1,{x:-canvas.width*p});renderOff(toStage,1,{x:canvas.width*(1-p)})}
  else if(type==='zoom'){renderOff(fromStage,1-p*.45,{scale:1+p*.18});renderOff(toStage,p,{scale:.82+.18*p})}
  else if(type==='wipe'){renderOff(fromStage,1);renderOff(toStage,1,{x:0},p)}
  else if(type==='flash'){renderOff(p<.5?fromStage:toStage,1);ctx.fillStyle=`rgba(255,255,255,${1-Math.abs(p-.5)*2})`;ctx.fillRect(0,0,canvas.width,canvas.height)}
}
function renderAtTime(t){ playback.offset=clamp(t,0,totalDuration()); $('timeline').value=playback.offset; $('timeLabel').textContent=`${fmt(playback.offset)} / ${fmt(totalDuration())}`; const r=resolveTime(playback.offset); if(!r)return; const s=r.section; let transition=null;
  if(r.stage===0){const td=Math.min(s.transitionDuration1,s.duration1); if(r.local>s.duration1-td) transition={to:1,p:(r.local-(s.duration1-td))/td,type:s.transition1};}
  if(r.stage===1){const td=Math.min(s.transitionDuration2,s.duration2); if(r.local>s.duration2-td) transition={to:2,p:(r.local-(s.duration2-td))/td,type:s.transition2};}
  if(transition) drawTransition(r.stage,transition.to,s,transition.p,transition.type); else drawStage(s,r.stage);
  $('emptyHint').style.display=sections.some(x=>x.image2Url||x.image3Url)?'none':'grid';
}

$('timeline').addEventListener('input',e=>{ stopPlayback(false); renderAtTime(Number(e.target.value)); });
$('playBtn').onclick=()=> playback.playing?stopPlayback():startPlayback();
$('prevFrameBtn').onclick=()=>{stopPlayback();renderAtTime(Math.max(0,playback.offset-1));}; $('nextFrameBtn').onclick=()=>{stopPlayback();renderAtTime(Math.min(totalDuration(),playback.offset+1));};
function startPlayback(){ if(totalDuration()<=0)return; if(playback.offset>=totalDuration()-.05) playback.offset=0; playback.playing=true; playback.startedAt=performance.now()-playback.offset*1000; $('playBtn').textContent='❚❚ Pause';
  if(music.url){playback.audio=new Audio(music.url);playback.audio.volume=music.volume;playback.audio.loop=true;playback.audio.currentTime=playback.offset % Math.max(1,playback.audio.duration||9999);playback.audio.play().catch(()=>{});} let lastSection=-1,lastStage=-1;
  const tick=(now)=>{ if(!playback.playing)return; const t=(now-playback.startedAt)/1000; if(t>=totalDuration()){renderAtTime(totalDuration());stopPlayback();return;} const r=resolveTime(t); if(r&&r.stage===2&&(r.sectionIndex!==lastSection||lastStage!==2)&&r.section.sfxUrl){const a=new Audio(r.section.sfxUrl);a.volume=r.section.sfxVolume;a.play().catch(()=>{});playback.sfxAudio=a;} lastSection=r?.sectionIndex??-1;lastStage=r?.stage??-1;renderAtTime(t);playback.raf=requestAnimationFrame(tick);}; playback.raf=requestAnimationFrame(tick);
}
function stopPlayback(resetButton=true){ playback.playing=false;if(playback.raf)cancelAnimationFrame(playback.raf);playback.raf=null;if(playback.audio){playback.audio.pause();playback.audio=null;}if(playback.sfxAudio){playback.sfxAudio.pause();playback.sfxAudio=null;} if(resetButton)$('playBtn').textContent='▶ Preview'; }

$('previewQuality').addEventListener('change',e=>{const w=Number(e.target.value);canvas.width=w;canvas.height=Math.round(w*9/16);renderAtTime(playback.offset);});

function serializable(){ return {version:1,settings:{musicVolume:music.volume},sections:sections.map(s=>{const x={...s}; delete x.image2;delete x.image3;delete x.sfx;delete x.image2Url;delete x.image3Url;delete x.sfxUrl;return x;})}; }
$('saveProjectBtn').onclick=()=>{const blob=new Blob([JSON.stringify(serializable(),null,2)],{type:'application/json'});downloadBlob(blob,'longform-project.json');toast('Project JSON saved (media files stay local)');};
$('loadProjectInput').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.sections))throw Error();sections=data.sections.slice(0,15).map((s,i)=>({...createSection(i+1),...s,id:crypto.randomUUID()}));activeIndex=0;music.volume=data.settings?.musicVolume??.65;$('musicVolume').value=music.volume;$('musicVolumeLabel').textContent=Math.round(music.volume*100)+'%';renderSectionList();loadForm();renderAtTime(0);toast('Project loaded. Re-add media files.');}catch{toast('Invalid project file');}});
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);}

$('exportBtn').onclick=async()=>{
  if(!('MediaRecorder' in window)) return toast('This browser does not support WebM export');
  stopPlayback(); const oldW=canvas.width,oldH=canvas.height; canvas.width=1280;canvas.height=720; const stream=canvas.captureStream(30); let audioCtx=null;
  try{
    audioCtx=new (window.AudioContext||window.webkitAudioContext)(); const dest=audioCtx.createMediaStreamDestination(); stream.addTrack(dest.stream.getAudioTracks()[0]);
    const rec=new MediaRecorder(stream,{mimeType:MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')?'video/webm;codecs=vp9,opus':'video/webm'}); const chunks=[];rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)}; const done=new Promise(res=>rec.onstop=res);rec.start(500);$('exportBtn').disabled=true;$('exportBtn').textContent='Exporting…';
    let musicNode=null,musicEl=null; if(music.url){musicEl=new Audio(music.url);musicEl.loop=true;musicEl.volume=1;const src=audioCtx.createMediaElementSource(musicEl),gain=audioCtx.createGain();gain.gain.value=music.volume;src.connect(gain).connect(dest);musicEl.play().catch(()=>{});musicNode={src,gain};}
    const start=performance.now(); let lastReveal=-1; await new Promise(resolve=>{const loop=(now)=>{const t=(now-start)/1000;if(t>=totalDuration()){renderAtTime(totalDuration());resolve();return;}const r=resolveTime(t);if(r?.stage===2&&lastReveal!==r.sectionIndex&&r.section.sfxUrl){lastReveal=r.sectionIndex;const el=new Audio(r.section.sfxUrl);const src=audioCtx.createMediaElementSource(el),gain=audioCtx.createGain();gain.gain.value=r.section.sfxVolume;src.connect(gain).connect(dest);el.play().catch(()=>{});}renderAtTime(t);requestAnimationFrame(loop)};requestAnimationFrame(loop)});
    if(musicEl)musicEl.pause();rec.stop();await done;const blob=new Blob(chunks,{type:'video/webm'});downloadBlob(blob,'longform-video.webm');toast('Export complete');
  }catch(err){console.error(err);toast('Export failed. Try Chrome/Edge.');}
  finally{try{await audioCtx?.close()}catch{} canvas.width=oldW;canvas.height=oldH;renderAtTime(0);$('exportBtn').disabled=false;$('exportBtn').textContent='Export WebM';}
};

renderSectionList();loadForm();updateMeta();renderAtTime(0);
