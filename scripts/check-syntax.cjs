const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const files=fs.readdirSync('.').filter(name=>name.endsWith('.js')).concat(fs.readdirSync('public').filter(name=>name.endsWith('.js')).map(name=>path.join('public',name)));
for(const file of files){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}console.log(`Sintaxis correcta: ${files.length} archivos.`);
