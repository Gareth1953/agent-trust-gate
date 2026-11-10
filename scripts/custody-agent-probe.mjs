// Attack operations against this run's disposable fixtures only. Launched under
// the actual unprivileged agent UID by the trusted isolation harness.
import { readFileSync,writeFileSync,renameSync,chmodSync,openSync,closeSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
const input=JSON.parse(readFileSync(0,'utf8'));
let result;
try {
  switch(input.op) {
    case 'read': readFileSync(input.path);break;
    case 'write': writeFileSync(input.path,'attacker rewrite');break;
    case 'chmod': chmodSync(input.path,0o777);break;
    case 'copy': {
      // Node 24.22.2 fs.cpSync aborts natively on this denied directory in the
      // retained first CI run. Exercise the actual copy with POSIX cp instead;
      // never turn a crashed probe or missing utility into a passing denial.
      try {execFileSync('/bin/cp',['-a','--',input.path,input.destination],{stdio:'pipe',timeout:2000});}
      catch(error){if(error.status===1 && /Permission denied/.test(String(error.stderr)))throw Object.assign(Error('POSIX copy permission denied'),{code:'COPY_DENIED'});throw error;}
      break;
    }
    case 'rename': renameSync(input.path,input.destination);break;
    case 'sql': {const db=new DatabaseSync(input.path);try{db.exec("UPDATE resource SET version=777,value='attacker changed'");}finally{db.close();}break;}
    case 'memory': {const fd=openSync('/proc/'+input.pid+'/mem','r+');closeSync(fd);break;}
    case 'signal': process.kill(input.pid,0);break;
    default:throw Error('PROBE_INVALID');
  }
  result={denied:false,op:input.op};
}catch(error){result={denied:true,op:input.op,code:error.code??'SQLITE_DENIED',message:String(error.message).slice(0,200)};}
console.log(JSON.stringify(result));
