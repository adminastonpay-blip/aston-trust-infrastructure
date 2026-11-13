import canonicalize from "canonicalize";
const enc=new TextEncoder(), dec=new TextDecoder();
const b64u=(b)=>{let s="";for(const x of b)s+=String.fromCharCode(x);return btoa(s).replace(/=/g,"").replaceAll("+","-").replaceAll("/","_");};
const unb64=(s)=>{if(typeof s!=="string"||!/^[A-Za-z0-9_-]+$/.test(s))throw Error("BAD_BASE64URL");const v=s.replace(/-/g,"+").replace(/_/g,"/");return Uint8Array.from(atob(v+"=".repeat((4-v.length%4)%4)),c=>c.charCodeAt(0));};
const bytes=(v)=>{const s=canonicalize(v);if(s===undefined)throw Error("NON_CANONICAL");return enc.encode(s);};
async function key(v,format,usages){if(v&&typeof v==="object"&&v.type)return v;return crypto.subtle.importKey(format,unb64(v),{name:"Ed25519"},false,usages);}
async function digest(v){const d=new Uint8Array(await crypto.subtle.digest("SHA-256",bytes(v)));return [...d].map(x=>x.toString(16).padStart(2,"0")).join("");}
export const encodePermitKey=(v)=>b64u(new Uint8Array(v));

/** Short-lived signed capability, issued only after the authoritative PDP returns ALLOW. */
export async function createPermitToken({authorization,agentId,model,inputs,privateKey,keyId,now=Date.now(),ttlSeconds=30}) {
  if(authorization?.decision!=="ALLOW"||authorization.action!=="ai.inference"||authorization.resourceId!==model||
     !authorization.requestId||!authorization.organizationId||!agentId||!keyId||
     !Number.isSafeInteger(ttlSeconds)||ttlSeconds<1||ttlSeconds>60) throw new TypeError("SafetyInterlock ALLOW required");
  const payload={version:"aston.permit/1.0",issuer:"aston-safety-interlock",audience:"aston-model-runner",keyId,
    tokenId:crypto.randomUUID(),organizationId:authorization.organizationId,agentId,requestId:authorization.requestId,
    action:"ai.inference",resourceId:model,policyId:authorization.policyId,policyVersion:authorization.policyVersion,
    inputDigest:await digest(inputs),issuedAt:Math.floor(now/1000),expiresAt:Math.floor(now/1000)+ttlSeconds};
  const sig=await crypto.subtle.sign({name:"Ed25519"},await key(privateKey,"pkcs8",["sign"]),bytes(payload));
  return b64u(bytes(payload))+"."+b64u(new Uint8Array(sig));
}

/** Fail-closed verification; returns claims only when signature, audience, scope, time and input digest match. */
export async function verifyPermitToken(token,publicKey,expected,now=Date.now()) {
  try {
    if(typeof token!=="string"||token.length>8192)return null;
    const p=token.split(".");if(p.length!==2)return null;
    const raw=unb64(p[0]),sig=unb64(p[1]),claims=JSON.parse(dec.decode(raw));
    if(canonicalize(claims)!==dec.decode(raw))return null;
    if(!await crypto.subtle.verify({name:"Ed25519"},await key(publicKey,"spki",["verify"]),sig,raw))return null;
    const t=Math.floor(now/1000);
    if(claims.version!=="aston.permit/1.0"||claims.issuer!=="aston-safety-interlock"||
       claims.audience!=="aston-model-runner"||claims.action!=="ai.inference"||!claims.tokenId||
       !Number.isSafeInteger(claims.issuedAt)||!Number.isSafeInteger(claims.expiresAt)||
       claims.issuedAt>t+5||claims.expiresAt<=t||claims.expiresAt-claims.issuedAt>60)return null;
    if(expected?.keyId&&claims.keyId!==expected.keyId)return null;
    if(claims.resourceId!==expected?.model||claims.requestId!==expected?.requestId||
       claims.inputDigest!==await digest(expected?.inputs)||
       (expected?.organizationId&&claims.organizationId!==expected.organizationId)||
       (expected?.agentId&&claims.agentId!==expected.agentId))return null;
    return claims;
  } catch{return null;}
}
