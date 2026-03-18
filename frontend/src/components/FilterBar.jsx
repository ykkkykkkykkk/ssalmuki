const F=[{key:"all",label:"전체",group:"status"},{key:"live",label:"진행중",group:"status"},{key:"soon",label:"마감임박",group:"status"},{key:"gift",label:"기프티콘",group:"tag"},{key:"cash",label:"현금/상품",group:"tag"},{key:"sub",label:"구독이벤트",group:"tag"}];
export default function FilterBar({filter,onFilter}){
  return(
    <div style={{display:"flex",gap:"6px",padding:"10px 16px",overflowX:"auto",borderBottom:"0.5px solid #f0f0f0"}}>
      {F.map(f=>{const active=f.group==="status"?filter.status===f.key:filter.tag===f.key;return(<button key={f.key} onClick={()=>onFilter(f.group==="status"?{status:f.key}:{tag:f.key===filter.tag?"all":f.key})} style={{flexShrink:0,padding:"4px 12px",borderRadius:"999px",fontSize:"12px",fontWeight:"500",border:`0.5px solid ${active?"transparent":"#e0e0e0"}`,background:active?"#EFF6FF":"#fff",color:active?"#1D4ED8":"#888",cursor:"pointer"}}>{f.label}</button>);})}
    </div>
  );
}
