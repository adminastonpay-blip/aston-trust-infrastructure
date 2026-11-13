const hexToBytes=(hex:string):Uint8Array=>{
  if(!/^[a-f0-9]{64}$/.test(hex))throw new TypeError("Expected lowercase SHA-256 digest");
  return Uint8Array.from(hex.match(/.{2}/g)!,x=>Number.parseInt(x,16));
};
const toHex=(v:Uint8Array)=>[...v].map(x=>x.toString(16).padStart(2,"0")).join("");
const concat=(...parts:Uint8Array[])=>{const out=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let i=0;for(const p of parts){out.set(p,i);i+=p.length;}return out;};
const hash=async(v:Uint8Array)=>new Uint8Array(await crypto.subtle.digest("SHA-256",v));
export interface MerkleProofStep {position:"left"|"right";hash:string}
export interface MerkleProof {index:number;leafCount:number;eventDigest:string;proof:MerkleProofStep[];root:string}
/** Domain-separated Merkle tree: leaf=SHA256(0x00||digest), node=SHA256(0x01||left||right); duplicate odd node. */
export async function buildMerkleTree(eventDigests:string[]) {
  if(!Array.isArray(eventDigests)||!eventDigests.length)throw new TypeError("At least one event digest is required");
  const levels:Uint8Array[][]=[await Promise.all(eventDigests.map(d=>hash(concat(Uint8Array.of(0),hexToBytes(d)))))];
  while(levels[levels.length-1].length>1){const row=levels[levels.length-1],next:Uint8Array[]=[];
    for(let i=0;i<row.length;i+=2)next.push(await hash(concat(Uint8Array.of(1),row[i],row[i+1]??row[i])));
    levels.push(next);}
  return {root:toHex(levels[levels.length-1][0]),leafCount:eventDigests.length,levels:levels.map(row=>row.map(toHex))};
}
export async function createMerkleProof(digests:string[],index:number):Promise<MerkleProof>{
  const tree=await buildMerkleTree(digests);if(!Number.isSafeInteger(index)||index<0||index>=digests.length)throw new RangeError("Invalid leaf index");
  const proof:MerkleProofStep[]=[];let cursor=index;
  for(let level=0;level<tree.levels.length-1;level++){const row=tree.levels[level],sibling=cursor^1;
    proof.push({position:cursor%2===0?"right":"left",hash:row[sibling]??row[cursor]});cursor=Math.floor(cursor/2);}
  return {index,leafCount:digests.length,eventDigest:digests[index],proof,root:tree.root};
}
export async function verifyMerkleProof(input:Pick<MerkleProof,"eventDigest"|"proof"|"root">):Promise<boolean>{
  try{let current=await hash(concat(Uint8Array.of(0),hexToBytes(input.eventDigest)));
    for(const step of input.proof){const sibling=hexToBytes(step.hash);current=step.position==="left"
      ?await hash(concat(Uint8Array.of(1),sibling,current)):await hash(concat(Uint8Array.of(1),current,sibling));}
    return toHex(current)===input.root;}catch{return false;}
}
