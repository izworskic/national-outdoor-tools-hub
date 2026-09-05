"use strict";
function finite(value,min=-Infinity,max=Infinity){if(value===null||value===undefined||value==="")return null;const n=Number(value);return Number.isFinite(n)&&n>=min&&n<=max?n:null;}
function ageMinutes(value,now=Date.now()){const t=Date.parse(value||"");return Number.isFinite(t)?Math.max(0,Math.round((now-t)/60000)):null;}
function sourceMeta({name,url,updatedAt=null,available=true,status=null}){return{source_name:name,source_url:url,source_updated_at:updatedAt,age_minutes:ageMinutes(updatedAt),source_status:available?(status||"available"):"unavailable",available:Boolean(available)};}
module.exports={finite,sourceMeta};
