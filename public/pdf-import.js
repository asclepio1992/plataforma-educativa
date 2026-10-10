let library;
export async function pdfToSlides(file, {maxPages=100, onProgress=()=>{}, loadLibrary=()=>import('/pdfjs/build/pdf.mjs')}={}) {
  if (file.size > 25*1024*1024) throw Error('El PDF supera 25 MB.');
  library ||= loadLibrary();
  const pdfjs = await library;
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/build/pdf.worker.mjs';
  const task = pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer()),cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/',wasmUrl:'/pdfjs/wasm/'});
  try {
    const pdf=await task.promise;
    if (pdf.numPages>maxPages) throw Error(`Solo hay espacio para ${maxPages} páginas. El PDF tiene ${pdf.numPages}.`);
    const slides=[];
    let bytes=0;
    for(let n=1;n<=pdf.numPages;n++) {
      onProgress(n,pdf.numPages);
      const page=await pdf.getPage(n);
      const natural=page.getViewport({scale:1});
      const viewport=page.getViewport({scale:Math.min(2,1920/Math.max(natural.width,natural.height))});
      const canvas=document.createElement('canvas');
      canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);
      await page.render({canvasContext:canvas.getContext('2d'),viewport,background:'rgb(255,255,255)'}).promise;
      const image=canvas.toDataURL('image/jpeg',0.85);
      bytes+=image.length;
      if(bytes>23*1024*1024) throw Error('Las páginas convertidas superan 23 MB. Divide el PDF en presentaciones más pequeñas.');
      slides.push({title:`${file.name.replace(/\.pdf$/i,'')} · ${n}`,body:'',image});
      page.cleanup();canvas.width=canvas.height=0;
    }
    return slides;
  } catch(e) {
    if(e.name==='PasswordException') throw Error('El PDF tiene contraseña. Guarda una copia sin contraseña para importarla.');
    if(e.name==='InvalidPDFException') throw Error('El archivo no es un PDF válido o está dañado.');
    throw e;
  } finally {await task.destroy();}
}
