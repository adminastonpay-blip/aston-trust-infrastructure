const json=(body,status=200)=>Response.json(body,{status});
/** SQLite-backed atomic one-time consumption for signed permit token IDs. */
export class PermitReplayGuard {
  constructor(state) {
    this.state=state;this.sql=state.storage.sql;this.healthy=true;
    state.blockConcurrencyWhile(async()=>{try{this.sql.exec("CREATE TABLE IF NOT EXISTS consumed_permits (token_id TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, consumed_at INTEGER NOT NULL)");}catch{this.healthy=false;}});
  }
  async fetch(request) {
    if(!this.healthy)return json({ok:false,error:"PERMIT_REPLAY_GUARD_UNAVAILABLE"},503);
    if(request.method!=="POST"||new URL(request.url).pathname!=="/consume")return json({ok:false,error:"NOT_FOUND"},404);
    let body;try{body=await request.json();}catch{return json({ok:false,error:"INVALID_JSON"},400);}
    if(typeof body?.tokenId!=="string"||!body.tokenId||!Number.isSafeInteger(body.expiresAt))return json({ok:false,error:"INVALID_PERMIT_ID"},400);
    try{return this.state.storage.transactionSync(()=>{
      const now=Math.floor(Date.now()/1000);
      this.sql.exec("DELETE FROM consumed_permits WHERE expires_at < ?",now-3600);
      try{this.sql.exec("INSERT INTO consumed_permits (token_id,expires_at,consumed_at) VALUES (?,?,?)",body.tokenId,body.expiresAt,now);return json({ok:true,consumed:true});}
      catch{const prior=this.sql.exec("SELECT token_id FROM consumed_permits WHERE token_id = ?",body.tokenId).toArray()[0];
        if(prior)return json({ok:false,error:"PERMIT_REPLAY"},409);throw Error("REPLAY_GUARD_STORAGE_FAILURE");}
    });}catch{this.healthy=false;return json({ok:false,error:"PERMIT_REPLAY_GUARD_UNAVAILABLE"},503);}
  }
}
