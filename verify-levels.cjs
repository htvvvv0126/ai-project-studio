const {chromium}=require('C:/Users/Admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base='http://127.0.0.1:4177/#',review=path.join(__dirname,'.impeccable/review');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(base+'levels');const levels=await p.evaluate(()=>window.COURSE_DATA.levels);
  const stored=await p.evaluate(()=>[localStorage.getItem('ai-project-studio-v1'),localStorage.getItem('ai-project-studio-feedback-v1')]);
  for(let i=0;i<6;i++){
    const link=p.locator('.level-map-desktop .level-link').nth(i),popup=p.locator('#level-popup-desktop');
    await link.hover();await popup.waitFor({state:'visible'});assert.match(await popup.innerText(),new RegExp(levels[i].ability));assert((await popup.innerText()).includes(levels[i].artifact));assert((await popup.innerText()).includes(levels[i].verify));
    const box=await popup.boundingBox();assert(box.x>=0&&box.x+box.width<=1440);
    assert.deepEqual(await p.evaluate(()=>[localStorage.getItem('ai-project-studio-v1'),localStorage.getItem('ai-project-studio-feedback-v1')]),stored);
  }
  const first=p.locator('.level-map-desktop .level-link').first(),popup=p.locator('#level-popup-desktop');
  await first.hover();await popup.hover();await p.waitForTimeout(190);assert.equal(await popup.getAttribute('aria-hidden'),'false');
  await p.mouse.move(10,10);await p.waitForFunction(()=>document.querySelector('#level-popup-desktop').getAttribute('aria-hidden')==='true');
  await first.focus();await popup.waitFor({state:'visible'});await p.keyboard.press('Escape');assert.equal(await popup.getAttribute('aria-hidden'),'true');
  await p.keyboard.press('Tab');assert.equal(await p.locator('.level-map-desktop .level-link').nth(1).evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Enter');await p.waitForURL('**/#lesson/'+levels[1].lesson);
  for(let i=0;i<6;i++){await p.goto(base+'levels');await p.locator('.level-map-desktop .level-link').nth(i).click();await p.waitForURL('**/#lesson/'+levels[i].lesson);}
  await p.goto(base+'levels');await p.locator('.level-map-desktop .level-link').nth(5).hover();await popup.evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));await p.screenshot({path:path.join(review,'levels-hover-desktop.png')});
  const touchContext=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),touch=await touchContext.newPage();touch.on('pageerror',e=>errors.push(e.message));
  for(let i=0;i<6;i++){await touch.goto(base+'levels');await touch.locator('.level-map-mobile .level-link').nth(i).tap();await touch.waitForURL('**/#lesson/'+levels[i].lesson);}
  await p.setViewportSize({width:320,height:1000});await p.goto(base+'levels');
  for(let i=0;i<6;i++){await p.locator('.level-map-mobile .level-link').nth(i).focus();await p.locator('#level-popup-mobile').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));const b=await p.locator('#level-popup-mobile').boundingBox();assert(b.x>=0&&b.x+b.width<=320);assert(b.y>=0&&b.y+b.height<=1000);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  await p.setViewportSize({width:390,height:844});await p.locator('.level-map-mobile .level-link').nth(3).focus();await p.locator('#level-popup-mobile').evaluate(e=>Promise.all(e.getAnimations().map(a=>a.finished)));const mobileBox=await p.locator('#level-popup-mobile').boundingBox();assert(mobileBox.y>=0&&mobileBox.y+mobileBox.height<=844);assert.match(await p.locator('#level-popup-mobile').evaluate(e=>getComputedStyle(e).boxShadow),/rgba\(0, 0, 0,/);await p.screenshot({path:path.join(review,'levels-hover-mobile.png')});
  await p.emulateMedia({reducedMotion:'reduce'});await p.setViewportSize({width:1440,height:1000});await p.goto(base+'levels');await p.locator('.level-map-desktop .level-link').first().hover();assert.equal(await p.locator('.level-map-desktop .level-link .level-node').first().evaluate(e=>getComputedStyle(e).transform),'none');assert.equal(await p.locator('#level-popup-desktop').getAttribute('aria-hidden'),'false');
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(review,'levels-interaction-verification.json'),JSON.stringify({passed:true,hoverDetails:6,desktopCourseLinks:6,touchCourseLinks:6,keyboardFocusAndEnter:true,escapeDismissal:true,hoverableTooltip:true,allSixTooltipsWithin320px:true,hoverDoesNotChangeLearningRecords:true,reducedMotion:true,errors},null,2));
  console.log('PASS: six hover details, desktop/touch links, keyboard/Escape, hoverable popup, 320px edges and reduced motion.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
