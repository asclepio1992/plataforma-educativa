const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process');
test('acceso exclusivo, alumnos autorizados, respuestas privadas en vivo, recuperación, PDF y persistencia',async()=>{
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'aula-test-'));let child,base,teacherCookie,studentCookie,reader;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:__dirname,env:{...process.env,PORT:'0',AULA_DATA_DIR:data},stdio:['ignore','pipe','pipe']});const output=await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',code=>reject(Error('Servidor terminó: '+code)));});base=`http://127.0.0.1:${output.toString().match(/localhost:(\d+)/)[1]}`;}
 async function stop(){if(reader){await reader.cancel();reader=null;}await new Promise(resolve=>{child.once('exit',resolve);child.kill();});}
 async function request(route,method='GET',data,cookie){return fetch(base+route,{method,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(data?{body:JSON.stringify(data)}:{})});}
 try{
  await start();assert.equal((await request('/api/rooms','POST')).status,401);assert.equal((await request('/data/classes.json')).status,404);assert.equal((await request('/server.js')).status,404);
  assert.equal((await request('/api/login','POST',{password:'incorrecta'})).status,401);
  const login=await request('/api/login','POST',{password:'36vkm610k'});assert.equal(login.status,200);teacherCookie=login.headers.get('set-cookie').split(';')[0];
  const room=await (await request('/api/rooms','POST',{},teacherCookie)).json();const route=`/api/rooms/${room.id}`;
  assert.equal((await request(route)).status,401);assert.equal((await request(route+'?view=teacher')).status,401);
  const slides=[{...room.slides[0]},{id:'quiz-uno',type:'quiz',title:'¿Cuánto es 2 + 2?',body:'Escoge una opción',image:'',options:['3','4','5'],correct:1}];
  const updated=await (await request(route+'?view=teacher','PUT',{slides,index:1,roster:[{name:'Ana Pérez'},{name:'Luis Gómez'}]},teacherCookie)).json();assert.equal(updated.roster.length,2);
  assert.equal((await request(route+'/join','POST',{studentId:'no-autorizado'})).status,403);
  const joined=await request(route+'/join','POST',{studentId:updated.roster[0].id});studentCookie=joined.headers.get('set-cookie').split(';')[0];const student=await joined.json();assert.ok(student.recovery);assert.equal(student.slides[1].correct,undefined);assert.equal(student.roster,undefined);
  const stream=await request(route+'/events?view=teacher','GET',null,teacherCookie);reader=stream.body.getReader();await reader.read();
  assert.equal((await request(route+'/answers','POST',{slideId:'quiz-uno',choice:1})).status,401);
  const response=await request(route+'/answers','POST',{slideId:'quiz-uno',choice:1},studentCookie);assert.equal(response.status,200);
  const next=new TextDecoder().decode((await reader.read()).value);assert.match(next,/"choice":1/);assert.match(next,/Ana Pérez/);
  assert.equal((await request(route+'?view=teacher','PUT',{index:0},studentCookie)).status,403);
  assert.equal((await request(route+'/certificate','GET',null,studentCookie)).status,400);
  const moved=await (await request(route+'?view=teacher','PUT',{slides:[slides[1],slides[0]],index:0},teacherCookie)).json();assert.equal(moved.results['quiz-uno'][student.student.id].choice,1);
  const changed=structuredClone(moved.slides);changed[0].options[0]='Otra';assert.equal((await request(route+'?view=teacher','PUT',{slides:changed},teacherCookie)).status,400);
  const secondJoin=await request(route+'/join','POST',{studentId:updated.roster[1].id});const secondCookie=secondJoin.headers.get('set-cookie').split(';')[0];const second=await (await request(route,'GET',null,secondCookie)).json();assert.deepEqual(second.answers,{});assert.equal(second.results,undefined);
  assert.equal((await request(route+'/join','POST',{studentId:student.student.id,recovery:'incorrecta'})).status,403);
  const recovered=await request(route+'/join','POST',{studentId:student.student.id,recovery:student.recovery});studentCookie=recovered.headers.get('set-cookie').split(';')[0];assert.equal((await recovered.json()).answers['quiz-uno'].choice,1);
  await request(route+'?view=teacher','PUT',{finished:true},teacherCookie);
  assert.equal((await request(route+'/answers','POST',{slideId:'quiz-uno',choice:0},studentCookie)).status,400);
  const pdfResponse=await request(route+'/certificate','GET',null,studentCookie);assert.equal(pdfResponse.headers.get('content-type'),'application/pdf');const pdf=Buffer.from(await pdfResponse.arrayBuffer());assert.equal(pdf.subarray(0,4).toString(),'%PDF');
  fs.mkdirSync(path.join(__dirname,'tmp','pdfs'),{recursive:true});fs.writeFileSync(path.join(__dirname,'tmp','pdfs','comprobante-prueba.pdf'),pdf);
  await stop();await start();const restored=await (await request(route,'GET',null,studentCookie)).json();assert.equal(restored.answers['quiz-uno'].choice,1);assert.equal(restored.finished,true);assert.equal((await request('/api/rooms','GET',null,teacherCookie)).status,200);
  await request(route+'/reset?view=teacher','POST',{studentId:student.student.id},teacherCookie);assert.equal((await request(route,'GET',null,studentCookie)).status,401);const reset=await (await request(route+'/join','POST',{studentId:student.student.id})).json();assert.equal(reset.answers['quiz-uno'].choice,1);
  await request('/api/logout','POST',{},teacherCookie);assert.equal((await request('/api/rooms','GET',null,teacherCookie)).status,401);
 }finally{if(child&&!child.killed)await stop();fs.rmSync(data,{recursive:true,force:true});}
});
