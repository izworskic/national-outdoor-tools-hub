'use strict';
// Build-time GMN cache; never contacts GMN on a visitor request.
const {view}=require('../lib/gmn-observed-activity');
const cache=require('../data/gmn-observed-flux.json');
module.exports=function handler(req,res){
 res.setHeader('Content-Type','application/json; charset=utf-8');
 res.setHeader('Access-Control-Allow-Origin','*');
 res.setHeader('Cache-Control','public, s-maxage=900, must-revalidate');
 if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Methods','GET, OPTIONS');return res.status(204).end();}
 if(req.method!=='GET')return res.status(405).json({error:'GET only'});
 return res.status(200).json(view(cache,Date.now()));
};
