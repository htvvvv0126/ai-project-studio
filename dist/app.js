(() => {
  'use strict';
  const D = window.COURSE_DATA;
  const lessons = D.stages.flatMap(s => s.lessons.map(l => ({ ...l, stage: s })));
  const coreStages = D.stages.filter(s => s.track === 'core');
  const electiveStages = D.stages.filter(s => s.track === 'elective');
  const extensionStages = D.stages.filter(s => s.track === 'extension');
  const coreLessons = lessons.filter(l => l.stage.track === 'core');
  const electiveLessons = lessons.filter(l => l.stage.track === 'elective');
  const extensionLessons = lessons.filter(l => l.stage.track === 'extension');
  const KEY = 'ai-project-studio-v1';
  const S = window.LEARNING_SUPPORT;
  const FEEDBACK_KEY = 'ai-project-studio-feedback-v1';
  const emptyFeedback = () => ({ version: 1, first: {}, drafts: {}, submissions: {}, drills: {} });
  let learning = emptyFeedback();
  let feedbackPersisted = true;
  const $ = s => document.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const blank = () => ({ version: 1, completed: [], notes: {}, checks: {}, examAnswers: {}, examResults: {}, practiceNotes: {}, practiceChecks: {}, lastLesson: '', updatedAt: '' });
  let state = blank();
  let toastTimer;
  const main = $('#main');
  function notify(message) {
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3200);
  }
  function storageWarning() {
    $('#storageWarning').hidden = false;
    $('.local-label').textContent = '本地保存暂不可用';
    $('#storageWarning').textContent = '浏览器暂时无法保存记录。本次仍可学习，请用“导出记录”备份，避免关闭后丢失。';
  }
  function normalize(raw) {
    if (!raw || raw.version !== 1 || !Array.isArray(raw.completed)) throw Error('这不是本学习台的记录文件，请选择之前导出的 JSON。');
    const clean = blank();
    clean.completed = lessons.filter(l => raw.completed.includes(l.id)).map(l => l.id);
    lessons.forEach(l => {
      if (typeof raw.notes?.[l.id] === 'string') clean.notes[l.id] = raw.notes[l.id].slice(0, 20000);
      if (Array.isArray(raw.checks?.[l.id])) clean.checks[l.id] = l.checks.map((_, i) => raw.checks[l.id][i] === true);
    });
    D.stages.forEach(s => {
      const a = raw.examAnswers?.[s.id];
      if (Array.isArray(a)) clean.examAnswers[s.id] = s.exam.questions.map((q, i) => Number.isInteger(a[i]) && a[i] >= 0 && a[i] < q.options.length ? a[i] : null);
      if (raw.examResults?.[s.id] && clean.examAnswers[s.id]?.every(x => x !== null)) clean.examResults[s.id] = { score: s.exam.questions.filter((q, i) => clean.examAnswers[s.id][i] === q.answer).length };
      if (typeof raw.practiceNotes?.[s.id] === 'string') clean.practiceNotes[s.id] = raw.practiceNotes[s.id].slice(0, 20000);
      if (Array.isArray(raw.practiceChecks?.[s.id])) clean.practiceChecks[s.id] = s.exam.checks.map((_, i) => raw.practiceChecks[s.id][i] === true);
    });
    clean.lastLesson = lessons.some(l => l.id === raw.lastLesson) ? raw.lastLesson : '';
    clean.updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : '';
    return clean;
  }
  try { const saved = localStorage.getItem(KEY); if (saved) state = normalize(JSON.parse(saved)); } catch { storageWarning(); }
  function cleanDraft(raw = {}) {
    const text = key => typeof raw[key] === 'string' ? raw[key].slice(0, 20000) : '';
    return { mode: ['actual','preparation'].includes(raw.mode) ? raw.mode : '', process: text('process'), evidence: [0,1,2].map(i=>typeof raw.evidence?.[i]==='string'?raw.evidence[i].slice(0,4000):''), independent: raw.independent===true, independentEvidence: text('independentEvidence'), source: raw.source==='peer'?'peer':'self', reviewer: text('reviewer'), verdict: ['pass','revise'].includes(raw.verdict)?raw.verdict:'', change: text('change') };
  }
  function normalizeFeedback(raw) {
    const clean = emptyFeedback();
    if (!raw || raw.version !== 1) return clean;
    if (raw.first && typeof raw.first === 'object') clean.first = { mode:raw.first.mode==='actual'?'actual':'preparation', text:typeof raw.first.text==='string'?raw.first.text.slice(0,20000):'', saved:typeof raw.first.saved==='string'?raw.first.saved:'' };
    for (const s of D.stages.filter(s=>S.rubrics[s.id])) {
      if (raw.drafts?.[s.id]) clean.drafts[s.id]=cleanDraft(raw.drafts[s.id]);
      if (Array.isArray(raw.submissions?.[s.id])) clean.submissions[s.id]=raw.submissions[s.id].filter(x=>x&&typeof x.artifact==='string').map(x=>({...cleanDraft(x),artifact:x.artifact.slice(0,20000),checks:s.exam.checks.map((_,i)=>x.checks?.[i]===true),at:typeof x.at==='string'?x.at:''}));
    }
    for (const d of [...S.scenarios,...S.faults]) {
      const v=raw.drills?.[d.id];
      if(v&&Number.isInteger(v.answer)&&v.answer>=0&&v.answer<d.options.length)clean.drills[d.id]={answer:v.answer,why:typeof v.why==='string'?v.why.slice(0,4000):''};
    }
    return clean;
  }
  try { const saved=localStorage.getItem(FEEDBACK_KEY); if(saved)learning=normalizeFeedback(JSON.parse(saved)); } catch { storageWarning(); }
  function saveFeedback() {
    try { localStorage.setItem(FEEDBACK_KEY,JSON.stringify(learning)); feedbackPersisted=true; return true; } catch { feedbackPersisted=false; storageWarning(); return false; }
  }
  function invalidatePeerReview(s) {
    const d=draftFor(s.id);
    if(d.source==='peer'&&(d.verdict||d.reviewer)) {
      d.verdict='';d.reviewer='';
      if($('#reviewVerdict'))$('#reviewVerdict').value='';
      if($('#reviewer'))$('#reviewer').value='';
    }
  }
  const draftFor = id => learning.drafts[id] ||= cleanDraft();
  const latestReview = id => learning.submissions[id]?.at(-1);
  function reviewFindings(s,r) {
    const gaps=[];
    if(!r.artifact?.trim())gaps.push('先提交真实成果或可检查摘录，不只写“已完成”。');
    if(r.mode!=='actual')gaps.push('当前是准备练习或尚未说明方式：实际操作仍待练，不计实操达标。');
    if(!r.process?.trim())gaps.push('补充原任务、用了什么工具及实际核对过程。');
    s.exam.checks.forEach((c,i)=>{if(!r.checks?.[i]||!r.evidence?.[i]?.trim())gaps.push(`标准${i+1}未完成自查或缺依据：${S.rubrics[s.id].evidence[i]}`);});
    if(r.independent&&!r.independentEvidence?.trim())gaps.push('已选择独立换题，但缺少新材料、新要求与独立结果的对照证据。');
    if(r.source==='peer'&&(!r.reviewer?.trim()||!r.verdict))gaps.push('人工复核缺少具体意见或结论，请先补齐；不能仅填“通过”。');
    if(r.source==='peer'&&r.verdict==='revise')gaps.push('人工复核要求修改：按复核意见修正，留下复验结果再提交。');
    return gaps;
  }
  function reviewLabel(s,r) {
    if(!r)return '未评估';
    if(r.mode!=='actual')return '预练已提交 · 实操待练';
    if(reviewFindings(s,r).length)return '需改进或补证';
    return r.source==='peer'?'人工复核达标（本人记录）':'自评材料齐全 · 待核验';
  }
  const snapshot = s => ({...cleanDraft(draftFor(s.id)),artifact:state.practiceNotes[s.id]||'',checks:s.exam.checks.map((_,i)=>state.practiceChecks[s.id]?.[i]===true)});
  const changedReview = s => {const r=latestReview(s.id);if(!r)return false;const {at,...prior}=r;return JSON.stringify(prior)!==JSON.stringify(snapshot(s));};
  function dateText(at) {const d=new Date(at);return Number.isNaN(d.valueOf())?'时间未记录':d.toLocaleString('zh-CN',{hour12:false});}
  function feedbackResult(s,r) {
    if(!r)return '<p class="empty-feedback">尚未提交评估。先保存作品，再填写核对依据；课程勾选和知识题不会自动填满这里。</p>';
    const gaps=reviewFindings(s,r);
    return `<div class="feedback-result" role="status"><h3>${esc(reviewLabel(s,r))}</h3><p>依据：${r.source==='peer'?'你填写的人工复核':'你的自评与字段规则检查'} · ${esc(dateText(r.at))}</p>${gaps.length?`<ul>${gaps.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'<p>任务、产物及三项核对依据已填写。字段齐全只说明材料可供检查，不能证明内容一定正确。</p>'}${r.source==='peer'?`<p>复核意见（本人记录）：${esc(r.reviewer)}</p>`:''}<p>下一步：${esc(gaps.length?S.rubrics[s.id].next:r.source==='self'?'请身边的人对照真实作品核验；也可换题继续练习。':'换材料再试，并保存独立完成证据。')}</p><p class="text-muted">没有AI自动批改；规则检查不判断任意作品的事实正确性，不授予认证。</p></div>`;
  }
  function abilityRow(s) {
    const r=latestReview(s.id),gaps=r?reviewFindings(s,r):[];
    const independent=r?.independent&&r.independentEvidence?.trim();
    return `<div class="ability-row"><div><h3>${esc(s.title)}</h3><p>知识理解：${state.examResults[s.id]?`知识题 ${state.examResults[s.id].score}/${s.exam.questions.length}，仅代表本次答题`:'未评估'}</p><p>实际操作：${esc(reviewLabel(s,r))}</p><p>独立完成：${independent?(gaps.length?'证据已自报 · 仍需补证':r.source==='peer'?'有人工复核记录（本人填写）':'证据已自报 · 待核验'):'未评估'}</p>${changedReview(s)?'<p class="text-muted">草稿有修改待重提；以上依据最近一次提交。</p>':''}</div>${button(r?'查看作品与反馈':'提交阶段成果','exams/'+s.id,'btn-secondary')}</div>`;
  }
  function learningSummary() {
    const reviewed=coreStages.filter(s=>latestReview(s.id));
    const practiced=reviewed.filter(s=>latestReview(s.id).mode==='actual');
    const passed=reviewed.filter(s=>{const r=latestReview(s.id);return r.source==='peer'&&!reviewFindings(s,r).length;});
    const independent=passed.filter(s=>{const r=latestReview(s.id);return r.independent&&r.independentEvidence.trim();});
    const improve=reviewed.find(s=>reviewFindings(s,latestReview(s.id)).length);
    const recent=reviewed.map(s=>({s,r:latestReview(s.id)})).sort((a,b)=>b.r.at.localeCompare(a.r.at))[0];
    return `<section class="learning-evidence"><h2>学习与能力，分开看</h2><p>已学习：${coreDone()}/${coreLessons.length}课自查 · 已练习：${practiced.length}/6阶段自报实际操作 · 通过人工复核：${passed.length}/6 · 有独立复核证据：${independent.length}/6</p><p class="text-muted">人工复核由你记录，没有平台老师认证。未提交${6-reviewed.length}阶段显示“未评估”；第7阶段不计入必修。</p>${recent?`<p>最近反馈：${esc(recent.s.title)} · ${esc(reviewLabel(recent.s,recent.r))}</p>`:'<p>还没有提交阶段作品。先从第一课做出一个小成果，再来核验能力。</p>'}${button(improve?'优先修改这份作品':'查看三维能力与作品',improve?'exams/'+improve.id:'levels','btn-secondary')}</section>`;
  }
  function prerequisitePanel(l) {
    const p=S.prerequisites[l.id];if(!p)return '';
    return `<details class="prerequisite"><summary>${p.lessons.length?'推荐基础，可随时补学或跳过':'无需基础，直接开始'}</summary>${p.lessons.length?`<p>如果下面的内容还陌生，先回看；跳过不会记为已掌握。</p><div class="related-lessons">${p.lessons.map(id=>{const x=lessons.find(x=>x.id===id);return button(x.title+' · '+(completed(id)?'已自查':'可补学'),'lesson/'+id,'btn-ghost');}).join('')}</div>`:''}<div class="related-lessons">${p.concepts.map(term=>button('查：'+term,'glossary/'+encodeURIComponent(term),'btn-ghost')).join('')}</div></details>`;
  }
  function firstTask() {
    return `<section class="lesson-section quick-start" id="firstTask"><h2>先做一件有用的小事 · 约10分钟</h2><p>AI可以按你给的材料整理、起草和修改。先用一个真实聊天工具，把通知变成行动清单，再亲手核对。不会的词稍后再查。</p>${button('没有聊天工具？查看可用入口','resources/chat','btn-secondary')}<ol class="step-list"><li>用你能打开的文字AI工具，新建一次对话；没有入口时可先阅读，真实操作保持待练。</li><li>复制下面的虚构通知与指令，亲自发给AI（约2分钟）。</li><li>对照原通知查时间、地点和待确认项。再发追问，看看改后的清单是否更好用（约3分钟）。</li><li>换一段你自己的非敏感通知或小任务，自己提问、修一次并核对（约3分钟）。</li><li>在下方留下前后结果与核对，保存第一个作品（约2分钟）。</li></ol>${copyBlock('第一条提问（虚构教学通知）',S.firstPrompt,'first')}${copyBlock('再追问一次',S.firstFollowup,'followup')}<p><strong>完成标准：</strong>实际发出提问与追问；时间地点保留正确；报名仍为待确认；换题后也能留下可用清单。建议用时不含注册、网络等待。</p><label for="firstMode">这次做到哪一步？</label><select id="firstMode" data-first-field="mode"><option value="preparation" ${learning.first.mode!=='actual'?'selected':''}>只做准备，尚未实际使用AI</option><option value="actual" ${learning.first.mode==='actual'?'selected':''}>已实际提问、追问并核对</option></select><label class="notes-field" for="firstEvidence">首个作品与核对记录</label><textarea class="notes-field" id="firstEvidence" data-first-field="text" rows="5" maxlength="20000" placeholder="记录：实际工具、第一次回答、追问后结果、时间地点核对、你独立换题的结果。未完成部分请标待做。">${esc(learning.first.text||'')}</textarea><p class="text-muted">本页自动暂存草稿。保存首个作品不会自动勾选整课，也不会认证能力。</p><button class="btn btn-primary" data-save-first>保存首个作品</button><p id="firstStatus" role="status">${!feedbackPersisted?'浏览器无法保存；当前仅在本页内存，请立即导出备份。':learning.first.saved?`首个作品已${learning.first.mode==='actual'?'自报实际练习':'记为准备练习'}保存；真实质量待核验。`:'还没有保存首个作品。'}</p><a href="#try">接着做本课分类练习</a></section>`;
  }
  function save() {
    state.updatedAt = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { storageWarning(); return false; }
  }
  const completed = id => state.completed.includes(id);
  const doneCount = s => s.lessons.filter(l => completed(l.id)).length;
  const coreDone = () => coreLessons.filter(l => completed(l.id)).length;
  const nextLesson = () => coreLessons.find(l => !completed(l.id)) || coreLessons[0];
  const trackName = s => s.track === 'core' ? '必修' : s.track === 'elective' ? '进阶选修' : '编程拓展';
  const stageLabel = s => s.track === 'extension' ? `拓展 ${extensionStages.indexOf(s)+1}` : `第 ${[...coreStages,...electiveStages].indexOf(s)+1} 阶段`;
  const flowIcon = path => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  function button(label, route, style = 'btn-secondary') { return `<button class="btn ${style}" data-route="${esc(route)}">${esc(label)}</button>`; }
  function progress() {
    const n = coreDone(), box = $('#sidebarProgress');
    if (!box.querySelector('.progress-track')) box.innerHTML = `<div class="status-line"><span>必修练习进度</span><strong></strong></div><div class="progress-track" role="progressbar" aria-label="已自查完成的必修课程" aria-valuemin="0" aria-valuemax="${coreLessons.length}"><span class="progress-fill"></span></div><p></p>`;
    box.querySelector('strong').textContent = `${n} / ${coreLessons.length} 课`;
    box.querySelector('.progress-track').setAttribute('aria-valuenow', n);
    const fill = box.querySelector('.progress-fill');
    fill.style.width = '100%';
    fill.style.transform = `scaleX(${n/coreLessons.length})`;
    box.querySelector('p').innerHTML = `选修、拓展已记录 ${state.completed.length-n} 课<br>当前浏览器保存 · 可导出备份`;
  }
  function pageTitle(title, description) { return `<div class="page-intro"><h1 class="page-title">${esc(title.replace(/[。.!！]+$/, ''))}</h1><p class="page-description">${esc(description)}</p></div>`; }
  function levelDiagram(compact) {
    const width=compact?380:1080, height=compact?380:300;
    const points=D.levels.map((l,i)=>({...l,x:compact?34+i*61:70+i*182,y:compact?310-i*47:240-i*35}));
    const route=points.map((p,i)=>i?`H${p.x} V${p.y}`:`M${p.x} ${p.y}`).join(' ');
    const variant=compact?'mobile':'desktop',popup='level-popup-'+variant;
    return `<div class="level-map level-map-${variant}"><svg class="level-staircase level-staircase-${variant}" viewBox="0 0 ${width} ${height}" role="group" aria-label="AI运用六级成长路线：悬停查看详情，点击进入课程"><path class="level-path" d="${route}"/>${points.map((p,i)=>`<a class="level-link" href="#lesson/${esc(p.lesson)}" data-level-index="${i}" aria-label="${esc(p.label+' '+p.title+'，进入'+p.course)}" aria-describedby="${popup}"><circle class="level-hit" cx="${p.x}" cy="${p.y}" r="${compact?36:30}"/><circle class="level-node" cx="${p.x}" cy="${p.y}" r="${compact?17:22}"/><text class="level-node-label" x="${p.x}" y="${p.y+4}">${esc(p.label)}</text><text class="level-node-title" x="${p.x}" y="${p.y-(compact?31:36)}">${esc(p.title)}</text></a>`).join('')}</svg><div class="level-popup" id="${popup}" role="tooltip" aria-hidden="true"></div></div>`;
  }
  let levelHideTimer, activeLevelLink, levelPositionFrame;
  function hideLevelDetail() {
    clearTimeout(levelHideTimer);
    document.querySelectorAll('.level-popup').forEach(p=>{p.classList.remove('is-visible');p.setAttribute('aria-hidden','true');});
    document.querySelectorAll('.level-link.is-previewed').forEach(a=>a.classList.remove('is-previewed'));
    activeLevelLink=null;
  }
  function showLevelDetail(link) {
    hideLevelDetail();activeLevelLink=link;
    const l=D.levels[Number(link.dataset.levelIndex)],map=link.closest('.level-map'),popup=map.querySelector('.level-popup');
    popup.innerHTML=`<h3>${esc(l.label+' · '+l.title)}</h3><p>${esc(l.ability)}</p><dl><div><dt>代表作品</dt><dd>${esc(l.artifact)}</dd></div><div><dt>验收重点</dt><dd>${esc(l.verify)}</dd></div></dl><p class="level-popup-course">${esc(l.course)} · 点击等级进入课程</p>`;
    positionLevelDetail(link);
    popup.classList.add('is-visible');popup.setAttribute('aria-hidden','false');link.classList.add('is-previewed');
  }
  function positionLevelDetail(link) {
    const map=link.closest('.level-map'),popup=map.querySelector('.level-popup');
    const bounds=map.getBoundingClientRect(),node=link.getBoundingClientRect();
    popup.style.width=Math.min(360,bounds.width-16)+'px';
    popup.style.maxHeight=Math.max(120,innerHeight-24)+'px';
    popup.style.left=Math.max(8,Math.min(bounds.width-popup.offsetWidth-8,node.left-bounds.left+node.width/2-popup.offsetWidth/2))+'px';
    const above=node.top-bounds.top-popup.offsetHeight-12;
    let top=above>=8?above:node.bottom-bounds.top+12;
    if(bounds.top+top+popup.offsetHeight>innerHeight-8)top=Math.max(8-bounds.top,node.top-bounds.top-popup.offsetHeight-12);
    popup.style.top=Math.max(8-bounds.top,Math.min(innerHeight-popup.offsetHeight-8-bounds.top,top))+'px';
  }
  function setupLevelDetails() {
    hideLevelDetail();
    document.querySelectorAll('.level-map').forEach(map=>{
      const popup=map.querySelector('.level-popup');
      map.querySelectorAll('.level-link').forEach(link=>{
        link.addEventListener('pointerenter',e=>{if(e.pointerType!=='touch')showLevelDetail(link);});
        link.addEventListener('pointerleave',()=>{levelHideTimer=setTimeout(hideLevelDetail,160);});
        link.addEventListener('focus',()=>{link.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});showLevelDetail(link);requestAnimationFrame(()=>{if(activeLevelLink===link)positionLevelDetail(link);});});
        link.addEventListener('blur',hideLevelDetail);
      });
      popup.addEventListener('pointerenter',()=>clearTimeout(levelHideTimer));
      popup.addEventListener('pointerleave',()=>{levelHideTimer=setTimeout(hideLevelDetail,160);});
    });
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeLevelLink)hideLevelDetail();});
  window.addEventListener('resize',()=>{if(activeLevelLink&&document.contains(activeLevelLink))positionLevelDetail(activeLevelLink);});
  window.addEventListener('scroll',()=>{
    if(!activeLevelLink||levelPositionFrame)return;
    levelPositionFrame=requestAnimationFrame(()=>{levelPositionFrame=0;if(activeLevelLink&&document.contains(activeLevelLink))positionLevelDetail(activeLevelLink);});
  },{passive:true});
  function stageCard(s,index,currentStage) {
    const n=doneCount(s),total=s.lessons.length,r=latestReview(s.id);
    const started=n>0||s.lessons.some(l=>state.lastLesson===l.id||state.notes[l.id]?.trim()||state.checks[l.id]?.some(Boolean))||state.examResults[s.id]||state.practiceNotes[s.id]?.trim()||r;
    const status=n===total?'已完成（自查）':started?'学习中':'未开始';
    const next=s.lessons.find(l=>!completed(l.id))||s.lessons[0];
    const intro=['辨认AI能做什么，选对第一项任务。','把想法说清楚，用追问得到更好的结果。','检查事实、来源和真实完成情况。','按任务选工具，做出可核对的作品。','用一个小项目，解决自己的真实问题。','串起多个步骤，检查工具返回与失败边界。','整理自己的方法，让好用的流程可以复用。'][index];
    const icons=['M4 5h16v11H9l-5 4zM8 9h8M8 12h5','M4 5h16v11H9l-5 4zM8 9h5M8 12h8','M10 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14M15 15l6 6M7 10l2 2 4-4','M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z','M4 6h16v15H4zM8 6V3h8v3M4 11h16M10 11v3h4v-3','M4 4h5v5H4zM15 15h5v5h-5zM9 6h8v9M4 17h11','M4 4h16v16H4zM8 4v16M8 9h12M12 13h4M12 16h4'][index];
    const pre=S.prerequisites[s.lessons[0].id];
    const knowledge=state.examResults[s.id]?`${state.examResults[s.id].score}/${s.exam.questions.length}题答对`:'未评估';
    const independent=r?.independent&&r.independentEvidence?.trim()?(reviewFindings(s,r).length?'已自报证据，仍需补证':r.source==='peer'?'有人工复核记录（本人填写）':'证据已自报，待核验'):'未评估';
    return `<li class="stage-card ${s.id===currentStage?'is-recommended':''} ${s.track==='elective'?'is-elective':''}" data-stage-card="${s.id}"><div class="stage-card-heading"><span class="stage-card-number">第 ${index+1} 阶段${s.track==='elective'?' · 选修':''}</span><span class="stage-card-symbol">${flowIcon(icons)}</span></div><div class="stage-card-copy"><h3>${esc(s.title)}</h3><p>${intro}</p></div><div class="stage-card-progress"><div class="stage-card-status"><span data-stage-status>${status}</span>${s.id===currentStage?'<span class="recommended-label">当前建议</span>':''}</div><progress value="${n}" max="${total}" aria-label="${esc(s.title)}自查进度">${n}/${total}</progress><p>${n} / ${total} 课已自查 · 实操：${esc(reviewLabel(s,r))}</p></div><details class="stage-card-details"><summary>课程与评估详情 ${flowIcon('M7 10l5 5 5-5')}</summary><div><ul>${s.lessons.map(l=>`<li>${button(l.title,'lesson/'+l.id,'btn-ghost')}<span>${completed(l.id)?'已自查':'可学习'}</span></li>`).join('')}</ul><dl><div><dt>知识理解</dt><dd>${esc(knowledge)}</dd></div><div><dt>实际操作</dt><dd>${esc(reviewLabel(s,r))}</dd></div><div><dt>独立完成</dt><dd>${esc(independent)}</dd></div></dl>${changedReview(s)?'<p>草稿已修改，以上反馈属于上一次提交。</p>':''}<p class="stage-prerequisite">${pre.lessons.length?'建议先了解：'+pre.lessons.map(id=>lessons.find(l=>l.id===id).title).join('、')+'。':'无需基础，直接开始。'}所有课程都可进入，跳过不算已掌握。</p></div></details><div class="stage-card-actions"><button class="btn ${s.id===currentStage?'btn-primary':'btn-secondary'}" data-stage-start="${s.id}" data-route="lesson/${next.id}" aria-label="${n===total?'回看课程':started?'继续学习':'开始学习'}：${esc(s.title)}">${n===total?'回看课程':started?'继续学习':'开始学习'}</button>${button('阶段实操','exams/'+s.id,'btn-ghost')}</div></li>`;
  }
  function levelsPage() {
    const next=nextLesson(),allDone=coreDone()===coreLessons.length;
    const challenge=coreStages.find(s=>!latestReview(s.id)||reviewFindings(s,latestReview(s.id)).length)||coreStages.at(-1);
    const currentStage=allDone?challenge.id:next.stage.id;
    const route=allDone?'exams/'+challenge.id:'lesson/'+next.id;
    return `<header class="levels-hero"><h1>把 AI 用起来</h1><p>从零开始，一步步学会解决真实问题。</p></header><section class="path-summary" aria-label="推荐下一步"><div><p class="path-summary-label">${allDone?'必修已自查，接着核验作品':'推荐下一步 · '+stageLabel(next.stage)}</p><h2>${esc(allDone?challenge.title:next.stage.title)}</h2><p>${esc(allDone?'课程完成不等于能力达标。用一次阶段挑战检查自己的成果。':next.title)}</p></div><div class="path-summary-action">${button(allDone?'核验阶段成果':coreDone()?'继续学习':'开始第一课',route,'btn-primary')}<span>${coreDone()} / ${coreLessons.length} 课必修已自查</span></div></section><section class="levels-learning-path" aria-labelledby="learningPathTitle"><div class="levels-section-heading"><h2 id="learningPathTitle">你的学习路线</h2><p>前六阶段必修，第七阶段按需选修。所有阶段都可直接进入。</p></div><ol class="stage-grid">${[...coreStages,...electiveStages].map((s,i)=>stageCard(s,i,currentStage)).join('')}</ol><p class="levels-progress-note">完成状态来自课程自查。知识题、真实操作和独立完成分别核验，不按课数自动认定掌握。</p></section><section class="levels-capabilities" aria-labelledby="capabilitiesTitle"><div class="levels-section-heading"><h2 id="capabilitiesTitle">会做什么，比学过多少更重要</h2><p>六级能力是本课程的成长参照。悬停查看详情，点击等级进入对应课程。</p></div><section class="level-overview">${levelDiagram(false)}${levelDiagram(true)}<p class="text-muted">手机轻点等级即可进入课程；键盘可用 Tab 聚焦、Enter 进入、Escape 关闭详情。</p></section>${learningSummary()}<ol class="level-list">${D.levels.map((l,i)=>`<li class="level-row"><details class="capability-detail"><summary><span class="level-badge">${esc(l.label)}</span><h3>${esc(l.title)}</h3>${flowIcon('M7 10l5 5 5-5')}</summary><div class="level-detail"><p>${esc(l.ability)}</p><dl class="level-proof"><div><dt>代表作品</dt><dd>${esc(l.artifact)}</dd></div><div><dt>验收重点</dt><dd>${esc(l.verify)}</dd></div></dl>${abilityRow(coreStages[i])}<div class="level-course">${button('学习这一级','lesson/'+l.lesson,'btn-secondary')}<span class="text-muted">${esc(l.course)}</span></div></div></details></li>`).join('')}</ol></section><details class="platform-guide"><summary>换一个工具，也按这条路学 ${flowIcon('M7 10l5 5 5-5')}</summary><p>先使用你能访问的工具完成必修。个人系统和编程开发分别在选修与拓展区，均不是必修毕业条件。</p><table><caption>通用方法与工具差异</caption><thead><tr><th scope="col">要完成的事</th><th scope="col">共通方法</th><th scope="col">怎样适配工具</th></tr></thead><tbody>${D.platformGuide.map(p=>`<tr><th scope="row">${esc(p.task)}</th><td>${esc(p.shared)}</td><td>${esc(p.adaptation)}</td></tr>`).join('')}</tbody></table></details><footer class="levels-footer"><p>想自己开发？原 22 课与旧学习记录仍保留在编程拓展。</p>${button('查看选修与编程拓展','extensions','btn-ghost')}</footer>`;
  }
  function welcomePage() {
    return `<section class="welcome-page" aria-labelledby="welcomeTitle"><a class="welcome-brand" href="#welcome" aria-label="AI Project Studio 欢迎页">${$('.brand-mark').outerHTML}<span>AI Project Studio</span></a><header class="welcome-intro"><h1 id="welcomeTitle">欢迎来到 AI 项目学习台</h1><p>从零开始，亲手做成</p></header><section class="welcome-card" aria-labelledby="accountTitle"><div class="welcome-card-heading"><h2 id="accountTitle">登录预览</h2><span>测试版</span></div><p id="accountNotice" class="account-notice">账号功能即将开放，当前可使用游客模式体验</p><fieldset disabled aria-describedby="accountNotice"><legend class="sr-only">账号登录尚未开放</legend><label for="previewEmail">邮箱</label><input id="previewEmail" type="email" placeholder="邮箱地址（暂未开放）" autocomplete="off"><label for="previewPassword">密码</label><input id="previewPassword" type="password" placeholder="密码（暂未开放）" autocomplete="off"><button class="btn preview-login" type="button" disabled>登录 · 即将开放</button></fieldset><div class="account-links"><span>创建账号 <small>即将开放</small></span><span>忘记密码 <small>即将开放</small></span></div><div class="guest-action">${button('以游客身份继续','levels','btn-primary')}<p>无需账号，直接开始学习</p></div></section><p class="welcome-storage">学习记录保存在当前浏览器，可导出备份<br>暂不支持跨设备同步</p></section>`;
  }
  function home() {
    const next = nextLesson();
    const allDone = coreDone() === coreLessons.length;
    return `${pageTitle('把 AI 用起来', '一步步解决真实问题，留下能检查的作品。')}
      <section class="project-banner home-recommendation" aria-label="推荐下一步学习"><div class="banner-copy"><p class="recommendation-stage">${allDone?'必修练习已自查 · 下一步核验作品':stageLabel(next.stage)+' · '+esc(next.stage.title)}</p><h2>${esc(allDone?'检查独立完成的成果':next.title)}</h2><p>${esc(allDone?'完成记录不等于能力达标，回到阶段挑战核对真实作品。':next.intro)}</p><span class="recommendation-time">${allDone?'理解、实操与独立完成分别核验':next.id==='core1-l1'?'首次动手约10分钟 · 完整课程建议20分钟':'建议 '+next.minutes+' 分钟'}</span></div><div class="home-next-action">${button(allDone ? '检查阶段挑战' : coreDone() ? '继续下一课' : '开始第一课', allDone?'exams/core6':'lesson/'+next.id, 'btn-primary')}<span>${coreDone()} / ${coreLessons.length} 课必修已自查</span>${button('查看AI运用等级图','levels','btn-ghost')}</div></section>
      <div class="dashboard-grid"><section class="learning-panel"><div class="section-heading"><h2>你的学习路线</h2><span class="text-muted">前六阶段必修 · 第七阶段选修</span></div>${stageList([...coreStages,...electiveStages],allDone?'':next.stage.id)}<div class="route-footer"><p>接下来按需要选：个人 AI 工作系统，或自己开发资料问答 Agent。它们不影响必修完成。</p>${button('打开选修与拓展','extensions','btn-secondary')}</div></section>
      <aside class="side-stack"><section class="side-panel"><h2>${allDone?'回看一份独立作品':'今天只做这一件事'}</h2><p>${esc(allDone?'从阶段挑战中选一份作品，换一个要求重新完成，并保留修改与核对记录。':next.id==='core1-l1'?'把一段通知变成可核对的清单；追问改一次，再自己换题试试。':next.task)}</p>${button(allDone?'打开最终挑战':'打开这节课',allDone?'exams/core6':'lesson/'+next.id,'btn-primary')}</section><section class="side-panel"><h2>怎样判断真正学会</h2><ul class="mini-list"><li>理解：能解释为什么这样选。</li><li>实操：留下实际输出并核对。</li><li>独立：换个任务仍能完成。</li></ul><p class="text-muted">自查与知识题不自动认证能力。需要他人反馈时，可分享作品与验收标准。</p>${button('查看我的项目','project','btn-ghost')}</section><section class="side-panel"><h2>已有旧版记录？</h2><p>原 22 课和考试都保留在拓展区，笔记与完成记录仍可查看。测试版暂不提供云同步。</p>${button('查看拓展与旧记录','extensions','btn-ghost')}</section></aside></div>${learningSummary()}<footer class="page-footer">先做练习，再记录完成。免费额度与工具功能以当前账户为准，无可用功能时保留待练，不用付费解锁课程。</footer>`;
  }
  function stageList(stages, openId) {
    return `<div class="stage-list">${stages.map(s => `<details class="stage-item ${s.id===openId?'is-current':''}" ${s.id===openId?'open':''}><summary class="stage-summary"><span class="stage-index">${s.track==='extension'?extensionStages.indexOf(s)+1:[...coreStages,...electiveStages].indexOf(s)+1}</span><span class="stage-info"><span class="stage-title">${esc(s.title)}</span><span class="stage-subtitle">${esc(s.subtitle)} · ${trackName(s)}</span></span><span class="stage-meta"><span>${doneCount(s)}/${s.lessons.length}</span><progress class="stage-progress" value="${doneCount(s)}" max="${s.lessons.length}" aria-label="${esc(s.title)}课程自查进度">${doneCount(s)}/${s.lessons.length}</progress></span><span class="stage-visual-status">${doneCount(s)===s.lessons.length?'已完成（自查）':s.id===openId?'当前建议':doneCount(s)>0?'学习中':'未开始'}</span></summary><div class="stage-lessons">${s.lessons.map((l,j)=>`<button class="lesson-row" data-route="lesson/${l.id}"><span class="lesson-number">${String(j+1).padStart(2,'0')}</span><span class="lesson-info"><span class="lesson-title">${esc(l.title)}</span><span class="lesson-meta">约 ${l.minutes} 分钟 · ${esc(l.level)}</span></span><span class="lesson-status ${completed(l.id)?'chip-success':''}">${completed(l.id)?'已自查':'去学习'}</span></button>`).join('')}<div class="stage-exam">${button('阶段综合挑战','exams/'+s.id,'btn-ghost')}<span class="text-muted">知识 ${state.examResults[s.id]?state.examResults[s.id].score+'/'+s.exam.questions.length:'待测'} · 实操 ${practiceReady(s)?'已自查':'待练'} · 独立能力需核验</span></div></div></details>`).join('')}</div>`;
  }
  function extensionsPage() {
    const oldDone=extensionLessons.filter(l=>completed(l.id)).length;
    return `${pageTitle('选修与拓展，按需要再深入。','这里不设普通用户毕业门槛。原有课程、考试和学习记录保留，原链接仍可打开。')}<section class="learning-panel extension-panel"><div class="section-heading"><h2>第 7 阶段 · 个人 AI 工作系统</h2><span class="text-muted">进阶选修 · 不要求编程</span></div><p class="route-description">把已经验证的方法、资料和长期任务组织起来。先完成一个手动流程，再考虑连接与自动化。</p>${stageList(electiveStages,electiveStages[0]?.id)}</section><section class="learning-panel extension-panel"><div class="section-heading"><h2>编程拓展 · 个人资料问答 Agent</h2><span class="text-muted">原 7 关 22 课 · 已自查 ${oldDone} / ${extensionLessons.length}</span></div><p class="route-description">从原来的任务练习继续到 Python、Git、API、RAG 与 Agent 开发。旧成绩和笔记仍归属原课，不会被算作新必修成绩。</p>${button('查看原项目任务书','project/agent','btn-secondary')}${stageList(extensionStages,lessons.find(l=>l.id===state.lastLesson&&l.stage.track==='extension')?.stage.id)}</section><section class="side-panel"><h2>哪些内容留到有需要时</h2><p>模型训练、Transformer 数学原理、向量数据库开发、微调和服务器部署都不是必修。本版保留原课程里已有的概念入口，尚未提供这些主题的完整专题课。</p>${button('回到必修路线','home','btn-primary')}</section>`;
  }
  function checklist(items, values, attr) { return `<div class="check-list">${items.map((c,i)=>`<label class="check-item"><input type="checkbox" ${attr}="${i}" ${values?.[i] ? 'checked' : ''}><span>${esc(c)}</span></label>`).join('')}</div>`; }
  function reviewForm(s) {
    if(!S.rubrics[s.id])return '';
    const d=draftFor(s.id),r=latestReview(s.id),rubric=S.rubrics[s.id],history=learning.submissions[s.id]||[];
    return `<section class="review-panel" id="reviewPanel"><h2>提交成果，逐项核对后再改进</h2><p>本阶段提交：${esc(rubric.artifact)} 上方“实操证据”保留你的成品文字、文件名称/位置及可检查摘录。本页不会上传或自动打开你的文件。</p><label for="reviewMode">实际操作还是准备练习？</label><select id="reviewMode" data-review-field="mode"><option value="">请选择本次实际完成范围</option><option value="actual" ${d.mode==='actual'?'selected':''}>已实际使用工具并取得成果</option><option value="preparation" ${d.mode==='preparation'?'selected':''}>只做准备/模拟，实际操作待练</option></select><label class="notes-field" for="reviewProcess">任务说明、工具选择与核对过程</label><textarea class="notes-field" id="reviewProcess" data-review-field="process" maxlength="20000" rows="3" placeholder="为什么选这个工具？给了什么输入？实际做了什么？怎样检查？">${esc(d.process)}</textarea><h3>对应上方三项自查，分别给出依据</h3><p class="text-muted">有做到就勾选原自查项，并写出可检查的位置或对照。不确定的保留未勾选，提交后会列出补练建议。</p>${s.exam.checks.map((c,i)=>`<label class="review-criterion" for="reviewEvidence${i}"><strong>标准 ${i+1}：${esc(c)}</strong><span>${esc(rubric.evidence[i])}</span><textarea class="notes-field" id="reviewEvidence${i}" data-review-evidence="${i}" maxlength="4000" rows="2" placeholder="记录你按这项标准检查的具体结果或未完成原因">${esc(d.evidence[i])}</textarea></label>`).join('')}<details class="review-optional" ${d.independent||d.source==='peer'?'open':''}><summary>独立换题与人工复核（有证据时再记录）</summary><label class="check-item"><input type="checkbox" data-review-field="independent" ${d.independent?'checked':''}><span>换过新材料或要求，未照抄详细步骤，独立完成过</span></label><label class="notes-field" for="independentEvidence">新要求、独立结果与核对证据</label><textarea class="notes-field" id="independentEvidence" data-review-field="independentEvidence" rows="3" maxlength="20000">${esc(d.independentEvidence)}</textarea><label for="reviewSource">谁对实际作品作了判断？</label><select id="reviewSource" data-review-field="source"><option value="self" ${d.source==='self'?'selected':''}>仅自己核对：自评待核验</option><option value="peer" ${d.source==='peer'?'selected':''}>已请人核对：我记录人工复核结果</option></select><label class="notes-field" for="reviewer">复核人称呼与具体意见</label><textarea class="notes-field" id="reviewer" data-review-field="reviewer" rows="3" maxlength="20000" placeholder="对方检查了什么？指出哪里需改？只记必要称呼，不填私人联系方式。">${esc(d.reviewer)}</textarea><label for="reviewVerdict">人工复核结论</label><select id="reviewVerdict" data-review-field="verdict"><option value="">尚未记录</option><option value="pass" ${d.verdict==='pass'?'selected':''}>对方确认本次成果符合上述标准</option><option value="revise" ${d.verdict==='revise'?'selected':''}>对方指出仍需改进</option></select><p class="text-muted">这是你填写的人工复核记录，平台没有验证复核人身份，也没有自动认定毕业。</p></details>${r?`<label class="notes-field" for="reviewChange">这次修改了什么，怎样复验？</label><textarea class="notes-field" id="reviewChange" data-review-field="change" rows="3" maxlength="20000" placeholder="对照上次反馈，说明本次改动和检查结果">${esc(d.change)}</textarea>`:''}<p id="reviewError" class="form-error" role="alert" hidden></p><p id="reviewDraftStatus" class="text-muted" role="status">${changedReview(s)?'草稿已修改，尚未重新提交；下面的反馈属于上一次成果。':'填写后自动暂存；提交才生成一次反馈记录。'}</p><button class="btn btn-primary" data-submit-review="${s.id}">${r?'修改后重新提交':'提交成果并查看反馈'}</button><div id="reviewFeedback">${feedbackResult(s,r)}</div>${history.length?`<details class="review-history"><summary>查看 ${history.length} 次提交与修改记录</summary>${[...history].reverse().map((v,i)=>`<article><h3>第 ${history.length-i} 次 · ${esc(dateText(v.at))}</h3><p>${esc(reviewLabel(s,v))}</p><p class="saved-artifact">${esc(v.artifact)}</p>${v.change?`<p>修改与复验：${esc(v.change)}</p>`:''}<details><summary>查看当次核对依据与反馈</summary><p>${esc(v.process)}</p><ol>${v.evidence.map(x=>`<li>${esc(x||'未填写')}</li>`).join('')}</ol>${feedbackResult(s,v)}</details></article>`).join('')}</details>`:''}</section>`;
  }
  function drills(items,heading) {
    return `<section class="practice-drills"><h2>${esc(heading)}</h2><p>先选做法并写一句理由，再看对照。题目练判断，不代替真实工具操作或能力验收。</p>${items.map(d=>{const saved=learning.drills[d.id];return `<details class="drill"><summary>${esc(d.title)}</summary><form data-drill="${d.id}"><fieldset><legend>你会先怎么做？</legend>${d.options.map((o,i)=>`<label class="option"><input type="radio" name="answer" value="${i}" ${saved?.answer===i?'checked':''} required><span>${esc(o)}</span></label>`).join('')}</fieldset><label class="notes-field" for="why-${d.id}">为什么这样选？</label><textarea class="notes-field" id="why-${d.id}" name="why" rows="2" maxlength="4000" required>${esc(saved?.why||'')}</textarea><button class="btn btn-secondary" type="submit">判断后查看对照</button><div class="drill-feedback" aria-live="polite">${saved?drillFeedback(d,saved):''}</div></form></details>`;}).join('')}</section>`;
  }
  function drillFeedback(d,v) {return `<p><strong>${v.answer===d.answer?'所选做法与本题条件相符。':'先回到题目条件，再试一次。'}</strong>${esc(d.why)}</p><p>你的理由：${esc(v.why)}</p><p class="text-muted">只核对所选做法，不自动评判自由文本理由。</p>${button('回课补练','lesson/'+d.lesson,'btn-ghost')}`;}
  function copyBlock(label, text, key) { return `<div class="example-block"><div class="example-header"><strong>${esc(label)}</strong><button class="btn btn-ghost" data-copy="${key}">复制</button></div><pre class="code-block"><code>${esc(text)}</code></pre></div>`; }
  function lessonPage(id) {
    const l = lessons.find(x=>x.id===id);
    if (!l) return notFound();
    state.lastLesson = id; save();
    const sequence = l.stage.track === 'core' ? coreLessons : l.stage.track === 'elective' ? electiveLessons : extensionLessons;
    const index = sequence.findIndex(x=>x.id===id);
    const back = l.stage.track === 'core' ? 'home' : 'extensions';
    return `<button class="back-link btn btn-ghost" data-route="${back}">返回${l.stage.track==='core'?'必修路线':'选修与拓展'}</button><div class="lesson-layout"><article class="lesson-article"><header class="lesson-header"><span class="chip">${stageLabel(l.stage)} · ${trackName(l.stage)}</span><h1 class="page-title">${esc(l.title)}</h1><p class="page-description">${esc(l.intro)}</p><div class="lesson-header-meta"><span class="text-muted">${id==='core1-l1'?'首次动手约10分钟；完整课程约20分钟':'建议 '+l.minutes+' 分钟'} · ${esc(l.level)}</span><span class="lesson-state">${completed(id)?'已完成（自查）':state.notes[id]?.trim()||state.checks[id]?.some(Boolean)?'学习中':'待练习'}</span></div></header><section class="lesson-section"><h2>学完这一课，你能做什么</h2><p>${esc(l.objective||l.stage.goal)}</p></section>${prerequisitePanel(l)}${id==='core1-l1'?firstTask():''}
      ${id==='core1-l1'?'<details class="first-theory"><summary>做完再理解：模型、产品与工具（按需展开）</summary>':''}<section class="lesson-section" id="understand"><h2>先弄明白</h2><div class="explanation">${l.explain.map(t=>`<p>${esc(t)}</p>`).join('')}</div>${l.knowledge.map(k=>`<section class="knowledge-section"><h3>${esc(k.title)}</h3>${k.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</section>`).join('')}<p class="knowledge-sources">对照官方资料：${l.knowledgeSources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a>`).join(' · ')}</p></section>${id==='core1-l1'?'</details>':''}
      <section class="lesson-section" id="try"><h2>跟着做一次</h2><ol class="step-list">${l.steps.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>${copyBlock(l.example.label,l.example.text,'example')}${l.prompt ? copyBlock('可以这样向 AI 求助',l.prompt,'prompt') : ''}</section>
      <section class="lesson-section lesson-practice" id="practice"><h2>轮到你动手</h2><div class="task-block"><p>${esc(l.task)}</p></div><h3>完成后，逐项自查</h3>${checklist(l.checks,state.checks[id],'data-lesson-check')}<label class="notes-field" for="lessonNote">记录你的成果或卡点</label><textarea class="notes-field" id="lessonNote" data-lesson-note placeholder="例如：我做出了什么、结果是什么、还卡在哪一步……" rows="5">${esc(state.notes[id]||'')}</textarea><p class="text-muted" id="noteStatus">输入后自动保存在当前浏览器；不用填写密码或 API Key。</p><div class="lesson-actions"><button class="btn btn-primary" data-complete="${id}">${completed(id) ? '本课已记录完成' : '记录本课完成'}</button>${completed(id) ? `<span class="chip chip-success" id="completionStatus">已自查</span>` : '<span class="text-muted">勾选全部自查项后即可记录</span>'}</div><p class="text-muted">完成记录来自你的自查，不代表老师已验收。</p></section>
      ${l.feedback?.length?`<section class="lesson-section"><h2>反馈与补练</h2><ul class="mini-list">${l.feedback.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>${button('用阶段挑战再试一次','exams/'+l.stage.id,'btn-secondary')}</section>`:''}${S.faults.some(d=>d.lesson===id)?drills(S.faults.filter(d=>d.lesson===id),'先判断问题，再尝试修复'):''}${id==='core4-l1'?drills(S.scenarios,'按任务选工具，先比较再决定'):''}${l.related?.length?`<section class="lesson-section"><h2>已有练习，按需加练</h2><p>以下是保留的旧版项目练习，不影响本课完成。</p><div class="related-lessons">${l.related.map(id=>{const r=lessons.find(x=>x.id===id);return r?button(r.title,'lesson/'+r.id,'btn-ghost'):'';}).join('')}</div></section>`:''}
      <div class="lesson-pagination">${index > 0 ? button('上一课','lesson/'+sequence[index-1].id) : '<span></span>'}${index < sequence.length-1 ? button('下一课','lesson/'+sequence[index+1].id,'btn-primary') : button('前往阶段综合挑战','exams/'+l.stage.id,'btn-primary')}</div></article><aside class="lesson-aside side-stack"><section class="side-panel"><h2>本课导航</h2><p class="lesson-location">${esc(stageLabel(l.stage)+' · '+l.stage.title)}</p><div class="document-list"><a href="#understand">先弄明白</a><a href="#try">跟着做一次</a><a href="#practice">独立换题练习</a></div>${button('本阶段综合挑战','exams/'+l.stage.id,'btn-ghost')}${button('查看AI运用等级图','levels','btn-ghost')}</section><section class="side-panel"><h2>遇到问题怎么问</h2><p>说明目标、已做步骤、实际结果和希望改进的地方。提供必要材料前先处理敏感信息。</p>${button(l.stage.track==='extension'?'查看原项目资料':'查看项目任务书',l.stage.track==='extension'?'project/agent':'project','btn-ghost')}${button('查一个概念','glossary','btn-ghost')}</section></aside></div>`;
  }
  function glossary(raw='') {
    let query='';try{query=decodeURIComponent(raw);}catch{query=raw;}
    return `${pageTitle('概念工具箱', '先知道它解决什么问题。标为“按需学习”的技术内容不影响普通用户完成必修。')}<div class="filter-bar"><label for="conceptSearch">查一个术语</label><input class="search-field" id="conceptSearch" type="search" placeholder="试试 大语言模型、幻觉、Agent、Skill" autocomplete="off" value="${esc(query)}"></div><div class="glossary-grid" id="glossaryItems">${glossaryItems(query)}</div>`;
  }
  function glossaryItems(query) {
    const list = D.glossary.filter(g => [g.term,g.alias,g.plain].join(' ').toLowerCase().includes(query.trim().toLowerCase()));
    return list.length ? list.map(g=>`<details class="glossary-item"><summary><span class="glossary-term">${esc(g.term)}</span> <span class="glossary-alias">${esc(g.alias)}</span>${g.optional ? '<span class="chip chip-muted">按需学习</span>' : ''}${flowIcon('M7 10l5 5 5-5')}</summary><div class="glossary-detail"><p>${esc(g.plain)}</p><p><strong>什么时候用：</strong>${esc(g.when)}</p><p><strong>项目里的例子：</strong>${esc(g.example)}</p></div></details>`).join('') : '<p class="empty-state glossary-empty" role="status">没找到这个词。试试更短的关键词，或用中文名称搜索。</p>';
  }
  function practiceReady(s) { return !!state.practiceNotes[s.id]?.trim() && s.exam.checks.every((_,i)=>state.practiceChecks[s.id]?.[i]); }
  function examPage(id) {
    const s = D.stages.find(s=>s.id===id) || D.stages[0];
    const result = state.examResults[s.id];
    return `${pageTitle('用一次实操，检验这一关。','先理解，再实际操作，最后换题独立完成。知识题自动判分；实操与独立能力需要真实作品和核验。')}<div class="exam-selector"><label for="stageSelect">选择关卡</label><select id="stageSelect">${[['必修',coreStages],['进阶选修',electiveStages],['编程拓展·旧版',extensionStages]].map(([label,group])=>`<optgroup label="${label}">${group.map(x=>`<option value="${x.id}" ${s.id===x.id?'selected':''}>${stageLabel(x)} · ${esc(x.title)}</option>`).join('')}</optgroup>`).join('')}</select></div><div class="lesson-layout"><div><section class="exam-card"><h2>${esc(s.exam.title)}</h2><p class="text-muted">第一部分：知识题 · ${s.exam.questions.length} 题</p><p class="quiz-progress" id="quizProgress" role="status" aria-live="polite">已回答 ${state.examAnswers[s.id]?.filter(a=>a!==null).length||0} / ${s.exam.questions.length} 题 · ${result?'已提交知识题':'本次选择尚未提交'}</p><form id="quizForm" data-stage="${s.id}">${s.exam.questions.map((q,i)=>`<fieldset class="question"><legend>${i+1}. ${esc(q.question)}</legend>${q.options.map((o,j)=>`<label class="option ${result && j===q.answer ? 'is-correct' : result && state.examAnswers[s.id]?.[i]===j && j!==q.answer ? 'is-wrong' : ''}"><input type="radio" name="q${i}" value="${j}" ${state.examAnswers[s.id]?.[i]===j?'checked':''} ${result?'disabled':''} required><span>${esc(o)}</span></label>`).join('')}${result ? `<p class="explanation"><strong>${state.examAnswers[s.id]?.[i]===q.answer?'回答正确。':'回答有误。'}</strong><span class="correct-answer">正确答案：${esc(q.options[q.answer])}</span>${esc(q.explanation)}</p>` : ''}</fieldset>`).join('')}<div class="lesson-actions">${result?`<div class="quiz-result" role="status">知识题：${result.score} / ${s.exam.questions.length} 题答对<p>接着完成下方实操并留下证据。答题正确不等于实际操作或独立能力已通过。</p></div><button type="button" class="btn btn-secondary" data-retry="${s.id}">重做知识题</button>`:'<button class="btn btn-primary" type="submit">提交知识题</button>'}</div></form></section><section class="practice-panel"><h2>第二部分：实操与独立挑战</h2><p>${esc(s.exam.task)}</p>${checklist(s.exam.checks,state.practiceChecks[s.id],'data-practice-check')}<label class="notes-field" for="practiceNote">你的实操证据</label><textarea class="notes-field" id="practiceNote" data-practice-note="${s.id}" maxlength="20000" rows="6" placeholder="记录实际成果、核验过程，以及换题后独立完成的证据；不要填写账号、密钥或私人资料。">${esc(state.practiceNotes[s.id]||'')}</textarea><div class="lesson-actions"><button class="btn btn-primary" data-save-practice="${s.id}">保存实操记录</button><span class="chip ${practiceReady(s)?'chip-success':'chip-muted'}" id="practiceStatus">${practiceReady(s)?'已自查，待核验':'待自查'}</span></div><p class="text-muted">这里只保存你的自查与证据，不自动授予能力等级或毕业。缺少工具时可做准备练习，但真实操作仍记为待练；不能用文字方案冒充已执行。</p></section>${reviewForm(s)}</div><aside class="side-stack"><section class="side-panel"><h2>怎样才算学会</h2><ul class="mini-list"><li>知识理解：能说明任务适用性和选择理由。</li><li>实际操作：交出真实输出、来源或文件并核对。</li><li>独立完成：换个任务，不照抄步骤仍能完成。</li></ul>${button('回到本关课程','lesson/'+s.lessons[0].id,'btn-ghost')}</section></aside></div>`;
  }
  function updateQuizProgress() {
    const form = $('#quizForm'), status = $('#quizProgress');
    if (!form || !status) return;
    const answered = form.querySelectorAll('input[type="radio"]:checked').length;
    const total = form.querySelectorAll('fieldset.question').length;
    status.textContent = `已回答 ${answered} / ${total} 题 · ${form.querySelector('button[type="submit"]')?'本次选择尚未提交':'已提交知识题'}`;
  }
  function projectPage(id) {
    if (id === 'agent') return agentProjectPage();
    return `${pageTitle('把一个真实问题做成作品。','不要求编程。选择一个有明确用途、输入和完成标准的小任务，做完后核对，并换一个要求再试。')}<div class="lesson-layout"><article class="lesson-article"><section class="project-spec"><h2>你的第一个 AI 实用项目</h2><p>从学习资料包、生活计划或工作汇报中选一个。可以使用免费工具与普通文档，不需要先购买服务。</p><ul class="mini-list"><li>学习：从一页公开资料制作复习题，核对每题依据。</li><li>生活：把虚构活动通知变成安排表，检查时间冲突。</li><li>工作：用模拟进度与数据做一页报告，核对数字和待办。</li></ul><p class="text-muted">本网页负责教学与记录，不会替你在其他产品中执行这些任务。</p></section><section class="lesson-section"><h2>用六步交付一个小成果</h2><ol class="step-list"><li>说明谁会用、解决什么问题。</li><li>准备可分享的材料，标出来源与日期。</li><li>选择工具，把任务拆成两到四步。</li><li>产出草稿，回到原文、数据或实际文件核对。</li><li>换一个要求，自己调整并记录一次修正。</li><li>交付最终作品、依据、限制与简短使用说明。</li></ol>${button('开始真实项目课','lesson/core5-l2','btn-primary')}</section><section class="lesson-section"><h2>怎样验收</h2><ul class="mini-list"><li>理解：能解释选工具和处理步骤的理由。</li><li>实操：有可打开、可核对的实际成果。</li><li>独立：没有照抄详细步骤，能完成一个相近的新要求。</li></ul><p>请身边的人只看作品和使用说明，指出看不懂或无法使用的地方，再改一次。评价来自证据，不能仅凭AI说“已完成”。</p>${button('提交阶段综合挑战','exams/core5','btn-secondary')}</section><section class="lesson-section"><h2>我的阶段作品与反馈</h2><p>六个必修阶段各交一件可检查成果。第七阶段为选修；学习过、练习过与独立完成分别记录。</p>${[...coreStages,...electiveStages].map(abilityRow).join('')}</section><section class="lesson-section"><h2>想自己开发资料问答 Agent？</h2><p>原项目任务书、六段TXT与三份项目模板全部保留在编程拓展中。它们不会成为普通用户毕业的条件。</p>${button('查看原项目与下载资料','project/agent','btn-secondary')}</section></article><aside class="side-stack"><section class="side-panel"><h2>先从哪开始</h2><p>第一次接触AI，先做任务适配与表达练习，再来到这里选项目。</p>${button('从第一课开始','lesson/core1-l1','btn-primary')}</section><section class="side-panel"><h2>不用一次做到很大</h2><p>先完成一页可用作品，再按实际问题增加工具。多步骤任务可以手动逐步执行，不必先写程序。</p>${button('查看必修路线','home','btn-ghost')}</section></aside></div>`;
  }
  function agentProjectPage() {
    return `${pageTitle('你的项目任务书', '从一个能核对的小版本起步。先跑通，再一点点加能力。')}<div class="lesson-layout"><article class="lesson-article"><section class="project-spec"><h2>${esc(D.project.title)}</h2><p>${esc(D.project.goal)}</p><ul class="mini-list">${D.project.features.map(f=>`<li>${esc(f)}</li>`).join('')}</ul><p class="text-muted">这是你要亲手做出的项目。本学习台负责教学和记录，不会在这里自动调用模型或完成资料问答。</p></section><section class="lesson-section"><h2>从第一版走到独立交付</h2><ol class="milestone-list">${D.project.milestones.map((m,i)=>`<li class="milestone"><strong>第 ${i+1} 关</strong><span>${esc(m)}</span>${button('去这一关','lesson/'+extensionStages[i].lessons[0].id,'btn-ghost')}</li>`).join('')}</ol></section><section class="lesson-section"><h2>开工前，先准备三份小文档</h2><p>先写清要做什么、怎么做、现在做到哪。后面每次改项目，顺手更新。</p><div class="document-list">${['项目需求.md','处理流程.md','当前进度.md'].map((n,i)=>`<div class="document-row"><span>${esc(n)}</span><button class="btn btn-secondary" data-template="${i}">下载模板</button></div>`).join('')}</div></section><section class="lesson-section"><div class="section-heading"><h2>第一份练习资料</h2><button class="btn btn-secondary" data-download-reference>下载 TXT</button></div><p class="text-muted">${esc(D.reference.title)} · 用于练习回答和标注出处</p>${D.reference.paragraphs.map(p=>`<div class="reference-paragraph"><strong>第 ${p.id} 段</strong><p>${esc(p.text)}</p></div>`).join('')}<p class="text-muted">这份原创教学资料可用于任意聊天工具的文本问答，也可下载后用于Python项目。</p></section></article><aside class="side-stack"><section class="side-panel"><h2>第一版只做三件事</h2><ul class="mini-list"><li>读入一份 TXT 资料。</li><li>回答时附上文件名和段落。</li><li>资料没写的内容，明确说不知道。</li></ul>${button('从原项目第一课开始','lesson/'+extensionLessons[0].id,'btn-primary')}</section></aside></div>`;
  }
  function notesPage() {
    const entries = lessons.filter(l=>state.notes[l.id]?.trim());
    const practical = D.stages.filter(s=>state.practiceNotes[s.id]?.trim());
    const isEmpty = !entries.length&&!practical.length&&!learning.first.text&&!Object.values(learning.submissions).some(a=>a.length);
    return `${pageTitle('我的学习记录', '把做过的成果、遇到的卡点留下来。记录保存在当前浏览器，记得定期导出。')}<div class="notes-list ${isEmpty?'notes-is-empty':''}">${isEmpty?`<div class="empty-state notes-empty"><span class="notes-empty-icon">${flowIcon('M5 3h14v18H5zM8 8h8M8 12h8M8 16h5')}</span><h2>从第一条学习记录开始</h2><p>在课程的实操环节留下你的作品与思考，之后可以随时回来查看。</p>${button('去学第一课','lesson/'+coreLessons[0].id,'btn-primary')}</div>`:''}${entries.map(l=>`<article class="note-item"><div class="section-heading"><h2>${esc(l.title)}</h2>${button('回到课程','lesson/'+l.id,'btn-ghost')}</div><p style="white-space:pre-wrap">${esc(state.notes[l.id])}</p></article>`).join('')}${practical.map(s=>`<article class="note-item"><div class="section-heading"><h2>${esc(s.title)} · 实操</h2>${button('查看任务','exams/'+s.id,'btn-ghost')}</div><p style="white-space:pre-wrap">${esc(state.practiceNotes[s.id])}</p><span class="chip chip-muted">${practiceReady(s)?'已自查，待核验':'待自查'}</span></article>`).join('')}${learning.first.text?`<article class="note-item"><h2>首个生活作品 · ${learning.first.mode==='actual'?'实际练习（自报）':'准备练习'}</h2><p>${esc(learning.first.text)}</p>${button('回到第一课','lesson/core1-l1','btn-ghost')}</article>`:''}${D.stages.filter(s=>latestReview(s.id)).map(s=>`<article class="note-item"><h2>${esc(s.title)} · 最近提交</h2><p>${esc(latestReview(s.id).artifact)}</p>${feedbackResult(s,latestReview(s.id))}${button('查看与修改作品','exams/'+s.id,'btn-ghost')}</article>`).join('')}</div>`;
  }
  function resourcesPage() {
    return `${pageTitle('需要时，再打开这些资料', '先看通用工具与核验资料；编程资料单独列在后面。功能、免费额度和费用以当前账户与官方说明为准。')}<section class="learning-evidence"><h2>还没有聊天工具？任选一个可访问入口</h2><p>在所选产品的输入框粘贴首课指令并发送，看到回答后返回学习台继续核对。若需要登录，按该产品当前提示操作；无需为本课购买服务。打不开时换已有可用工具，真实练习保持待做。</p><div class="tool-entry-grid"><article class="tool-entry"><h3>DeepSeek</h3><p>用于首课的文字提问练习，返回这里核对结果。</p><a class="btn btn-secondary" href="https://chat.deepseek.com/" target="_blank" rel="noopener noreferrer" aria-label="打开 DeepSeek（官方，新标签页）">访问 DeepSeek ${flowIcon('M7 17 17 7M7 7h10v10')}</a></article><article class="tool-entry"><h3>ChatGPT</h3><p>使用同一份首课指令，练习提问、追问与核对。</p><a class="btn btn-secondary" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer" aria-label="打开 ChatGPT（官方，新标签页）">访问 ChatGPT ${flowIcon('M7 17 17 7M7 7h10v10')}</a></article></div>${button('返回第一课任务','lesson/core1-l1','btn-ghost')}<p class="text-muted">只需能收发文字的工具。本页不要求安装插件、不收集登录信息；打开入口不代表已完成练习。</p></section><section class="tool-comparison"><h2>先选能力，再选你能用的工具</h2><p>下面比较的是使用方式，不是品牌排行。速度、价格和免费额度随产品与账户变化；先用最小任务试一次。</p><div class="table-wrap" tabindex="0" role="region" aria-label="工具能力对比表，可横向滚动"><table><caption>任务、相对投入与核验方式</caption><thead><tr><th scope="col">能力</th><th scope="col">适用任务</th><th scope="col">时间与成本</th><th scope="col">可靠性怎样检查</th></tr></thead><tbody>${S.tools.map(row=>`<tr>${row.map((x,i)=>i?`<td>${esc(x)}</td>`:`<th scope="row">${esc(x)}</th>`).join('')}</tr>`).join('')}</tbody></table></div></section>${drills(S.scenarios,'工具选择对比练习')}${drills(S.faults,'遇到错误，先判断再处理')}<div class="resource-list">${D.resources.filter(r=>r.track==='core').map(r=>`<a class="resource-link external-link" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"><span><strong>${esc(r.title)}</strong><span>${esc(r.description)}</span></span>${flowIcon("M7 17 17 7M7 7h10v10")}</a>`).join('')}</div><section class="lesson-section"><h2>编程拓展资料</h2><p class="text-muted">不属于普通用户必修；想自己开发时再查。</p><div class="resource-list">${D.resources.filter(r=>r.track!=='core').map(r=>`<a class="resource-link external-link" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"><span><strong>${esc(r.title)}</strong><span>${esc(r.description)}</span></span></a>`).join('')}</div></section><footer class="page-footer">官方文档和安装入口可能更新。请按当前工具版本核对；无需一次读完所有资源。</footer>`;
  }
  function notFound() { return `${pageTitle('这页暂时找不到','从闯关路线重新选择一节课。')}${button('回到首页','home','btn-primary')}`; }
  function current() { return location.hash.slice(1).split('/'); }
  const enteredViews = new Set();
  function render() {
    const [route,id] = current();
    const name = route || 'welcome';
    const viewKey = name + '/' + (id || '');
    document.body.dataset.view=name;
    const titles = {welcome:'欢迎',home:'学习桌面',extensions:'选修与拓展',levels:'AI运用等级图',project:'我的项目',glossary:'概念速查',exams:'小测与实操',notes:'学习笔记',resources:'资料与工具',lesson:'课程学习'};
    main.getAnimations().forEach(a=>a.cancel());
    main.innerHTML = name==='welcome'?welcomePage():name==='home'?home():name==='extensions'?extensionsPage():name==='levels'?levelsPage():name==='lesson'?lessonPage(id):name==='glossary'?glossary(id):name==='exams'?examPage(id):name==='project'?projectPage(id):name==='notes'?notesPage():name==='resources'?resourcesPage():notFound();
    $('#breadcrumb').textContent = titles[name] || 'AI 项目学习台';
    document.title = `${titles[name]||'学习'} · AI 项目学习台`;
    document.querySelectorAll('nav [data-route]').forEach(el=>{const active=el.dataset.route===(name==='lesson'?(lessons.find(l=>l.id===id)?.stage.track==='core'?'home':'extensions'):name);el.classList.toggle('is-active',active);if(active)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    progress();
    setupLevelDetails();
    updateQuizProgress();
    if (!enteredViews.has(viewKey) && !matchMedia('(prefers-reduced-motion: reduce)').matches && main.animate) {
      main.animate([{opacity:.94,transform:'translateY(8px)'},{opacity:1,transform:'translateY(0)'}],{duration:350,easing:'cubic-bezier(.16,1,.3,1)'});
    }
    enteredViews.add(viewKey);
    if ($('#mobileMenu').open) $('#mobileMenu').close();
    window.scrollTo(0,0);
    main.focus({preventScroll:true});
  }
  function download(name, content, type='text/plain;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([content],{type}));
    const a = document.createElement('a'); a.href=url; a.download=name; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); } catch {
      const t = document.createElement('textarea');t.value=text;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();if(!ok){notify('复制未完成，请选中示例文字手动复制。');return;}
    } notify('已复制，可以粘贴使用。');
  }
  document.addEventListener('click', e=> {
    const anchor = e.target.closest('a[href^="#"]');
    if (anchor && ['#main','#understand','#try','#practice','#firstTask'].includes(anchor.getAttribute('href'))) {
      const target = $(anchor.getAttribute('href')); if(target) {const details=target.closest('details');if(details)details.open=true;e.preventDefault();target.scrollIntoView({behavior:'smooth'});if(target===main)main.focus({preventScroll:true});} return;
    }
    const el = e.target.closest('button'); if(!el) return;
    if(el.dataset.route) {
      if ($('#mobileMenu').open) $('#mobileMenu').close();
      if (location.hash === '#'+el.dataset.route) main.focus({preventScroll:true});
      else location.hash=el.dataset.route;
      return;
    }
    const [,id]=current();
    if(el.dataset.copy) {const l=lessons.find(l=>l.id===id);if(l)copy(el.dataset.copy==='first'?S.firstPrompt:el.dataset.copy==='followup'?S.firstFollowup:el.dataset.copy==='prompt'?l.prompt:l.example.text);}
    if(el.hasAttribute('data-save-first')) {
      if(!learning.first.text?.trim()){const status=$('#firstStatus');status.textContent='先记录实际结果或当前卡点，再保存。';$('#firstEvidence').focus();return;}
      const prior=learning.first.saved;learning.first.saved=new Date().toISOString();const ok=saveFeedback();if(!ok)learning.first.saved=prior||'';
      $('#firstStatus').textContent=ok?(learning.first.mode==='actual'?'首个作品已自报实际练习并保存；请核对独立换题是否也完成。':'准备练习已保存，真实提问与修改仍待练。'):'浏览器无法保存，请立即导出记录备份。';
    }
    if(el.dataset.submitReview) {
      const s=D.stages.find(s=>s.id===el.dataset.submitReview),r=snapshot(s),error=$('#reviewError');
      const missing=[];if(!r.artifact.trim())missing.push('先在上方“实操证据”填写成果或可检查摘录。');if(!r.mode)missing.push('请选择实际操作或准备练习。');
      if(latestReview(s.id)&&!r.change.trim())missing.push('重新提交前，请写明改了什么、怎样复验。');
      if(latestReview(s.id)&&!changedReview(s))missing.push('本次成果与上次相同，请先按反馈修改后再提交。');
      if(missing.length){error.textContent=missing.join(' ');error.hidden=false;error.scrollIntoView({block:'center'});return;}
      learning.submissions[s.id]??=[];learning.submissions[s.id].push({...r,at:new Date().toISOString()});
      const ok=saveFeedback();render();$('#reviewFeedback').scrollIntoView({block:'center'});notify(ok?'已保存本次成果与反馈，可按建议修改后重交。':'暂存在本次页面，请立即导出记录。');
    }
    if(el.dataset.complete) {
      const l=lessons.find(l=>l.id===el.dataset.complete);
      if(!l.checks.every((_,i)=>state.checks[l.id]?.[i])) {notify('先完成练习，并勾选全部自查项。');return;}
      if(!completed(l.id)) state.completed.push(l.id);
      save(); render(); notify('已记录本课完成，下一课见。');
    }
    if(el.dataset.retry) {delete state.examResults[el.dataset.retry];delete state.examAnswers[el.dataset.retry];save();render();}
    if(el.dataset.savePractice) {
      const s=D.stages.find(s=>s.id===el.dataset.savePractice);const persisted=save();
      $('#practiceStatus').textContent=practiceReady(s)?'已自查，待核验':'待自查';
      $('#practiceStatus').className='chip '+(practiceReady(s)?'chip-success':'chip-muted');
      notify(persisted?'实操记录已保存。':'暂存在本次页面，请导出记录备份。');
    }
    if(el.hasAttribute('data-download-reference')) download(D.reference.fileName,referenceText());
    if(el.dataset.template!==undefined) {const i=Number(el.dataset.template);const files=templates();download(files[i].name,files[i].text);}
  });
  document.addEventListener('change', e=> {
    const el=e.target;const [,id]=current();
    if(el.type==='radio'&&el.closest('#quizForm')) updateQuizProgress();
    if(el.id==='stageSelect') location.hash='exams/'+el.value;
    if(el.hasAttribute('data-lesson-check')) {
      state.checks[id]??=[];state.checks[id][Number(el.dataset.lessonCheck)]=el.checked;
      if(!el.checked) state.completed=state.completed.filter(x=>x!==id);
      save();progress();
      const completeButton=main.querySelector('[data-complete]');if(completeButton&&!completed(id)) {completeButton.textContent='记录本课完成';$('#completionStatus')?.remove();}
    }
    if(el.hasAttribute('data-practice-check')) {const s=D.stages.find(s=>s.id===id)||D.stages[0];state.practiceChecks[s.id]??=[];state.practiceChecks[s.id][Number(el.dataset.practiceCheck)]=el.checked;save();if(S.rubrics[s.id]){invalidatePeerReview(s);saveFeedback();}updatePracticeStatus(s);updateDraftStatus(s);}
  });
  function updatePracticeStatus(s) {const status=$('#practiceStatus');if(status){status.textContent=practiceReady(s)?'已自查，待核验':'待自查';status.className='chip '+(practiceReady(s)?'chip-success':'chip-muted');}}
  function updateDraftStatus(s) {const el=$('#reviewDraftStatus');if(el)el.textContent=!feedbackPersisted?'浏览器无法保存，当前仅在本页内存，请导出备份。':changedReview(s)?'草稿已修改，尚未重新提交；下面反馈属于上一次成果。新版本需重新人工复核。':'草稿已暂存；提交后生成反馈。';}
  document.addEventListener('input',e=> {
    const el=e.target;const [,id]=current();
    if(el.hasAttribute('data-first-field')) {learning.first[el.dataset.firstField]=el.value;saveFeedback();}
    if(el.hasAttribute('data-review-field')||el.hasAttribute('data-review-evidence')) {
      const stage=D.stages.find(s=>s.id===id)||D.stages[0],d=draftFor(stage.id);if(el.hasAttribute('data-review-evidence'))d.evidence[Number(el.dataset.reviewEvidence)]=el.value;else d[el.dataset.reviewField]=el.type==='checkbox'?el.checked:el.value;
      if(el.hasAttribute('data-review-evidence')||!['source','reviewer','verdict','change'].includes(el.dataset.reviewField))invalidatePeerReview(stage);const ok=saveFeedback();updateDraftStatus(stage);if(!ok)$('#reviewDraftStatus').textContent='浏览器无法保存，请立即导出备份。';
    }
    if(el.id==='conceptSearch') $('#glossaryItems').innerHTML=glossaryItems(el.value);
    if(el.hasAttribute('data-lesson-note')) {state.notes[id]=el.value;const ok=save();$('#noteStatus').textContent=ok?'已保存在当前浏览器。':'暂存在本次页面，请导出记录备份。';}
    if(el.hasAttribute('data-practice-note')) {state.practiceNotes[el.dataset.practiceNote]=el.value;save();const s=D.stages.find(s=>s.id===el.dataset.practiceNote);if(S.rubrics[s.id]){invalidatePeerReview(s);saveFeedback();}updatePracticeStatus(s);updateDraftStatus(s);}
  });
  document.addEventListener('submit',e=> {
    if(e.target.dataset.drill){
      e.preventDefault();const d=[...S.scenarios,...S.faults].find(x=>x.id===e.target.dataset.drill),f=new FormData(e.target),why=String(f.get('why')||'').trim();
      if(!why){notify('先写一句你的判断理由，再查看对照。');return;}
      const v={answer:Number(f.get('answer')),why};learning.drills[d.id]=v;const ok=saveFeedback();e.target.querySelector('.drill-feedback').innerHTML=drillFeedback(d,v);if(!ok)notify('浏览器无法保存本次练习，请导出记录。');return;
    }
    if(e.target.id!=='quizForm')return;e.preventDefault();
    const s=D.stages.find(s=>s.id===e.target.dataset.stage);const form=new FormData(e.target);
    const answers=s.exam.questions.map((_,i)=>form.has('q'+i)?Number(form.get('q'+i)):null);
    if(answers.some(x=>x===null)){notify('请先完成所有知识题。');return;}
    state.examAnswers[s.id]=answers;state.examResults[s.id]={score:s.exam.questions.filter((q,i)=>q.answer===answers[i]).length};save();render();
  });
  function referenceText() {return D.reference.paragraphs.map(p=>p.text).join('\n\n');}
  function templates() { return [
    {name:'项目需求.md',text:'# 个人资料问答 Agent · 项目需求\n\n## 我要解决的问题\n从自己的资料中找到答案，并能核对出处。\n\n## 第一版范围\n- 读取一份 TXT 文件。\n- 回答时给出文件名和段落编号。\n- 资料没有答案时明确说明，不编造。\n\n## 我的验收问题\n1. 有依据的问题：\n2. 有依据的问题：\n3. 资料没有答案的问题：\n\n## 暂时不做\n多用户、自动联网、多智能体。\n'},
    {name:'处理流程.md',text:'# 处理流程\n\n## 第一版流程\n读取 TXT → 划分并编号段落 → 找到相关段落 → 带着证据提问模型 → 显示回答和引用\n\n## 文件职责（学习时逐步实现）\n- 资料：原始 TXT，不覆盖源文件。\n- 程序：读取、检索、调用模型和显示结果。\n- 配置：从环境读取密钥，不写进代码。\n\n## 我当前实际实现的流程\n待填写。\n\n## 我还不能解释的步骤\n待填写。\n'},
    {name:'当前进度.md',text:'# 当前进度\n\n## 已实际完成\n尚未记录，请填写自己运行和验证过的结果。\n\n## 运行方式\n待填写。\n\n## 最近一次测试\n- 输入：\n- 实际输出：\n- 证据与出处：\n- 结果：\n\n## 当前卡点\n待填写。\n\n## 下一步\n完成当前关卡的一项小任务。\n\n## Git 存档\n提交编号：待实际提交后填写。\n'}
  ]; }
  $('#exportBtn').addEventListener('click',()=>{download('AI学习记录_'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify({...state,...(learning.first.text||Object.keys(learning.drafts).length||Object.keys(learning.drills).length||Object.values(learning.submissions).some(a=>a.length)?{learningFeedback:learning}:{})},null,2),'application/json');notify('已导出记录，请妥善保存文件。');});
  $('#importBtn').addEventListener('click',()=>$('#importFile').click());
  $('#importFile').addEventListener('change',async e=> {
    const file=e.target.files[0];if(!file)return;
    try {const raw=JSON.parse(await file.text());const imported=normalize(raw),feedback=normalizeFeedback(raw.learningFeedback);if(!confirm('导入会替换当前浏览器的课程、笔记和反馈记录；旧文件不含新增反馈。建议先导出备份。现在导入吗？'))return;state=imported;learning=feedback;const savedState=save(),savedFeedback=saveFeedback(),ok=savedState&&savedFeedback;render();notify(ok?'已导入学习记录。':'已载入记录，请导出备份，当前浏览器无法保存。');}catch(error){notify(error instanceof SyntaxError?'文件无法解析，请选择有效的 JSON 记录。':error.message);}finally{e.target.value='';}
  });
  $('#menuToggle').addEventListener('click',()=>$('#mobileMenu').showModal());
  $('#closeMenu').addEventListener('click',()=>$('#mobileMenu').close());
  $('#mobileMenu').addEventListener('click',e=>{if(e.target===$('#mobileMenu'))$('#mobileMenu').close();});
  const detailAnimations = new WeakMap();
  document.addEventListener('click', e => {
    const summary = e.target.closest('summary');
    if (!summary || e.target.closest('button,a,input') || matchMedia('(prefers-reduced-motion: reduce)').matches || !summary.parentElement.animate) return;
    const details = summary.parentElement;
    if (!details.matches('.stage-item,.stage-card-details,.capability-detail,.glossary-item')) return;
    e.preventDefault();
    const previous = detailAnimations.get(details), opening = previous ? !previous.opening : !details.open;
    const from = details.getBoundingClientRect().height;
    if (previous) previous.animation.cancel();
    details.open = true;
    details.style.height = ''; details.style.overflow = '';
    const to = opening ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
    details.style.overflow = 'hidden';
    const animation = details.animate([{height:from+'px'},{height:to+'px'}], {duration:250,easing:'cubic-bezier(.16,1,.3,1)'});
    const entry = {animation,opening}; detailAnimations.set(details,entry);
    animation.finished.then(() => {
      if (detailAnimations.get(details) !== entry) return;
      details.open = opening; details.style.overflow = ''; detailAnimations.delete(details);
    }).catch(()=>{});
  });
  window.addEventListener('hashchange',render);
  render();
})();
