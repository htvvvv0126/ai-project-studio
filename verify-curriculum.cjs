const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const root=__dirname,review=path.join(root,'.impeccable/review');
function readData(source){const c={window:{}};vm.runInNewContext(source,c);return JSON.parse(JSON.stringify(c.window.COURSE_DATA));}
const old=readData(execFileSync('git',['show','0752eb8c95a6b1543decaa4c94586da2864e9ffe:dist/course-data.js'],{cwd:root,encoding:'utf8'}));
const data=readData(fs.readFileSync(path.join(root,'dist/course-data.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'dist/core-course.js'),'utf8'));
const legacy=data.stages.filter(s=>s.track==='extension');
assert.deepEqual(legacy.map(({track,...s})=>s),old.stages);
const allLessons=data.stages.flatMap(s=>s.lessons),core=data.stages.filter(s=>s.track==='core').flatMap(s=>s.lessons);
const ids=data.stages.flatMap(s=>[s.id,...s.lessons.map(l=>l.id)]);assert.equal(new Set(ids).size,ids.length);
assert.equal(core.length,15);assert.equal(allLessons.length,39);
const knownLessons=new Set(allLessons.map(l=>l.id)),knownStages=new Set(data.stages.map(s=>s.id));
for(const s of data.stages){assert.equal(s.exam.questions.length,3);for(const q of s.exam.questions)assert(q.answer>=0&&q.answer<q.options.length);for(const l of s.lessons)for(const r of l.related||[])assert(knownLessons.has(r));}
const validRoute=r=>{const [name,id]=r.split('/');return name==='lesson'?knownLessons.has(id):name==='exams'?(!id||knownStages.has(id)):name==='project'?(!id||id==='agent'):['home','levels','extensions','glossary','notes','resources'].includes(name);};
const oldRecord={version:1,completed:old.stages.flatMap(s=>s.lessons.map(l=>l.id)),notes:{},checks:{},examAnswers:{},examResults:{},practiceNotes:{},practiceChecks:{},lastLesson:'s6-l3',updatedAt:'2026-10-21T00:00:00+08:00'};
for(const s of old.stages){for(const l of s.lessons){oldRecord.notes[l.id]='保留旧笔记 '+l.id;oldRecord.checks[l.id]=l.checks.map(()=>true);}oldRecord.examAnswers[s.id]=s.exam.questions.map(q=>q.answer);oldRecord.examResults[s.id]={score:3};oldRecord.practiceNotes[s.id]='保留旧实操 '+s.id;oldRecord.practiceChecks[s.id]=s.exam.checks.map(()=>true);}
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{const ctx=await b.newContext({viewport:{width:1440,height:1000},acceptDownloads:true}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
await p.goto('http://127.0.0.1:4177/#home');
await p.locator('#importFile').setInputFiles({name:'old-v1-records.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(oldRecord))});
await p.waitForFunction(()=>document.querySelector('#sidebarProgress').textContent.includes('已记录 22'));
let exportEvent=p.waitForEvent('download');await p.locator('#exportBtn').click();let exported=JSON.parse(fs.readFileSync(await(await exportEvent).path(),'utf8'));
for(const key of Object.keys(oldRecord).filter(k=>k!=='updatedAt'))assert.deepEqual(exported[key],oldRecord[key],key+' changed during v1 import');
assert.match(await p.locator('#sidebarProgress').innerText(),/0 \/ 15/);
await p.goto('http://127.0.0.1:4177/#extensions');assert.equal(await p.locator('.stage-item').count(),8);assert.equal(await p.locator('.lesson-row').count(),24);assert.match(await p.locator('main').innerText(),/22 \/ 22/);
await p.goto('http://127.0.0.1:4177/#lesson/s6-l3');assert.equal(await p.locator('#lessonNote').inputValue(),'保留旧笔记 s6-l3');
await p.goto('http://127.0.0.1:4177/#exams/s6');assert.match(await p.locator('.quiz-result').innerText(),/3 \/ 3/);assert.equal(await p.locator('#practiceNote').inputValue(),'保留旧实操 s6');
await p.goto('http://127.0.0.1:4177/#lesson/core1-l1');for(const box of await p.locator('[data-lesson-check]').all())await box.check();await p.locator('[data-complete]').click();
await p.goto('http://127.0.0.1:4177/#home');assert.equal(await p.getByRole('button',{name:'继续下一课',exact:true}).getAttribute('data-route'),'lesson/core1-l2');
await p.goto('http://127.0.0.1:4177/#lesson/core1-l1');await p.locator('[data-lesson-check]').first().uncheck();assert.match(await p.locator('#sidebarProgress').innerText(),/0 \/ 15/);
await p.goto('http://127.0.0.1:4177/#exams/core3');for(const [i,q]of data.stages.find(s=>s.id==='core3').exam.questions.entries())await p.locator(`input[name=q${i}][value="${q.answer}"]`).check();await p.locator('#quizForm button[type=submit]').click();assert.match(await p.locator('.quiz-result').innerText(),/3 \/ 3/);assert.equal(await p.locator('#practiceStatus').innerText(),'待自查');assert.match(await p.locator('main').innerText(),/不自动授予能力等级或毕业/);
await p.evaluate(ids=>{const r=JSON.parse(localStorage.getItem('ai-project-studio-v1'));r.completed=[...r.completed,...ids];localStorage.setItem('ai-project-studio-v1',JSON.stringify(r));},core.map(l=>l.id));
await p.goto('http://127.0.0.1:4177/#home');await p.reload();assert.match(await p.locator('#sidebarProgress').innerText(),/15 \/ 15/);assert.equal(await p.getByRole('button',{name:'检查阶段挑战',exact:true}).getAttribute('data-route'),'exams/core6');
await p.goto('http://127.0.0.1:4177/#lesson/core6-l2');assert.equal(await p.getByRole('button',{name:'下一课',exact:true}).count(),0);assert.equal(await p.getByRole('button',{name:'前往阶段综合挑战'}).getAttribute('data-route'),'exams/core6');
await p.goto('http://127.0.0.1:4177/#lesson/core7-l2');assert.equal(await p.getByRole('button',{name:'下一课',exact:true}).count(),0);
const routes=['home','extensions','levels','project','project/agent','glossary','notes','resources',...data.stages.flatMap(s=>['exams/'+s.id,...s.lessons.map(l=>'lesson/'+l.id)])];
const routeTargets=new Set();for(const route of routes){await p.goto('http://127.0.0.1:4177/#'+route);for(const r of await p.locator('main [data-route]').evaluateAll(e=>e.map(x=>x.dataset.route)))routeTargets.add(r);}for(const r of routeTargets)assert(validRoute(r),'Broken internal route '+r);
const screens=await b.newContext({viewport:{width:1440,height:1000}}),screen=await screens.newPage();
for(const [file,route,width,height]of [['core-home-desktop.png','home',1440,1000],['core-home-mobile.png','home',390,844],['core-extensions-desktop.png','extensions',1440,1000],['core-extensions-mobile.png','extensions',390,844],['core-lesson-desktop.png','lesson/core1-l1',1440,1000],['core-lesson-mobile.png','lesson/core1-l1',390,844],['core-exam-desktop.png','exams/core3',1440,1000],['core-levels-mobile.png','levels',390,844]]){await screen.setViewportSize({width,height});await screen.goto('http://127.0.0.1:4177/#'+route);await screen.waitForFunction(()=>scrollY===0);await screen.screenshot({path:path.join(review,file)});}
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(review,'curriculum-verification.json'),JSON.stringify({passed:true,originalStagesPreserved:7,originalLessonsPreserved:22,oldKnowledgeSectionsPreserved:110,oldStateImportExportVerified:true,newCoreLessons:15,electiveLessons:2,uniqueIds:true,allInternalRoutesResolved:routeTargets.size,quizDoesNotCertifyPractice:true,coreCompletionExcludesElectives:true,lastCoreLessonStopsBeforeExtensions:true,errors},null,2));console.log('PASS: legacy v1 import/export, original courses, grouped progression, independent assessment and internal routes.');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
