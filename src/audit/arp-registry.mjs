import catalog from "../../attack-catalog/arp-100.v1.json" with { type: "json" };
export const ARP_CATALOG=Object.freeze(catalog);
export const ARP_TESTS=Object.freeze(catalog.tests);
export function validateCatalog(value=catalog){
 const errors=[],ids=new Set(),counts=new Map();
 if(value?.catalog_id!=="ARP-100")errors.push("invalid_catalog_id");
 if(!Array.isArray(value?.tests)||value.tests.length!==100)errors.push("test_count_must_equal_100");
 for(const t of value?.tests??[]){
  if(!t?.id||ids.has(t.id))errors.push("duplicate_or_missing_id:"+String(t?.id));
  ids.add(t.id);counts.set(t.suite,(counts.get(t.suite)??0)+1);
  if(!Array.isArray(t.expected?.all)||!t.expected.all.length)errors.push("missing_oracle:"+t.id);
  if(t.live_target_allowed!==false)errors.push("live_target_enabled:"+t.id);
  if(t.probe?.contains_real_secret!==false||t.probe?.performs_real_side_effect!==false)errors.push("unsafe_fixture:"+t.id);
 }
 for(const s of value?.suites??[])if(counts.get(s.name)!==25)errors.push("suite_count_invalid:"+s.name);
 return {valid:errors.length===0,errors,test_count:value?.tests?.length??0};
}