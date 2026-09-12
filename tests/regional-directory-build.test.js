const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const root=path.join(__dirname,'..');

test('regional organizer preserves the existing directory while separating national and regional tools',()=>{
  const source=path.join(root,'public','national-tools','index.html');
  const before=fs.readFileSync(source,'utf8');
  const beforeIds=[...before.matchAll(/data-tool-id="([^"]+)"/g)].map(match=>match[1]).sort();
  const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'national-tools-regions-'));
  const tempFile=path.join(tempDir,'index.html');
  fs.copyFileSync(source,tempFile);

  const run=spawnSync(process.execPath,[path.join(root,'scripts','organize-regional-directory.mjs')],{
    cwd:root,
    env:{...process.env,NATIONAL_TOOLS_DIRECTORY_FILE:tempFile},
    encoding:'utf8'
  });
  assert.equal(run.status,0,run.stderr||run.stdout);

  const after=fs.readFileSync(tempFile,'utf8');
  const afterIds=[...after.matchAll(/data-tool-id="([^"]+)"/g)].map(match=>match[1]).sort();
  assert.deepEqual(afterIds,beforeIds,'organizer must not add, drop or duplicate source cards');
  assert.match(after,/id="national-tools-title"/);
  assert.match(after,/id="regional-tools-title"/);
  assert.match(after,/Use these anywhere in the U\.S\./);
  assert.match(after,/Start with where you're going\./);

  for(const region of ['Northeast & Great Lakes','Appalachia & Ohio Valley','Southeast','Mississippi & Great Plains','Pacific Northwest']){
    assert.ok(after.includes(region),`missing ${region}`);
  }

  const nationalStart=after.indexOf('id="national-tools-title"');
  const regionalStart=after.indexOf('id="regional-tools-title"');
  assert.ok(nationalStart>=0&&regionalStart>nationalStart,'national tools should precede regional collections');
  const nationalBlock=after.slice(nationalStart,regionalStart);
  const regionalBlock=after.slice(regionalStart);
  assert.match(nationalBlock,/data-tool-id="rivers"/);
  assert.match(nationalBlock,/data-tool-id="aurora"/);
  assert.match(nationalBlock,/data-tool-id="monarch"/);
  assert.match(regionalBlock,/data-tool-id="gauley"/);
  assert.match(regionalBlock,/data-tool-id="fort-madison"/);
  assert.match(regionalBlock,/data-tool-id="ballard-locks"/);
  assert.match(regionalBlock,/data-tags="[^"]*pacific northwest[^"]*"/);

  fs.rmSync(tempDir,{recursive:true,force:true});
});
