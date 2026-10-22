import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('./dist/', import.meta.url);
const [template, css, data, core, support, app, brandIcon] = await Promise.all(['index.template.html','styles.css','course-data.js','core-course.js','learning-support.js','app.js','assets/brand/ai-project-studio-icon.svg'].map(f=>readFile(new URL(f,root),'utf8')));
const inline = text => text.replace(/<\/script/gi,'<\\/script');
const html = template.replaceAll('<!-- BRAND_ICON -->',`data:image/svg+xml;base64,${Buffer.from(brandIcon).toString('base64')}`).replace('<!-- APP_STYLES -->',`<style>\n${css}\n</style>`).replace('<!-- COURSE_DATA -->',`<script>\n${inline(data)}\n</script>`).replace('<!-- CORE_COURSE -->',`<script>\n${inline(core)}\n</script>`).replace('<!-- LEARNING_SUPPORT -->',`<script>\n${inline(support)}\n</script>`).replace('<!-- APP_SCRIPT -->',`<script>\n${inline(app)}\n</script>`);
if (/<!-- (BRAND_ICON|APP_STYLES|COURSE_DATA|CORE_COURSE|LEARNING_SUPPORT|APP_SCRIPT) -->/.test(html)) throw Error('Unfilled template slot');
await writeFile(new URL('index.html',root),html,'utf8');
console.log('Built single-file dist/index.html');
