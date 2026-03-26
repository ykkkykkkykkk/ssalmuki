const F=[
  {key:"all",label:"전체",group:"status"},
  {key:"live",label:"진행중",group:"status"},
  {key:"soon",label:"마감임박",group:"status"},
  {key:"gift",label:"기프티콘",group:"tag"},
  {key:"cash",label:"현금/상품",group:"tag"},
  {key:"sub",label:"구독이벤트",group:"tag"},
];
export default function FilterBar({filter,onFilter}){
  return(
    <div style={{display:"flex",gap:"4px",overflowX:"auto"}}>
      {F.map(f=>{
        const active=f.group==="status"?filter.status===f.key:filter.tag===f.key;
        return(
          <button key={f.key} onClick={()=>onFilter(f.group==="status"?{status:f.key}:{tag:f.key===filter.tag?"all":f.key})}
            style={{
              flexShrink:0,padding:"4px 10px",borderRadius:"2px",fontSize:"11px",fontWeight:active?"700":"400",
              border:`1px solid ${active?"var(--color-border)":"transparent"}`,
              background:active?"#fff":"transparent",
              color:active?"var(--color-text)":"var(--color-text-muted)",
              cursor:"pointer",fontFamily:"var(--font-sans)",
            }}>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
