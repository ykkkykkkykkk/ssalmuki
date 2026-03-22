export default function EventCard({ event, onSelect }) {
  const bc={live:{bg:"#FEF2F2",color:"#B91C1C"},soon:{bg:"#FFFBEB",color:"#92400E"},ended:{bg:"#F3F4F6",color:"#9CA3AF"}};
  const bt={live:"진행중",soon:"마감임박",ended:"종료"};
  const badge=bc[event.status]||bc.live;
  return (
    <div onClick={()=>onSelect?.(event.id)} role="button" tabIndex={0} aria-label={event.title} onKeyDown={(e) => { if (e.key === 'Enter') onSelect?.(event.id); }} style={{display:"flex",gap:"12px",padding:"14px",background:"#fff",border:"0.5px solid #f0f0f0",borderRadius:"12px",textDecoration:"none",cursor:"pointer",color:"inherit"}} onMouseEnter={e=>e.currentTarget.style.borderColor="#d0d0d0"} onMouseLeave={e=>e.currentTarget.style.borderColor="#f0f0f0"}>
      <div style={{position:"relative",flexShrink:0,width:"96px",height:"64px",borderRadius:"8px",overflow:"hidden",background:"#f3f4f6"}}>
        {event.thumbnail_url?<img src={event.thumbnail_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px"}}>🎁</div>}
        {event.subscriber_count&&<span style={{position:"absolute",bottom:"3px",right:"4px",fontSize:"9px",fontWeight:"500",background:"rgba(0,0,0,0.6)",color:"#fff",padding:"1px 5px",borderRadius:"3px"}}>{event.subscriber_count}</span>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:"6px",marginBottom:"4px"}}>
          <p style={{fontSize:"13px",fontWeight:"500",color:"#111",lineHeight:"1.4",flex:1}}>{event.title}</p>
          <span style={{flexShrink:0,fontSize:"10px",fontWeight:"500",padding:"2px 7px",borderRadius:"999px",background:badge.bg,color:badge.color}}>{bt[event.status]||"진행중"}</span>
        </div>
        <p style={{fontSize:"12px",color:"#aaa",marginBottom:"6px"}}>{event.channel_name}{event.view_count>0&&<span> · {(event.view_count/10000).toFixed(1)}만 조회</span>}</p>
        <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:"6px"}}>
          {Array.isArray(event.conditions)&&event.conditions.length>0&&<span style={{fontSize:"11px",color:"#bbb"}}>{event.conditions.join(" + ")}</span>}
          {event.prize&&<span style={{fontSize:"11px",background:"#F0FDF4",color:"#15803D",padding:"1px 8px",borderRadius:"4px"}}>{event.prize.length>20?event.prize.slice(0,20)+"…":event.prize}</span>}
          {event.dday&&<span style={{fontSize:"11px",fontWeight:"500",marginLeft:"auto",color:event.status==="soon"?"#D97706":"#bbb"}}>{event.dday}</span>}
        </div>
      </div>
    </div>
  );
}
