import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';
import {writeFile,mkdir} from 'node:fs/promises';
const doc=await PDFDocument.create();const page=doc.addPage([595,760]);const serif=await doc.embedFont(StandardFonts.TimesRoman);const sans=await doc.embedFont(StandardFonts.Helvetica);const bold=await doc.embedFont(StandardFonts.HelveticaBold);
const green=rgb(.08,.27,.22),muted=rgb(.35,.42,.33);
page.drawRectangle({x:0,y:0,width:595,height:760,color:rgb(.995,.99,.97)});
function text(t,x,y,size=11,font=sans,color=green){page.drawText(t,{x,y,size,font,color});}
text('FIELD NOTES',46,699,10,bold);text('A small report.',46,650,34,serif);text('A surprisingly big difference.',46,615,24,serif);
page.drawLine({start:{x:46,y:586},end:{x:548,y:586},thickness:1,color:rgb(.7,.77,.65)});
// Deliberately interleave columns in PDF content order: a realistic extraction problem.
const left=['The workshop grew slowly.','Twelve independent makers came','together to build useful things.','Every small correction mattered.'];
const right=['Reading order is part of meaning.','A parser may jump between columns,','even when the page looks clear.','You can repair that order here.'];
left.forEach((line,i)=>{text(line,46,550-i*22);text(right[i],310,550-i*22);});
text('THE NUMBERS',46,405,10,bold);text('Revenue',46,365,12,bold);text('Refunds',242,365,12,bold);text('Net result',424,365,12,bold);
text('$12,500',242,328,21,serif);text('$2,100',46,328,21,serif);text('-$10,400',424,328,21,serif);
text('Attach a column label before exporting these values.',46,280,10,sans,muted);
text('REPAIR NOTES',46,215,10,bold);text('1. Move related column lines together.',46,181);text('2. Label $2,100 as Revenue, as printed above it.',46,159);text('3. Label $12,500 as Refunds. The negative result is intentional.',46,137);
text('The net result is negative. Preserve its sign in your AI input.',46,104,10,sans,muted);
text('UFODIA / PAPER SURGERY',46,47,8,bold,muted);text('01',525,47,8,bold,muted);
await mkdir('public',{recursive:true});await writeFile('public/sample.pdf',await doc.save());
