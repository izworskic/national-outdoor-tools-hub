export default async function handler(req,res){
  const mod=await import('gauley-release-live/api/live.js');
  return mod.default(req,res);
}
