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

test('a failed local PDF read reports the error and allows the next document',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await page.evaluate(()=>{const read=File.prototype.arrayBuffer;File.prototype.arrayBuffer=function(){return this.name==='unreadable.pdf'?Promise.reject(new Error('Disk read interrupted.')):read.call(this);};});
  await page.locator('#pdf-input').setInputFiles({name:'unreadable.pdf',mimeType:'application/pdf',buffer:Buffer.from('unreadable')});
  await expect(page.locator('#status')).toHaveText('Disk read interrupted.');
  await expect(page.locator('#status')).toHaveClass(/error/);
  await expect(page.locator('#pdf-input')).toBeEnabled();
  await page.locator('#sample').click();
  await expect(page.locator('.block')).toHaveCount(26);
  expect(errors).toEqual([]);
});

test('reordering updates the reading and preview, preserves the original, and retains focus',async({page})=>{
  await page.goto('/');
  await page.locator('#sample').click();
  await expect(page.locator('.block')).toHaveCount(26);
  await expect(page.locator('.repair-tip')).toContainText('original PDF stays unchanged');
  await page.getByText('Preview corrected Markdown').click();
  const first=page.locator('.block').first();
  const second=page.locator('.block').nth(1);
  const firstId=await first.getAttribute('data-block');
  const firstText=await first.locator('textarea').inputValue();
  const secondText=await second.locator('textarea').inputValue();
  const initialPreview=await page.locator('#preview').textContent();
  const marker=page.locator(`.marker[data-block="${firstId}"]`);
  const markerStyle=await marker.getAttribute('style');
  await expect(first.getByRole('button',{name:'Move block 1 up'})).toBeDisabled();
  await first.getByRole('button',{name:'Move block 1 down'}).click();
  await expect(page.locator('.block').first().locator('textarea')).toHaveValue(secondText);
  await expect(page.locator('.block').nth(1).locator('textarea')).toHaveValue(firstText);
  await expect(page.getByRole('button',{name:'Move block 2 down'})).toBeFocused();
  await expect(page.locator('#move-status')).toHaveText('Block moved to position 2 of 26 on page 1.');
  await expect(marker).toHaveAttribute('style',markerStyle);
  expect(await page.locator('#preview').textContent()).not.toBe(initialPreview);
  await page.getByRole('button',{name:'Move block 2 up'}).click();
  await expect(page.locator('.block').first().locator('textarea')).toHaveValue(firstText);
  await expect(page.locator('#preview')).toHaveText(initialPreview);
  await expect(page.getByRole('button',{name:'Move block 1 down'})).toBeFocused();
  await expect(page.locator('#move-status')).toHaveText('Block moved to position 1 of 26 on page 1.');
});


test('keyboard file input focus is visible on the full-size upload label',async({page})=>{
  await page.goto('/');
  for(let i=0;i<12&&!(await page.locator('#pdf-input').evaluate(e=>e===document.activeElement));i++)await page.keyboard.press('Tab');
  await expect(page.locator('#pdf-input')).toBeFocused();
  const indicator=await page.locator('label[for="pdf-input"]').evaluate(e=>({width:e.getBoundingClientRect().width,outline:getComputedStyle(e).outlineStyle,thickness:parseFloat(getComputedStyle(e).outlineWidth)}));
  expect(indicator.width).toBeGreaterThan(80);expect(indicator.outline).toBe('solid');expect(indicator.thickness).toBeGreaterThanOrEqual(2);
});
