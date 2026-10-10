const crypto=require('node:crypto');
const {completion,requiredActivities,beginClosing}=require('./class-lifecycle');
const {types,rubric,publicEvidence,publicSlides}=require('./academic');
const defaults={studentPinRequired:false,requiredEvidenceCount:0,checkoutEnabled:false,checkoutPinRequired:true,quizFeedback:true,clockTeacher:"always",clockStudent:"always",clockInterval:60,clockDuration:10,alertMinutes:[10,5],alertDuration:8,guestEnabled:false,lateTolerance:5,focusEnabled:true,focusGrace:10,focusPenalty:1,allowDownloads:true,scheduledStart:null,lockFuture:true,requireFullscreen:false,uploadDeadline:null,exitAt:null,minimumAttendance:80,classEnd:null};
const settings=r=>({...defaults,...r.settings});
function participation(r,s,now=Date.now()){
 const policy=settings(r),start=policy.scheduledStart||r.startedAt;
 const joined=s.joinedAt?Date.parse(s.joinedAt):null;
 let present=joined!==null&&(!r.finishedAt||joined<=Date.parse(r.finishedAt))&&(!r.attendanceLockedAt||joined<=Date.parse(r.attendanceLockedAt));
 const minutes=start&&joined?Math.max(0,(joined-Date.parse(start))/60000):0;
 const events=s.focusEvents||[];const penalty=events.reduce((n,e)=>n+(e.penalized&&!e.exempt?e.points:0),0);
 let late=present&&minutes>policy.lateTolerance;const status=s.attendanceStatus||(!present?'absent':late?'late':'present');if(s.attendanceStatus){present=!['absent','absent-excused'].includes(status);late=['late','late-excused'].includes(status);}return {present,status,joinedAt:s.joinedAt||null,late,lateMinutes:Math.ceil(minutes),focusLosses:events.filter(e=>e.penalized&&!e.exempt).length,penalty,score:present?Math.max(0,100-penalty):0,away:!!s.focusAwayAt,start:start||null,manual:!!s.attendanceStatus};
}
function settleFocus(r,s,now=Date.now()){
 if(!s.focusAwayAt)return;
 const seconds=Math.max(0,(now-Date.parse(s.focusAwayAt))/1000),policy=settings(r);
 s.focusEvents||=[];s.focusEvents.push({id:crypto.randomUUID(),at:s.focusAwayAt,backAt:new Date(now).toISOString(),seconds:Math.round(seconds),penalized:policy.focusEnabled&&seconds>=policy.focusGrace,points:policy.focusPenalty,exempt:false});delete s.focusAwayAt;
}
function validateSettings(input,fail){if(!input||typeof input!=='object'||Array.isArray(input))fail('Configuración inválida.');const out={};for(const [key,min,max] of [['requiredEvidenceCount',0,5],['lateTolerance',0,120],['focusGrace',1,300],['focusPenalty',0,20],['minimumAttendance',0,100],['clockInterval',15,600],['clockDuration',3,60],['alertDuration',3,60]])if(input[key]!==undefined){if(!Number.isInteger(input[key])||input[key]<min||input[key]>max)fail('Revisa los valores de asistencia y participación.');out[key]=input[key];}
 for(const key of ['studentPinRequired','checkoutEnabled','checkoutPinRequired','quizFeedback','guestEnabled','focusEnabled','allowDownloads','lockFuture','requireFullscreen'])if(input[key]!==undefined){if(typeof input[key]!=='boolean')fail('Configuración inválida.');out[key]=input[key];}
 for(const key of ['scheduledStart','uploadDeadline','exitAt','classEnd'])if(input[key]!==undefined){if(input[key]!==null&&(typeof input[key]!=='string'||!Number.isFinite(Date.parse(input[key]))))fail('Hora inválida.');out[key]=input[key];}for(const key of ['clockTeacher','clockStudent'])if(input[key]!==undefined){if(!['always','hidden','intermittent'].includes(input[key]))fail('Modo de reloj inválido.');out[key]=input[key];}if(input.alertMinutes!==undefined){if(!Array.isArray(input.alertMinutes)||input.alertMinutes.length>6||input.alertMinutes.some(n=>!Number.isInteger(n)||n<1||n>120))fail('Configura hasta 6 avisos entre 1 y 120 minutos.');out.alertMinutes=[...new Set(input.alertMinutes)].sort((a,b)=>b-a);}return out;
}
async function handleFeature({r,req,res,action,isTeacher,s,body,send,fail,persist,broadcast,snapshot,pdf,saveFile}){
 const teacherOnly=()=>{if(!isTeacher)fail('Esta función es exclusiva del profesor.',403);};const studentOnly=()=>{if(!s||isTeacher)fail('Esta función es exclusiva del alumno.',403);};
  const done=(save=true)=>{if(save)persist();broadcast(r);send(res,200,action==='annotations'?{ok:true}:snapshot(r,s,isTeacher));return true;};
 if(action==='close'&&req.method==='POST'){teacherOnly();if(r.finished)fail('Reabre la clase antes de iniciar su cierre.');const data=await body(req,4096);if(typeof data.reason!=='string'||!data.reason.trim()||data.reason.length>500)fail('Indica el motivo del cierre (máximo 500 caracteres).');if(data.interrupted!==undefined&&typeof data.interrupted!=='boolean')fail('Tipo de cierre inválido.');beginClosing(r,data.reason.trim(),data.interrupted);for(const student of r.roster)settleFocus(r,student);return done();}
 if(action==='checkout-code'&&req.method==='POST'){teacherOnly();if(!settings(r).checkoutEnabled||!r.closing&&(!settings(r).classEnd||Date.now()<Date.parse(settings(r).classEnd)))fail('El checador abre a la hora de salida configurada.',409);r.checkoutCode=String(crypto.randomInt(100000,1000000));r.checkoutCodeAt=new Date().toISOString();return done();}
 if(action==='checkout'){
  if(req.method==='PUT'){teacherOnly();const data=await body(req,4096),student=r.roster.find(x=>x.id===data.studentId&&x.active);if(!student?.joinedAt)fail('Alumno sin ingreso registrado.');if(typeof data.reason!=='string'||!data.reason.trim()||data.reason.length>500)fail('Indica el motivo de la excepción (máximo 500 caracteres).');if(student.checkoutAt)fail('La salida ya fue registrada.');student.checkoutAt=new Date().toISOString();student.checkoutException=data.reason.trim();student.checkoutByTeacher=true;return done();}
  if(req.method==='POST'){studentOnly();if(s.checkoutAt)return done(false);const policy=settings(r);if(!policy.checkoutEnabled||!r.closing&&(!policy.classEnd||Date.now()<Date.parse(policy.classEnd)))fail('Espera la hora oficial de salida para registrar tu checada.',409);const data=await body(req,4096);if(policy.checkoutPinRequired){if((s.checkoutBlockedUntil||0)>Date.now())fail('Demasiados intentos de código. Espera 5 minutos.',429);if(!r.checkoutCode||String(data.code||'')!==r.checkoutCode){s.checkoutFailures=(s.checkoutFailures||0)+1;if(s.checkoutFailures>=8){s.checkoutBlockedUntil=Date.now()+300000;s.checkoutFailures=0;}fail('Escribe el código de salida que muestra tu profesor.',403);}delete s.checkoutFailures;delete s.checkoutBlockedUntil;}if((r.closing?requiredActivities(r):r.slides.filter(x=>x.exitTicket)).some(x=>!r.answers[x.id]?.[s.id])||completion(r,s).missingEvidence||completion(r,s).pendingReview)fail('Completa primero tu ticket de salida.',409);s.checkoutAt=new Date().toISOString();return done();}
 }
 if(action==='timer'&&req.method==='POST'){
  teacherOnly();const data=await body(req,4096);r.timer||={elapsed:0,runningSince:null};const t=r.timer;
  if(data.action==='start'){if(r.finished)fail('Reabre la clase antes de iniciar el reloj.');r.startedAt||=new Date().toISOString();t.runningSince||=Date.now();}
  else if(data.action==='pause'){if(t.runningSince)t.elapsed+=Date.now()-t.runningSince;t.runningSince=null;}
  else if(data.action==='reset'){t.elapsed=0;t.runningSince=null;}
  else fail('Acción de reloj inválida.');return done();
 }
 if(action==='poll'&&req.method==='POST'){
  teacherOnly();const data=await body(req,4096);const slide=r.slides[r.index];if(slide.type!=='quiz')fail('Selecciona una pregunta.');
  if(data.action==='open'){const seconds=Number(data.seconds||0);if(!Number.isInteger(seconds)||seconds<0||seconds>3600)fail('Duración inválida.');r.poll={slideId:slide.id,openedAt:Date.now(),deadline:seconds?Date.now()+seconds*1000:null,closed:false};}else if(data.action==='close'){r.poll={...(r.poll||{}),slideId:slide.id,closed:true};}else fail('Acción inválida.');return done();
 }
 if(action==='exit'&&req.method==='POST'){
  teacherOnly();const index=r.slides.findIndex(x=>x.exitTicket);if(index<0)fail('Marca entre 1 y 3 preguntas como boleto de salida.');r.index=index;r.revealedIds||=[];r.revealedIds.push(r.slides[index].id);r.deckRevision=(r.deckRevision||0)+1;r.exitLaunched=true;r.poll=null;return done();
 }
 if(action==='pulse'&&req.method==='POST'){
  studentOnly();const data=await body(req,4096);if(!['clear','confused','repeat'].includes(data.value)||r.finished)fail('Retroalimentación no disponible.');s.pulse=data.value;return done();
 }
 if(action==='annotations'&&req.method==='PUT'){
  teacherOnly();const data=await body(req,300000);if(data.clear){r.annotations=[];r.pointer=null;}else if(data.pointer!==undefined){if(data.pointer!==null&&(!Number.isFinite(data.pointer.x)||!Number.isFinite(data.pointer.y)||data.pointer.x<0||data.pointer.x>1||data.pointer.y<0||data.pointer.y>1))fail('Puntero inválido.');r.pointer=data.pointer?{x:data.pointer.x,y:data.pointer.y,slideId:r.slides[r.index].id}:null;}else if(data.stroke){const st=data.stroke;if(!Array.isArray(st.points)||st.points.length<2||st.points.length>500||st.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.x>1||p.y<0||p.y>1))fail('Trazo inválido.');r.annotations||=[];if(r.annotations.length>=200)fail('Borra las anotaciones antes de añadir más.');r.annotations.push({id:crypto.randomUUID(),slideId:r.slides[r.index].id,color:['#56a5ff','#ffcc66','#ff708a'].includes(st.color)?st.color:'#ffcc66',points:st.points.map(p=>({x:p.x,y:p.y}))});}else fail('Anotación inválida.');return done(!!data.clear||data.pointer===undefined);
 }
 if(action==='media'&&req.method==='POST'){
  teacherOnly();const data=await body(req,4096);const slide=r.slides[r.index];if(!slide.video||!Number.isFinite(data.time)||data.time<0||data.time>86400||typeof data.playing!=='boolean')fail('Control de video inválido.');r.media={slideId:slide.id,time:data.time,playing:data.playing,updatedAt:Date.now()};return done();
 }
 if(action==='attendance-edit'&&req.method==='POST'){
  teacherOnly();const data=await body(req,4096);if(data.lock!==undefined){if(typeof data.lock!=='boolean')fail('Estado inválido.');r.attendanceLocked=data.lock;r.attendanceLockedAt=data.lock?new Date().toISOString():null;return done();}if(r.attendanceLocked)fail('Desbloquea el registro de asistencia para editarlo.');const student=r.roster.find(x=>x.id===data.studentId);if(!student||!['auto','present','late','late-excused','absent','absent-excused'].includes(data.status))fail('Asistencia inválida.');student.attendanceStatus=data.status==='auto'?null:data.status;return done();
 }
 if(action==='incidents'&&req.method==='POST'){
  teacherOnly();const data=await body(req,4096);if(!r.roster.some(x=>x.id===data.studentId)||!types.includes(data.type)||typeof data.note!=='string'||data.note.length>1000)fail('Incidencia inválida.');r.incidents||=[];if(r.incidents.length>=2000)fail('Límite de incidencias alcanzado.');r.incidents.push({id:crypto.randomUUID(),studentId:data.studentId,type:data.type,note:data.note,at:new Date().toISOString(),slideIndex:r.index,topic:r.slides[r.index].title});return done();
 }
 if(action==='rubric'&&req.method==='PUT'){
  teacherOnly();const data=await body(req,4096);if(!Array.isArray(data.items)||!data.items.length||data.items.length>6||data.items.some(x=>typeof x.name!=='string'||!x.name.trim()||x.name.length>120||!Number.isInteger(x.max)||x.max<1||x.max>100)||data.items.reduce((n,x)=>n+x.max,0)>100)fail('Rúbrica inválida (hasta 6 criterios, máximo 100 puntos).');r.rubric=data.items.map(x=>({name:x.name,max:x.max}));return done();
 }
 if(action==='evidence'&&req.method==='POST'){
  studentOnly();const data=await body(req,12*1024*1024);if(!['work','justification'].includes(data.kind))fail('Tipo inválido.');const deadline=s.extensionUntil||settings(r).uploadDeadline;const late=!!deadline&&Date.now()>Date.parse(deadline);if(data.kind==='work'&&(r.finished||late))fail('El plazo de entrega cerró. Puedes enviar un justificante y solicitar una excepción.',409);r.evidence||=[];if(r.evidence.filter(e=>e.studentId===s.id).length>=30)fail('Límite de entregas alcanzado.');const saved=saveFile(data,fail);r.evidence.push({...saved,id:crypto.randomUUID(),studentId:s.id,kind:data.kind,at:new Date().toISOString(),late,justified:!!s.extensionUntil});if(r.closing&&!settings(r).checkoutEnabled&&!completion(r,s).missingIds.length&&!completion(r,s).missingEvidence&&!completion(r,s).pendingReview)s.checkoutAt||=new Date().toISOString();return done();
 }
 if(action==='grade'&&req.method==='PUT'){
  teacherOnly();const data=await body(req,4096);const evidence=r.evidence?.find(e=>e.id===data.id&&e.kind==='work');const items=r.rubric||rubric;if(!evidence||!Array.isArray(data.scores)||data.scores.length!==items.length||data.scores.some((n,i)=>!Number.isFinite(n)||n<0||n>items[i].max)||typeof data.feedback!=='string'||data.feedback.length>2000)fail('Calificación inválida.');evidence.grade={items,scores:data.scores,score:data.scores.reduce((n,v)=>n+v,0),max:items.reduce((n,v)=>n+v.max,0),feedback:data.feedback,at:new Date().toISOString()};return done();
 }
 if(action==='exception'&&req.method==='POST'){
  teacherOnly();const data=await body(req,4096);const student=r.roster.find(x=>x.id===data.studentId);if(!student||!r.evidence?.some(e=>e.studentId===student.id&&e.kind==='justification')||typeof data.until!=='string'||!Number.isFinite(Date.parse(data.until))||Date.parse(data.until)<=Date.now())fail('Se necesita un justificante y un nuevo plazo válido.');student.extensionUntil=data.until;return done();
 }
 if(action==='report'&&req.method==='GET'){
  teacherOnly();res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="informe-${r.id}.pdf"`});pdf.reportPDF(r).pipe(res);return true;
 }
 if(action==='focus'&&req.method==='POST'){
  studentOnly();const data=await body(req,4096);if(!['away','back'].includes(data.event))fail('Evento inválido.');
  const policy=settings(r);if(r.finished||r.closing||s.checkoutAt||!r.startedAt||!policy.focusEnabled)return send(res,200,snapshot(r,s,false)),true;
  if(data.event==='away'){if(!s.focusAwayAt)s.focusAwayAt=new Date().toISOString();}else settleFocus(r,s);return done();
 }
 if(action==='focus-review'&&req.method==='POST'){
  teacherOnly();const data=await body(req,4096);const student=r.roster.find(x=>x.id===data.studentId);const event=student?.focusEvents?.find(e=>e.id===data.eventId);if(!event||typeof data.exempt!=='boolean')fail('Registro inválido.');event.exempt=data.exempt;return done();
 }
 if(action==='notes'&&req.method==='PUT'){
  studentOnly();const data=await body(req,16000);if(typeof data.text!=='string'||data.text.length>10000||!r.slides.some(x=>x.id===data.slideId))fail('Nota inválida.');s.notes||={};s.notes[data.slideId]=data.text;persist();send(res,200,{ok:true,slideId:data.slideId});return true;
 }
 if(action==='preferences'&&req.method==='PUT'){
  studentOnly();const data=await body(req,4096);if(!['navy','midnight','light'].includes(data.theme))fail('Tema inválido.');s.theme=data.theme;return done();
 }
 if(action==='questions'){
  if(req.method==='POST'){studentOnly();if(r.finished)fail('Esta clase ya finalizó.');const data=await body(req,4096);if(typeof data.text!=='string'||!data.text.trim()||data.text.length>1000||typeof data.anonymous!=='boolean')fail('Escribe una pregunta de hasta 1000 caracteres.');r.questions||=[];const own=r.questions.filter(q=>q.studentId===s.id);if(own.length>=100||r.questions.length>=1000)fail('Se alcanzó el límite de preguntas.');if(own.length&&Date.now()-Date.parse(own.at(-1).at)<5000)fail('Espera unos segundos antes de enviar otra pregunta.');r.questions.push({id:crypto.randomUUID(),studentId:s.id,text:data.text.trim(),anonymous:data.anonymous,at:new Date().toISOString(),resolved:false});return done();}
  if(req.method==='PUT'){teacherOnly();const data=await body(req,4096);const question=r.questions?.find(q=>q.id===data.id);if(!question)fail('Pregunta no encontrada.');if(data.project!==undefined){if(typeof data.project!=='boolean')fail('Acción inválida.');r.projectedQuestionId=data.project?question.id:null;}if(data.resolved!==undefined){if(typeof data.resolved!=='boolean')fail('Acción inválida.');question.resolved=data.resolved;if(data.resolved&&r.projectedQuestionId===question.id)r.projectedQuestionId=null;}return done();}
 }
 if(action==='certificates'&&req.method==='GET'){
  teacherOnly();if(!r.finished&&!r.closing)fail('Inicia el cierre para generar los comprobantes del grupo.');const active=r.roster.filter(s=>s.active&&completion(r,s).ready);if(!active.length)fail('No hay alumnos elegibles para comprobantes. Revisa la lista y los registros de salida.');res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="comprobantes-${r.id}.pdf"`,'Cache-Control':'no-store'});const {issueReceipt}=require('./studio-services');const urls=active.map(s=>issueReceipt(r,s,require('./server').studio,req));persist();pdf.groupCertificates(r,active,urls).pipe(res);return true;
 }
 if(action==='attendance'&&req.method==='GET'){
  teacherOnly();res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="asistencia-${r.id}.pdf"`,'Cache-Control':'no-store'});pdf.attendancePDF(r).pipe(res);return true;
 }
 if(action==='presentation'&&req.method==='GET'){
  if(!isTeacher&&!settings(r).allowDownloads)fail('El profesor ha desactivado las descargas.',403);res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="presentacion-${r.id}.pdf"`,'Cache-Control':'no-store'});pdf.presentationPDF(r,isTeacher?null:s).pipe(res);return true;
 }
 if(action==='materials'&&req.method==='GET'){
  studentOnly();if(!settings(r).allowDownloads)fail('El profesor ha desactivado las descargas.',403);res.setHeader('Content-Disposition',`attachment; filename="material-${r.id}.json"`);send(res,200,{format:'aula-student',version:1,title:r.title,slides:publicSlides(r).filter(s=>s.type!=='locked'),notes:s.notes||{},answers:Object.fromEntries(Object.entries(r.answers).filter(([,v])=>v[s.id]).map(([id,v])=>[id,v[s.id]]))});return true;
 }
 return false;
}
module.exports={settings,participation,settleFocus,validateSettings,handleFeature};
