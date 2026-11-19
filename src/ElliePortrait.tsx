import type { CSSProperties } from 'react';
/** Fixed, reusable Ellie portrait. Unlike the player she is not customisable. */
export function ElliePortrait({size=160}:{size?:number}){
 const pixel:CSSProperties={imageRendering:'pixelated',width:size,height:size};
 return <svg viewBox="0 0 96 96" style={pixel} role="img" aria-label="Ellie, red-haired factory caretaker" shapeRendering="crispEdges">
 <path fill="#182330" d="M0 0h96v96H0z"/>
 <path fill="#6e3340" d="M12 94V76l13-13h48l12 13v18z"/>
 <path fill="#dc8737" d="M12 94V76l16-12h41l16 12v18z"/>
 <path fill="#293647" d="M30 66h36v30H30z"/>
 <path fill="#f2c05a" d="M19 75h9v20h-9zm49 0h9v20h-9z"/>
 <path fill="#a3442b" d="M18 33h8V18h8V9h27v5h9v11h8v39H67V42H26v23H16V42h2z"/>
 <path fill="#e97436" d="M18 32h8V19h9V11h24v5h9v12h7v24h-8V34H25v25h-7z"/>
 <path fill="#f1b98b" d="M28 28h38v31H55v7H37v-7h-9z"/>
 <path fill="#d67b55" d="M29 50h6v7h-6zm30 0h6v7h-6z"/>
 <path fill="#2a3742" d="M35 39h5v5h-5zm17 0h5v5h-5z"/>
 <path fill="#fdf4dd" d="M36 38h2v3h-2zm17 0h2v3h-2z"/>
 <path fill="#a74d3c" d="M41 53h13v3H41z"/>
 <path fill="#e97436" d="M22 17h12v-7h28v7h8v7H22z"/>
 <path fill="#263644" d="M23 16h49v6H23z"/>
 <path fill="#9ec6d2" d="M28 11h16v10H28zm23 0h16v10H51z"/>
 <path fill="#dae6df" d="M31 13h7v4h-7zm23 0h7v4h-7z"/>
 <path fill="#263644" d="M43 13h9v4h-9z"/>
 <path fill="#263644" d="M29 65h10v7H29zm26 0h10v7H55z"/>
 </svg>;
}
