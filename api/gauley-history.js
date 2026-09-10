export default async function handler(req,res){
  const mod=await import('gauley-release-live/api/history.js');
  return mod.default(req,res);
}
