import canonicalize from "canonicalize";
export interface ViolationAttempt {violationType:string;observedAt:string;requestId?:string|null;model?:string|null;actor:string;route:string;details?:Record<string,unknown>}
export interface SignedViolationReport {
  schemaVersion:"aston.violation-report/1.0";reportId:string;violationType:string;observedAt:string;
  requestId:string|null;model:string|null;actor:string;route:string;details:Record<string,unknown>;
  digest:{algorithm:"SHA-256";value:string};signature:{algorithm:"EdDSA";keyId:string;value:string};
}
const enc=new TextEncoder();
const b64=(v:Uint8Array)=>{let s="";for(const b of v)s+=String.fromCharCode(b);return btoa(s).replace(/=/g,"").replaceAll("+","-").replaceAll("/","_");};
const unb64=(s:string)=>{const v=s.replace(/-/g,"+").replace(/_/g,"/");return Uint8Array.from(atob(v+"=".repeat((4-v.length%4)%4)),c=>c.charCodeAt(0));};
const canonical=(v:unknown)=>{const s=canonicalize(v);if(s===undefined)throw Error("NOT_CANONICAL");return enc.encode(s);};
async function importKey(v:CryptoKey|string,format:"pkcs8"|"spki",usage:KeyUsage[]){return typeof v==="object"?v:crypto.subtle.importKey(format,unb64(v),{name:"Ed25519"},false,usage);}
export async function createViolationReport(attempt:ViolationAttempt,privateKey:CryptoKey|string,keyId:string):Promise<SignedViolationReport>{
  if(!/^[A-Z][A-Z0-9_]{2,95}$/.test(attempt?.violationType??"")||!Number.isFinite(Date.parse(attempt?.observedAt??""))||!attempt.actor||!attempt.route||!keyId)
    throw new TypeError("Invalid violation report");
  const core={schemaVersion:"aston.violation-report/1.0" as const,reportId:crypto.randomUUID(),violationType:attempt.violationType,
    observedAt:attempt.observedAt,requestId:attempt.requestId??null,model:attempt.model??null,actor:attempt.actor,route:attempt.route,details:attempt.details??{}};
  const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",canonical(core)));
  const signature=new Uint8Array(await crypto.subtle.sign({name:"Ed25519"},await importKey(privateKey,"pkcs8",["sign"]),digest));
  return {...core,digest:{algorithm:"SHA-256",value:[...digest].map(b=>b.toString(16).padStart(2,"0")).join("")},
    signature:{algorithm:"EdDSA",keyId,value:b64(signature)}};
}
export async function verifyViolationReport(report:SignedViolationReport,publicKey:CryptoKey|string):Promise<boolean>{
  try{if(report?.schemaVersion!=="aston.violation-report/1.0"||report.digest?.algorithm!=="SHA-256"||report.signature?.algorithm!=="EdDSA")return false;
    const core={...report} as Record<string,unknown>;delete core.digest;delete core.signature;
    const digest=new Uint8Array(await crypto.subtle.digest("SHA-256",canonical(core)));
    const hex=[...digest].map(b=>b.toString(16).padStart(2,"0")).join("");
    return hex===report.digest.value&&await crypto.subtle.verify({name:"Ed25519"},await importKey(publicKey,"spki",["verify"]),unb64(report.signature.value),digest);
  }catch{return false;}
}
