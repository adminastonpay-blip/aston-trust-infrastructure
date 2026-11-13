import { buildMerkleTree } from "./merkle-tree.ts";
/** Queue of event digests; caller controls periodic flush and supplies a Bitcoin/OTS anchor adapter. */
export class EvidenceBatcher {
  constructor({maxBatchSize=256}={}) {
    if(!Number.isSafeInteger(maxBatchSize)||maxBatchSize<1||maxBatchSize>10000)throw new TypeError("Invalid maxBatchSize");
    this.maxBatchSize=maxBatchSize;this.pending=[];
  }
  add(eventDigest) {
    if(!/^[a-f0-9]{64}$/.test(eventDigest??""))throw new TypeError("Invalid SHA-256 event digest");
    this.pending.push(eventDigest);return {queued:true,size:this.pending.length,flushRecommended:this.pending.length>=this.maxBatchSize};
  }
  async flush({anchor,batchId=crypto.randomUUID(),createdAt=new Date().toISOString()}={}) {
    if(!this.pending.length)return null;
    const digests=this.pending.slice(),tree=await buildMerkleTree(digests);
    const batch={schemaVersion:"aston.evidence-batch/1.0",batchId,createdAt,count:digests.length,
      algorithm:"SHA-256",treeVersion:"aston-merkle/1.0",root:tree.root,eventDigests:digests};
    if(typeof anchor!=="function")return {...batch,anchored:false};
    const receipt=await anchor({root:tree.root,batchId,count:digests.length,createdAt});
    this.pending.splice(0,digests.length);return {...batch,anchored:true,anchorReceipt:receipt};
  }
  get size(){return this.pending.length;}
}
