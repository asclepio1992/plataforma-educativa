const {test}=require('node:test');
const assert=require('node:assert/strict');
function fixture(){
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 400] /Resources << >> /Contents 4 0 R >>','<< /Length 27 >>\nstream\n0 0.5 0 rg 20 20 80 80 re f\nendstream'];
 let text='%PDF-1.4\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(Buffer.byteLength(text));text+=`${i+1} 0 obj\n${o}\nendobj\n`;});const xref=Buffer.byteLength(text);text+='xref\n0 5\n0000000000 65535 f \n'+offsets.slice(1).map(o=>`${String(o).padStart(10,'0')} 00000 n \n`).join('')+`trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new File([text],'clase.pdf',{type:'application/pdf'});
}
test('importa un PDF real y rechaza límites sin publicar páginas parciales',async()=>{
 const canvas=require('@napi-rs/canvas');
 global.DOMMatrix=canvas.DOMMatrix;global.Path2D=canvas.Path2D;global.ImageData=canvas.ImageData;
 global.document={createElement:()=>canvas.createCanvas(1,1)};
 const pdfjs=await import('./node_modules/pdfjs-dist/legacy/build/pdf.mjs');
 // En Node el worker usa una ruta de archivo; el navegador utiliza la ruta HTTP.
 const library={...pdfjs,GlobalWorkerOptions:{}};
 const {pdfToSlides}=await import('./public/pdf-import.js');
 const progress=[];
 const slides=await pdfToSlides(fixture(),{loadLibrary:async()=>library,onProgress:(n,total)=>progress.push([n,total])});
 assert.equal(slides.length,1);assert.equal(slides[0].title,'clase · 1');assert.match(slides[0].image,/^data:image\/jpeg;base64,/);assert.deepEqual(progress,[[1,1]]);
 const image=await canvas.loadImage(slides[0].image);assert.equal(image.width,1200);assert.equal(image.height,800);
 await assert.rejects(pdfToSlides(fixture(),{maxPages:0}),/Solo hay espacio/);
 await assert.rejects(pdfToSlides(new File(['dañado'],'malo.pdf')),/no es un PDF válido/);
 delete global.document;
});
