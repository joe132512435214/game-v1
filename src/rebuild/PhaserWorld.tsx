import Phaser from 'phaser';
import {useEffect,useRef} from 'react';
import type {Vector} from './engine';

type Props={background:string;character:string;position:Vector;camera:Vector};
export default function PhaserWorld(props:Props){
 const host=useRef<HTMLDivElement>(null);
 const latest=useRef(props);latest.current=props;
 useEffect(()=>{
  if(!host.current)return;
  let disposed=false;
  class WorldScene extends Phaser.Scene{
   private ground?:Phaser.GameObjects.Image;
   private actor?:Phaser.GameObjects.Image;
   private previousGround='';
   private previousActor='';
   private versions={ground:0,actor:0};
   private loadArt(kind:'ground'|'actor',markup:string){
    const version=++this.versions[kind];
    const img=new Image();
    img.onload=()=>{
     if(disposed||version!==this.versions[kind])return;
     const key=kind+'-'+version;
     this.textures.addImage(key,img);
     const old=kind==='ground'?this.ground:this.actor;
     const oldKey=old?.texture.key;
     const sprite=this.add.image(0,0,key).setOrigin(0).setDepth(kind==='ground'?0:10);
     if(kind==='ground')this.ground=sprite;else this.actor=sprite;
     old?.destroy();if(oldKey)this.textures.remove(oldKey);
    };
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(markup);
   }
   create(){this.cameras.main.setBounds(0,0,1024,768);}
   update(){
    const p=latest.current;
    if(p.background!==this.previousGround){this.previousGround=p.background;this.loadArt('ground',p.background);}
    if(p.character!==this.previousActor){this.previousActor=p.character;this.loadArt('actor',p.character);}
    this.actor?.setPosition(p.position.x-16,p.position.y-40);
    this.cameras.main.setScroll(p.camera.x,p.camera.y);
   }
  }
  const game=new Phaser.Game({type:Phaser.AUTO,parent:host.current,width:768,height:470,pixelArt:true,roundPixels:true,backgroundColor:'#343139',scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},scene:WorldScene,audio:{noAudio:true}});
  return()=>{disposed=true;game.destroy(true);};
 },[]);
 return <div ref={host} style={{width:'100%',aspectRatio:'768 / 470',overflow:'hidden'}} aria-label="GPU-rendered factory world"/>;
}
