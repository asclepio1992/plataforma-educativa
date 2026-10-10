const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function resetFiles(directory,password){
 if(typeof password!=='string'||password.length<8||password.length>128||!password.trim())throw Error('La contraseña debe tener entre 8 y 128 caracteres.');
 const authFile=path.join(directory,'teacher.json'),classesFile=path.join(directory,'classes.json');
 if(!fs.existsSync(authFile))throw Error('No se encontró el perfil del profesor en este equipo.');
 const auth=JSON.parse(fs.readFileSync(authFile,'utf8')),classes=fs.existsSync(classesFile)?JSON.parse(fs.readFileSync(classesFile,'utf8')):null;
 const key=crypto.randomBytes(24).toString('hex').toUpperCase();auth.salt=crypto.randomBytes(24).toString('hex');auth.password=crypto.scryptSync(password,auth.salt,64).toString('hex');auth.recoverySalt=crypto.randomBytes(24).toString('hex');auth.recoveryHash=crypto.scryptSync(key,auth.recoverySalt,64).toString('hex');auth.recoveryCreatedAt=new Date().toISOString();
 const write=(file,value)=>{fs.writeFileSync(file+'.tmp',JSON.stringify(value));fs.renameSync(file+'.tmp',file);};
 if(classes){classes.sessions=[];write(classesFile,classes);}write(authFile,auth);
 return key.match(/.{8}/g).join('-');
}
function secret(prompt){return new Promise((resolve,reject)=>{let value='';process.stdout.write(prompt);process.stdin.setRawMode(true);process.stdin.resume();const finish=()=>{process.stdin.removeListener('data',input);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');};const input=chunk=>{for(const ch of chunk.toString()){if(ch==='\u0003'){finish();reject(Error('Operación cancelada.'));return;}if(ch==='\r'||ch==='\n'){finish();resolve(value);return;}if(ch==='\u007f'||ch==='\b'){value=value.slice(0,-1);}else if(ch>=' '&&value.length<128)value+=ch;}};process.stdin.on('data',input);});}
async function main(){
 if(!process.stdin.isTTY)throw Error('Ejecuta este comando directamente en una terminal del equipo servidor.');
 try{const response=await fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/session',{signal:AbortSignal.timeout(1500)});if(response.ok)throw Error('SERVER_RUNNING');}catch(error){if(error.message==='SERVER_RUNNING')throw Error('Detén la aplicación antes de restablecer la contraseña.');}
 console.log('Recuperación local del profesor. Tus clases y grupos se conservarán.');
 const password=await secret('Nueva contraseña (mínimo 8 caracteres): '),repeat=await secret('Repite la contraseña: ');if(password!==repeat)throw Error('Las contraseñas no coinciden.');
 const key=resetFiles(process.env.AULA_DATA_DIR||path.join(__dirname,'data'),password);
 console.log('Acceso restablecido. Guarda esta NUEVA clave de recuperación en un lugar privado:\n'+key+'\nLa clave anterior ya no funciona. Inicia la aplicación con npm.cmd start.');
}
if(require.main===module)main().catch(error=>{console.error(error.message);process.exitCode=1;});
module.exports={resetFiles};
