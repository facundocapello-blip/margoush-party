import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('3d/js/main.js','utf8');
const pauseSource=source.slice(source.indexOf('function pause()'), source.indexOf('async function boot()'));
function setup(state){
 const counts={reset:0,pause:0,resume:0,frames:0};
 const context={game:{state,timeScale:1},document:{hidden:false},input:{reset(){counts.reset++}},audio:{pauseMusic(){counts.pause++},resumeMusic(){counts.resume++}},showScreen(){},requestAnimationFrame(){counts.frames++}};
 vm.createContext(context);vm.runInContext(pauseSource,context);return {context,counts};
}
for(const state of ['playing','intro','transition','rescue'])test(`pause and resume preserves ${state}`,()=>{
 const {context:c,counts}=setup(state);c.pause();assert.equal(c.game.state,'paused');c.frame(100);c.frame(200);assert.equal(counts.frames,2);c.pause();c.resume();assert.equal(c.game.state,state);assert.equal(counts.pause,1);assert.equal(counts.resume,1);
});
test('hidden frame pauses rescue and cannot resume until visible',()=>{const {context:c}=setup('rescue');c.document.hidden=true;c.frame(100);assert.equal(c.game.state,'paused');c.resume();assert.equal(c.game.state,'paused');c.document.hidden=false;c.resume();assert.equal(c.game.state,'rescue')});
for(const state of ['menu','result','error'])test(`${state} does not run simulation or render`,()=>{const {context:c}=setup(state);c.frame(100);assert.equal(c.game.state,state)});
