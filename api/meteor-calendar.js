'use strict';
// Clock-based shower windows are independent of NWS and the GMN upstream.
// A weather outage must never prevent visitors from identifying active showers.
const {showerContext}=require('./meteor-viewing.js')._test;
module.exports=function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=300');
 res.setHeader('Access-Control-Allow-Origin','*');
 if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');return res.status(204).end();}
 if(req.method!=='GET')return res.status(405).json({error:'GET only'});
 const now=Date.now(),shower=showerContext(now);
 const brief=s=>({name:s.name,id:s.id,idealPeakZhr:s.zhr,peakAt:s.peakAt});
 return res.status(200).json({status:'ok',generatedAt:new Date(now).toISOString(),
  active:shower.active.map(brief),primary:shower.primary?brief(shower.primary):null,
  upcoming:shower.next?brief(shower.next):null,
  source:'IMO season-reference shower windows; no weather or GMN request'});
};
