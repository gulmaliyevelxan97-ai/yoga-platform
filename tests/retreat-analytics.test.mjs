import test from 'node:test';
import assert from 'node:assert/strict';
import {readRetreatAnalytics} from '../app/retreat-analytics.mjs';

test('Retreat analytics requests mentor-scoped counts without reading private content',async()=>{
 const queries=[];
 const client={
  from(table){
   const record={table,filters:[]};
   queries.push(record);
   return {
    select(fields,options){Object.assign(record,{fields,options});return this;},
    eq(...filter){record.filters.push(filter);return this;},
    order(){return this;},
    then(resolve){resolve(table==='restart_retreat_members'
     ?{data:[{cohort_id:'cohort',restart_retreat_cohorts:{title:'Test'}}]}
     :{count:2});}
   };
  },
  rpc(name,args){queries.push({name,args});return {data:3};}
 };
 assert.deepEqual(await readRetreatAnalytics(client,{id:'guest',is_anonymous:true}),[]);
 assert.deepEqual(queries,[]);
 assert.deepEqual(await readRetreatAnalytics(client,{id:'mentor'}),[{title:'Test',values:[
  ['approved',2],['pending',2],['shared',2],['submitted',2],['reviewed',2],['unread',3]
 ]}]);
 assert.deepEqual(queries[0].filters,[['user_id','mentor'],['role','mentor']]);
 for (const query of queries.slice(1,-1)) {
  assert.equal(query.fields,'id');
  assert.deepEqual(query.options,{count:'exact',head:true});
  assert.deepEqual(query.filters[0],['cohort_id','cohort']);
 }
 assert.deepEqual(queries.find(q=>q.table==='restart_retreat_responses').filters[1],['share_with_mentor',true]);
 assert.deepEqual(queries.at(-1),{name:'restart_retreat_unread_count',args:{p_cohort_id:'cohort'}});
});
