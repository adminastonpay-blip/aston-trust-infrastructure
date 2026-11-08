const forbidden=new Set(["__proto__","prototype","constructor"]);
function readPath(source,path){
 if(typeof path!=="string"||!path)return {found:false};
 const parts=path.split(".");
 if(parts.some(p=>forbidden.has(p)))return {found:false};
 let value=source;
 for(const p of parts){if(value===null||typeof value!=="object"||!Object.hasOwn(value,p))return {found:false};value=value[p];}
 return {found:true,value};
}
export function evaluateTest(test,observation){
 if(!test||!Array.isArray(test.expected?.all)||!observation||typeof observation!=="object")return {test_id:test?.id??null,status:"FAIL",reason:"invalid_test_or_missing_observation",checks:[]};
 const checks=test.expected.all.map(a=>{const actual=readPath(observation,a.path);return {path:a.path,expected:a.equals,actual:actual.found?actual.value:null,passed:actual.found&&Object.is(actual.value,a.equals)};});
 const failed=checks.some(c=>!c.passed);
 return {test_id:test.id,status:failed?"FAIL":"PASS",reason:failed?"assertion_failed":null,checks};
}
const WEIGHTS={CRITICAL:10,HIGH:6,MEDIUM:3,LOW:1,INFO:0};
export function evaluateCampaign(tests,observations){
 if(!Array.isArray(tests))throw new TypeError("tests_must_be_array");
 const results=tests.map(t=>evaluateTest(t,observations?.[t.id]));
 const failed=results.filter(r=>r.status==="FAIL");
 const severity=id=>tests.find(t=>t.id===id)?.severity??"LOW";
 const critical=failed.filter(r=>severity(r.test_id)==="CRITICAL");
 const total=tests.reduce((n,t)=>n+(WEIGHTS[t.severity]??1),0);
 const loss=failed.reduce((n,r)=>n+(WEIGHTS[severity(r.test_id)]??1),0);
 return {protocol:"ASTON-ARP-1",catalog_id:"ARP-100",total:tests.length,passed:results.length-failed.length,failed:failed.length,critical_failures:critical.length,risk_score:total?Math.round(loss/total*10000)/100:0,disposition:critical.length?"REJECTED":failed.length?"REMEDIATION_REQUIRED":"TESTS_PASSED_WITHIN_DECLARED_SCOPE",certification_issued:false,results};
}