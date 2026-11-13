import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

async function getDownload(page,button){
  const wait=page.waitForEvent('download');
  await button.click();
  const download=await wait;
  return {download,content:await readFile(await download.path(),'utf8')};
}

test('local workbench: analysis, evidence, export and responsive layout',async({page},testInfo)=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const done=[];
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang','en');
      await page.locator('#sample').click();await expect(page.locator('#status')).toContainText('26 text blocks');await expect(page.locator('.block')).toHaveCount(26);
      const first=page.locator('.block').first();const initial=await first.locator('textarea').inputValue();await first.locator('button[aria-label$="down"]').click();await expect(page.locator('.block').nth(1).locator('textarea')).toHaveValue(initial);
      const target=page.locator('.block').filter({has:page.locator('textarea')}).nth(1);await target.locator('input').fill('Field label');
      const patch=await getDownload(page,page.locator('#patch'));const parsed=JSON.parse(patch.content);expect(parsed.blocks[1].label).toBe('Field label');
      const markdown=await getDownload(page,page.locator('#markdown'));expect(markdown.content).toContain('**Field label:**');
      await page.locator('#patch-input').setInputFiles({name:'wrong.repair.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...parsed,documentSha256:'wrong'}))});await expect(page.locator('#status')).toContainText('different PDF');
      await page.locator('#patch-input').setInputFiles({name:'right.repair.json',mimeType:'application/json',buffer:Buffer.from(patch.content)});await expect(page.locator('#status')).toContainText('fingerprint matches');
      done.push('Real PDF decode/render (26 blocks)','Reorder/edit/export Markdown','Repair roundtrip and wrong-source rejection');
  await page.screenshot({path:testInfo.outputPath('desktop.png'),fullPage:false});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:testInfo.outputPath('mobile.png'),fullPage:false});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1)).toBe(false);
  expect(errors).toEqual([]);
});
