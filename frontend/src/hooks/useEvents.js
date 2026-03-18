import{useState,useEffect,useCallback}from"react";
const BASE=import.meta.env.VITE_API_URL||"";
async function fetchEvents({status,tag,page=1,limit=20}={}){
  const p=new URLSearchParams({page,limit});
  if(status&&status!=="all")p.set("status",status);
  if(tag&&tag!=="all")p.set("tag",tag);
  const r=await fetch(`${BASE}/api/events?${p}`);
  if(!r.ok)throw new Error("API 오류");
  return r.json();
}
async function fetchStats(){const r=await fetch(`${BASE}/api/stats`);if(!r.ok)throw new Error("API 오류");return r.json();}
export function useEvents(){
  const[events,setEvents]=useState([]);
  const[stats,setStats]=useState(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState(null);
  const[filter,setFilter]=useState({status:"all",tag:"all"});
  const[page,setPage]=useState(1);
  const[totalPages,setTotalPages]=useState(1);
  const[total,setTotal]=useState(0);
  const load=useCallback(async()=>{
    setLoading(true);setError(null);
    try{const[ev,st]=await Promise.all([fetchEvents({...filter,page}),fetchStats()]);setEvents(ev.events);setTotal(ev.total);setTotalPages(ev.totalPages);setStats(st);}
    catch(e){setError(e.message);}
    finally{setLoading(false);}
  },[filter,page]);
  useEffect(()=>{load();},[load]);
  const updateFilter=useCallback((f)=>{setFilter(p=>({...p,...f}));setPage(1);},[]);
  return{events,stats,loading,error,filter,updateFilter,page,setPage,totalPages,total,reload:load};
}
