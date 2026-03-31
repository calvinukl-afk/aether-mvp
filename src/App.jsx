import { useState, useRef, useEffect } from "react";
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Legend } from "recharts";
import * as XLSX from "xlsx";

// ── TOKENS ────────────────────────────────────────────────────────────────────
const T = {
  bg:"#080c18", bgCard:"#0d1020", bgSec:"#111525",
  border:"rgba(255,255,255,0.07)",
  primary:"#6366f1", primaryDim:"rgba(99,102,241,0.13)",
  accent:"#06b6d4", accentDim:"rgba(6,182,212,0.10)",
  green:"#10b981", greenDim:"rgba(16,185,129,0.10)",
  red:"#ef4444", redDim:"rgba(239,68,68,0.09)",
  yellow:"#f59e0b", yellowDim:"rgba(245,158,11,0.10)",
  text:"#e2e8f0", muted:"#4a5568", dim:"#8896aa",
};

const GS = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{background:#080c18;color:#e2e8f0;font-family:'Inter',system-ui,sans-serif;}
  ::-webkit-scrollbar{width:5px;height:5px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#1a2035;border-radius:10px;}
  ::-webkit-scrollbar-thumb:hover{background:#252d45;}
  input[type=range]{accent-color:#6366f1;cursor:pointer;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
  @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
  @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
`;

const card = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:8, padding:16 };
const mono = { fontFamily:"'JetBrains Mono',monospace", fontSize:11 };
const label = { fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2, color:T.muted, textTransform:"uppercase" };
const tag = (c) => ({ fontSize:9, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1.2, padding:"2px 7px", borderRadius:3, border:`1px solid ${c}35`, color:c, background:`${c}10` });
const btn = (v="primary") => ({ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", transition:"all 0.15s", ...(v==="primary"?{background:T.primary,color:"#fff"}:{background:T.bgSec,color:T.dim,border:`1px solid ${T.border}`}) });

// ── NAV ───────────────────────────────────────────────────────────────────────
const NAV = [
  {id:"assistant",label:"AI Assistant",icon:"◈"},
  {id:"dashboard",label:"Dashboard",icon:"⬡"},
  {id:"network",label:"Store Network",icon:"◎"},
  {id:"diagnostics",label:"Root Cause Analysis",icon:"◆"},
  {id:"recommendations",label:"Recommendations",icon:"⬟"},
  {id:"twin",label:"Digital Twin",icon:"◉"},
  {id:"supply",label:"Supply Chain",icon:"◇"},
  {id:"transformation",label:"Transformation",icon:"△"},
];
const TITLES = {assistant:"AI Assistant",dashboard:"Store Performance Dashboard",network:"Store Network Overview",diagnostics:"Root Cause Analysis",recommendations:"Recommendations",twin:"Digital Twin Simulator",supply:"Supply Chain Optimization",transformation:"Transformation Management"};

// ── STATIC DATA ───────────────────────────────────────────────────────────────
const revenueData = [{day:"Mon",actual:4200,baseline:4500},{day:"Tue",actual:3820,baseline:4300},{day:"Wed",actual:5160,baseline:5200},{day:"Thu",actual:4730,baseline:4800},{day:"Fri",actual:5520,baseline:5600},{day:"Sat",actual:6840,baseline:7200},{day:"Sun",actual:6110,baseline:6800}];
const kpis = [{label:"Revenue (7d)",value:"£36,380",change:"-18.2%",pos:false,sub:"vs baseline £44,400"},{label:"Transactions",value:"1,247",change:"-22%",pos:false,sub:"38 payment failures"},{label:"Avg Order",value:"£29.15",change:"-1.2%",pos:false,sub:"Slight basket drop"},{label:"CSAT Score",value:"3.2/5",change:"-18%",pos:false,sub:"Service delays"}];
const signals = [{sev:"critical",title:"New Manager Onboarded",detail:"Store #042 — New manager started 3 days ago. Historical pattern: -12% sales weeks 1–3.",time:"3d ago",src:"HRIS"},{sev:"critical",title:"Payment Terminal Failure",detail:"Terminal 3 failing every other day for 6 months. Decline rate 4.2% vs 1.8% baseline. -£1,800/wk.",time:"ONGOING",src:"PAYMENTS"},{sev:"warning",title:"Staff Turnover Spike",detail:"Turnover +34% post manager change. 3 FTE short. Service degraded 23%, CSAT -18%.",time:"3d ago",src:"HRIS"},{sev:"warning",title:"Service Quality Decline",detail:"Avg transaction time +23%. Queue >4 min at peak. CSAT -18% week-over-week.",time:"2d ago",src:"OPS"}];
const stores = [{id:"042",loc:"London",rev:-18.2,alerts:4,status:"critical"},{id:"015",loc:"Manchester",rev:-8.5,alerts:2,status:"warning"},{id:"028",loc:"Birmingham",rev:-6.2,alerts:1,status:"warning"},{id:"071",loc:"Bristol",rev:-3.1,alerts:1,status:"warning"},{id:"007",loc:"Leeds",rev:2.1,alerts:0,status:"healthy"},{id:"033",loc:"Glasgow",rev:1.8,alerts:0,status:"healthy"},{id:"055",loc:"Edinburgh",rev:3.4,alerts:0,status:"healthy"}];
const twinDims = [{dim:"Demand",v:82,base:70},{dim:"Pricing",v:74,base:65},{dim:"Staffing",v:68,base:72},{dim:"Inventory",v:55,base:78},{dim:"Service",v:79,base:75},{dim:"Payments",v:61,base:80}];
const valueData = [{week:"W-4",expected:2000,actual:1800},{week:"W-3",expected:4000,actual:3600},{week:"W-2",expected:6000,actual:5200},{week:"W-1",expected:8000,actual:6800},{week:"Now",expected:10000,actual:7200}];
const suppliers = [{name:"Supplier A",price:2.14,vol:35,status:"HIGH"},{name:"Supplier B",price:1.87,vol:40,status:"MID"},{name:"Supplier C",price:1.52,vol:25,status:"LOW"}];
const initiatives = [{name:"Manager Onboarding Program",expected:"£2,400/wk",actual:"£800/wk",pct:33,status:"under"},{name:"Payment Terminal Replacement",expected:"£2,100/wk",actual:"£1,950/wk",pct:93,status:"track"},{name:"Staff Retention Program",expected:"£1,500/wk",actual:"£1,200/wk",pct:80,status:"track"}];
const recs = [{pri:"CRITICAL",title:"Replace Terminal 3 Card Reader",impact:"+£1,800/wk",effort:"LOW",time:"24h",desc:"Immediate hardware replacement. £300/day quick win recoverable immediately."},{pri:"CRITICAL",title:"Accelerated Manager Onboarding",impact:"+£2,400/wk",effort:"MEDIUM",time:"2 weeks",desc:"Pair with experienced mentor, daily operational reviews, clear decision authority."},{pri:"HIGH",title:"Staff Retention Program",impact:"+£1,500/wk",effort:"MEDIUM",time:"3 weeks",desc:"Retention bonuses + schedule stability to rebuild the workforce."},{pri:"HIGH",title:"Targeted Recovery Promotion",impact:"+£800/wk",effort:"LOW",time:"1 week",desc:"10% loyalty promotion to rebuild customer confidence during the recovery period."}];
const benchmarks = [{metric:"Revenue/SqFt",store:"£312",peer:"£428",industry:"£395",st:"below"},{metric:"Staff Productivity",store:"68%",peer:"84%",industry:"79%",st:"below"},{metric:"Payment Success Rate",store:"95.8%",peer:"98.3%",industry:"98.1%",st:"below"},{metric:"Customer Satisfaction",store:"3.2",peer:"4.1",industry:"3.9",st:"below"},{metric:"Peak Hour Coverage",store:"87%",peer:"96%",industry:"92%",st:"warning"}];
const kitchens = [{loc:"Singapore (3 kitchens)",cost:2.8,prod:45,c:T.red},{loc:"Malaysia (1 kitchen)",cost:1.2,prod:30,c:T.yellow},{loc:"Vietnam (1 kitchen)",cost:0.6,prod:25,c:T.green}];
const extSources = [{id:"nielsen",label:"NielsenIQ Market Data",icon:"📊"},{id:"google",label:"Google Trends",icon:"📈"},{id:"competitor",label:"Competitor Pricing",icon:"🔍"},{id:"macro",label:"Macro / Economic Data",icon:"🌍"}];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function Tag({c,children}){return <span style={tag(c)}>{children}</span>;}
function Dot({status}){const c=status==="critical"?T.red:status==="warning"?T.yellow:T.green;return <span style={{width:6,height:6,borderRadius:"50%",background:c,display:"inline-block",marginRight:6,flexShrink:0,boxShadow:`0 0 5px ${c}`}}/>;}
function KpiCard({label:l,value,change,pos,sub}){
  return(
    <div style={{...card,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${T.primary},transparent)`}}/>
      <div style={{...label,marginBottom:8}}>{l}</div>
      <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,marginBottom:3}}>{value}</div>
      <span style={{...mono,color:pos?T.green:T.red,fontWeight:700}}>{change}</span>
      <div style={{fontSize:10,color:T.muted,marginTop:4}}>{sub}</div>
    </div>
  );
}

// ── MARKDOWN ──────────────────────────────────────────────────────────────────
function Inline({text}){
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{parts.map((p,i)=>{
    if(p.startsWith("**")&&p.endsWith("**"))return<strong key={i} style={{color:T.text}}>{p.slice(2,-2)}</strong>;
    if(p.startsWith("`")&&p.endsWith("`"))return<code key={i} style={{background:T.bgSec,color:T.accent,padding:"1px 5px",borderRadius:3,fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>{p.slice(1,-1)}</code>;
    return p;
  })}</>;
}
function Md({text}){
  return <>{text.split("\n").map((line,i)=>{
    if(line.startsWith("## "))return<div key={i} style={{fontSize:13,fontWeight:800,color:T.primary,marginTop:10,marginBottom:4}}>{line.slice(3)}</div>;
    if(line.startsWith("### "))return<div key={i} style={{fontSize:12,fontWeight:700,color:T.text,marginTop:8,marginBottom:3}}>{line.slice(4)}</div>;
    if(line.startsWith("# "))return<div key={i} style={{fontSize:14,fontWeight:800,color:T.text,marginTop:10,marginBottom:4}}>{line.slice(2)}</div>;
    if(line.startsWith("- ")||line.startsWith("• "))return<div key={i} style={{display:"flex",gap:6,paddingLeft:4,marginBottom:3}}><span style={{color:T.primary,flexShrink:0}}>›</span><span><Inline text={line.slice(2)}/></span></div>;
    const nm=line.match(/^(\d+)\.\s*(.*)/);
    if(nm)return<div key={i} style={{display:"flex",gap:6,paddingLeft:4,marginBottom:3}}><span style={{color:T.accent,flexShrink:0,...mono,fontSize:10}}>{nm[1]}.</span><span><Inline text={nm[2]}/></span></div>;
    if(line.trim()==="")return<div key={i} style={{height:5}}/>;
    return<div key={i} style={{marginBottom:2}}><Inline text={line}/></div>;
  })}</>;
}

// ── FILE READING ──────────────────────────────────────────────────────────────
function readExcel(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=(e)=>{
      try{
        const wb=XLSX.read(new Uint8Array(e.target.result),{type:"array"});
        let out="";
        wb.SheetNames.slice(0,6).forEach(name=>{
          const csv=XLSX.utils.sheet_to_csv(wb.Sheets[name],{blankrows:false});
          out+=`\n\n=== Sheet: ${name} ===\n`+csv.split("\n").slice(0,150).join("\n");
        });
        resolve(out.slice(0,14000));
      }catch(err){reject(err);}
    };
    reader.onerror=reject;
    reader.readAsArrayBuffer(file);
  });
}
function readPdf(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=(e)=>resolve(e.target.result.split(",")[1]);
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}

// ── AI ASSISTANT ──────────────────────────────────────────────────────────────
function AssistantPage(){
  const[messages,setMessages]=useState([{role:"assistant",content:`## Welcome to Aether AI Assistant\n\nI'm powered by Claude with enterprise benchmark knowledge.\n\n**I can help you with:**\n- Analysing uploaded cost data (P&L, budgets, expense reports)\n- Identifying cost saving levers with industry benchmarks\n- Operational improvement recommendations\n- Store diagnostics and strategic planning\n\nUpload an Excel or PDF file above, or ask me anything directly.\n\nTry: *"What are typical cost saving levers for a restaurant operation?"*`,files:[]}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[allFiles,setAllFiles]=useState([]);
  const[pending,setPending]=useState([]);
  const[sources,setSources]=useState(extSources.map(s=>({...s,active:false})));
  const[dragOver,setDragOver]=useState(false);
  const endRef=useRef(null);
  const fileRef=useRef(null);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const toggle=(id)=>setSources(p=>p.map(s=>s.id===id?{...s,active:!s.active}:s));

  const processFiles=async(rawFiles)=>{
    const arr=Array.from(rawFiles).filter(f=>/\.(xlsx|xls|pdf)$/i.test(f.name));
    if(!arr.length)return;
    const parsed=[];
    for(const f of arr){
      try{
        if(/\.(xlsx|xls)$/i.test(f.name)){
          const text=await readExcel(f);
          parsed.push({name:f.name,type:"excel",content:text,size:f.size});
        }else{
          const b64=await readPdf(f);
          parsed.push({name:f.name,type:"pdf",content:b64,size:f.size});
        }
      }catch(e){console.error("File error:",e);}
    }
    if(!parsed.length)return;
    setAllFiles(p=>[...p,...parsed]);
    setPending(p=>[...p,...parsed]);
    const preview=parsed.map(f=>`**${f.name}** (${f.type.toUpperCase()}, ${(f.size/1024).toFixed(1)} KB)`).join("\n");
    setMessages(p=>[...p,{role:"assistant",content:`## Files Ready\n\n${preview}\n\nContent extracted. What would you like me to focus on?\n\n- Cost base breakdown and key drivers\n- Cost saving levers vs industry benchmarks\n- Operational efficiency opportunities\n- Margin improvement recommendations\n- Something specific — just ask`,files:parsed.map(f=>f.name)}]);
  };

  const send=async()=>{
    if((!input.trim()&&!pending.length)||loading)return;
    const userText=input.trim()||"Analyse the uploaded files. Identify cost saving levers and operational improvement opportunities with benchmarks.";
    setInput("");
    setMessages(p=>[...p,{role:"user",content:userText,files:pending.map(f=>f.name)}]);
    setLoading(true);

    const activeSrc=sources.filter(s=>s.active).map(s=>s.label);
    const system=`You are Aether — an enterprise decision intelligence AI specialising in cost analysis, operational improvement, and commercial diagnostics.

When analysing uploaded data always structure your output:
1. **What I see** — brief summary of the data
2. **Key cost drivers** — top 3–5 identified
3. **Cost saving levers** — specific and quantified (use % or currency ranges)
4. **Operational improvement opportunities** — ranked by effort vs impact
5. **Prioritised next steps**

Benchmarking: always compare costs to industry norms. Ask for industry context if not provided. Use realistic ranges (e.g. "QSR labour cost benchmark: 28–34% of revenue").

External data sources active: ${activeSrc.length?activeSrc.join(", "):"None — user can toggle above"}

Be direct, specific, and commercial. Format with markdown headers and bullets.`;

    const userContent=[];
    for(const f of pending){
      if(f.type==="pdf"){
        userContent.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:f.content}});
      }else{
        userContent.push({type:"text",text:`=== Uploaded Excel: ${f.name} ===\n${f.content}`});
      }
    }
    userContent.push({type:"text",text:userText});

    const history=messages.slice(-10).map(m=>({role:m.role,content:String(m.content)}));

    try{
      const res=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:2000,system,messages:[...history,{role:"user",content:userContent}]})
      });
      const data=await res.json();
      const text=data.content?.[0]?.text||"Unable to get a response. Please try again.";
      setMessages(p=>[...p,{role:"assistant",content:text,files:[]}]);
    }catch(e){
      setMessages(p=>[...p,{role:"assistant",content:"**Connection error.** Please check your connection and try again.",files:[]}]);
    }
    setPending([]);
    setLoading(false);
  };

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* External Sources */}
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${T.border}`,background:T.bgCard,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div>
            <div style={{fontSize:12,fontWeight:700}}>External Data Sources</div>
            <div style={{...mono,color:T.muted,marginTop:1}}>Market benchmarks, competitor data, and custom datasets</div>
          </div>
          <span style={tag(T.accent)}>BETA</span>
        </div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {sources.map(s=>(
            <button key={s.id} onClick={()=>toggle(s.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:5,fontSize:11,fontWeight:500,cursor:"pointer",border:"none",transition:"all 0.15s",background:s.active?T.primaryDim:T.bgSec,color:s.active?T.primary:T.dim,outline:s.active?`1px solid ${T.primary}50`:`1px solid ${T.border}`}}>
              {s.icon} {s.label} <span style={{...mono,fontSize:9,color:s.active?T.primary:T.muted}}>{s.active?"ON":"OFF"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload Zone */}
      <div style={{padding:"10px 20px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div
          onDrop={e=>{e.preventDefault();setDragOver(false);processFiles(e.dataTransfer.files);}}
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onClick={()=>fileRef.current?.click()}
          style={{background:dragOver?T.primaryDim:T.bgSec,border:`1.5px dashed ${dragOver?T.primary:T.border}`,borderRadius:8,padding:"11px 16px",cursor:"pointer",transition:"all 0.15s"}}
        >
          <input ref={fileRef} type="file" multiple accept=".xlsx,.xls,.pdf" style={{display:"none"}} onChange={e=>processFiles(e.target.files)}/>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:34,height:34,borderRadius:8,background:T.primaryDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>📎</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,marginBottom:1}}>Upload Files for Analysis</div>
              <div style={{...mono,color:T.muted}}>Drop Excel (.xlsx) or PDF · Click to browse</div>
            </div>
            {allFiles.length>0&&<span style={tag(T.green)}>{allFiles.length} FILE{allFiles.length>1?"S":""} LOADED</span>}
          </div>
          {allFiles.length>0&&(
            <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
              {allFiles.map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:4,padding:"3px 8px"}}>
                  <span style={{fontSize:10}}>{f.type==="pdf"?"📄":"📊"}</span>
                  <span style={{...mono,color:T.dim,fontSize:10}}>{f.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 20px",display:"flex",flexDirection:"column",gap:12}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",animation:"fadeIn 0.2s ease"}}>
            {m.role==="assistant"&&(
              <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${T.primary},${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0,marginRight:8,marginTop:2}}>A</div>
            )}
            <div style={{maxWidth:"82%"}}>
              {m.files&&m.files.length>0&&m.role==="user"&&(
                <div style={{display:"flex",gap:5,marginBottom:5,justifyContent:"flex-end",flexWrap:"wrap"}}>
                  {m.files.map((f,j)=><div key={j} style={{...mono,background:T.primaryDim,color:T.primary,padding:"2px 6px",borderRadius:3,border:`1px solid ${T.primary}30`,fontSize:9}}>📎 {f}</div>)}
                </div>
              )}
              <div style={{padding:"11px 14px",borderRadius:m.role==="user"?"8px 2px 8px 8px":"2px 8px 8px 8px",fontSize:12,lineHeight:1.65,background:m.role==="user"?T.primary:T.bgSec,border:m.role==="assistant"?`1px solid ${T.border}`:"none",color:m.role==="user"?"#fff":T.text}}>
                {m.role==="assistant"?<Md text={m.content}/>:m.content}
              </div>
            </div>
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${T.primary},${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>A</div>
            <div style={{background:T.bgSec,border:`1px solid ${T.border}`,borderRadius:"2px 8px 8px 8px",padding:"11px 14px",display:"flex",gap:5,alignItems:"center"}}>
              <span style={{fontSize:11,color:T.muted,marginRight:4}}>Analysing</span>
              {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.primary,animation:`bounce 1.1s infinite ${i*0.18}s`}}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,background:T.bgCard,flexShrink:0}}>
        {pending.length>0&&(
          <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
            {pending.map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:5,background:T.primaryDim,border:`1px solid ${T.primary}40`,borderRadius:4,padding:"3px 8px"}}>
                <span style={{fontSize:10}}>{f.type==="pdf"?"📄":"📊"}</span>
                <span style={{...mono,color:T.primary,fontSize:10}}>{f.name}</span>
                <button onClick={()=>setPending(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,lineHeight:1,padding:0,marginLeft:2}}>×</button>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <textarea
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            placeholder={pending.length?"Files attached — describe what to analyse, or press Send for a full review...":"Ask about cost savings, ops improvements, or upload files for analysis..."}
            rows={2}
            style={{flex:1,background:T.bgSec,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:12,color:T.text,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.5}}
          />
          <button onClick={send} disabled={loading||(!input.trim()&&!pending.length)} style={{...btn(),padding:"10px 16px",height:52,opacity:loading?0.5:1,flexShrink:0}}>➤</button>
        </div>
        <div style={{...mono,color:T.muted,marginTop:5,textAlign:"center",fontSize:10}}>Enter to send · Shift+Enter for new line · Files persist across messages</div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard(){
  return(
    <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:14}}>
      <div style={{background:T.redDim,border:`1px solid ${T.red}40`,borderRadius:8,padding:"12px 16px",display:"flex",gap:12}}>
        <span style={{fontSize:16,flexShrink:0}}>⚠️</span>
        <div>
          <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Store Volume Decline Detected</div>
          <div style={{fontSize:11,color:T.dim,lineHeight:1.55}}>Revenue down 18.2% WoW. Aether compressed 3–4 weeks of manual analysis into 2.5 hours. Root causes: manager transition, staff turnover, payment failures.</div>
        </div>
      </div>
      <div style={card}>
        <div style={{...label,marginBottom:8}}>A. Compress Analysis Time</div>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1,background:T.redDim,border:`1px solid ${T.red}30`,borderRadius:6,padding:"10px 14px"}}>
            <div style={{...label,marginBottom:3}}>Traditional</div>
            <div style={{fontSize:20,fontWeight:800,color:T.red}}>3–4 weeks</div>
            <div style={{fontSize:10,color:T.dim,marginTop:2}}>Manual data pulls, analyst meetings</div>
          </div>
          <div style={{display:"flex",alignItems:"center",color:T.muted,fontSize:18,padding:"0 4px"}}>→</div>
          <div style={{flex:1,background:T.primaryDim,border:`1px solid ${T.primary}40`,borderRadius:6,padding:"10px 14px"}}>
            <div style={{...label,marginBottom:3}}>Aether AI</div>
            <div style={{fontSize:20,fontWeight:800,color:T.primary}}>2.5 hours</div>
            <div style={{fontSize:10,color:T.dim,marginTop:2}}>Automated diagnostic loop</div>
          </div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {kpis.map(k=><KpiCard key={k.label} {...k}/>)}
      </div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>Revenue: Actual vs Baseline</div>
        <div style={{...mono,color:T.muted,marginBottom:12}}>7-day performance</div>
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={revenueData}>
            <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.primary} stopOpacity={0.28}/><stop offset="95%" stopColor={T.primary} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
            <XAxis dataKey="day" tick={{fontSize:10,fill:T.muted}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:T.muted}} axisLine={false} tickLine={false} tickFormatter={v=>`£${(v/1000).toFixed(1)}k`}/>
            <Tooltip contentStyle={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,fontSize:11}} formatter={v=>`£${v.toLocaleString()}`}/>
            <Area type="monotone" dataKey="baseline" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" fill="none" strokeWidth={1.5}/>
            <Area type="monotone" dataKey="actual" stroke={T.primary} fill="url(#ag)" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div><div style={{fontSize:12,fontWeight:700}}>Root Cause Signals</div><div style={{...mono,color:T.muted,marginTop:2}}>Factors driving volume decline</div></div>
          <span style={tag(T.red)}>4 FACTORS</span>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {signals.map((s,i)=>(
            <div key={i} style={{background:T.bgSec,border:`1px solid ${T.border}`,borderRadius:6,padding:"10px 12px",display:"flex",gap:10}}>
              <Dot status={s.sev}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}>
                  <span style={{fontSize:12,fontWeight:600}}>{s.title}</span>
                  <span style={tag(s.sev==="critical"?T.red:T.yellow)}>{s.sev.toUpperCase()}</span>
                </div>
                <div style={{fontSize:11,color:T.dim,lineHeight:1.5}}>{s.detail}</div>
                <div style={{display:"flex",gap:8,marginTop:5}}>
                  <span style={{...mono,color:T.muted}}>{s.time}</span>
                  <span style={tag(T.primary)}>{s.src}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── NETWORK ───────────────────────────────────────────────────────────────────
function Network(){
  const[sel,setSel]=useState("042");
  const ss=stores.find(s=>s.id===sel);
  return(
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,height:"100%",overflowY:"auto"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {[{l:"Total Stores",v:"50",c:T.primary},{l:"Alerting",v:stores.filter(s=>s.alerts>0).length,c:T.yellow},{l:"Critical",v:stores.filter(s=>s.status==="critical").length,c:T.red}].map(k=>(
          <div key={k.l} style={{...card,textAlign:"center"}}><div style={{...label,marginBottom:6}}>{k.l}</div><div style={{fontSize:26,fontWeight:800,color:k.c}}>{k.v}</div></div>
        ))}
      </div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:10}}>Store Performance</div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {stores.map(s=>(
            <div key={s.id} onClick={()=>setSel(s.id)} style={{background:sel===s.id?T.primaryDim:T.bgSec,border:`1px solid ${sel===s.id?T.primary:T.border}`,borderRadius:6,padding:"9px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}}>
              <Dot status={s.status}/>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>Store #{s.id} — {s.loc}</div><div style={{...mono,color:T.muted,marginTop:1}}>Rev: <span style={{color:s.rev<0?T.red:T.green,fontWeight:700}}>{s.rev>0?"+":""}{s.rev}%</span> · {s.alerts} alerts</div></div>
              <span style={tag(s.status==="critical"?T.red:s.status==="warning"?T.yellow:T.green)}>{s.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
      {ss&&(
        <div style={{...card,borderColor:`${T.primary}40`}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:10}}>Store #{ss.id} — {ss.loc}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[{l:"Revenue Δ",v:`${ss.rev>0?"+":""}${ss.rev}%`,c:ss.rev<0?T.red:T.green},{l:"Alerts",v:ss.alerts,c:ss.alerts>0?T.red:T.green},{l:"Status",v:ss.status.toUpperCase(),c:ss.status==="critical"?T.red:ss.status==="warning"?T.yellow:T.green}].map(m=>(
              <div key={m.l} style={{background:T.bgSec,borderRadius:6,padding:10,textAlign:"center"}}><div style={{...label,marginBottom:4}}>{m.l}</div><div style={{fontSize:16,fontWeight:800,color:m.c}}>{m.v}</div></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── DIAGNOSTICS ───────────────────────────────────────────────────────────────
function Diagnostics(){
  return(
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,height:"100%",overflowY:"auto"}}>
      <div style={card}>
        <div style={{...label,marginBottom:8}}>B. Standardise "What Good Looks Like"</div>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Benchmark: Store #042 vs Peers & Industry</div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 80px",gap:6,padding:"4px 10px",marginBottom:4}}>
          {["Metric","Store","Peer Avg","Industry",""].map(h=><span key={h} style={label}>{h}</span>)}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {benchmarks.map(b=>(
            <div key={b.metric} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 80px",gap:6,alignItems:"center",padding:"8px 10px",background:T.bgSec,borderRadius:6}}>
              <span style={{fontSize:11,fontWeight:600}}>{b.metric}</span>
              <span style={{...mono,color:b.st==="below"?T.red:T.yellow,fontWeight:700}}>{b.store}</span>
              <span style={{...mono,color:T.dim}}>{b.peer}</span>
              <span style={{...mono,color:T.dim}}>{b.industry}</span>
              <span style={tag(b.st==="below"?T.red:T.yellow)}>{b.st.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Diagnostic Tree — Volume Decline</div>
        <div style={{display:"flex",flexDirection:"column",gap:7}}>
          {[{hyp:"Pricing Mismatch",conf:8,verdict:"RULED OUT",c:T.green,detail:"Price index within 2% of peers. Not the primary cause."},{hyp:"Payment System Failure",conf:91,verdict:"CONFIRMED",c:T.red,detail:"Card decline rate 4.2% vs 1.8% baseline. £1,800 weekly revenue loss."},{hyp:"People / Service Degradation",conf:87,verdict:"CONFIRMED",c:T.red,detail:"Manager change + 34% staff turnover spike. CSAT down 18%."},{hyp:"Competitor Activity",conf:22,verdict:"LOW PROBABILITY",c:T.yellow,detail:"No new competitor within 1km. Not primary driver."}].map(h=>(
            <div key={h.hyp} style={{background:T.bgSec,borderRadius:6,padding:"10px 12px",border:`1px solid ${T.border}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontSize:12,fontWeight:600}}>{h.hyp}</span><span style={tag(h.c)}>{h.verdict}</span></div>
              <div style={{fontSize:11,color:T.dim,marginBottom:6,lineHeight:1.5}}>{h.detail}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1,height:4,background:T.bgCard,borderRadius:2,overflow:"hidden"}}><div style={{width:`${h.conf}%`,height:"100%",background:h.c,borderRadius:2}}/></div>
                <span style={{...mono,color:h.c,fontWeight:700,minWidth:28}}>{h.conf}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── RECOMMENDATIONS ───────────────────────────────────────────────────────────
function Recommendations(){
  const[approved,setApproved]=useState({});
  return(
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:10,height:"100%",overflowY:"auto"}}>
      <div style={{...card,background:`linear-gradient(135deg,${T.primaryDim},${T.accentDim})`}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Ranked Recommendations — Store #042</div>
        <div style={{fontSize:11,color:T.dim}}>Prioritised by impact vs effort. Approve to track in Transformation.</div>
      </div>
      {recs.map((r,i)=>(
        <div key={i} style={{...card,border:`1px solid ${approved[i]?`${T.green}50`:T.border}`,transition:"all 0.2s"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:8}}>
            <div style={{display:"flex",gap:7,alignItems:"center",flex:1,flexWrap:"wrap"}}>
              <span style={tag(r.pri==="CRITICAL"?T.red:T.yellow)}>{r.pri}</span>
              <span style={{fontSize:13,fontWeight:700}}>{r.title}</span>
            </div>
            <button onClick={()=>setApproved(p=>({...p,[i]:!p[i]}))} style={{...btn(approved[i]?"primary":"secondary"),fontSize:11,padding:"5px 10px",background:approved[i]?T.green:T.bgSec,color:approved[i]?"#fff":T.dim,flexShrink:0}}>{approved[i]?"✓ Approved":"Approve"}</button>
          </div>
          <div style={{fontSize:11,color:T.dim,marginBottom:10,lineHeight:1.55}}>{r.desc}</div>
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            <div><span style={label}>Impact: </span><span style={{fontSize:11,color:T.green,fontWeight:700}}>{r.impact}</span></div>
            <div><span style={label}>Effort: </span><span style={tag(r.effort==="LOW"?T.green:T.yellow)}>{r.effort}</span></div>
            <div><span style={label}>Timeline: </span><span style={{...mono,color:T.dim}}>{r.time}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── DIGITAL TWIN ──────────────────────────────────────────────────────────────
function DigitalTwin(){
  const[price,setPrice]=useState(0);
  const[staff,setStaff]=useState(0);
  const[simulated,setSimulated]=useState(false);
  const results=[
    {m:"Revenue",base:36380,sim:36380+price*500+staff*200,fmt:v=>`£${Math.round(v).toLocaleString()}`},
    {m:"Gross Margin %",base:26.4,sim:26.4-price*0.5+staff*0.2,fmt:v=>`${v.toFixed(1)}%`},
    {m:"CSAT Score",base:3.2,sim:Math.min(5,Math.max(0,3.2+staff*0.3-price*0.1)),fmt:v=>`${v.toFixed(1)}/5`},
    {m:"Labor Cost %",base:32.1,sim:32.1+staff*1.5,fmt:v=>`${v.toFixed(1)}%`},
  ];
  return(
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,height:"100%",overflowY:"auto"}}>
      <div style={card}>
        <div style={{...label,marginBottom:6}}>C. Test Decisions Before Execution</div>
        <div style={{fontSize:12,fontWeight:700,marginBottom:14}}>Digital Twin Simulator — Store #042</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:14}}>
          {[{lbl:"Price Adjustment",val:price,set:setPrice,min:-10,max:10,unit:"%",c:T.primary},{lbl:"Staffing Adjustment",val:staff,set:setStaff,min:-2,max:4,unit:" FTE",c:T.accent}].map(ctrl=>(
            <div key={ctrl.lbl}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:11,fontWeight:600}}>{ctrl.lbl}</span><span style={{...mono,color:ctrl.c,fontWeight:700}}>{ctrl.val>0?"+":""}{ctrl.val}{ctrl.unit}</span></div>
              <input type="range" min={ctrl.min} max={ctrl.max} step={1} value={ctrl.val} onChange={e=>ctrl.set(Number(e.target.value))} style={{width:"100%",accentColor:ctrl.c}}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:2}}><span style={{...mono,color:T.muted}}>{ctrl.min}{ctrl.unit}</span><span style={{...mono,color:T.muted}}>+{ctrl.max}{ctrl.unit}</span></div>
            </div>
          ))}
        </div>
        <button onClick={()=>setSimulated(true)} style={{...btn(),width:"100%",justifyContent:"center",padding:9}}>⬟ Run Simulation</button>
      </div>
      {simulated&&(
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10}}>
            {results.map(r=>{
              const delta=r.sim-r.base;
              const pos=delta>=0;
              return(
                <div key={r.m} style={{...card,border:`1px solid ${pos?`${T.green}40`:`${T.red}40`}`,background:pos?T.greenDim:T.redDim}}>
                  <div style={{...label,marginBottom:4}}>{r.m}</div>
                  <div style={{fontSize:18,fontWeight:800,color:pos?T.green:T.red,marginBottom:3}}>{pos?"+":""}{r.m==="Revenue"?`£${Math.round(delta).toLocaleString()}`:delta.toFixed(1)}</div>
                  <div style={{...mono,color:T.muted}}>{r.fmt(r.base)} → {r.fmt(r.sim)}</div>
                </div>
              );
            })}
          </div>
          <div style={{...card,background:T.primaryDim,border:`1px solid ${T.primary}40`}}>
            <span style={{color:T.primary,fontWeight:700,fontSize:11}}>Simulation complete. </span>
            <span style={{fontSize:11,color:T.dim}}>Net revenue impact: </span>
            <span style={{color:(price*500+staff*200)>=0?T.green:T.red,fontWeight:700,fontSize:11}}>£{Math.round(price*500+staff*200).toLocaleString()}</span>
          </div>
          <div style={card}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:10}}>Digital Twin Dimensions</div>
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart data={twinDims}>
                <PolarGrid stroke="rgba(255,255,255,0.05)"/>
                <PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.muted}}/>
                <Radar name="Current" dataKey="v" stroke={T.primary} fill={T.primary} fillOpacity={0.14} strokeWidth={2}/>
                <Radar name="Baseline" dataKey="base" stroke={T.accent} fill={T.accent} fillOpacity={0.06} strokeWidth={1.5} strokeDasharray="4 4"/>
                <Legend wrapperStyle={{fontSize:10}}/>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

// ── SUPPLY CHAIN ──────────────────────────────────────────────────────────────
function SupplyChain(){
  return(
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,height:"100%",overflowY:"auto"}}>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Supplier Consolidation — Frozen Products</div>
        <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12}}>
          {suppliers.map(s=>(
            <div key={s.name} style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 80px",gap:8,alignItems:"center",background:T.bgSec,borderRadius:6,padding:"9px 12px"}}>
              <span style={{fontSize:12,fontWeight:600}}>{s.name}</span>
              <span style={{...mono,fontWeight:700}}>£{s.price}/unit</span>
              <span style={{...mono,color:T.dim}}>{s.vol}% vol</span>
              <span style={tag(s.status==="LOW"?T.green:s.status==="MID"?T.yellow:T.red)}>{s.status}</span>
            </div>
          ))}
        </div>
        <div style={{background:T.greenDim,border:`1px solid ${T.green}40`,borderRadius:6,padding:"10px 12px"}}>
          <div style={{fontSize:11,fontWeight:700,color:T.green,marginBottom:3}}>Consolidation Opportunity</div>
          <div style={{fontSize:11,color:T.dim,lineHeight:1.55}}>Consolidate to Supplier C (£1.52/unit): <strong style={{color:T.green}}>£89,280/year savings</strong>. Recommended: 70% C + 30% B for supply security.</div>
        </div>
      </div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Central Kitchen Harmonization</div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {kitchens.map(k=>(
            <div key={k.loc} style={{background:T.bgSec,borderRadius:6,padding:"10px 12px",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:600,marginBottom:5}}>{k.loc}</div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1,height:4,background:T.bgCard,borderRadius:2,overflow:"hidden"}}><div style={{width:`${k.prod}%`,height:"100%",background:k.c,borderRadius:2}}/></div>
                  <span style={{...mono,color:T.muted,minWidth:24}}>{k.prod}%</span>
                </div>
              </div>
              <span style={{...mono,fontWeight:700}}>£{k.cost}M/yr</span>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[{l:"Annual Savings",v:"£1.6M",c:T.green},{l:"Investment",v:"£500K",c:T.yellow},{l:"Payback",v:"3.7 months",c:T.accent}].map(m=>(
            <div key={m.l} style={{background:T.bgSec,borderRadius:6,padding:10,textAlign:"center"}}><div style={{...label,marginBottom:4}}>{m.l}</div><div style={{fontSize:14,fontWeight:800,color:m.c}}>{m.v}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TRANSFORMATION ────────────────────────────────────────────────────────────
function Transformation(){
  return(
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,height:"100%",overflowY:"auto"}}>
      <div style={card}>
        <div style={{...label,marginBottom:6}}>D. Track Value Realization</div>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Expected vs Actual — Cumulative Value</div>
        <ResponsiveContainer width="100%" height={195}>
          <LineChart data={valueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
            <XAxis dataKey="week" tick={{fontSize:10,fill:T.muted}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:T.muted}} axisLine={false} tickLine={false} tickFormatter={v=>`£${v/1000}k`}/>
            <Tooltip contentStyle={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,fontSize:11}} formatter={v=>`£${v.toLocaleString()}`}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Line type="monotone" dataKey="expected" stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" strokeWidth={2} name="Expected"/>
            <Line type="monotone" dataKey="actual" stroke={T.primary} strokeWidth={2.5} name="Actual" dot={{fill:T.primary,r:4}}/>
          </LineChart>
        </ResponsiveContainer>
        <div style={{background:T.redDim,border:`1px solid ${T.red}40`,borderRadius:6,padding:"9px 12px",marginTop:10}}>
          <span style={{color:T.red,fontWeight:700,fontSize:11}}>⚠ Value Gap: </span>
          <span style={{fontSize:11,color:T.dim}}>Initiatives delivering 72% of expected value. Decision workflows triggered.</span>
        </div>
      </div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Initiative Status</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {initiatives.map((init,i)=>(
            <div key={i} style={{background:init.status==="under"?T.redDim:T.greenDim,border:`1px solid ${(init.status==="under"?T.red:T.green)}40`,borderRadius:6,padding:"11px 12px"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <div><div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{init.name}</div><div style={{...mono,color:T.muted}}>Expected: {init.expected} | Actual: {init.actual}</div></div>
                <span style={tag(init.status==="under"?T.red:T.green)}>{init.status==="under"?"UNDERPERFORMING":"ON-TRACK"}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{flex:1,height:4,background:T.bgCard,borderRadius:2,overflow:"hidden"}}><div style={{width:`${init.pct}%`,height:"100%",background:init.status==="under"?T.red:T.green,borderRadius:2}}/></div>
                <span style={{...mono,color:T.muted,minWidth:28}}>{init.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const[page,setPage]=useState("assistant");
  const pages={assistant:<AssistantPage/>,dashboard:<Dashboard/>,network:<Network/>,diagnostics:<Diagnostics/>,recommendations:<Recommendations/>,twin:<DigitalTwin/>,supply:<SupplyChain/>,transformation:<Transformation/>};
  return(
    <>
      <style>{GS}</style>
      <div style={{display:"flex",height:"100vh",background:T.bg,fontFamily:"'Inter',system-ui,sans-serif",color:T.text,overflow:"hidden"}}>
        {/* Sidebar */}
        <aside style={{width:218,flexShrink:0,background:T.bgCard,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${T.primary},${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",flexShrink:0}}>Æ</div>
            <div><div style={{fontSize:13,fontWeight:800,letterSpacing:-0.4,lineHeight:1}}>Aether</div><div style={{...mono,color:T.accent,marginTop:2,fontSize:9,letterSpacing:1}}>ENTERPRISE AI</div></div>
          </div>
          <div style={{padding:"10px 12px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{...label,marginBottom:5}}>Active Store</div>
            <div style={{background:T.bgSec,borderRadius:5,padding:"7px 10px",fontSize:11,fontWeight:600,border:`1px solid ${T.border}`}}>Store #042 — London</div>
          </div>
          <div style={{padding:"7px 14px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:6,height:6,borderRadius:"50%",background:T.green,display:"inline-block",animation:"pulse 2s infinite"}}/>
              <span style={{...mono,color:T.accent,fontSize:10}}>TWIN ACTIVE · LIVE</span>
            </div>
          </div>
          <nav style={{flex:1,padding:8,overflowY:"auto",display:"flex",flexDirection:"column",gap:1}}>
            {NAV.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:6,border:"none",cursor:"pointer",textAlign:"left",width:"100%",transition:"all 0.12s",background:page===n.id?T.primaryDim:"transparent",color:page===n.id?T.primary:T.dim,fontWeight:page===n.id?600:400,fontSize:12,fontFamily:"inherit"}}>
                <span style={{fontSize:12,opacity:0.65,width:14,textAlign:"center",flexShrink:0}}>{n.icon}</span>
                {n.label}
                {page===n.id&&<div style={{marginLeft:"auto",width:2.5,height:14,borderRadius:2,background:T.primary}}/>}
              </button>
            ))}
          </nav>
          <div style={{padding:"10px 12px",borderTop:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:T.primaryDim,border:`1px solid ${T.primary}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:T.primary,flexShrink:0}}>BZ</div>
              <div><div style={{fontSize:11,fontWeight:600}}>Biz Ops Team</div><div style={{...mono,color:T.muted,fontSize:9}}>INSIGHTS & PLANNING</div></div>
            </div>
            <div style={{display:"flex",justifyContent:"center"}}>
              <span style={{...mono,fontSize:9,letterSpacing:2,padding:"3px 14px",borderRadius:20,border:`1px solid ${T.primary}40`,color:T.primary,background:T.primaryDim}}>DEMO</span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{height:50,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0,background:T.bgCard}}>
            <div><div style={{fontSize:13,fontWeight:700}}>{TITLES[page]}</div><div style={{...mono,color:T.muted,fontSize:10}}>Store #042 · Updated 2 min ago</div></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{...tag(T.red),display:"flex",alignItems:"center",gap:5}}><span style={{width:5,height:5,borderRadius:"50%",background:T.red,display:"inline-block"}}/>4 ALERTS</div>
              <div style={tag(T.primary)}>CLAUDE POWERED</div>
            </div>
          </div>
          <div style={{flex:1,overflow:"hidden",display:"flex"}}>{pages[page]}</div>
        </main>
      </div>
    </>
  );
}
