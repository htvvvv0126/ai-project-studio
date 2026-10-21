import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('./dist/', import.meta.url);
const [template, css, data, core, support, app] = await Promise.all(['index.template.html','styles.css','course-data.js','core-course.js','learning-support.js','app.js'].map(f=>readFile(new URL(f,root),'utf8')));
const inline = text => text.replace(/<\/script/gi,'<\\/script');
const html = template.replace('<!-- APP_STYLES -->',`<style>\n${css}\n</style>`).replace('<!-- COURSE_DATA -->',`<script>\n${inline(data)}\n</script>`).replace('<!-- CORE_COURSE -->',`<script>\n${inline(core)}\n</script>`).replace('<!-- LEARNING_SUPPORT -->',`<script>\n${inline(support)}\n</script>`).replace('<!-- APP_SCRIPT -->',`<script>\n${inline(app)}\n</script>`);
if (/<!-- (APP_STYLES|COURSE_DATA|CORE_COURSE|LEARNING_SUPPORT|APP_SCRIPT) -->/.test(html)) throw Error('Unfilled template slot');
await writeFile(new URL('index.html',root),html,'utf8');
console.log('Built single-file dist/index.html');
