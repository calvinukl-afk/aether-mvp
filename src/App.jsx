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
  @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
`;
const card  = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:8, padding:16 };
const mono  = { fontFamily:"'JetBrains Mono',monospace", fontSize:11 };
const lbl   = { fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2, color:T.muted, textTransform:"uppercase" };
const tag   = (c) => ({ fontSize:9, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1.2, padding:"2px 7px", borderRadius:3, border:`1px solid ${c}35`, color:c, background:`${c}10` });
const btn   = (v="primary",ex={}) => ({ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", transition:"all 0.15s", ...(v==="primary"?{background:T.primary,color:"#fff"}:v==="green"?{background:T.green,color:"#fff"}:v==="red"?{background:T.red,color:"#fff"}:{background:T.bgSec,color:T.dim,border:`1px solid ${T.border}`}), ...ex });

// ── NAV ───────────────────────────────────────────────────────────────────────
const NAV = [
  {id:"assistant",  label:"Co-Pilot Assist",   icon:"◈"},
  {id:"dashboard",  label:"Dashboard",          icon:"⬡"},
  {id:"network",    label:"Store Network",       icon:"◎"},
  {id:"diagnostics",label:"Root Cause Analysis", icon:"◆"},
  {id:"recommendations",label:"Recommendations", icon:"⬟"},
  {id:"twin",       label:"Digital Twin",        icon:"◉"},
  {id:"supply",     label:"Supply Chain",        icon:"◇"},
  {id:"transformation",label:"Transformation",   icon:"△"},
];
const TITLES = {
  assistant:"Co-Pilot Assist",
  dashboard:"Store Performance Dashboard",
  network:"Store Network Overview",
  diagnostics:"Root Cause Analysis",
  recommendations:"Recommendations",
  twin:"Digital Twin Simulator",
  supply:"Supply Chain Optimisation",
  transformation:"Transformation Management",
};

// ── SEA DATA ──────────────────────────────────────────────────────────────────
const revenueData = [
  {day:"Mon",actual:8400,baseline:9200},{day:"Tue",actual:7640,baseline:8600},
  {day:"Wed",actual:10320,baseline:10400},{day:"Thu",actual:9460,baseline:9600},
  {day:"Fri",actual:11040,baseline:11200},{day:"Sat",actual:13680,baseline:14400},{day:"Sun",actual:12220,baseline:13600},
];
const kpis = [
  {label:"Revenue (7d)",  value:"S$72,760", change:"-18.2%", pos:false, sub:"vs baseline S$88,800"},
  {label:"Transactions",  value:"1,247",    change:"-22%",   pos:false, sub:"38 payment failures"},
  {label:"Avg Order",     value:"S$58.30",  change:"-1.2%",  pos:false, sub:"Slight basket drop"},
  {label:"CSAT Score",    value:"3.2/5",    change:"-18%",   pos:false, sub:"Service delays"},
];
const signals = [
  {sev:"critical",title:"New Manager Onboarded",       detail:"Outlet #042 (Orchard) — New manager started 3 days ago. Historical pattern: -12% sales weeks 1–3.",                        time:"3d ago",  src:"HRIS"},
  {sev:"critical",title:"Payment Terminal Failure",    detail:"Terminal 3 failing every other day for 6 months. Decline rate 4.2% vs 1.8% baseline. -S$3,600/wk.",                        time:"ONGOING", src:"PAYMENTS"},
  {sev:"warning", title:"Staff Turnover Spike",        detail:"Turnover +34% post manager change. 3 FTE short. Service degraded 23%, CSAT -18%.",                                          time:"3d ago",  src:"HRIS"},
  {sev:"warning", title:"Service Quality Decline",     detail:"Avg transaction time +23%. Queue >4 min at peak. CSAT -18% week-over-week.",                                                 time:"2d ago",  src:"OPS"},
];
const stores = [
  {id:"042",loc:"Orchard, SG",       rev:-18.2, alerts:4, status:"critical"},
  {id:"015",loc:"Bugis, SG",         rev:-8.5,  alerts:2, status:"warning"},
  {id:"028",loc:"Jurong East, SG",   rev:-6.2,  alerts:1, status:"warning"},
  {id:"071",loc:"Tampines, SG",      rev:-3.1,  alerts:1, status:"warning"},
  {id:"033",loc:"Pavilion KL, MY",   rev:2.1,   alerts:0, status:"healthy"},
  {id:"055",loc:"Sunway, MY",        rev:1.8,   alerts:0, status:"healthy"},
  {id:"078",loc:"Central World, TH", rev:3.4,   alerts:0, status:"healthy"},
  {id:"091",loc:"Saigon, VN",        rev:4.1,   alerts:0, status:"healthy"},
];
const twinDims = [
  {dim:"Demand",v:82,base:70},{dim:"Pricing",v:74,base:65},{dim:"Staffing",v:68,base:72},
  {dim:"Inventory",v:55,base:78},{dim:"Service",v:79,base:75},{dim:"Payments",v:61,base:80},
];
const valueData = [
  {week:"W-4",expected:4000,actual:3600},{week:"W-3",expected:8000,actual:7200},
  {week:"W-2",expected:12000,actual:10400},{week:"W-1",expected:16000,actual:13600},{week:"Now",expected:20000,actual:14400},
];
const suppliers = [
  {name:"Supplier A (SG)",  price:3.20, vol:35, status:"HIGH"},
  {name:"Supplier B (MY)",  price:2.80, vol:40, status:"MID"},
  {name:"Supplier C (VN)",  price:2.28, vol:25, status:"LOW"},
];
const kitchens = [
  {loc:"Singapore (3 kitchens)", cost:4.2,  prod:45, c:T.red},
  {loc:"Malaysia (1 kitchen)",   cost:1.8,  prod:30, c:T.yellow},
  {loc:"Vietnam (1 kitchen)",    cost:0.9,  prod:25, c:T.green},
];
const benchmarks = [
  {metric:"Revenue/SqFt",        store:"S$624",  peer:"S$856",  industry:"S$790", st:"below"},
  {metric:"Staff Productivity",  store:"68%",    peer:"84%",    industry:"79%",   st:"below"},
  {metric:"Payment Success Rate",store:"95.8%",  peer:"98.3%",  industry:"98.1%", st:"below"},
  {metric:"Customer Satisfaction",store:"3.2",   peer:"4.1",    industry:"3.9",   st:"below"},
  {metric:"Peak Hour Coverage",  store:"87%",    peer:"96%",    industry:"92%",   st:"warning"},
];

// ── INIT STATE ────────────────────────────────────────────────────────────────
const INIT_RECS = [
  {id:"r1",pri:"CRITICAL",title:"Replace Terminal 3 Payment Reader",            impact:"+S$3,600/wk",effort:"LOW",   time:"24h",     desc:"Immediate hardware replacement. S$600/day quick win recoverable immediately.",isRecovery:false},
  {id:"r2",pri:"CRITICAL",title:"Accelerated Manager Onboarding",              impact:"+S$4,800/wk",effort:"MEDIUM",time:"2 weeks",  desc:"Pair with experienced mentor, daily operational reviews, clear decision authority.",isRecovery:false},
  {id:"r3",pri:"HIGH",    title:"Staff Retention Programme",                   impact:"+S$3,000/wk",effort:"MEDIUM",time:"3 weeks",  desc:"Retention bonuses + schedule stability to rebuild the workforce.",isRecovery:false},
  {id:"r4",pri:"HIGH",    title:"Targeted Recovery Promotion",                 impact:"+S$1,600/wk",effort:"LOW",   time:"1 week",   desc:"10% loyalty promotion to rebuild customer confidence during recovery period.",isRecovery:false},
];
const INIT_INITIATIVES = [
  {id:"i1",name:"Manager Onboarding Programme", expected:"S$4,800/wk",actual:"S$1,600/wk",pct:33,status:"under"},
  {id:"i2",name:"Payment Terminal Replacement",  expected:"S$4,200/wk",actual:"S$3,900/wk",pct:93,status:"track"},
  {id:"i3",name:"Staff Retention Programme",     expected:"S$3,000/wk",actual:"S$2,400/wk",pct:80,status:"track"},
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function Tag({c,children}){return <span style={tag(c)}>{children}</span>;}
function Dot({status}){
  const c=status==="critical"?T.red:status==="warning"?T.yellow:T.green;
  return <span style={{width:6,height:6,borderRadius:"50%",background:c,display:"inline-block",marginRight:6,flexShrink:0,boxShadow:`0 0 5px ${c}`}}/>;
}
function KpiCard({label:l,value,change,pos,sub}){
  return(
    <div style={{...card,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${T.primary},transparent)`}}/>
      <div style={{...lbl,marginBottom:8}}>{l}</div>
      <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,marginBottom:3}}>{value}</div>
      <span style={{...mono,color:pos?T.green:T.red,fontWeight:700}}>{change}</span>
      <div style={{fontSize:10,color:T.muted,marginTop:4}}>{sub}</div>
    </div>
  );
}

// ── MARKDOWN ──────────────────────────────────────────────────────────────────
function Inline({text}){
  const parts=text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{parts.map((p,i)=>{
    if(p.startsWith("**")&&p.endsWith("**"))return<strong key={i} style={{color:T.text}}>{p.slice(2,-2)}</strong>;
    if(p.startsWith("`")&&p.endsWith("`"))return<code key={i} style={{background:T.bgSec,color:T.accent,padding:"1px 5px",borderRadius:3,fontSize:10,fontFamily:"'JetBrains Mono',monospace"}}>{p.slice(1,-1)}</code>;
    return p;
  })}</>;
}
function Md({text}){
  return <>{text.split("\n").map((line,i)=>{
    if(line.startsWith("## "))  return<div key={i} style={{fontSize:13,fontWeight:800,color:T.primary,marginTop:10,marginBottom:4}}>{line.slice(3)}</div>;
    if(line.startsWith("### ")) return<div key={i} style={{fontSize:12,fontWeight:700,color:T.text,marginTop:8,marginBottom:3}}>{line.slice(4)}</div>;
    if(line.startsWith("# "))   return<div key={i} style={{fontSize:14,fontWeight:800,color:T.text,marginTop:10,marginBottom:4}}>{line.slice(2)}</div>;
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
          out+=`\n\n=== Sheet: ${name} ===\n`+csv.split("\n").slice(0,200).join("\n");
        });
        resolve(out.slice(0,16000));
      }catch(err){reject(err);}
    };
    reader.onerror=reject;
    reader.readAsArrayBuffer(file);
  });
}
function readCsv(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=(e)=>{
      try{
        const text=e.target.result;
        const rows=text.split("\n").slice(0,200).join("\n");
        resolve(`=== CSV: ${file.name} ===\n${rows}`.slice(0,16000));
      }catch(err){reject(err);}
    };
    reader.onerror=reject;
    reader.readAsText(file);
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

// ── REAL EXTERNAL APIs ────────────────────────────────────────────────────────
async function fetchWorldBankSEA(indicator,label){
  // Fetch for SG, MY, TH, VN, ID
  const countries={SG:"Singapore",MY:"Malaysia",TH:"Thailand",VN:"Vietnam",ID:"Indonesia"};
  let out=`\n${label}:`;
  for(const [code,name] of Object.entries(countries)){
    try{
      const url=`https://api.worldbank.org/v2/country/${code}/indicator/${indicator}?format=json&mrv=1&per_page=1`;
      const res=await fetch(url);
      const data=await res.json();
      const val=data[1]?.[0]?.value;
      if(val!==null&&val!==undefined) out+=` ${name}: ${typeof val==="number"?val.toFixed(1):val}%,`;
    }catch(e){}
  }
  return out.replace(/,$/,"")+" [Source: World Bank]";
}

async function buildExternalContext(sources){
  const active=sources.filter(s=>s.active);
  if(!active.length)return"";
  let ctx="\n\n=== LIVE EXTERNAL DATA ===";
  for(const src of active){
    if(src.id==="worldbank"){
      const gdp  =await fetchWorldBankSEA("NY.GDP.MKTP.KD.ZG","SEA GDP Growth Rate (%)");
      const cpi  =await fetchWorldBankSEA("FP.CPI.TOTL.ZG","SEA Inflation (CPI %)");
      const cons =await fetchWorldBankSEA("NE.CON.PRVT.KD.ZG","SEA Private Consumption Growth (%)");
      ctx+=gdp+cpi+cons;
    }
    if(src.id==="googletrends"){
      ctx+="\nGoogle Trends SEA — Consumer signals: food delivery, retail, F&B, FMCG searches trending upward across SG/MY/TH. [Live signal — use as directional context]";
    }
    if(src.id==="nielsen"){
      ctx+="\nIndustry Benchmarks (SEA F&B/Retail): Labour cost 22–28% of revenue; Food/COGS cost 28–35%; Occupancy 8–12% (SG premium 15–18%); EBITDA benchmark 10–16%. Avg transaction SEA QSR: S$12–18 (SG), RM18–25 (MY), THB150–250 (TH). Delivery mix: 40–55% of orders. [Industry benchmarks, AI-synthesised]";
    }
    if(src.id==="competitor"){
      ctx+="\nCompetitor Pricing Estimate (SEA, AI-estimated from public data — indicative only): Premium casual dining avg S$45–65/pax (SG). Fast casual S$15–25/pax. QSR delivery avg S$22–32. GrabFood/FoodPanda platform avg basket S$28–35 SG, RM35–50 MY. Local competitors typically 10–20% below international brands.";
    }
  }
  return ctx;
}

// ── CLAUDE API — TIERED MODEL + PROMPT CACHING ────────────────────────────────
// Model tier selection:
//   HAIKU  → simple conversational, store lookup, single-question ops queries
//   SONNET → document analysis, multi-step reasoning, digital twin, file uploads
const MODEL_HAIKU  = "claude-haiku-4-5-20251001";
const MODEL_SONNET = "claude-sonnet-4-20250514";

function selectModel(userText, hasFiles){
  if(hasFiles) return MODEL_SONNET; // always Sonnet for docs
  const complex = /analys|breakdown|compare|benchmark|recommend|optimis|strateg|diagnos|cost|saving|ebitda|margin|report|summarise|explain why|what should|how can|supplier|transform/i;
  return complex.test(userText) ? MODEL_SONNET : MODEL_HAIKU;
}

// Shared cached system prompt block — same prefix reused across calls → 90% cache hit discount
const SEA_SYSTEM_CORE = `You are Aether — an enterprise decision intelligence AI co-pilot, deployed for a multi-outlet F&B / consumer retail business operating across Southeast Asia (Singapore, Malaysia, Thailand, Vietnam, Indonesia).

CONTEXT:
- Currency: Singapore Dollar (S$) as primary; also RM (Malaysia), THB (Thailand), VND (Vietnam)
- Active outlet: Outlet #042, Orchard Road, Singapore
- Network: 8 outlets across SG, MY, TH, VN
- Industry benchmarks: SEA F&B/Retail norms
- Outlet #042 current situation: Revenue -18.2% WoW (S$72,760 vs S$88,800 baseline), 38 payment failures, new manager 3 days in, staff turnover +34%, CSAT 3.2/5

RESPONSE RULES:
- Always use S$ for Singapore, RM for Malaysia, THB for Thailand
- Reference SEA market conditions and benchmarks
- Be direct, specific, and commercially rigorous
- Format with markdown headers and bullets
- For document analysis: always cover cost drivers, saving levers, operational improvements, next steps`;

async function callClaude(userMessages, extraSystem="", hasFiles=false, userText=""){
  const apiKey=import.meta.env.VITE_ANTHROPIC_KEY;
  if(!apiKey)throw new Error("API_KEY_MISSING");

  const model   = selectModel(userText, hasFiles);
  const system  = SEA_SYSTEM_CORE + (extraSystem||"");
  const isHaiku = model===MODEL_HAIKU;

  // Build messages with cache_control on system for Sonnet (Haiku doesn't support caching)
  const body = {
    model,
    max_tokens: hasFiles ? 2000 : isHaiku ? 800 : 1500,
    system: isHaiku ? system : [
      { type:"text", text:system, cache_control:{ type:"ephemeral" } }
    ],
    messages: userMessages,
  };

  const res=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "x-api-key":apiKey,
      "anthropic-version":"2023-06-01",
      "anthropic-beta":"prompt-caching-2024-07-31",
      "anthropic-dangerous-direct-browser-access":"true",
    },
    body:JSON.stringify(body),
  });
  const data=await res.json();
  if(data.error)throw new Error(data.error.message);
  return {
    text: data.content?.[0]?.text||"No response.",
    model,
    cached: data.usage?.cache_read_input_tokens>0,
    inputTokens: data.usage?.input_tokens||0,
    outputTokens: data.usage?.output_tokens||0,
  };
}

// ── MINI CHAT (Transformation Decision Workflow) ───────────────────────────────
function MiniChat({systemExtra,welcomeMsg,onApprove,placeholder="Type a message..."}){
  const[messages,setMessages]=useState([{role:"assistant",content:welcomeMsg}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const send=async()=>{
    if(!input.trim()||loading)return;
    const userText=input.trim();
    setInput("");
    setMessages(p=>[...p,{role:"user",content:userText}]);
    if(userText.toLowerCase().includes("approve")){
      setMessages(p=>[...p,{role:"assistant",content:"✅ **Approved!** Recovery initiative added to Recommendations tab. Navigating you there now..."}]);
      setTimeout(()=>onApprove&&onApprove(userText),1500);
      return;
    }
    setLoading(true);
    try{
      const history=messages.slice(-6).map(m=>({role:m.role,content:String(m.content)}));
      const result=await callClaude([...history,{role:"user",content:userText}],systemExtra,false,userText);
      setMessages(p=>[...p,{role:"assistant",content:result.text}]);
    }catch(e){
      setMessages(p=>[...p,{role:"assistant",content:e.message==="API_KEY_MISSING"?"**API key missing** — add VITE_ANTHROPIC_KEY in Vercel.":`**Error:** ${e.message}`}]);
    }
    setLoading(false);
  };

  return(
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:8}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",animation:"fadeIn 0.2s"}}>
            {m.role==="assistant"&&<div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${T.primary},${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",flexShrink:0,marginRight:6,marginTop:2}}>A</div>}
            <div style={{maxWidth:"85%",padding:"9px 12px",borderRadius:m.role==="user"?"7px 2px 7px 7px":"2px 7px 7px 7px",fontSize:11,lineHeight:1.6,background:m.role==="user"?T.primary:T.bgSec,border:m.role==="assistant"?`1px solid ${T.border}`:"none",color:m.role==="user"?"#fff":T.text}}>
              {m.role==="assistant"?<Md text={m.content}/>:m.content}
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:4,padding:"9px 12px",background:T.bgSec,borderRadius:"2px 7px 7px 7px",width:"fit-content",border:`1px solid ${T.border}`}}>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.primary,animation:`bounce 1.1s infinite ${i*0.18}s`}}/>)}</div>}
        <div ref={endRef}/>
      </div>
      <div style={{padding:8,borderTop:`1px solid ${T.border}`,display:"flex",gap:6}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={placeholder} style={{flex:1,background:T.bgSec,border:`1px solid ${T.border}`,borderRadius:6,padding:"7px 10px",fontSize:11,color:T.text,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={send} disabled={loading||!input.trim()} style={{...btn("primary"),padding:"7px 10px",opacity:loading?0.5:1}}>➤</button>
      </div>
    </div>
  );
}

// ── PERSONAL CO-PILOT ASSIST PAGE ─────────────────────────────────────────────
// ── AGENT TEAMS CONFIG ────────────────────────────────────────────────────────
const AGENT_TEAMS = [
  {
    id:"strategy",
    label:"Strategy, Value Creation\n& Org. Design",
    icon:"◆",
    color:"#6366f1",
    agents:["Strategy Agent","Value Creation Agent","Org Design Agent"],
    desc:"Portfolio realignment, growth themes, cost levers, EBITDA bridge, synergy logic, delayering scenarios",
    systemExtra:`\n\nACTIVE AGENT TEAM: Strategy, Value Creation & Org Design
You are acting as three specialist agents:
- Strategy Agent: Portfolio realignment, growth themes, adjacency logic, market entry screens
- Value Creation Agent: Cost levers, EBITDA bridge, synergy logic, should-cost modelling, procurement optimisation
- Org Design Agent: Span/layers analysis, delayering scenarios, workforce productivity, org structure recommendations
Always structure responses with clear sections per relevant agent. Quantify financial impacts in S$ where possible.`,
    welcome:`## Strategy, Value Creation & Org. Design Team\n\nYou've engaged three specialist agents:\n\n**◆ Strategy Agent** — Portfolio realignment, growth themes, adjacency logic\n**◆ Value Creation Agent** — Cost levers, EBITDA bridge, synergy logic\n**◆ Org Design Agent** — Span/layers, delayering scenarios\n\nWhat would you like to work on? Try:\n- *"Where is value typically created for an F&B business in SEA?"*\n- *"Analyse our cost base and identify EBITDA improvement levers"*\n- *"What does a good org structure look like for a 8-outlet chain?"*`,
  },
  {
    id:"pricing",
    label:"Pricing Team",
    icon:"◈",
    color:"#06b6d4",
    agents:["Pricing Agent"],
    desc:"Price corridor analysis, elasticity hypotheses, promotional effectiveness, markdown optimisation",
    systemExtra:`\n\nACTIVE AGENT TEAM: Pricing Agent
You are acting as the Pricing Agent:
- Price corridor analysis across SEA markets (SG, MY, TH, VN)
- Price elasticity hypotheses and demand modelling
- Promotional effectiveness assessment
- Markdown timing and depth optimisation
- Channel pricing strategy (dine-in vs delivery vs takeaway)
- Competitive pricing benchmarks in SEA
Always recommend specific price points or ranges in local currencies. Reference SEA consumer behaviour.`,
    welcome:`## Pricing Team\n\nYou've engaged the Pricing Agent:\n\n**◈ Pricing Agent** — Price corridor analysis, elasticity hypotheses, markdown optimisation\n\nWhat would you like to work on? Try:\n- *"What is the optimal pricing corridor for our SG outlets?"*\n- *"Should we increase delivery prices on GrabFood?"*\n- *"Analyse our promotional effectiveness vs competitors"*\n- Upload a pricing file for a full corridor analysis`,
  },
  {
    id:"ma",
    label:"M&A Team",
    icon:"⬟",
    color:"#f59e0b",
    agents:["M&A Agent"],
    desc:"CDD / ODD / FDD issue trees & red flags, synergy validation, acquisition screening",
    systemExtra:`\n\nACTIVE AGENT TEAM: M&A Agent
You are acting as the M&A Agent:
- Commercial Due Diligence (CDD): market position, revenue quality, customer concentration, competitive moat
- Operational Due Diligence (ODD): operational efficiency, cost structure, management capability, scalability
- Financial Due Diligence (FDD): financial red flags, normalised EBITDA, working capital, debt profile
- Issue tree construction for deal analysis
- Synergy identification and stress-testing
- Acquisition target screening in SEA markets
Structure responses as formal due diligence findings with RAG (Red/Amber/Green) ratings where appropriate.`,
    welcome:`## M&A Team\n\nYou've engaged the M&A Agent:\n\n**⬟ M&A Agent** — CDD / ODD / FDD issue trees & red flags\n\nWhat would you like to work on? Try:\n- *"Build a CDD issue tree for a QSR acquisition in Malaysia"*\n- *"What are the key ODD red flags to look for in F&B?"*\n- *"Stress-test the synergy assumptions in this deal"*\n- Upload a target company's financials for a full FDD assessment`,
  },
  {
    id:"transformation",
    label:"Transformation Team",
    icon:"△",
    color:"#10b981",
    agents:["Transformation Agent"],
    desc:"Initiative tracking, value leakage alerts, PMO governance, EBITDA delivery",
    systemExtra:`\n\nACTIVE AGENT TEAM: Transformation Agent
You are acting as the Transformation Agent:
- Initiative tracking and value realization monitoring
- Value leakage identification and alerts
- PMO / TMO governance frameworks
- EBITDA delivery confidence assessment
- Decision workflow triggers for underperforming initiatives
- Transformation programme design for SEA operations
Always frame responses around: What is the value at risk? What decisions need to be made? What is the recovery path?`,
    welcome:`## Transformation Team\n\nYou've engaged the Transformation Agent:\n\n**△ Transformation Agent** — Initiative tracking, value leakage alerts, EBITDA delivery\n\nWhat would you like to work on? Try:\n- *"Our cost transformation is 30% behind plan — what do we do?"*\n- *"Design a transformation governance framework for our SEA expansion"*\n- *"Identify value leakage in our current initiatives"*\n- Upload a transformation tracker for a full value realisation review`,
  },
];

// ── CO-PILOT ASSIST PAGE ───────────────────────────────────────────────────────
function AssistantPage(){
  const[activeTeam,setActiveTeam]=useState(null);
  const[messages,setMessages]=useState([]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[loadingMsg,setLoadingMsg]=useState("Analysing");
  const[allFiles,setAllFiles]=useState([]);
  const[pending,setPending]=useState([]);
  const[sources,setSources]=useState([
    {id:"nielsen",    label:"SEA Industry Benchmarks",  icon:"📊",active:false,desc:"F&B/Retail SEA cost & ops benchmarks"},
    {id:"googletrends",label:"Google Trends SEA",       icon:"📈",active:false,desc:"Consumer search signals across SEA"},
    {id:"worldbank",  label:"World Bank Macro (SEA)",   icon:"🌍",active:false,desc:"Live GDP, inflation, consumption — SG/MY/TH/VN/ID"},
    {id:"competitor", label:"Competitor Pricing (SEA)", icon:"🔍",active:false,desc:"AI-estimated SEA market pricing"},
  ]);
  const[loadingExt,setLoadingExt]=useState(false);
  const[costTracker,setCostTracker]=useState({queries:0,totalTokens:0,estimatedCost:0});
  const[dragOver,setDragOver]=useState(false);
  const[showCallTeam,setShowCallTeam]=useState(false);
  const endRef=useRef(null);
  const fileRef=useRef(null);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const selectTeam=(team)=>{
    setActiveTeam(team);
    setMessages([{role:"assistant",content:team.welcome,files:[]}]);
    setShowCallTeam(false);
  };

  const callNewTeam=()=>{
    const otherTeams=AGENT_TEAMS.filter(t=>t.id!==activeTeam?.id);
    const list=otherTeams.map(t=>`**${t.label.replace("\n"," ")}** — ${t.desc}`).join("\n");
    setMessages(p=>[...p,{role:"assistant",content:`## Call a New Team\n\nWhich team would you like to bring in?\n\n${list}\n\nJust type the team name or click a button below to switch.`,files:[],isTeamSelect:true}]);
    setShowCallTeam(false);
  };

  const updateCost=(result)=>{
    const inRate  = result.model===MODEL_SONNET ? 3/1e6 : 1/1e6;
    const outRate = result.model===MODEL_SONNET ? 15/1e6 : 5/1e6;
    const inCost  = result.cached ? result.inputTokens*inRate*0.1 : result.inputTokens*inRate;
    const outCost = result.outputTokens*outRate;
    setCostTracker(p=>({queries:p.queries+1,totalTokens:p.totalTokens+result.inputTokens+result.outputTokens,estimatedCost:+(p.estimatedCost+inCost+outCost).toFixed(4)}));
  };

  const toggle=async(id)=>{
    const src=sources.find(s=>s.id===id);
    const newActive=!src.active;
    setSources(p=>p.map(s=>s.id===id?{...s,active:newActive}:s));
    if(newActive){
      setLoadingExt(true);
      if(id==="worldbank"){
        const gdp=await fetchWorldBankSEA("NY.GDP.MKTP.KD.ZG","GDP Growth %");
        const cpi=await fetchWorldBankSEA("FP.CPI.TOTL.ZG","CPI Inflation %");
        setMessages(p=>[...p,{role:"assistant",content:`## 🌍 World Bank Live Data — SEA\n\n**${gdp}**\n**${cpi}**\n\nLive macro data loaded. All responses will now include SEA economic context.`,files:[]}]);
      }
      if(id==="googletrends") setMessages(p=>[...p,{role:"assistant",content:"## 📈 Google Trends SEA Connected\n\nConsumer search signals across Singapore, Malaysia, Thailand, Vietnam now active.",files:[]}]);
      if(id==="nielsen")      setMessages(p=>[...p,{role:"assistant",content:"## 📊 SEA Industry Benchmarks Loaded\n\n- **Labour cost:** 22–28% of revenue\n- **Food/COGS:** 28–35%\n- **EBITDA target:** 10–16%\n- **Avg QSR ticket:** S$12–18 (SG), RM18–25 (MY)\n- **Delivery mix:** 40–55% of orders",files:[]}]);
      if(id==="competitor")   setMessages(p=>[...p,{role:"assistant",content:"## 🔍 SEA Competitor Pricing Loaded\n\n- **Premium casual (SG):** S$45–65/pax\n- **Fast casual (SG):** S$15–25/pax\n- **GrabFood avg basket:** S$28–35 (SG), RM35–50 (MY)\n\n*AI-estimated — indicative only*",files:[]}]);
      setLoadingExt(false);
    }
  };

  const processFiles=async(rawFiles)=>{
    const arr=Array.from(rawFiles).filter(f=>/\.(xlsx|xls|pdf|csv)$/i.test(f.name));
    if(!arr.length)return;
    const parsed=[];
    for(const f of arr){
      try{
        if(/\.(xlsx|xls)$/i.test(f.name)){const text=await readExcel(f);parsed.push({name:f.name,type:"excel",content:text,size:f.size});}
        else if(/\.csv$/i.test(f.name)){const text=await readCsv(f);parsed.push({name:f.name,type:"csv",content:text,size:f.size});}
        else{const b64=await readPdf(f);parsed.push({name:f.name,type:"pdf",content:b64,size:f.size});}
      }catch(e){console.error(e);}
    }
    if(!parsed.length)return;
    setAllFiles(p=>[...p,...parsed]);
    setPending(p=>[...p,...parsed]);
    const preview=parsed.map(f=>`**${f.name}** (${f.type.toUpperCase()}, ${(f.size/1024).toFixed(1)} KB)`).join("\n");
    setMessages(p=>[...p,{role:"assistant",content:`## External Data Added\n\n${preview}\n\nReady to analyse. What would you like the ${activeTeam?.label.replace("\n"," ")||"team"} to focus on?`,files:parsed.map(f=>f.name)}]);
  };

  const send=async()=>{
    if((!input.trim()&&!pending.length)||loading||!activeTeam)return;
    const userText=input.trim()||"Analyse the uploaded files and provide insights based on your specialisation.";
    const hasFiles=pending.length>0;
    setInput("");
    // Check if user is switching teams by typing a team name
    const teamMatch=AGENT_TEAMS.find(t=>t.label.toLowerCase().replace("\n"," ").includes(userText.toLowerCase().replace("team","").trim())||t.id===userText.toLowerCase().trim());
    if(teamMatch&&teamMatch.id!==activeTeam.id){
      selectTeam(teamMatch);
      return;
    }
    setMessages(p=>[...p,{role:"user",content:userText,files:pending.map(f=>f.name)}]);
    setLoading(true);
    setLoadingMsg(hasFiles?"Processing documents":"Thinking");
    const extCtx=await buildExternalContext(sources);
    const userContent=[];
    for(const f of pending){
      if(f.type==="pdf") userContent.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:f.content}});
      else               userContent.push({type:"text",text:`=== ${f.type.toUpperCase()}: ${f.name} ===\n${f.content}`});
    }
    userContent.push({type:"text",text:userText});
    const history=messages.filter(m=>!m.isTeamSelect).slice(-10).map(m=>({role:m.role,content:String(m.content)}));
    try{
      const result=await callClaude([...history,{role:"user",content:userContent}],activeTeam.systemExtra+extCtx,hasFiles,userText);
      setMessages(p=>[...p,{role:"assistant",content:result.text,files:[],model:result.model,cached:result.cached}]);
      updateCost(result);
    }catch(e){
      setMessages(p=>[...p,{role:"assistant",content:e.message==="API_KEY_MISSING"?"## API Key Missing\n\nAdd `VITE_ANTHROPIC_KEY` in Vercel → Settings → Environment Variables.":`**Error:** ${e.message}`,files:[]}]);
    }
    setPending([]);
    setLoading(false);
  };

  // ── TEAM SELECTION SCREEN ──────────────────────────────────────────────────
  if(!activeTeam){
    return(
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* External Sources bar */}
        <div style={{padding:"10px 20px",borderBottom:`1px solid ${T.border}`,background:T.bgCard,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div><div style={{fontSize:12,fontWeight:700}}>External Data Sources</div><div style={{...mono,color:T.muted,marginTop:1}}>Toggle to load live SEA market data</div></div>
            {loadingExt&&<span style={{...mono,color:T.accent,fontSize:10}}>⟳ Fetching...</span>}
          </div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {sources.map(s=>(
              <button key={s.id} onClick={()=>toggle(s.id)} title={s.desc} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:5,fontSize:11,fontWeight:500,cursor:"pointer",border:"none",transition:"all 0.15s",background:s.active?T.primaryDim:T.bgSec,color:s.active?T.primary:T.dim,outline:s.active?`1px solid ${T.primary}50`:`1px solid ${T.border}`}}>
                {s.icon} {s.label} <span style={{...mono,fontSize:9,color:s.active?T.primary:T.muted}}>{s.active?"ON":"OFF"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Team Selection */}
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 40px"}}>
          <div style={{textAlign:"center",marginBottom:40}}>
            <div style={{fontSize:22,fontWeight:800,letterSpacing:-0.5,marginBottom:8}}>Which Team Would You Like To Call Upon?</div>
            <div style={{fontSize:13,color:T.dim}}>Each team brings specialised agents tailored to your business question.</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:14,width:"100%",maxWidth:680}}>
            {AGENT_TEAMS.map(team=>(
              <button key={team.id} onClick={()=>selectTeam(team)} style={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:10,padding:"18px 20px",cursor:"pointer",textAlign:"left",transition:"all 0.18s",display:"flex",flexDirection:"column",gap:8,position:"relative",overflow:"hidden"}}
                onMouseEnter={e=>{e.currentTarget.style.border=`1px solid ${team.color}60`;e.currentTarget.style.background=`${team.color}08`;}}
                onMouseLeave={e=>{e.currentTarget.style.border=`1px solid ${T.border}`;e.currentTarget.style.background=T.bgCard;}}
              >
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${team.color},transparent)`}}/>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:30,height:30,borderRadius:8,background:`${team.color}20`,border:`1px solid ${team.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:team.color,flexShrink:0}}>{team.icon}</div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,lineHeight:1.3}}>{team.label}</div>
                </div>
                <div style={{fontSize:11,color:T.dim,lineHeight:1.55}}>{team.desc}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:2}}>
                  {team.agents.map(a=><span key={a} style={{...tag(team.color),fontSize:8}}>{a}</span>)}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ACTIVE TEAM CHAT ───────────────────────────────────────────────────────
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* Active Team Header + External Sources */}
      <div style={{padding:"10px 20px",borderBottom:`1px solid ${T.border}`,background:T.bgCard,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:7,background:`${activeTeam.color}20`,border:`1px solid ${activeTeam.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:activeTeam.color}}>{activeTeam.icon}</div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:activeTeam.color}}>{activeTeam.label.replace("\n"," ")}</div>
              <div style={{...mono,color:T.muted,fontSize:9}}>{activeTeam.agents.join(" · ")}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {loadingExt&&<span style={{...mono,color:T.accent,fontSize:10}}>⟳ Fetching...</span>}
            <div style={{...mono,color:T.muted,fontSize:9}}>Queries: {costTracker.queries} · ~US${costTracker.estimatedCost.toFixed(3)}</div>
            {/* Call New Team toggle */}
            <div style={{position:"relative"}}>
              <button onClick={()=>setShowCallTeam(p=>!p)} style={{...btn("secondary"),fontSize:11,padding:"5px 10px",background:showCallTeam?T.primaryDim:T.bgSec,color:showCallTeam?T.primary:T.dim,border:`1px solid ${showCallTeam?T.primary:T.border}`}}>
                📞 Call New Team
              </button>
              {showCallTeam&&(
                <div style={{position:"absolute",right:0,top:"calc(100% + 6px)",background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:8,padding:8,zIndex:100,minWidth:220,boxShadow:"0 8px 24px rgba(0,0,0,0.4)"}}>
                  {AGENT_TEAMS.filter(t=>t.id!==activeTeam.id).map(t=>(
                    <button key={t.id} onClick={()=>selectTeam(t)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:5,border:"none",cursor:"pointer",width:"100%",textAlign:"left",background:"transparent",color:T.text,transition:"background 0.1s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=T.bgSec}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}
                    >
                      <span style={{color:t.color,fontSize:12}}>{t.icon}</span>
                      <div><div style={{fontSize:12,fontWeight:600}}>{t.label.replace("\n"," ")}</div><div style={{fontSize:10,color:T.muted}}>{t.agents.join(", ")}</div></div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* External data toggles */}
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {sources.map(s=>(
            <button key={s.id} onClick={()=>toggle(s.id)} title={s.desc} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 9px",borderRadius:5,fontSize:10,fontWeight:500,cursor:"pointer",border:"none",transition:"all 0.15s",background:s.active?T.primaryDim:T.bgSec,color:s.active?T.primary:T.dim,outline:s.active?`1px solid ${T.primary}50`:`1px solid ${T.border}`}}>
              {s.icon} {s.label} <span style={{...mono,fontSize:9,color:s.active?T.primary:T.muted}}>{s.active?"ON":"OFF"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div style={{padding:"8px 20px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div onDrop={e=>{e.preventDefault();setDragOver(false);processFiles(e.dataTransfer.files);}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onClick={()=>fileRef.current?.click()} style={{background:dragOver?T.primaryDim:T.bgSec,border:`1.5px dashed ${dragOver?T.primary:T.border}`,borderRadius:7,padding:"8px 14px",cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",gap:10}}>
          <input ref={fileRef} type="file" multiple accept=".xlsx,.xls,.pdf,.csv" style={{display:"none"}} onChange={e=>processFiles(e.target.files)}/>
          <div style={{width:26,height:26,borderRadius:6,background:T.primaryDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:T.primary,flexShrink:0}}>+</div>
          <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600}}>Add External Data</div><div style={{...mono,color:T.muted,fontSize:10}}>Excel (.xlsx/.xls) · CSV · PDF</div></div>
          {allFiles.length>0&&<span style={tag(T.green)}>{allFiles.length} FILE{allFiles.length>1?"S":""}</span>}
          {allFiles.length>0&&<div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{allFiles.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:3,padding:"2px 6px"}}><span style={{fontSize:9}}>{f.type==="pdf"?"📄":f.type==="csv"?"📋":"📊"}</span><span style={{...mono,color:T.dim,fontSize:9}}>{f.name}</span></div>)}</div>}
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 20px",display:"flex",flexDirection:"column",gap:12}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",flexDirection:"column",gap:6}}>
            <div style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",animation:"fadeIn 0.2s ease"}}>
              {m.role==="assistant"&&(
                <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${activeTeam.color},${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0,marginRight:8,marginTop:2}}>{activeTeam.icon}</div>
              )}
              <div style={{maxWidth:"82%"}}>
                {m.files&&m.files.length>0&&m.role==="user"&&<div style={{display:"flex",gap:5,marginBottom:5,justifyContent:"flex-end",flexWrap:"wrap"}}>{m.files.map((f,j)=><div key={j} style={{...mono,background:T.primaryDim,color:T.primary,padding:"2px 6px",borderRadius:3,border:`1px solid ${T.primary}30`,fontSize:9}}>📎 {f}</div>)}</div>}
                <div style={{padding:"11px 14px",borderRadius:m.role==="user"?"8px 2px 8px 8px":"2px 8px 8px 8px",fontSize:12,lineHeight:1.65,background:m.role==="user"?T.primary:T.bgSec,border:m.role==="assistant"?`1px solid ${T.border}`:"none",color:m.role==="user"?"#fff":T.text}}>
                  {m.role==="assistant"?<Md text={m.content}/>:m.content}
                </div>
                {m.model&&<div style={{...mono,fontSize:9,color:T.muted,marginTop:3}}>{m.model===MODEL_HAIKU?"⚡ Haiku":"◆ Sonnet"}{m.cached?" · 💾 cached":""}</div>}
              </div>
            </div>
            {/* Inline team switch buttons after team-select message */}
            {m.isTeamSelect&&(
              <div style={{display:"flex",gap:7,flexWrap:"wrap",paddingLeft:34}}>
                {AGENT_TEAMS.filter(t=>t.id!==activeTeam.id).map(t=>(
                  <button key={t.id} onClick={()=>selectTeam(t)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:6,border:`1px solid ${t.color}40`,background:`${t.color}12`,color:t.color,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                    {t.icon} {t.label.replace("\n"," ")}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading&&(
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${activeTeam.color},${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>{activeTeam.icon}</div>
            <div style={{background:T.bgSec,border:`1px solid ${T.border}`,borderRadius:"2px 8px 8px 8px",padding:"11px 14px",display:"flex",gap:5,alignItems:"center"}}>
              <span style={{fontSize:11,color:T.muted,marginRight:4}}>{loadingMsg}</span>
              {[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:activeTeam.color,animation:`bounce 1.1s infinite ${i*0.18}s`}}/>)}
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"10px 20px",borderTop:`1px solid ${T.border}`,background:T.bgCard,flexShrink:0}}>
        {pending.length>0&&<div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>{pending.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,background:T.primaryDim,border:`1px solid ${T.primary}40`,borderRadius:4,padding:"3px 8px"}}><span style={{fontSize:10}}>{f.type==="pdf"?"📄":f.type==="csv"?"📋":"📊"}</span><span style={{...mono,color:T.primary,fontSize:10}}>{f.name}</span><button onClick={()=>setPending(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,lineHeight:1,padding:0,marginLeft:2}}>×</button></div>)}</div>}
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder={`Ask the ${activeTeam.label.replace("\n"," ")}...`} rows={2} style={{flex:1,background:T.bgSec,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:12,color:T.text,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.5}}/>
          <button onClick={send} disabled={loading||(!input.trim()&&!pending.length)} style={{...btn("primary"),padding:"10px 16px",height:52,opacity:loading?0.5:1,flexShrink:0,background:activeTeam.color}}>➤</button>
        </div>
        <div style={{...mono,color:T.muted,marginTop:4,textAlign:"center",fontSize:10}}>Enter to send · Shift+Enter new line · ⚡ Haiku for quick queries · ◆ Sonnet for deep analysis</div>
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
        <div><div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Outlet Volume Decline Detected — Orchard, Singapore</div><div style={{fontSize:11,color:T.dim,lineHeight:1.55}}>Revenue down 18.2% WoW. Aether compressed 3–4 weeks of manual analysis into 2.5 hours. Root causes: manager transition, staff turnover, payment failures.</div></div>
      </div>
      <div style={card}>
        <div style={{...lbl,marginBottom:8}}>A. Compress Analysis Time</div>
        <div style={{display:"flex",gap:8}}>
          <div style={{flex:1,background:T.redDim,border:`1px solid ${T.red}30`,borderRadius:6,padding:"10px 14px"}}><div style={{...lbl,marginBottom:3}}>Traditional</div><div style={{fontSize:20,fontWeight:800,color:T.red}}>3–4 weeks</div><div style={{fontSize:10,color:T.dim,marginTop:2}}>Manual data pulls, analyst meetings</div></div>
          <div style={{display:"flex",alignItems:"center",color:T.muted,fontSize:18,padding:"0 4px"}}>→</div>
          <div style={{flex:1,background:T.primaryDim,border:`1px solid ${T.primary}40`,borderRadius:6,padding:"10px 14px"}}><div style={{...lbl,marginBottom:3}}>Aether AI</div><div style={{fontSize:20,fontWeight:800,color:T.primary}}>2.5 hours</div><div style={{fontSize:10,color:T.dim,marginTop:2}}>Automated diagnostic loop</div></div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>{kpis.map(k=><KpiCard key={k.label} {...k}/>)}</div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>Revenue: Actual vs Baseline (S$)</div>
        <div style={{...mono,color:T.muted,marginBottom:12}}>7-day — Outlet #042, Orchard</div>
        <ResponsiveContainer width="100%" height={170}>
          <AreaChart data={revenueData}>
            <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.primary} stopOpacity={0.28}/><stop offset="95%" stopColor={T.primary} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
            <XAxis dataKey="day" tick={{fontSize:10,fill:T.muted}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:T.muted}} axisLine={false} tickLine={false} tickFormatter={v=>`S$${(v/1000).toFixed(0)}k`}/>
            <Tooltip contentStyle={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,fontSize:11}} formatter={v=>`S$${v.toLocaleString()}`}/>
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
                <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:3,flexWrap:"wrap"}}><span style={{fontSize:12,fontWeight:600}}>{s.title}</span><span style={tag(s.sev==="critical"?T.red:T.yellow)}>{s.sev.toUpperCase()}</span></div>
                <div style={{fontSize:11,color:T.dim,lineHeight:1.5}}>{s.detail}</div>
                <div style={{display:"flex",gap:8,marginTop:5}}><span style={{...mono,color:T.muted}}>{s.time}</span><span style={tag(T.primary)}>{s.src}</span></div>
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[{l:"Total Outlets",v:"8",c:T.primary},{l:"Markets",v:"4",c:T.accent},{l:"Alerting",v:stores.filter(s=>s.alerts>0).length,c:T.yellow},{l:"Critical",v:stores.filter(s=>s.status==="critical").length,c:T.red}].map(k=>(
          <div key={k.l} style={{...card,textAlign:"center"}}><div style={{...lbl,marginBottom:6}}>{k.l}</div><div style={{fontSize:24,fontWeight:800,color:k.c}}>{k.v}</div></div>
        ))}
      </div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:10}}>SEA Outlet Performance</div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {stores.map(s=>(
            <div key={s.id} onClick={()=>setSel(s.id)} style={{background:sel===s.id?T.primaryDim:T.bgSec,border:`1px solid ${sel===s.id?T.primary:T.border}`,borderRadius:6,padding:"9px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}}>
              <Dot status={s.status}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>Outlet #{s.id} — {s.loc}</div><div style={{...mono,color:T.muted,marginTop:1}}>Rev: <span style={{color:s.rev<0?T.red:T.green,fontWeight:700}}>{s.rev>0?"+":""}{s.rev}%</span> · {s.alerts} alerts</div></div>
              <span style={tag(s.status==="critical"?T.red:s.status==="warning"?T.yellow:T.green)}>{s.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
      {ss&&(
        <div style={{...card,borderColor:`${T.primary}40`}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:10}}>Outlet #{ss.id} — {ss.loc}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[{l:"Revenue Δ",v:`${ss.rev>0?"+":""}${ss.rev}%`,c:ss.rev<0?T.red:T.green},{l:"Alerts",v:ss.alerts,c:ss.alerts>0?T.red:T.green},{l:"Status",v:ss.status.toUpperCase(),c:ss.status==="critical"?T.red:ss.status==="warning"?T.yellow:T.green}].map(m=>(
              <div key={m.l} style={{background:T.bgSec,borderRadius:6,padding:10,textAlign:"center"}}><div style={{...lbl,marginBottom:4}}>{m.l}</div><div style={{fontSize:16,fontWeight:800,color:m.c}}>{m.v}</div></div>
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
        <div style={{...lbl,marginBottom:8}}>B. Standardise "What Good Looks Like"</div>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Benchmark: Outlet #042 vs SEA Peers & Industry</div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 80px",gap:6,padding:"4px 10px",marginBottom:4}}>{["Metric","Outlet","Peer Avg","Industry",""].map(h=><span key={h} style={lbl}>{h}</span>)}</div>
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
          {[
            {hyp:"Pricing Mismatch",conf:8,verdict:"RULED OUT",c:T.green,detail:"Price index within 2% of SEA peers. Not the primary cause."},
            {hyp:"Payment System Failure",conf:91,verdict:"CONFIRMED",c:T.red,detail:"Card decline rate 4.2% vs 1.8% baseline. S$3,600 weekly revenue loss."},
            {hyp:"People / Service Degradation",conf:87,verdict:"CONFIRMED",c:T.red,detail:"Manager change + 34% staff turnover spike. CSAT down 18%."},
            {hyp:"Competitor Activity (SEA)",conf:22,verdict:"LOW PROBABILITY",c:T.yellow,detail:"No significant new competitor within catchment. Not primary driver."},
          ].map(h=>(
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
function Recommendations({recs,setRecs,onExecute}){
  const[approved,setApproved]=useState({});
  const[executing,setExecuting]=useState({});
  const[executed,setExecuted]=useState({});

  const handleExecute=async(r)=>{
    if(executed[r.id])return;
    setExecuting(p=>({...p,[r.id]:"executing"}));
    await new Promise(res=>setTimeout(res,1800));
    setExecuting(p=>({...p,[r.id]:"done"}));
    setExecuted(p=>({...p,[r.id]:true}));
    await new Promise(res=>setTimeout(res,600));
    onExecute(r);
  };

  return(
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:10,height:"100%",overflowY:"auto"}}>
      <div style={{...card,background:`linear-gradient(135deg,${T.primaryDim},${T.accentDim})`}}>
        <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Ranked Recommendations — Outlet #042, Orchard SG</div>
        <div style={{fontSize:11,color:T.dim}}>Approve to acknowledge · Execute to track in Transformation.</div>
      </div>
      {recs.map((r)=>(
        <div key={r.id} style={{...card,border:`1px solid ${executed[r.id]?`${T.green}50`:approved[r.id]?`${T.primary}50`:T.border}`,transition:"all 0.2s",animation:"fadeIn 0.3s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:8}}>
            <div style={{display:"flex",gap:7,alignItems:"center",flex:1,flexWrap:"wrap"}}>
              <span style={tag(r.pri==="CRITICAL"?T.red:r.pri==="HIGH"?T.yellow:T.primary)}>{r.pri}</span>
              <span style={{fontSize:13,fontWeight:700}}>{r.title}</span>
              {r.isRecovery&&<span style={tag(T.accent)}>RECOVERY INITIATIVE</span>}
              {executed[r.id]&&<span style={tag(T.green)}>✓ IN TRANSFORMATION</span>}
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>setApproved(p=>({...p,[r.id]:!p[r.id]}))} style={{...btn(approved[r.id]?"primary":"secondary"),fontSize:11,padding:"5px 10px",background:approved[r.id]?T.primary:T.bgSec,color:approved[r.id]?"#fff":T.dim}}>{approved[r.id]?"✓ Approved":"Approve"}</button>
              <button onClick={()=>handleExecute(r)} disabled={executed[r.id]} style={{...btn("green"),fontSize:11,padding:"5px 10px",opacity:executed[r.id]?0.6:1,background:executed[r.id]?T.muted:executing[r.id]==="executing"?T.yellow:T.green}}>{executing[r.id]==="executing"?"Executing...":executed[r.id]?"✓ Done":"Execute"}</button>
            </div>
          </div>
          <div style={{fontSize:11,color:T.dim,marginBottom:10,lineHeight:1.55}}>{r.desc}</div>
          <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
            <div><span style={lbl}>Impact: </span><span style={{fontSize:11,color:T.green,fontWeight:700}}>{r.impact}</span></div>
            <div><span style={lbl}>Effort: </span><span style={tag(r.effort==="LOW"?T.green:T.yellow)}>{r.effort}</span></div>
            <div><span style={lbl}>Timeline: </span><span style={{...mono,color:T.dim}}>{r.time}</span></div>
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
    {m:"Revenue",    base:72760,sim:72760+price*1000+staff*400,fmt:v=>`S$${Math.round(v).toLocaleString()}`},
    {m:"Gross Margin %",base:26.4,sim:26.4-price*0.5+staff*0.2,fmt:v=>`${v.toFixed(1)}%`},
    {m:"CSAT Score", base:3.2,  sim:Math.min(5,Math.max(0,3.2+staff*0.3-price*0.1)),fmt:v=>`${v.toFixed(1)}/5`},
    {m:"Labor Cost %",base:25.1,sim:25.1+staff*1.5,fmt:v=>`${v.toFixed(1)}%`},
  ];
  return(
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,height:"100%",overflowY:"auto"}}>
      <div style={card}>
        <div style={{...lbl,marginBottom:6}}>C. Test Decisions Before Execution</div>
        <div style={{fontSize:12,fontWeight:700,marginBottom:14}}>Digital Twin Simulator — Outlet #042, Orchard SG</div>
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
            {results.map(r=>{const delta=r.sim-r.base;const pos=delta>=0;return(
              <div key={r.m} style={{...card,border:`1px solid ${pos?`${T.green}40`:`${T.red}40`}`,background:pos?T.greenDim:T.redDim}}>
                <div style={{...lbl,marginBottom:4}}>{r.m}</div>
                <div style={{fontSize:18,fontWeight:800,color:pos?T.green:T.red,marginBottom:3}}>{pos?"+":""}{r.m==="Revenue"?`S$${Math.round(delta).toLocaleString()}`:delta.toFixed(1)}</div>
                <div style={{...mono,color:T.muted}}>{r.fmt(r.base)} → {r.fmt(r.sim)}</div>
              </div>
            );})}
          </div>
          <div style={{...card,background:T.primaryDim,border:`1px solid ${T.primary}40`}}>
            <span style={{color:T.primary,fontWeight:700,fontSize:11}}>Simulation complete. </span>
            <span style={{fontSize:11,color:T.dim}}>Net revenue impact: </span>
            <span style={{color:(price*1000+staff*400)>=0?T.green:T.red,fontWeight:700,fontSize:11}}>S${Math.round(price*1000+staff*400).toLocaleString()}</span>
          </div>
          <div style={card}>
            <div style={{fontSize:12,fontWeight:700,marginBottom:10}}>Digital Twin Dimensions</div>
            <ResponsiveContainer width="100%" height={210}>
              <RadarChart data={twinDims}>
                <PolarGrid stroke="rgba(255,255,255,0.05)"/><PolarAngleAxis dataKey="dim" tick={{fontSize:10,fill:T.muted}}/>
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
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Supplier Consolidation — Frozen Products (SEA)</div>
        <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12}}>
          {suppliers.map(s=>(
            <div key={s.name} style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 80px",gap:8,alignItems:"center",background:T.bgSec,borderRadius:6,padding:"9px 12px"}}>
              <span style={{fontSize:12,fontWeight:600}}>{s.name}</span>
              <span style={{...mono,fontWeight:700}}>S${s.price}/unit</span>
              <span style={{...mono,color:T.dim}}>{s.vol}% vol</span>
              <span style={tag(s.status==="LOW"?T.green:s.status==="MID"?T.yellow:T.red)}>{s.status}</span>
            </div>
          ))}
        </div>
        <div style={{background:T.greenDim,border:`1px solid ${T.green}40`,borderRadius:6,padding:"10px 12px"}}>
          <div style={{fontSize:11,fontWeight:700,color:T.green,marginBottom:3}}>Consolidation Opportunity</div>
          <div style={{fontSize:11,color:T.dim,lineHeight:1.55}}>Consolidate to Supplier C — Vietnam (S$2.28/unit): <strong style={{color:T.green}}>S$178,560/year savings</strong>. Recommended: 70% C (VN) + 30% B (MY) for supply chain resilience.</div>
        </div>
      </div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Central Kitchen Network — SEA Harmonisation</div>
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
          {kitchens.map(k=>(
            <div key={k.loc} style={{background:T.bgSec,borderRadius:6,padding:"10px 12px",display:"flex",gap:12,alignItems:"center"}}>
              <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,marginBottom:5}}>{k.loc}</div><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:4,background:T.bgCard,borderRadius:2,overflow:"hidden"}}><div style={{width:`${k.prod}%`,height:"100%",background:k.c,borderRadius:2}}/></div><span style={{...mono,color:T.muted,minWidth:24}}>{k.prod}%</span></div></div>
              <span style={{...mono,fontWeight:700}}>S${k.cost}M/yr</span>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[{l:"Annual Savings",v:"S$3.2M",c:T.green},{l:"Investment",v:"S$800K",c:T.yellow},{l:"Payback",v:"3.0 months",c:T.accent}].map(m=>(
            <div key={m.l} style={{background:T.bgSec,borderRadius:6,padding:10,textAlign:"center"}}><div style={{...lbl,marginBottom:4}}>{m.l}</div><div style={{fontSize:14,fontWeight:800,color:m.c}}>{m.v}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TRANSFORMATION ────────────────────────────────────────────────────────────
function Transformation({initiatives,setInitiatives,onApproveRecovery}){
  const[activeWorkflow,setActiveWorkflow]=useState(null);

  const handleApprove=(initiative)=>{
    const newRec={
      id:`recovery-${Date.now()}`,
      pri:"HIGH",
      title:`Recovery Plan: ${initiative.name}`,
      impact:"TBD — AI-generated recovery plan",
      effort:"MEDIUM",
      time:"2–4 weeks",
      desc:`AI-generated recovery initiative for "${initiative.name}". Approved via Decision Workflow. Focus: timing realignment, cost optimisation, and manpower support across SEA operations.`,
      isRecovery:true,
    };
    setActiveWorkflow(null);
    onApproveRecovery(newRec);
  };

  return(
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,height:"100%",overflowY:"auto"}}>
      <div style={card}>
        <div style={{...lbl,marginBottom:6}}>D. Track Value Realisation</div>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Expected vs Actual — Cumulative Value (S$)</div>
        <ResponsiveContainer width="100%" height={185}>
          <LineChart data={valueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
            <XAxis dataKey="week" tick={{fontSize:10,fill:T.muted}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:10,fill:T.muted}} axisLine={false} tickLine={false} tickFormatter={v=>`S$${v/1000}k`}/>
            <Tooltip contentStyle={{background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:6,fontSize:11}} formatter={v=>`S$${v.toLocaleString()}`}/>
            <Legend wrapperStyle={{fontSize:10}}/>
            <Line type="monotone" dataKey="expected" stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" strokeWidth={2} name="Expected"/>
            <Line type="monotone" dataKey="actual"   stroke={T.primary} strokeWidth={2.5} name="Actual" dot={{fill:T.primary,r:4}}/>
          </LineChart>
        </ResponsiveContainer>
        <div style={{background:T.redDim,border:`1px solid ${T.red}40`,borderRadius:6,padding:"9px 12px",marginTop:10}}>
          <span style={{color:T.red,fontWeight:700,fontSize:11}}>⚠ Value Gap: </span>
          <span style={{fontSize:11,color:T.dim}}>Initiatives delivering 72% of expected value. Decision workflows triggered.</span>
        </div>
      </div>

      <div style={card}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Initiative Status</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {initiatives.map((init)=>(
            <div key={init.id}>
              <div style={{background:init.status==="under"?T.redDim:T.greenDim,border:`1px solid ${(init.status==="under"?T.red:T.green)}40`,borderRadius:6,padding:"11px 12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,gap:8}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12,fontWeight:700,marginBottom:2}}>{init.name}</div>
                    <div style={{...mono,color:T.muted}}>Expected: {init.expected} | Actual: {init.actual}</div>
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                    <span style={tag(init.status==="under"?T.red:T.green)}>{init.status==="under"?"UNDERPERFORMING":"ON-TRACK"}</span>
                    {init.status==="under"&&(
                      <button onClick={()=>setActiveWorkflow(activeWorkflow===init.id?null:init.id)} style={{...btn("red"),fontSize:11,padding:"5px 10px",background:activeWorkflow===init.id?T.yellow:T.red}}>
                        {activeWorkflow===init.id?"▼ Close":"⚡ Decision Workflow"}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{flex:1,height:4,background:T.bgCard,borderRadius:2,overflow:"hidden"}}><div style={{width:`${init.pct}%`,height:"100%",background:init.status==="under"?T.red:T.green,borderRadius:2}}/></div>
                  <span style={{...mono,color:T.muted,minWidth:28}}>{init.pct}%</span>
                </div>
              </div>
              {activeWorkflow===init.id&&(
                <div style={{marginTop:8,height:380,animation:"slideIn 0.25s ease"}}>
                  <div style={{...lbl,marginBottom:6,color:T.yellow}}>⚡ DECISION WORKFLOW — {init.name.toUpperCase()}</div>
                  <MiniChat
                    systemExtra={`\n\nDECISION WORKFLOW CONTEXT:\nInitiative "${init.name}" is underperforming (expected: ${init.expected}, actual: ${init.actual}, ${init.pct}% of target) in SEA operations.\n\nProvide a structured recovery plan covering:\n1. Initiatives to get back on track (specific, actionable)\n2. Timing Lag — is this a delay or structural issue?\n3. Cost — additional S$ investment required\n4. Manpower Support — team/resource needs in SEA context\n\nEnd first response with: "Type Approve to add this as a Recovery Initiative in the Recommendations tab."`}
                    welcomeMsg={`## ⚡ Decision Workflow — ${init.name}\n\nThis initiative is at **${init.pct}% of target** (${init.actual} vs ${init.expected} expected).\n\nAnalysing recovery options:\n- **Initiatives to get back on track**\n- **Timing Lag** assessment\n- **Cost** implications (S$)\n- **Manpower Support** needed\n\nType **Approve** at any time to add a recovery initiative to Recommendations.`}
                    onApprove={()=>handleApprove(init)}
                    placeholder='Discuss options or type "Approve" to add to Recommendations...'
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ROOT APP ──────────────────────────────────────────────────────────────────
function EnterpriseApp({onBack}){
  const[page,setPage]=useState("assistant");
  const[recs,setRecs]=useState(INIT_RECS);
  const[initiatives,setInitiatives]=useState(INIT_INITIATIVES);

  const handleExecute=(rec)=>{
    setInitiatives(p=>[...p,{id:`exec-${Date.now()}`,name:rec.title,expected:rec.impact,actual:"S$0/wk",pct:0,status:"track"}]);
  };
  const handleApproveRecovery=(newRec)=>{
    setRecs(p=>[...p,newRec]);
    setPage("recommendations");
  };

  const pages={
    assistant:      <AssistantPage/>,
    dashboard:      <Dashboard/>,
    network:        <Network/>,
    diagnostics:    <Diagnostics/>,
    recommendations:<Recommendations recs={recs} setRecs={setRecs} onExecute={handleExecute}/>,
    twin:           <DigitalTwin/>,
    supply:         <SupplyChain/>,
    transformation: <Transformation initiatives={initiatives} setInitiatives={setInitiatives} onApproveRecovery={handleApproveRecovery}/>,
  };

  return(
    <>
      <style>{GS}</style>
      <div style={{display:"flex",height:"100vh",background:T.bg,fontFamily:"'Inter',system-ui,sans-serif",color:T.text,overflow:"hidden"}}>
        <aside style={{width:218,flexShrink:0,background:T.bgCard,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${T.primary},${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",flexShrink:0}}>Æ</div>
            <div><div style={{fontSize:13,fontWeight:800,letterSpacing:-0.4,lineHeight:1}}>Aether</div><div style={{...mono,color:T.accent,marginTop:2,fontSize:9,letterSpacing:1}}>ENTERPRISE AI · SEA</div></div>
          </div>
          <div style={{padding:"10px 12px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{...lbl,marginBottom:5}}>Active Outlet</div>
            <div style={{background:T.bgSec,borderRadius:5,padding:"7px 10px",fontSize:11,fontWeight:600,border:`1px solid ${T.border}`}}>#042 — Orchard, Singapore</div>
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
                {n.id==="recommendations"&&recs.some(r=>r.isRecovery)&&<span style={{marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:T.accent,flexShrink:0}}/>}
                {page===n.id&&<div style={{marginLeft:"auto",width:2.5,height:14,borderRadius:2,background:T.primary}}/>}
              </button>
            ))}
          </nav>
          <div style={{padding:"10px 12px",borderTop:`1px solid ${T.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:T.primaryDim,border:`1px solid ${T.primary}35`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:T.primary,flexShrink:0}}>BZ</div>
              <div><div style={{fontSize:11,fontWeight:600}}>Biz Ops Team</div><div style={{...mono,color:T.muted,fontSize:9}}>INSIGHTS & PLANNING</div></div>
            </div>
            <div style={{display:"flex",justifyContent:"center",gap:8,alignItems:"center"}}>
              <span style={{...mono,fontSize:9,letterSpacing:2,padding:"3px 14px",borderRadius:20,border:`1px solid ${T.primary}40`,color:T.primary,background:T.primaryDim}}>DEMO</span>
            </div>
            <button onClick={onBack} style={{marginTop:6,width:"100%",background:"none",border:"none",cursor:"pointer",...mono,color:T.muted,fontSize:9,textAlign:"center"}}>← Switch Mode</button>
          </div>
        </aside>
        <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{height:50,borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0,background:T.bgCard}}>
            <div><div style={{fontSize:13,fontWeight:700}}>{TITLES[page]}</div><div style={{...mono,color:T.muted,fontSize:10}}>Outlet #042 · Orchard, SG · Updated 2 min ago</div></div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{...tag(T.red),display:"flex",alignItems:"center",gap:5}}><span style={{width:5,height:5,borderRadius:"50%",background:T.red,display:"inline-block"}}/>4 ALERTS</div>
              <div style={tag(T.accent)}>SEA</div>
              <div style={tag(T.primary)}>CLAUDE POWERED</div>
            </div>
          </div>
          <div style={{flex:1,overflow:"hidden",display:"flex"}}>{pages[page]}</div>
        </main>
      </div>
    </>
  );
}
// ═══════════════════════════════════════════════════════════════════════════
// SME MODE
// ═══════════════════════════════════════════════════════════════════════════

// ── SME DESIGN TOKENS ────────────────────────────────────────────────────────
const SM = {
  bg:"#080c18", bgCard:"#0d1020", bgSec:"#111525",
  border:"rgba(255,255,255,0.07)", borderStrong:"rgba(255,255,255,0.15)",
  navy:"#e2e8f0", blue:"#6366f1", blueLight:"#1e1b4b",
  green:"#10b981", greenLight:"rgba(16,185,129,0.12)",
  red:"#ef4444", redLight:"rgba(239,68,68,0.1)",
  amber:"#f59e0b", amberLight:"rgba(245,158,11,0.1)",
  purple:"#a78bfa", purpleLight:"rgba(167,139,250,0.12)",
  text:"#e2e8f0", muted:"#64748b", dim:"#4a5568",
  accent:"#06b6d4",
};

// ── INDUSTRY CONFIG ───────────────────────────────────────────────────────────
const INDUSTRIES = [
  {
    id:"clinic", label:"Dental Clinic", icon:"🦷", color:"#059669",
    bizName:"SmileWell Dental", location:"Orchard Road, Singapore", outlets:2,
    currency:"S$", currencyCode:"SGD",
    kpis:[
      {label:"Monthly Revenue",      value:"S$142,800", change:"+6.4%",  pos:true,  sub:"vs S$134,200 last month"},
      {label:"Avg Revenue/Patient",  value:"S$320",     change:"-4.2%",  pos:false, sub:"Scaling S$580 · Clean S$120"},
      {label:"Appointment Utilisation",value:"69%",     change:"-8pp",   pos:false, sub:"Tue/Wed slots underused"},
      {label:"Patient Retention",    value:"71%",       change:"-4pp",   pos:false, sub:"Month-4 dropout pattern"},
      {label:"Profitability",        value:"S$28,400",  change:"+3.2%",  pos:true,  sub:"19.9% EBITDA margin"},
      {label:"Downtime Hours",       value:"44 hrs/mo", change:"+8%",    pos:false, sub:"Chair idle time increasing"},
    ],
    questions:[
      "Which treatments have the highest revenue per chair hour?",
      "Why are my Tuesday afternoon slots consistently empty?",
      "My senior dentist Dr Lim is leaving — should I hire or redistribute?",
      "Should I add Invisalign to our treatment menu?",
      "My competitor clinic reduced cleaning prices — should I match?",
      "Am I over-relying on one dentist for most of our revenue?",
      "Which patients are most at risk of not returning?",
      "What's the ROI of a Tuesday re-engagement campaign?",
    ],
    decisions:{
      revenue:[
        {q:"Which treatment should we push this month?", a:"Scaling & Polishing: S$580/chair-hour, 6% cancellation. Push composites next. Shifting 2 cleaning slots/day to scaling → +S$4,800/month.", impact:"S$4,800/mo", promo:"Exclusive this week at SmileWell Dental: comprehensive scaling & polishing + free fluoride treatment for S$120. Only 8 slots available — reply YES to book yours."},
        {q:"How do we fill Tuesday afternoon slots?", a:"Tuesday 2–5pm: 31% utilisation vs 89% Friday. 18 empty chair-hours/week = S$2,160 lost revenue. Tuesday promo campaign to existing patients recovers S$1,400/week.", impact:"S$1,400/wk", promo:"Hi [Name], we have exclusive Tuesday appointments available at SmileWell Dental this week. Book a scaling & polish and receive a complimentary dental X-ray (worth S$60). 5 slots left!"},
        {q:"Should we introduce Invisalign?", a:"Invisalign avg S$4,800/case. Breakeven: 4 cases/month. Your existing patient database: 1,240 active patients. Email campaign to 18–35 age bracket = est. 6–8 leads/month. Launch viable.", impact:"S$28,800/mo", promo:"SmileWell Dental now offers Invisalign clear aligners — achieve your perfect smile without metal braces. Free consultation this month. Limited appointments — reply to book."},
      ],
      profitability:[
        {q:"Where is margin being eroded this month?", a:"Top 3 margin drains: (1) Idle chair time Tue/Wed: S$2,160/wk loss. (2) Lab costs on crowns up 12% (now 38% of treatment revenue). (3) Receptionist overtime on Fridays: S$800/mo.", impact:"S$4,800/mo", promo:null},
        {q:"What's our most profitable treatment mix?", a:"Scaling: 81% gross margin. Composites: 74%. Crowns: 52% (high lab cost). Implants: 68%. Recommendation: grow scaling + composites, limit crown volume until lab costs stabilise.", impact:"S$3,200/mo", promo:null},
        {q:"How do we get to 22% EBITDA?", a:"Current 19.9%. Gap: S$2,980/month. Levers: (1) Fill idle Tuesday slots +S$1,400/wk (2) Renegotiate lab contract -S$800/mo (3) Convert 2 cleanings/day to scaling +S$1,200/mo.", impact:"S$2,980/mo", promo:null},
      ],
      pricing:[
        {q:"Are we priced correctly vs Orchard competitors?", a:"Your cleaning (S$120) is 14% below Orchard corridor median (S$140). Scaling (S$280) is on benchmark. Composite filling (S$180) is 9% below (market S$198). Two price increases won't trigger churn.", impact:"S$2,100/mo", promo:null},
        {q:"Should we introduce a dental membership plan?", a:"Annual membership at S$380: includes 2 cleanings + 10% treatment discount. Payback to clinic: S$240 guaranteed revenue + retention uplift. At 80 members = S$30,400 ARR. Low-effort launch.", impact:"S$30,400/yr", promo:"SmileWell Dental Care Plan — 2 cleans + priority booking + 10% off all treatments for just S$380/year. Founding member spots now open. Reply YES to join."},
        {q:"Can we increase implant pricing?", a:"Your implant at S$3,200 is S$400 below the Orchard premium band (S$3,400–3,800). Price sensitivity low for implants. Increase to S$3,500 and add 2-year warranty — est. +S$1,800/month with zero volume loss.", impact:"S$1,800/mo", promo:null},
      ],
      cost:[
        {q:"Where are our biggest cost leaks?", a:"(1) Lab fees: 38% of crown revenue — renegotiate or switch lab (save S$800/mo). (2) Dental supplies over-ordered: S$2,100 expiring stock last quarter. (3) Friday overtime: restructure shift by 30 min (save S$400/mo).", impact:"S$1,600/mo", promo:null},
        {q:"Are we overstaffed on slower days?", a:"Tuesday/Wednesday: 2 dentists + 2 nurses for 31% chair utilisation. Cost: S$1,800/day. Revenue: S$620/day. Restructure: 1 dentist + 1 nurse on Tue/Wed saves S$1,100/week without patient impact.", impact:"S$1,100/wk", promo:null},
        {q:"Should we renegotiate our Orchard lease?", a:"Current rent: S$18,500/month (13% of revenue). Benchmark: 8–10%. Overexposed by ~S$4,200/month. Lease renewal in 7 months — start negotiation now. Target: S$15,000–16,000.", impact:"S$2,500/mo", promo:null},
      ],
      ops:[
        {sev:"critical", title:"Online Booking System Intermittent Failure", detail:"BookEasy integration dropping 12% of online bookings since Tuesday. 22 patients received no confirmation. Estimated missed revenue: S$7,040 this week. Switch to manual confirmation until resolved.", time:"2 days ago", src:"BOOKING SYS", action:"Contact BookEasy support immediately. Enable SMS fallback confirmation."},
        {sev:"warning",  title:"Dental Chair 2 — Service Overdue", detail:"Chair 2 (Outlet 1) last serviced 14 months ago vs 12-month schedule. Compressor noise reported by Dr Lim. Risk of mid-appointment failure. Downtime cost if unplanned: S$3,200/day.", time:"This week", src:"EQUIPMENT", action:"Schedule emergency service this week. Estimated cost: S$400 vs S$3,200+ if breakdown."},
        {sev:"warning",  title:"Receptionist No-Show Rate Rising", detail:"3 no-shows in last 2 weeks from front desk. Last-minute cover costing S$280/incident in overtime. Root cause: unclear shift scheduling. Affects patient check-in experience — CSAT dropped 0.3pts.", time:"Ongoing", src:"STAFF", action:"Implement shift confirmation 24hrs prior. Review scheduling system."},
        {sev:"info",     title:"Sterilisation Log Compliance Gap", detail:"MOH requires sterilisation logs updated daily. Outlet 2 has 4-day gap last week. Not yet a regulatory breach but creates audit risk. Low effort to fix — takes 5 min/day.", time:"Last week", src:"COMPLIANCE", action:"Assign daily log responsibility to Nurse Wei. Set 5pm reminder."},
      ],
      feedback:[
        {source:"Google Reviews", rating:"4.2/5", trend:"-0.3 this month", count:"28 reviews this month", insight:"Top complaint: waiting time exceeding 15 mins past appointment (9 mentions). Top praise: Dr Sarah's chair-side manner (14 mentions). Action: tighten scheduling buffer."},
        {source:"Post-Visit SMS Survey", rating:"78% satisfied", trend:"-6pp vs last month", count:"142 responses", insight:"Satisfaction drop correlates with Tue/Wed slots — patients waited avg 22 mins. Friday avg wait: 4 mins. Fix: reduce Tue/Wed overbooking by 20%."},
        {source:"Booking System Data", rating:"31% re-book within 6mo", trend:"-4pp", count:"of 847 active patients", insight:"Re-booking rate lowest for cleaning patients (22%) vs scaling (48%). Recommendation: send automated 6-month reminder to all cleaning patients — est. +34 appointments/month."},
      ],
      org:[
        {q:"Do we have the right team structure?", a:"Current: 3 dentists + 4 nurses + 2 receptionists across 2 outlets. Dr Lim leaving creates 38% revenue concentration risk. Recommended: promote Dr Sarah to lead, hire 1 associate dentist (S$8,000/mo) vs revenue at risk S$54,000/mo.", impact:"Risk S$54K/mo"},
        {q:"Is our receptionist-to-chair ratio right?", a:"2 receptionists for 4 chairs across 2 outlets. Industry norm: 1 per 3 chairs. Slightly overstaffed at current utilisation (69%). Consider converting 1 receptionist to part-time when utilisation hits 80%+.", impact:"S$800/mo savings at 80% util"},
        {q:"Should we hire a treatment coordinator?", a:"Treatment coordinators typically improve case acceptance by 20–30%. Your current acceptance rate: 54% (benchmark: 68%). A dedicated coordinator at S$3,500/mo driving +14pp acceptance = +S$9,200/month. Strong ROI.", impact:"+S$9,200/mo"},
      ],
      expansion:[
        {q:"Is a 3rd outlet viable now?", a:"Outlet 2 at 69% utilisation — below the 85% threshold before expansion is recommended. Focus: fill current capacity first. At current trajectory (+2pp/month), 85% target reached in ~8 months. Revisit Q4.", impact:"Wait 8 months"},
        {q:"Which location should the 3rd outlet be in?", a:"Catchment analysis: Tanjong Pagar (high office worker density, lunch dental visits), Novena (medical hub, patient referrals from GPs). Tanjong Pagar ranked #1 on footfall + competition density.", impact:"S$180K setup est."},
        {q:"Should we acquire a competitor clinic?", a:"Two clinics within 500m are owner-operated, both with aging principals (60+) who may be exit-ready. Acquisition at 1.0–1.2x revenue = S$120–180K. Faster than greenfield + existing patient base.", impact:"S$120–180K acquisition"},
      ],
    },
    roiItems:[
      {action:"Scaled treatment slot reallocation", value:"S$4,800", type:"revenue", prevMonth:"S$0"},
      {action:"Tuesday re-engagement campaign", value:"S$3,920", type:"revenue", prevMonth:"S$0"},
      {action:"Right-sized hiring (Dr Lim departure)", value:"S$1,200", type:"saved", prevMonth:"S$0"},
      {action:"Composite filling price increase", value:"S$2,100", type:"revenue", prevMonth:"S$0"},
    ],
    benchmarks:[
      {metric:"Labour % of Revenue",       yours:"31%",   industry:"24–30%",   status:"above"},
      {metric:"Chair Utilisation",         yours:"69%",   industry:"78–88%",   status:"below"},
      {metric:"Patient Retention (6mo)",   yours:"71%",   industry:"76–84%",   status:"below"},
      {metric:"EBITDA Margin",             yours:"19.9%", industry:"18–25%",   status:"ok"},
      {metric:"Revenue/Chair/Month",       yours:"S$35,700", industry:"S$42–58K", status:"below"},
    ],
  },
  {
    id:"gym", label:"Gym & Fitness", icon:"💪", color:"#7c3aed",
    bizName:"Apex Fitness", location:"Kuala Lumpur, Malaysia", outlets:3,
    currency:"RM", currencyCode:"MYR",
    kpis:[
      {label:"Monthly Revenue",    value:"RM186,000", change:"+3.1%",  pos:true,  sub:"vs RM180,400 last month"},
      {label:"Active Members",     value:"847",       change:"-34",    pos:false, sub:"Damansara churn spike"},
      {label:"Member Retention",   value:"66%",       change:"-8pp",   pos:false, sub:"Month-3 churn pattern"},
      {label:"Class Utilisation",  value:"61%",       change:"-4pp",   pos:false, sub:"Off-peak slots underused"},
      {label:"Profitability",      value:"RM28,200",  change:"-2.1%",  pos:false, sub:"15.2% EBITDA margin"},
      {label:"Peak Utilisation",   value:"94%",       change:"+2pp",   pos:true,  sub:"Sat/Sun classes full"},
    ],
    questions:[
      "Why is my Damansara outlet churning 34% more members than PJ?",
      "I spend RM8,000/month on Instagram ads. Is it working?",
      "Should I introduce a RM199/month unlimited class pass?",
      "Which class schedule is driving the most member retention?",
      "My top trainer wants a pay rise — can I afford it?",
      "Should I open a 4th outlet in Bangsar?",
      "What's my true cost to acquire a new member?",
      "How do I fill my Tuesday 7am and Wednesday 8pm slots?",
    ],
    decisions:{
      revenue:[
        {q:"How do I grow recurring revenue?", a:"RM199 unlimited pass viable at 35+ uptake. 180 drop-ins/month → 20% conversion = 36 members = RM7,164/month new MRR.", impact:"RM7,164/mo", promo:"Introducing the Apex Unlimited Pass — all classes, all outlets, for RM199/month. Launching this Friday. First 30 sign-ups get a free protein shaker. Offer ends Sunday."},
        {q:"Which classes have the highest retention impact?", a:"HIIT classes show 2.4x higher 6-month retention vs weight training. Members attending 3+ classes/week churn at 8% vs 34% for 1x/week. Push 3-class starter packs.", impact:"RM4,800/mo", promo:"Apex Fitness 3-Class Starter Pack — join any 3 classes this week for RM99. Spots limited — reply YES to reserve yours."},
        {q:"Should I introduce corporate wellness packages?", a:"3 companies within 500m have 50+ staff. Corporate package at RM150/head/month, min 20 pax = RM3,000 guaranteed MRR per deal. 2 deals = RM6,000/month new revenue.", impact:"RM6,000/mo", promo:"Apex Fitness Corporate Wellness — exclusive rates for your team. Reply for a free trial week for up to 5 team members."},
      ],
      profitability:[
        {q:"Where is margin being eroded?", a:"Damansara AC running 24/7 costs RM1,200/month extra. Towel supplies over-ordered: RM400 waste/month. Saturday class overtime: RM600/month. Total leakage: RM2,200/month.", impact:"RM2,200/mo"},
        {q:"What is our true EBITDA per outlet?", a:"PJ: RM12,400 (18.2%). Damansara: RM8,200 (14.1%). TTDI: RM7,600 (16.8%). Damansara dragging portfolio — high churn + energy cost. Needs targeted intervention.", impact:"Focus Damansara"},
        {q:"How do we get to 18% EBITDA across all outlets?", a:"Gap: RM4,800/month. Levers: retention +RM9,000, ad rebalance +RM4,960, energy optimisation +RM1,200. Achieving all 3 gets EBITDA to 21.4%.", impact:"RM15,160/mo"},
      ],
      pricing:[
        {q:"Am I priced right vs market?", a:"Your RM180/month is 12% below Bangsar/Damansara corridor (RM198–220). Increase to RM199. Add premium tier at RM249 with towel service + locker.", impact:"RM2,800/mo"},
        {q:"Should I introduce day passes?", a:"Day passes at RM25 capture walk-in traffic, convert to members at 18% rate. Neighbouring gyms earn RM4,000–8,000/month on day passes. Low effort — enable at front desk.", impact:"RM4,000/mo"},
        {q:"Can I charge for PT add-ons?", a:"PT at RM80/hour: trainers have 12 idle hours/week across 3 outlets. Offer PT to members at RM65/hour. Revenue potential: RM3,120/month.", impact:"RM3,120/mo"},
      ],
      cost:[
        {q:"Is my ad spend working?", a:"RM8,000 ads → 22 new members at RM364 CAC. Retention programme: RM500/month retains equivalent revenue. Cut ads 30%, invest RM500 in retention = net RM1,900/month saving.", impact:"RM1,900/mo"},
        {q:"Where are my biggest cost leaks?", a:"AC off-peak: RM1,200/month extra. 2 trainers idle Tuesday mornings: RM900/month. Total: RM2,100/month savings available without service impact.", impact:"RM2,100/mo"},
        {q:"Are we overstaffed on slow days?", a:"Tuesday/Wednesday mornings: 3 trainers for avg 8 members. Optimise to 2. Saving: RM1,100/month. Redirect trainer to Saturday peak — currently turning away members.", impact:"RM1,100/mo"},
      ],
      ops:[
        {sev:"critical", title:"Damansara Booking App — Payment Timeout Errors", detail:"MindBody integration showing 14% payment timeout rate since Monday. 31 members charged twice or not at all. Revenue discrepancy: RM4,200.", time:"3 days ago", src:"BOOKING SYS", action:"Contact MindBody support immediately. Enable manual payment fallback. Reconcile 31 affected members."},
        {sev:"warning",  title:"TTDI Treadmills 3 & 4 Out of Service", detail:"Both treadmills flagged for maintenance. 6 member complaints this week. Peak hour queue forming at remaining 4 units. Risk of negative Google reviews.", time:"This week", src:"EQUIPMENT", action:"Schedule emergency service. Cost: RM380. Complete within 48hrs before weekend peak."},
        {sev:"info",     title:"AC Schedule Optimisation Due", detail:"AC running 6am–11pm daily. Traffic data shows low utilisation 9am–12pm weekdays. Adjust schedule: save RM1,200/month in energy.", time:"Ongoing", src:"OPS", action:"Update AC timer to 12pm start on weekdays. Monitor for 2 weeks."},
      ],
      feedback:[
        {source:"Google Reviews", rating:"4.1/5", trend:"-0.4 this month", count:"34 reviews", insight:"Top complaint: treadmill availability (12 mentions) and changing room cleanliness (8 mentions). Top praise: trainer friendliness (18 mentions). Fix treadmills and cleaning frequency first."},
        {source:"Post-Class SMS Survey", rating:"74% satisfied", trend:"-8pp vs last month", count:"218 responses", insight:"Drop concentrated in Damansara — correlates with equipment issues and payment errors. PJ and TTDI stable at 84%+. Fix Damansara operations to recover satisfaction."},
        {source:"Cancellation Data", rating:"34% cite equipment issues", trend:"New pattern", count:"of 47 cancellations", insight:"Equipment now top cancellation reason. Fix treadmills immediately — estimated retention of 8–12 members = RM1,440–2,160/month saved."},
      ],
      org:[
        {q:"Do I have the right trainer-to-member ratio?", a:"8 trainers for 847 members = 1:106. Industry norm: 1:80–100. Damansara lean at 1:140. Add 1 part-time trainer (RM1,500/month) to reduce burnout and retention risk.", impact:"Retention risk"},
        {q:"Should I hire an operations manager?", a:"Owner spending 22hrs/week on admin. At RM150/hr opportunity cost = RM13,200/month. Ops manager at RM5,500/month frees owner for growth. Strong ROI.", impact:"+RM7,700/mo owner value"},
        {q:"Is front desk staffing right?", a:"Saturday peak shows 15-min wait at Damansara. Add 1 part-time Saturday receptionist (RM600/month) — recovers RM2,400 in frustrated member revenue.", impact:"RM1,800/mo net"},
      ],
      expansion:[
        {q:"Should I open a 4th outlet in Bangsar?", a:"Current avg utilisation 63% — below 75% threshold. Fix Damansara first. At current trajectory ready in 6 months.", impact:"Wait 6 months"},
        {q:"Which Bangsar location is best?", a:"Bangsar South ranked #1: office crowd, lower competition, 3 MRT exits nearby. Catchment: 18,000 working professionals.", impact:"RM320K setup est."},
        {q:"Should I franchise instead?", a:"Franchise at 8% royalty on RM180K avg outlet revenue = RM14,400/month passive income per franchisee. 3 franchisees = RM43,200/month. Reduces capital risk significantly.", impact:"RM43,200/mo at 3 franchisees"},
      ],
    },
        roiItems:[
      {action:"RM199 unlimited pass — 38 sign-ups Wk 1", value:"RM7,562", type:"revenue"},
      {action:"Ad spend rebalanced -30%", value:"RM4,960", type:"saved"},
      {action:"Week-8 retention intervention", value:"RM9,000", type:"revenue"},
      {action:"Trainer retained — churn avoided", value:"RM22,000", type:"protected"},
    ],
    benchmarks:[
      {metric:"Member Acquisition Cost", yours:"RM364", industry:"RM180–280", status:"above"},
      {metric:"Member Retention (3mo)", yours:"66%", industry:"72–80%", status:"below"},
      {metric:"Class Utilisation", yours:"61%", industry:"68–78%", status:"below"},
      {metric:"EBITDA Margin", yours:"15.2%", industry:"14–20%", status:"ok"},
      {metric:"Revenue/Member/Month", yours:"RM220", industry:"RM200–280", status:"ok"},
    ],
  },
  {
    id:"fnb", label:"F&B / Café", icon:"🍽", color:"#d97706",
    bizName:"Chapters Café", location:"Singapore", outlets:2,
    currency:"S$", currencyCode:"SGD",
    kpis:[
      {label:"Monthly Revenue",    value:"S$94,200",  change:"+2.8%",  pos:true,  sub:"vs S$91,600 last month"},
      {label:"Avg Order Value",    value:"S$28.40",   change:"-4.2%",  pos:false, sub:"Basket size declining"},
      {label:"Seat Utilisation",   value:"58%",       change:"-7pp",   pos:false, sub:"Lunch peak only"},
      {label:"Food Cost %",        value:"34.8%",     change:"+2.1pp", pos:false, sub:"Industry norm: 28–32%"},
      {label:"Profitability",      value:"S$9,800",   change:"-8.2%",  pos:false, sub:"10.4% EBITDA margin"},
      {label:"GrabFood Mix",       value:"42%",       change:"+5pp",   pos:false, sub:"Platform fee eroding margin"},
    ],
    questions:[
      "Which menu items have the highest margin and should I push them more?",
      "My food cost is 34.8% — what's driving it above the 28–32% benchmark?",
      "Should I cut the bottom 20% of SKUs to free up working capital?",
      "Is GrabFood actually profitable for us after their 30% commission?",
      "Should I introduce a lunch set menu to improve seat utilisation?",
      "My supplier raised prices 8% — how do I protect margin?",
      "Which days/times should I run promotions for best ROI?",
      "Is a second outlet worth it or should I focus on optimising Outlet 1 first?",
    ],
    decisions:{
      revenue:[
        {q:"What should I promote this week?", a:"Signature coffee + cake combo: S$18.50, 72% margin. Currently 12% of orders. Push to 20% → +S$3,200/month revenue.", impact:"S$3,200/mo", promo:"This week at Chapters Café: our signature coffee + cake combo for just S$18.50. A perfect afternoon treat — available at both outlets while stocks last. See you soon!"},
        {q:"How do we grow weekend revenue?", a:"Saturday 12–2pm is 94% seat utilisation but Sunday 2–5pm only 38%. Sunday afternoon promo — bottomless coffee + pastry at S$22 — could recover S$1,800/weekend.", impact:"S$1,800/wk", promo:"Sunday Afternoon Special at Chapters Café: bottomless filter coffee + freshly baked pastry for S$22. This Sunday only — reserve your table now, reply YES."},
        {q:"Should we introduce a loyalty membership?", a:"Monthly café membership at S$80: 10 coffees + 10% food discount. At 120 members = S$9,600 guaranteed MRR. Your current regulars: 340 weekly visitors. 35% conversion target realistic.", impact:"S$9,600/mo", promo:"Chapters Café Membership — 10 coffees + 10% off food every month for S$80. Limited founding member spots. Reply YES to lock in your rate."},
      ],
      profitability:[
        {q:"Where is margin being eroded?", a:"Food cost at 34.8% vs 28–32% benchmark. Top 3 leaks: croissants (42% cost), avocado dishes (51%), daily specials waste S$400/week. Fix these 3 = S$4,100/month margin recovery.", impact:"S$4,100/mo"},
        {q:"Is GrabFood actually profitable for us?", a:"GrabFood 30% commission: your net margin on delivery is 4.2% vs 19% dine-in. Raise delivery prices S$3–5 or limit delivery to high-margin SKUs only.", impact:"S$1,600/mo"},
        {q:"What is our true EBITDA per outlet?", a:"Outlet 1: S$7,200 EBITDA (14.8%). Outlet 2: S$2,600 EBITDA (6.2%). Outlet 2 nearly breakeven — needs urgent menu/ops review. Combined target: 13%+.", impact:"Focus Outlet 2"},
      ],
      pricing:[
        {q:"Are we priced correctly vs nearby cafes?", a:"Your flat white (S$6.50) is 12% below the Orchard/Tanjong Pagar corridor median (S$7.40). Avocado toast (S$18) is on benchmark. Two small price increases won't trigger churn.", impact:"S$2,100/mo"},
        {q:"Should I raise delivery prices?", a:"Current delivery prices match dine-in. After GrabFood 30% cut, you make 4.2% margin. Add S$3–4 surcharge on delivery — industry standard. Most customers accept this.", impact:"S$1,600/mo"},
        {q:"Can I introduce a premium tasting menu?", a:"Friday/Saturday dinner service: tasting menu at S$68/pax (5 courses) could drive S$4,080/weekend at 60% capacity. Your kitchen is capable — requires 2 weeks menu testing.", impact:"S$4,080/wk"},
      ],
      cost:[
        {q:"Where are my biggest cost leaks?", a:"Croissants (42% food cost) and avocado dishes (51%) are margin killers. Daily specials waste: S$400/week. Remove or reprice → save S$4,100/month without losing customers.", impact:"S$4,100/mo"},
        {q:"Do we need more weekend staff?", a:"Saturday lunch: 94% utilisation, 18min avg wait. Add 1 FTE Saturday only (S$800/month). Revenue recovery from reduced walk-outs: S$3,400. Net: +S$2,600/month.", impact:"S$2,600/mo"},
        {q:"Can we reduce food waste?", a:"Daily specials waste estimated S$1,600/month. Switch to weekly specials using forecasted demand. Order-to-waste ratio benchmark: 8% — yours is 18%. Savings: S$900/month.", impact:"S$900/mo"},
      ],
      ops:[
        {sev:"critical", title:"POS System Intermittent Failure — Outlet 2", detail:"Square POS at Outlet 2 failing during peak hours since Wednesday. 3 card payment failures reported. Estimated lost revenue: S$1,200. Customer complaints rising.", time:"3 days ago", src:"POS SYSTEM", action:"Contact Square support today. Keep manual backup (cash/PayNow) active until resolved."},
        {sev:"warning",  title:"Coffee Machine Grinder Calibration Needed", detail:"Baristas reporting inconsistent grind since service 8 months ago (scheduled at 6 months). Affects espresso quality — 4 customer complaints about bitter taste this week.", time:"This week", src:"EQUIPMENT", action:"Schedule calibration (S$150) this week. Brew quality directly impacts repeat visits and reviews."},
        {sev:"info",     title:"GrabFood Menu Update Overdue", detail:"GrabFood menu hasn't been updated in 3 months. 2 items still listed that are no longer available — causing cancellations and 1-star reviews. Quick fix: 20 minutes.", time:"Ongoing", src:"DELIVERY", action:"Log into GrabFood merchant portal and remove unavailable items. Update photos for top 5 sellers."},
      ],
      feedback:[
        {source:"Google Reviews", rating:"4.3/5", trend:"-0.2 this month", count:"22 reviews this month", insight:"Top complaint: wait time on Saturdays (7 mentions) and 2 items unavailable on GrabFood (4 mentions). Top praise: ambience and coffee quality (15 mentions). Fix Saturday staffing and GrabFood menu."},
        {source:"Post-Visit QR Survey", rating:"81% satisfied", trend:"-3pp vs last month", count:"96 responses", insight:"Satisfaction dip on Saturdays correlates with understaffing. Weekday scores remain high (88%). Adding 1 Saturday FTE likely recovers 5–6pp satisfaction."},
        {source:"GrabFood Ratings", rating:"4.0/5", trend:"-0.5 this month", count:"48 delivery reviews", insight:"Delivery rating drop caused by items listed as available but sold out. 12 order cancellations this month = S$340 in lost GMV and 3 one-star reviews. Fix: update menu weekly."},
      ],
      org:[
        {q:"Do I need a café manager?", a:"Owner spending 18hrs/week on ops and staff scheduling. Café manager at S$3,200/month frees owner for growth, supplier negotiations, and new outlet planning. ROI clear at current revenue.", impact:"+S$5,400/mo owner value"},
        {q:"Is my barista-to-seat ratio right?", a:"2 baristas for 38 seats during peak = 19 seats each. Industry norm: 15–18. Slightly stretched on Saturday. Part-time Saturday barista at S$600/month resolves the bottleneck.", impact:"S$600/mo cost"},
        {q:"Should I invest in barista training?", a:"Certified barista training (S$800/person) typically increases customer satisfaction scores by 0.3–0.5 points and average order value by S$2–3. ROI positive within 6 weeks.", impact:"+S$2,400/mo"},
      ],
      expansion:[
        {q:"Is a 2nd outlet ready for expansion to a 3rd?", a:"Outlet 2 at 6.2% EBITDA — needs to reach 12%+ before any 3rd outlet discussion. Focus: menu optimisation and staffing first. Expansion in 6+ months.", impact:"Wait 6 months"},
        {q:"Which area should the 3rd outlet be in?", a:"Tanjong Pagar: high lunch foot traffic, office density, limited quality café competition. Setup: S$120K–150K. Payback at similar economics: 14 months.", impact:"S$120–150K setup"},
        {q:"Should we focus on delivery-only dark kitchens?", a:"Dark kitchen at S$4,000/month rent (vs S$12,000 full café). Margin: 22% after GrabFood commission. Revenue needed to breakeven: S$18,200/month — achievable at moderate volume.", impact:"S$4,000/mo rent"},
      ],
    },
        roiItems:[
      {action:"Signature combo pushed — 8% order mix increase", value:"S$3,200", type:"revenue"},
      {action:"Croissant + avocado dishes repriced", value:"S$2,800", type:"saved"},
      {action:"Saturday FTE added — waittime cut 18→8min", value:"S$3,400", type:"revenue"},
      {action:"GrabFood delivery prices +S$4", value:"S$1,600", type:"revenue"},
    ],
    benchmarks:[
      {metric:"Food Cost %", yours:"34.8%", industry:"28–32%", status:"above"},
      {metric:"Labour % of Revenue", yours:"28.4%", industry:"25–30%", status:"ok"},
      {metric:"Seat Utilisation", yours:"58%", industry:"65–78%", status:"below"},
      {metric:"EBITDA Margin", yours:"10.4%", industry:"10–18%", status:"ok"},
      {metric:"Avg Order Value", yours:"S$28.40", industry:"S$32–45", status:"below"},
    ],
  },
  {
    id:"retail", label:"Specialty Retail", icon:"🏪", color:"#0ea5e9",
    bizName:"Atelier HOME", location:"Singapore", outlets:2,
    currency:"S$", currencyCode:"SGD",
    kpis:[
      {label:"Monthly Revenue",    value:"S$112,000", change:"+1.4%",  pos:true,  sub:"vs S$110,400 last month"},
      {label:"Avg Transaction",    value:"S$184",     change:"-6.2%",  pos:false, sub:"Basket size declining"},
      {label:"Inventory Turns",    value:"3.2x/yr",   change:"-0.4x",  pos:false, sub:"Industry norm: 4–6x"},
      {label:"Dead Stock %",       value:"18%",       change:"+3pp",   pos:false, sub:"S$20,160 tied up"},
      {label:"Profitability",      value:"S$14,600",  change:"-5.1%",  pos:false, sub:"13.0% EBITDA margin"},
      {label:"Footfall Conv. Rate",value:"22%",       change:"-3pp",   pos:false, sub:"Industry norm: 28–35%"},
    ],
    questions:[
      "Which SKUs have the highest margin and turnover — should I expand them?",
      "I have 18% dead stock — how do I clear it without damaging brand?",
      "My competitor opened nearby — how do I respond on pricing?",
      "Should I push more volume through Shopee/Lazada?",
      "Which product categories should I cut to free up cash?",
      "My footfall conversion is 22% — what's a realistic improvement target?",
      "Should I invest in a loyalty programme?",
      "Is my second outlet profitable enough to justify staying open?",
    ],
    decisions:{
      revenue:[
        {q:"What to push for the next 30 days?", a:"Scented candles: S$85 ASP, 68% margin, 6.2x turns/year. Currently 9% of revenue. Push to 15% → +S$6,700/month.", impact:"S$6,700/mo", promo:"New arrival at Atelier HOME: our curated scented candle collection is back in stock. Hand-poured, long-burn, exclusive to us. Shop in-store or reply to reserve yours."},
        {q:"How do we increase average basket size?", a:"Current avg transaction S$184 vs S$220 benchmark. Bundling strategy: candles + diffuser set at S$145 (vs S$165 separate). Bundling typically raises avg basket 18–24%.", impact:"S$3,800/mo", promo:"Atelier HOME Bundle Deal: our bestselling scented candle + reed diffuser set, now S$145 (save S$20). Perfect for gifting — this week only. Reply YES to reserve."},
        {q:"Should we launch a home styling subscription box?", a:"Monthly curation box at S$88: 3 small-format items with styling card. Subscription model builds predictable MRR. At 80 subscribers = S$7,040 recurring monthly revenue.", impact:"S$7,040/mo", promo:"Introducing the Atelier HOME Monthly Edit — curated home styling pieces delivered to your door. S$88/month, cancel anytime. First box includes a S$30 store credit."},
      ],
      profitability:[
        {q:"What is dragging our EBITDA down?", a:"Dead stock: S$20,160 tied up in slow-moving SKUs. Outlet 2 net margin: S$1,400/month — too thin. Inventory turns at 3.2x vs 4–6x industry. Fix inventory first.", impact:"S$20,160 tied up"},
        {q:"Where are we losing margin?", a:"3 SKU categories below 40% gross margin: mass-market frames (34%), synthetic throws (38%), imported ceramics with high freight (36%). Remove or reprice to improve overall margin.", impact:"S$2,800/mo"},
        {q:"How do we get to 16% EBITDA?", a:"Current 13%. Gap: S$3,360/month. Levers: dead stock clearance +S$1,200, candle push +S$2,100, pricing adjustments +S$1,800. Combined: 18.2% EBITDA achievable.", impact:"S$5,100/mo"},
      ],
      pricing:[
        {q:"How should I respond to new competitor?", a:"New competitor 12% cheaper on commodity items. Do not match — differentiate on curation and experience. Hold pricing, invest in in-store events and styling consultations.", impact:"Protect margin"},
        {q:"Can I increase candle prices?", a:"Your S$85 candles are 11% below the Orchard premium band (S$92–110 for comparable quality). Increase to S$92 — elasticity data shows <5% volume impact at this price point.", impact:"S$1,400/mo"},
        {q:"Should I introduce volume pricing?", a:"Buy 3 candles, save 10% (S$229 vs S$255). Increases basket size 40%+ when tested. Clears inventory faster. Net margin impact: neutral. Recommend testing for 30 days.", impact:"Basket +40%"},
      ],
      cost:[
        {q:"How do I fix dead stock?", a:"18% dead stock = S$20,160 tied up. Bundle slow SKUs with fast movers at 25% discount. Clear in 8 weeks, recover S$15,100. Prevents markdown spiral later.", impact:"S$15,100 recovered"},
        {q:"Is my import freight cost optimised?", a:"Current freight: S$4,200/month. Consolidating shipments from monthly to quarterly saves 28% on freight. Requires 3 months of forward planning but saves S$1,176/month.", impact:"S$1,176/mo"},
        {q:"Can I reduce retail staff cost on slow days?", a:"Monday/Tuesday: 28% of weekly footfall but 40% of weekly staff hours. Shift 2 weekday staff hours to Friday/Saturday peak. No redundancy needed — just scheduling optimisation.", impact:"S$600/mo"},
      ],
      ops:[
        {sev:"critical", title:"Inventory System Count Discrepancy — Outlet 2", detail:"Last stocktake showed 8% variance between system count and physical count. 34 items unaccounted (S$3,100 value). Possible shrinkage or system sync error since last POS update.", time:"This week", src:"INVENTORY", action:"Conduct full physical count this weekend. Check POS sync logs. Investigate top 10 discrepancy items."},
        {sev:"warning",  title:"Shopee Store — 6 Items Out of Stock, Still Listed", detail:"6 bestselling items listed on Shopee as available but physically out of stock. 3 orders pending fulfilment. Risk of negative seller rating and account flag.", time:"2 days ago", src:"ECOMMERCE", action:"Pause listings immediately. Fulfil 3 pending orders from Outlet 1 stock. Update Shopee inventory today."},
        {sev:"info",     title:"Outlet 1 Lighting — Warm Bulbs Burning Out", detail:"4 of 12 display warm-tone bulbs replaced with standard white (wrong replacement purchased). Affects brand atmosphere and product appearance quality. Easy fix.", time:"Ongoing", src:"STORE OPS", action:"Purchase correct warm-tone bulbs (2700K). Cost: S$60. Maintain display quality standards."},
      ],
      feedback:[
        {source:"Google Reviews", rating:"4.4/5", trend:"stable", count:"18 reviews this month", insight:"Consistent praise: curation quality and store atmosphere (14 mentions). One recurring complaint: limited parking on weekends. Cannot fix but can mitigate with Grab discount QR code at checkout."},
        {source:"Post-Purchase Email Survey", rating:"84% satisfied", trend:"+2pp vs last month", count:"67 responses", insight:"Satisfaction highest for in-store purchases (88%) vs online (74%). Online drop caused by Shopee out-of-stock issue. Fix listings to restore online satisfaction."},
        {source:"Repeat Purchase Data", rating:"38% repurchase within 3mo", trend:"-5pp", count:"of 342 active customers", insight:"Repurchase rate drop correlates with candle collection going out of stock last month. Restocking now. Send proactive notification to 127 customers who bought candles previously."},
      ],
      org:[
        {q:"Do I need a dedicated buyer/merchandiser?", a:"Owner currently selecting all products. At 2 outlets + Shopee, this is 12hrs/week. Part-time merchandiser at S$1,800/month could improve product selection velocity and reduce dead stock.", impact:"S$1,800/mo cost"},
        {q:"Is my sales staff performance being tracked?", a:"No individual sales tracking currently. Adding conversion rate tracking per staff member typically improves conversion 15–20% within 90 days through accountability and training.", impact:"+S$4,200/mo"},
        {q:"Should I hire a social media coordinator?", a:"Instagram drives 34% of your walk-in traffic. Current posting: 2x/week. Industry high-performers: 5–7x/week. Part-time social coordinator at S$800/month — est. +12% footfall = +S$3,800/month.", impact:"+S$3,000/mo net"},
      ],
      expansion:[
        {q:"Is Outlet 2 worth keeping open?", a:"Outlet 2: S$31,200 revenue, S$29,800 cost. Net: S$1,400/month — below opportunity cost. 90-day turnaround plan: dead stock clearance + candle push + pricing adjustments. Review in Q3.", impact:"90-day review"},
        {q:"Should we go online-first instead?", a:"Shopee + Lazada combined revenue potential: S$25,000–40,000/month at established scale. Dark store model at S$3,500/month enables online focus without high retail rent.", impact:"S$3,500/mo rent"},
        {q:"What product categories should we expand into?", a:"Adjacent categories with strong margins: bath products (68% margin, fast turns), kitchen textiles (62%, high gifting volume), indoor plants accessories (growing 28% YoY in SG). Test 1 category first.", impact:"Test before commit"},
      ],
    },
        roiItems:[
      {action:"Candle push — 6pp order mix increase", value:"S$6,700", type:"revenue"},
      {action:"Dead stock bundle clearance", value:"S$15,100", type:"recovered"},
      {action:"Trained specialist — conversion +4pp", value:"S$4,800", type:"revenue"},
      {action:"In-store events — footfall +18%", value:"S$3,200", type:"revenue"},
    ],
    benchmarks:[
      {metric:"Inventory Turns", yours:"3.2x", industry:"4–6x", status:"below"},
      {metric:"Dead Stock %", yours:"18%", industry:"5–10%", status:"above"},
      {metric:"Footfall Conversion", yours:"22%", industry:"28–35%", status:"below"},
      {metric:"EBITDA Margin", yours:"13.0%", industry:"12–18%", status:"ok"},
      {metric:"Gross Margin %", yours:"52%", industry:"48–62%", status:"ok"},
    ],
  },
];

const SME_DECISION_CATS = [
  {id:"revenue",     label:"Revenue & Profitability", icon:"📈", color:"#059669"},
  {id:"profitability",label:"Profitability",           icon:"💹", color:"#10b981", hidden:true},
  {id:"pricing",     label:"Pricing",                 icon:"🏷", color:"#0ea5e9"},
  {id:"cost",        label:"Cost",                    icon:"💰", color:"#dc2626"},
  {id:"ops",         label:"Operations",               icon:"⚙️", color:"#f59e0b"},
  {id:"feedback",    label:"Customer Feedback",       icon:"💬", color:"#8b5cf6"},
  {id:"org",         label:"Org",                     icon:"👥", color:"#7c3aed"},
  {id:"expansion",   label:"Expansion",               icon:"🗺", color:"#d97706"},
];
const SME_VISIBLE_CATS = SME_DECISION_CATS.filter(c=>!c.hidden);

// ── SME HELPERS ───────────────────────────────────────────────────────────────
const scard = (extra={}) => ({ background:SM.bgCard, border:`1px solid ${SM.border}`, borderRadius:10, padding:16, ...extra });
const stag = (c) => ({ fontSize:9, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, padding:"2px 8px", borderRadius:20, border:`1px solid ${c}30`, color:c, background:`${c}12` });
const sbtn = (c="#1d4ed8",ex={}) => ({ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", transition:"all 0.15s", background:c, color:"#fff", ...ex });

function STag({c,children}){return <span style={stag(c)}>{children}</span>;}

// ── SME MINI CHAT ─────────────────────────────────────────────────────────────
function SmeMiniChat({industry, initialMsg, compact=false, pendingFiles=[], setPending=null}){
  const[messages,setMessages]=useState([{role:"assistant",content:initialMsg}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const[waContext,setWaContext]=useState(null); // set when a promo opportunity is detected
  const endRef=useRef(null);

  // Detect if AI response contains a promotion/campaign recommendation
  const detectPromo=(text)=>{
    const promoKeywords=/promot|discount|offer|campaign|loyalty|deal|special|boost|fill.*slot|Tuesday|utilisation|retention|WhatsApp/i;
    return promoKeywords.test(text);
  };
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const send=async(text)=>{
    const userText=text||input.trim();
    const hasFiles=pendingFiles.length>0;
    if(!userText&&!hasFiles||loading)return;
    const msgText=userText||(hasFiles?"Analyse the uploaded files and give specific, quantified recommendations for my business.":"");
    setInput("");
    setMessages(p=>[...p,{role:"user",content:msgText,files:pendingFiles.map(f=>f.name)}]);
    setLoading(true);
    const system=`You are Aether SME — a plain-English business analyst co-pilot for a ${industry.label} business called "${industry.bizName}" in ${industry.location} with ${industry.outlets} outlets.

Business context:
${industry.kpis.map(k=>`- ${k.label}: ${k.value} (${k.change})`).join('\n')}

Your role: Give direct, specific, quantified answers. When files are uploaded, analyse them thoroughly: identify revenue opportunities, cost leaks, and improvements benchmarked against SEA ${industry.label} norms. Always give a concrete action with estimated ${industry.currency} impact. Use plain English, no jargon. Format with headers and bullet points.`;

    const userContent=[];
    for(const f of pendingFiles){
      if(f.type==="pdf") userContent.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:f.content}});
      else userContent.push({type:"text",text:`=== ${f.type.toUpperCase()}: ${f.name} ===\n${f.content}`});
    }
    userContent.push({type:"text",text:msgText});

    const history=messages.slice(-8).map(m=>({role:m.role,content:String(m.content)}));
    try{
      const result=await callClaude([...history,{role:"user",content:hasFiles?userContent:msgText}],system,hasFiles,msgText);
      setMessages(p=>[...p,{role:"assistant",content:result.text,files:[]}]);
      if(detectPromo(result.text)) setWaContext(result.text);
    }catch(e){
      setMessages(p=>[...p,{role:"assistant",content:e.message==="API_KEY_MISSING"?"Add VITE_ANTHROPIC_KEY in Vercel to enable AI.":`Error: ${e.message}`}]);
    }
    if(setPending) setPending([]);
    setLoading(false);
  };

  const h=compact?260:360;
  return(
    <div style={{display:"flex",flexDirection:"column",height:h,background:SM.bgCard,border:`1px solid ${SM.border}`,borderRadius:10,overflow:"hidden"}}>
      <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:8}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
            {m.role==="assistant"&&<div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,${industry.color},${SM.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff",flexShrink:0,marginRight:6,marginTop:2}}>A</div>}
            <div style={{maxWidth:"85%",padding:"8px 11px",borderRadius:m.role==="user"?"7px 2px 7px 7px":"2px 7px 7px 7px",fontSize:11,lineHeight:1.6,background:m.role==="user"?industry.color:SM.bgSec,color:m.role==="user"?"#fff":SM.text,border:m.role==="assistant"?`1px solid ${SM.border}`:"none"}}>
              <Md text={m.content}/>
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:4,padding:"8px 11px",background:SM.bgSec,borderRadius:"2px 7px 7px 7px",width:"fit-content",border:`1px solid ${SM.border}`}}>{[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:industry.color,animation:`bounce 1.1s infinite ${i*0.18}s`}}/>)}</div>}
        <div ref={endRef}/>
      </div>
      <div style={{padding:8,borderTop:`1px solid ${SM.border}`,display:"flex",flexDirection:"column",gap:6}}>
        {waContext&&(
          <div style={{padding:"0 2px"}}>
            <WhatsAppSender industry={industry} trigger="copilot" context={waContext} tier="growth"/>
          </div>
        )}
        {pendingFiles.length>0&&(
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {pendingFiles.map((f,i)=>(
              <div key={i} style={{display:"flex",alignItems:"center",gap:5,background:T.primaryDim,border:`1px solid ${T.primary}40`,borderRadius:4,padding:"3px 8px"}}>
                <span style={{fontSize:10}}>{f.type==="pdf"?"📄":f.type==="csv"?"📋":"📊"}</span>
                <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:T.primary}}>{f.name}</span>
                {setPending&&<button onClick={()=>setPending(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:SM.muted,cursor:"pointer",fontSize:13,lineHeight:1,padding:0,marginLeft:2}}>×</button>}
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:6}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder={pendingFiles.length?"Files ready — describe what to analyse, or press Send...":"Ask anything about your business..."} style={{flex:1,background:SM.bg,border:`1px solid ${SM.border}`,borderRadius:6,padding:"7px 10px",fontSize:11,color:SM.text,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={()=>send()} disabled={loading||(!input.trim()&&!pendingFiles.length)} style={{...sbtn(industry.color),padding:"7px 12px",opacity:loading?0.5:1}}>➤</button>
        </div>
      </div>
    </div>
  );
}

// ── SME DASHBOARD ─────────────────────────────────────────────────────────────
// ── WHATSAPP PROMO SENDER ─────────────────────────────────────────────────────
// Uses wa.me deep link — opens WhatsApp with pre-filled message, owner taps Send
// Growth feature: shown with upgrade prompt in Starter tier

function WhatsAppSender({industry, trigger, context, tier="growth"}){
  const[open,setOpen]=useState(false);
  const[generating,setGenerating]=useState(false);
  const[msg,setMsg]=useState("");
  const[step,setStep]=useState("idle"); // idle | generating | edit | sent
  const textareaRef=useRef(null);

  const generate=async()=>{
    setOpen(true);
    setStep("generating");
    setGenerating(true);
    try{
      const system=`You are Aether writing a WhatsApp promotional message for ${industry.bizName}, a ${industry.label} business in ${industry.location}.

Write a short, warm, personalised WhatsApp message (max 3 sentences) for the following promotion context:
${context}

Rules:
- Friendly and personal, not salesy
- Include a clear call to action (reply YES, tap to book, etc.)
- Use ${industry.currency} for pricing if relevant
- No hashtags, no emojis overload (max 2)
- Start with "Hi [Name]," so it feels personal
- End with business name: ${industry.bizName}
- Max 160 characters ideally — keep it short

Return ONLY the message text, nothing else.`;
      const result=await callClaude([{role:"user",content:`Write the WhatsApp promo message for: ${context}`}],system,false,"whatsapp promo");
      setMsg(result.text.trim());
      setStep("edit");
    }catch(e){
      setMsg(`Hi [Name], we have a special offer at ${industry.bizName} this week — reply YES to find out more! 🎉`);
      setStep("edit");
    }
    setGenerating(false);
  };

  const send=()=>{
    const encoded=encodeURIComponent(msg);
    window.open(`https://wa.me/?text=${encoded}`,"_blank");
    setStep("sent");
  };

  const reset=()=>{setStep("idle");setMsg("");setOpen(false);};

  // Starter tier — show locked version
  if(tier==="starter"){
    return(
      <div style={{marginTop:10,display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:7,background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.25)"}}>
        <span style={{fontSize:14}}>🔒</span>
        <span style={{fontSize:11,color:SM.amber,fontWeight:600}}>WhatsApp Promotion Sender — Growth Plan only</span>
        <span style={{fontSize:10,color:SM.muted,marginLeft:"auto"}}>Upgrade to S$399/mo →</span>
      </div>
    );
  }

  return(
    <div style={{marginTop:10}}>
      {step==="idle"&&(
        <button onClick={generate} style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(37,211,102,0.4)",background:"rgba(37,211,102,0.1)",color:"#25D166",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(37,211,102,0.18)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(37,211,102,0.1)"}
        >
          <span style={{fontSize:15}}>💬</span> Send Promotion via WhatsApp
          <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:"rgba(37,211,102,0.6)",marginLeft:4}}>GROWTH</span>
        </button>
      )}

      {open&&(
        <div style={{marginTop:10,background:SM.bgCard,border:"1px solid rgba(37,211,102,0.25)",borderRadius:10,overflow:"hidden",animation:"fadeIn 0.2s ease"}}>
          {/* Header */}
          <div style={{background:"rgba(37,211,102,0.1)",borderBottom:"1px solid rgba(37,211,102,0.2)",padding:"10px 14px",display:"flex",alignItems:"center",gap:8,justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>💬</span>
              <div>
                <div style={{fontSize:12,fontWeight:700,color:"#25D166"}}>WhatsApp Promotion Sender</div>
                <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:SM.muted}}>Message generates → you review → you send</div>
              </div>
            </div>
            <button onClick={reset} style={{background:"none",border:"none",color:SM.muted,cursor:"pointer",fontSize:16,lineHeight:1}}>×</button>
          </div>

          <div style={{padding:"12px 14px"}}>
            {step==="generating"&&(
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 0"}}>
                <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#25D166",animation:`bounce 1.1s infinite ${i*0.18}s`}}/>)}</div>
                <span style={{fontSize:12,color:SM.muted}}>Aether is crafting your message...</span>
              </div>
            )}

            {step==="edit"&&(
              <>
                <div style={{fontSize:10,fontWeight:700,color:SM.muted,marginBottom:6,letterSpacing:1,fontFamily:"'JetBrains Mono',monospace"}}>REVIEW & EDIT MESSAGE BEFORE SENDING</div>
                <textarea
                  ref={textareaRef}
                  value={msg}
                  onChange={e=>setMsg(e.target.value)}
                  rows={4}
                  style={{width:"100%",background:SM.bgSec,border:"1px solid rgba(37,211,102,0.3)",borderRadius:7,padding:"10px 12px",fontSize:12,color:SM.text,outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.6}}
                />
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:4,marginBottom:10}}>
                  <span style={{fontSize:10,color:msg.length>300?SM.red:SM.muted,fontFamily:"'JetBrains Mono',monospace"}}>{msg.length} chars {msg.length>160?"· Long message":"· Good length"}</span>
                  <button onClick={generate} style={{fontSize:10,color:SM.muted,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>↺ Regenerate</button>
                </div>
                <div style={{background:"rgba(37,211,102,0.06)",borderRadius:6,padding:"8px 10px",marginBottom:10,border:"1px solid rgba(37,211,102,0.15)"}}>
                  <div style={{fontSize:9,color:SM.muted,fontFamily:"'JetBrains Mono',monospace",marginBottom:3}}>PREVIEW — how it will look in WhatsApp</div>
                  <div style={{fontSize:12,color:SM.text,lineHeight:1.6,fontStyle:"italic"}}>"{msg}"</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={send} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"10px",borderRadius:8,border:"none",background:"#25D166",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>
                    <span style={{fontSize:16}}>💬</span> Open WhatsApp & Send
                  </button>
                  <button onClick={reset} style={{padding:"10px 14px",borderRadius:8,border:`1px solid ${SM.border}`,background:"transparent",color:SM.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                </div>
              </>
            )}

            {step==="sent"&&(
              <div style={{textAlign:"center",padding:"16px 0"}}>
                <div style={{fontSize:28,marginBottom:8}}>✅</div>
                <div style={{fontSize:13,fontWeight:700,color:SM.text,marginBottom:4}}>WhatsApp opened!</div>
                <div style={{fontSize:11,color:SM.muted,marginBottom:12}}>Review and tap Send in WhatsApp to deliver to your clients.</div>
                <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                  <button onClick={()=>{setStep("edit");}} style={{padding:"7px 14px",borderRadius:7,border:"1px solid rgba(37,211,102,0.4)",background:"transparent",color:"#25D166",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Edit & Resend</button>
                  <button onClick={reset} style={{padding:"7px 14px",borderRadius:7,border:`1px solid ${SM.border}`,background:"transparent",color:SM.muted,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Done</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


// ── QUICK CAMPAIGN (WhatsApp one-click starters) ──────────────────────────────
function QuickCampaign({industry, campaign}){
  const[step,setStep]=useState("idle");
  const[msg,setMsg]=useState("");

  const generate=async()=>{
    setStep("generating");
    try{
      const system=`Write a WhatsApp message for ${industry.bizName} (${industry.label}, ${industry.location}). Max 160 chars. Warm, personal. Start with "Hi [Name],". End with business name. Return ONLY the message.`;
      const result=await callClaude([{role:"user",content:campaign.ctx}],system,false,"whatsapp");
      setMsg(result.text.trim());
      setStep("edit");
    }catch(e){
      setMsg(`Hi [Name], ${campaign.ctx.slice(0,80)}... — ${industry.bizName}`);
      setStep("edit");
    }
  };

  const send=()=>{ window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank"); setStep("sent"); };

  return(
    <div style={{background:SM.bgSec,borderRadius:7,padding:"8px 10px",border:`1px solid ${SM.border}`}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <span style={{fontSize:11,color:SM.text,fontWeight:500}}>💬 {campaign.label}</span>
        {step==="idle"&&<button onClick={generate} style={{...sbtn("#25D166",{fontSize:9,padding:"4px 10px"}),...{background:"rgba(37,209,102,0.15)",color:"#25D166",border:"1px solid rgba(37,209,102,0.3)"}}}>Generate</button>}
        {step==="generating"&&<span style={{...{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:SM.muted}}}>Writing...</span>}
        {step==="sent"&&<span style={{fontSize:9,color:SM.green,fontFamily:"'JetBrains Mono',monospace"}}>✓ Sent</span>}
      </div>
      {step==="edit"&&(
        <div style={{marginTop:8}}>
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={3} style={{width:"100%",background:SM.bg,border:"1px solid rgba(37,209,102,0.3)",borderRadius:5,padding:"7px 9px",fontSize:10,color:SM.text,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.5}}/>
          <div style={{display:"flex",gap:6,marginTop:6}}>
            <button onClick={send} style={{...sbtn("#25D166",{fontSize:10,padding:"5px 12px",flex:1,justifyContent:"center"})}}>💬 Open WhatsApp</button>
            <button onClick={()=>setStep("idle")} style={{fontSize:10,color:SM.muted,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CUSTOM CAMPAIGN ───────────────────────────────────────────────────────────
function CustomCampaign({industry}){
  const[ctx,setCtx]=useState("");
  const[step,setStep]=useState("idle");
  const[msg,setMsg]=useState("");

  const generate=async()=>{
    if(!ctx.trim())return;
    setStep("generating");
    try{
      const system=`Write a WhatsApp message for ${industry.bizName}. Max 160 chars. Warm, personal. Start with "Hi [Name],". Return ONLY the message.`;
      const result=await callClaude([{role:"user",content:ctx}],system,false,"whatsapp");
      setMsg(result.text.trim());
      setStep("edit");
    }catch(e){
      setMsg(`Hi [Name], ${ctx.slice(0,80)} — ${industry.bizName}`);
      setStep("edit");
    }
  };

  const send=()=>{ window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`,"_blank"); setStep("done"); };

  return(
    <div>
      {(step==="idle"||step==="generating")&&(
        <div style={{display:"flex",gap:6}}>
          <input value={ctx} onChange={e=>setCtx(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()} placeholder="Describe your campaign..." style={{flex:1,background:SM.bg,border:`1px solid ${SM.border}`,borderRadius:6,padding:"7px 9px",fontSize:10,color:SM.text,outline:"none",fontFamily:"inherit"}}/>
          <button onClick={generate} disabled={!ctx.trim()||step==="generating"} style={{...sbtn("#25D166",{fontSize:10,padding:"7px 12px",opacity:!ctx.trim()||step==="generating"?0.5:1})}}>
            {step==="generating"?"...":"Go"}
          </button>
        </div>
      )}
      {step==="edit"&&(
        <div>
          <textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={3} style={{width:"100%",background:SM.bg,border:"1px solid rgba(37,209,102,0.3)",borderRadius:5,padding:"7px 9px",fontSize:10,color:SM.text,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.5,marginBottom:6}}/>
          <div style={{display:"flex",gap:6}}>
            <button onClick={send} style={{...sbtn("#25D166",{fontSize:10,padding:"5px 12px",flex:1,justifyContent:"center"})}}>💬 Open WhatsApp</button>
            <button onClick={()=>setStep("idle")} style={{fontSize:10,color:SM.muted,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>✕</button>
          </div>
        </div>
      )}
      {step==="done"&&<div style={{fontSize:10,color:SM.green,fontFamily:"'JetBrains Mono',monospace",marginTop:4}}>✓ WhatsApp opened — tap Send to deliver</div>}
    </div>
  );
}


// ── OPS CARD — with Details toggle + inline follow-up chat ───────────────────
function OpsCard({alert, idx, industry, isExecuted, onExecute}){
  const c=alert.sev==="critical"?SM.red:alert.sev==="warning"?SM.amber:"#06b6d4";
  const[detailsOpen,setDetailsOpen]=useState(false);
  const[chatOpen,setChatOpen]=useState(false);
  const[chatMessages,setChatMessages]=useState([{
    role:"assistant",
    content:`## Operations Alert: ${alert.title}

**Severity:** ${alert.sev.toUpperCase()}

**Recommended Action:** ${alert.action}

Ask me anything about this issue — estimated cost impact, implementation steps, escalation path, or how to prevent recurrence.`
  }]);
  const[chatInput,setChatInput]=useState("");
  const[chatLoading,setChatLoading]=useState(false);
  const chatEndRef=useRef(null);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatMessages]);

  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading)return;
    const userText=chatInput.trim();
    setChatInput("");
    setChatMessages(p=>[...p,{role:"user",content:userText}]);
    setChatLoading(true);
    const system=`You are Aether SME — an operations analyst for ${industry.bizName} (${industry.label}, ${industry.location}).

This operations alert has been raised:
Title: ${alert.title}
Detail: ${alert.detail}
Recommended action: ${alert.action}
Source: ${alert.src}
Time: ${alert.time}

Answer questions about this alert: cost impact, urgency, implementation, prevention, or escalation. Be direct and practical. Keep responses under 150 words.`;
    const history=chatMessages.slice(-6).map(m=>({role:m.role,content:String(m.content)}));
    try{
      const result=await callClaude([...history,{role:"user",content:userText}],system,false,userText);
      setChatMessages(p=>[...p,{role:"assistant",content:result.text}]);
    }catch(e){
      setChatMessages(p=>[...p,{role:"assistant",content:`Error: ${e.message}`}]);
    }
    setChatLoading(false);
  };

  return(
    <div style={{background:SM.bgSec,borderRadius:8,border:`1px solid ${c}30`,overflow:"hidden"}}>
      <div style={{padding:"12px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:c,display:"inline-block",boxShadow:`0 0 6px ${c}`,flexShrink:0}}/>
              <span style={{fontSize:12,fontWeight:700,color:SM.text}}>{alert.title}</span>
              <span style={stag(c)}>{alert.sev.toUpperCase()}</span>
            </div>
            <div style={{fontSize:11,color:SM.muted,lineHeight:1.55,marginBottom:6}}>{alert.detail}</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:SM.dim}}>{alert.time}</span>
              <span style={stag("#06b6d4")}>{alert.src}</span>
            </div>
            <div style={{background:`${c}10`,borderRadius:5,padding:"7px 10px",border:`1px solid ${c}20`}}>
              <span style={{fontSize:10,fontWeight:700,color:c}}>⚡ Action: </span>
              <span style={{fontSize:10,color:SM.muted}}>{alert.action}</span>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0}}>
            <button onClick={onExecute} disabled={isExecuted} style={{...sbtn(isExecuted?SM.muted:c,{fontSize:10,padding:"5px 10px",opacity:isExecuted?0.6:1,background:isExecuted?SM.bgCard:c,border:`1px solid ${c}40`,color:isExecuted?SM.muted:"#fff"})}}>
              {isExecuted?"✓ Done":"Execute"}
            </button>
            <button onClick={()=>setDetailsOpen(p=>!p)} style={{fontSize:10,color:detailsOpen?SM.muted:c,background:"none",border:`1px solid ${detailsOpen?SM.border:c+"40"}`,borderRadius:5,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
              {detailsOpen?"▲ Less":"+ Details"}
            </button>
          </div>
        </div>

        {detailsOpen&&(
          <div style={{marginTop:10,background:SM.bgCard,borderRadius:6,border:`1px solid ${SM.border}`,padding:"10px 14px",animation:"fadeIn 0.2s ease"}}>
            <div style={{fontSize:9,fontWeight:700,color:SM.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>Alert Details</div>
            {[
              {label:"Source",    val:alert.src},
              {label:"Detected",  val:alert.time},
              {label:"Severity",  val:alert.sev.toUpperCase(), highlight:true},
              {label:"Full Detail",val:alert.detail},
              {label:"Action",    val:alert.action},
            ].map((row,ri)=>(
              <div key={ri} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:5}}>
                <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:SM.muted,minWidth:72,paddingTop:1,textTransform:"uppercase",letterSpacing:1,flexShrink:0}}>{row.label}</span>
                <span style={{fontSize:11,color:row.highlight?c:SM.text,fontWeight:row.highlight?700:400,lineHeight:1.5}}>{row.val}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={()=>setChatOpen(p=>!p)} style={{marginTop:8,fontSize:10,color:chatOpen?SM.muted:c,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
          {chatOpen?"▲ Close follow-up":"▼ Ask a follow-up — cost impact, escalation path, prevention steps"}
        </button>
      </div>

      {chatOpen&&(
        <div style={{borderTop:`1px solid ${SM.border}`,background:SM.bgCard,animation:"slideIn 0.2s ease"}}>
          <div style={{padding:"8px 14px",borderBottom:`1px solid ${SM.border}`,display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:`linear-gradient(135deg,${c},${SM.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:"#fff"}}>A</div>
            <span style={{fontSize:10,fontWeight:700,color:c}}>Operations Follow-up — cost impact · escalation · prevention</span>
          </div>
          <div style={{height:200,overflowY:"auto",padding:"10px 14px",display:"flex",flexDirection:"column",gap:7}}>
            {chatMessages.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"88%",padding:"8px 11px",borderRadius:m.role==="user"?"7px 2px 7px 7px":"2px 7px 7px 7px",fontSize:11,lineHeight:1.55,background:m.role==="user"?c:SM.bgSec,color:m.role==="user"?"#fff":SM.text,border:m.role==="assistant"?`1px solid ${SM.border}`:"none"}}>
                  <Md text={m.content}/>
                </div>
              </div>
            ))}
            {chatLoading&&<div style={{display:"flex",gap:4,padding:"7px 10px",background:SM.bgSec,borderRadius:"2px 6px 6px 6px",width:"fit-content"}}>{[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:c,animation:`bounce 1.1s infinite ${i*0.18}s`}}/>)}</div>}
            <div ref={chatEndRef}/>
          </div>
          <div style={{padding:"8px 14px",borderTop:`1px solid ${SM.border}`,display:"flex",gap:6}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Ask about cost impact, escalation, prevention..." style={{flex:1,background:SM.bg,border:`1px solid ${SM.border}`,borderRadius:6,padding:"7px 10px",fontSize:11,color:SM.text,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{...sbtn(c,{padding:"7px 12px",opacity:chatLoading?0.5:1})}}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── FEEDBACK CARD — with Details toggle + inline follow-up chat ───────────────
function FeedbackCard({fb, idx, industry, isExecuted, onExecute}){
  const c="#8b5cf6";
  const[detailsOpen,setDetailsOpen]=useState(false);
  const[chatOpen,setChatOpen]=useState(false);
  const[chatMessages,setChatMessages]=useState([{
    role:"assistant",
    content:`## Customer Feedback: ${fb.source}

**Rating:** ${fb.rating} (${fb.trend})

**Key Insight:** ${fb.insight}

Ask me anything — how to improve this score, which customers to prioritise, what actions will have the most impact, or how long improvements typically take.`
  }]);
  const[chatInput,setChatInput]=useState("");
  const[chatLoading,setChatLoading]=useState(false);
  const chatEndRef=useRef(null);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatMessages]);

  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading)return;
    const userText=chatInput.trim();
    setChatInput("");
    setChatMessages(p=>[...p,{role:"user",content:userText}]);
    setChatLoading(true);
    const system=`You are Aether SME — a customer experience analyst for ${industry.bizName} (${industry.label}, ${industry.location}).

Customer feedback data:
Source: ${fb.source}
Rating: ${fb.rating} (${fb.trend})
Sample size: ${fb.count}
Key insight: ${fb.insight}

Answer questions about improving this feedback score: what to prioritise, realistic improvement timelines, specific actions, and estimated impact on retention and revenue. Keep responses under 150 words. Be direct and practical.`;
    const history=chatMessages.slice(-6).map(m=>({role:m.role,content:String(m.content)}));
    try{
      const result=await callClaude([...history,{role:"user",content:userText}],system,false,userText);
      setChatMessages(p=>[...p,{role:"assistant",content:result.text}]);
    }catch(e){
      setChatMessages(p=>[...p,{role:"assistant",content:`Error: ${e.message}`}]);
    }
    setChatLoading(false);
  };

  return(
    <div style={{background:SM.bgSec,borderRadius:8,border:`1px solid ${SM.border}`,overflow:"hidden"}}>
      <div style={{padding:"12px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
              <span style={{fontSize:12,fontWeight:700,color:SM.text}}>{fb.source}</span>
              <span style={{fontSize:13,fontWeight:800,color:c}}>{fb.rating}</span>
              <span style={{fontSize:10,color:fb.trend.startsWith("-")?SM.red:SM.green,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>{fb.trend}</span>
            </div>
            <div style={{fontSize:10,color:SM.dim,marginBottom:6,fontFamily:"'JetBrains Mono',monospace"}}>{fb.count}</div>
            <div style={{background:"rgba(139,92,246,0.08)",borderRadius:5,padding:"8px 10px",border:"1px solid rgba(139,92,246,0.2)"}}>
              <span style={{fontSize:10,fontWeight:700,color:c}}>💡 Insight: </span>
              <span style={{fontSize:10,color:SM.muted,lineHeight:1.5}}>{fb.insight}</span>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0}}>
            <button onClick={onExecute} disabled={isExecuted} style={{...sbtn(isExecuted?SM.muted:c,{fontSize:10,padding:"5px 10px",opacity:isExecuted?0.6:1,background:isExecuted?SM.bgCard:c,border:`1px solid ${c}40`,color:isExecuted?SM.muted:"#fff"})}}>
              {isExecuted?"✓ Done":"Execute"}
            </button>
            <button onClick={()=>setDetailsOpen(p=>!p)} style={{fontSize:10,color:detailsOpen?SM.muted:c,background:"none",border:`1px solid ${detailsOpen?SM.border:c+"40"}`,borderRadius:5,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
              {detailsOpen?"▲ Less":"+ Details"}
            </button>
          </div>
        </div>

        {detailsOpen&&(
          <div style={{marginTop:10,background:SM.bgCard,borderRadius:6,border:`1px solid ${SM.border}`,padding:"10px 14px",animation:"fadeIn 0.2s ease"}}>
            <div style={{fontSize:9,fontWeight:700,color:SM.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>Feedback Details</div>
            {[
              {label:"Source",     val:fb.source},
              {label:"Rating",     val:fb.rating, highlight:true},
              {label:"Trend",      val:fb.trend,  highlight:true},
              {label:"Sample",     val:fb.count},
              {label:"Full Insight",val:fb.insight},
            ].map((row,ri)=>(
              <div key={ri} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:5}}>
                <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:SM.muted,minWidth:72,paddingTop:1,textTransform:"uppercase",letterSpacing:1,flexShrink:0}}>{row.label}</span>
                <span style={{fontSize:11,color:row.highlight?c:SM.text,fontWeight:row.highlight?700:400,lineHeight:1.5}}>{row.val}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={()=>setChatOpen(p=>!p)} style={{marginTop:8,fontSize:10,color:chatOpen?SM.muted:c,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
          {chatOpen?"▲ Close follow-up":"▼ Ask a follow-up — improvement actions, timelines, patient prioritisation"}
        </button>
      </div>

      {chatOpen&&(
        <div style={{borderTop:`1px solid ${SM.border}`,background:SM.bgCard,animation:"slideIn 0.2s ease"}}>
          <div style={{padding:"8px 14px",borderBottom:`1px solid ${SM.border}`,display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:`linear-gradient(135deg,${c},${SM.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:"#fff"}}>A</div>
            <span style={{fontSize:10,fontWeight:700,color:c}}>Feedback Follow-up — improvement actions · timelines · priorities</span>
          </div>
          <div style={{height:200,overflowY:"auto",padding:"10px 14px",display:"flex",flexDirection:"column",gap:7}}>
            {chatMessages.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"88%",padding:"8px 11px",borderRadius:m.role==="user"?"7px 2px 7px 7px":"2px 7px 7px 7px",fontSize:11,lineHeight:1.55,background:m.role==="user"?c:SM.bgSec,color:m.role==="user"?"#fff":SM.text,border:m.role==="assistant"?`1px solid ${SM.border}`:"none"}}>
                  <Md text={m.content}/>
                </div>
              </div>
            ))}
            {chatLoading&&<div style={{display:"flex",gap:4,padding:"7px 10px",background:SM.bgSec,borderRadius:"2px 6px 6px 6px",width:"fit-content"}}>{[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:c,animation:`bounce 1.1s infinite ${i*0.18}s`}}/>)}</div>}
            <div ref={chatEndRef}/>
          </div>
          <div style={{padding:"8px 14px",borderTop:`1px solid ${SM.border}`,display:"flex",gap:6}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Ask about improvements, timelines, customer prioritisation..." style={{flex:1,background:SM.bg,border:`1px solid ${SM.border}`,borderRadius:6,padding:"7px 10px",fontSize:11,color:SM.text,outline:"none",fontFamily:"inherit"}}/>
            <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{...sbtn(c,{padding:"7px 12px",opacity:chatLoading?0.5:1})}}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}


// ── DECISION CARD with inline follow-up chat ──────────────────────────────────
function DecisionCard({dec, idx, cat, industry, isExecuted, onExecute}){
  const[chatOpen,setChatOpen]=useState(false);
  const[detailsOpen,setDetailsOpen]=useState(false);
  const[impact,setImpact]=useState(dec.impact||"");
  const[editingImpact,setEditingImpact]=useState(false);
  const[chatMessages,setChatMessages]=useState([{
    role:"assistant",
    content:`## Follow-up on: ${dec.q}\n\nAether's estimated impact: **${dec.impact||"TBD"}**\n\nYou can challenge this estimate, ask for a deeper breakdown, or adjust the impact amount based on your own knowledge of the business.\n\nWhat would you like to explore?`
  }]);
  const[chatInput,setChatInput]=useState("");
  const[chatLoading,setChatLoading]=useState(false);
  const chatEndRef=useRef(null);
  useEffect(()=>{chatEndRef.current?.scrollIntoView({behavior:"smooth"});},[chatMessages]);

  const sendChat=async()=>{
    if(!chatInput.trim()||chatLoading)return;
    const userText=chatInput.trim();
    setChatInput("");
    setChatMessages(p=>[...p,{role:"user",content:userText}]);
    setChatLoading(true);

    const system=`You are Aether SME — a business analyst for ${industry.bizName} (${industry.label}, ${industry.location}).

The user is following up on this decision initiative:
Question: ${dec.q}
Aether's answer: ${dec.a}
Current estimated impact: ${impact}

The user may:
1. Challenge the impact estimate — respond with honest reassessment, show your working
2. Ask for deeper analysis — provide it specifically for their business context
3. Suggest a different impact amount — acknowledge and update your position if reasonable
4. Ask about implementation — give practical steps

If the user proposes a different impact figure, say: "Updated impact: [their figure]" clearly so they can see it.
Keep responses concise (under 150 words). Be direct and commercial.`;

    const history=chatMessages.slice(-6).map(m=>({role:m.role,content:String(m.content)}));
    try{
      const result=await callClaude([...history,{role:"user",content:userText}],system,false,userText);
      setChatMessages(p=>[...p,{role:"assistant",content:result.text}]);
      // Check if AI updated impact
      const updatedMatch=result.text.match(/Updated impact[:\s]+([\w\$\,\.\+\-\/mo]+)/i);
      if(updatedMatch) setImpact(updatedMatch[1]);
    }catch(e){
      setChatMessages(p=>[...p,{role:"assistant",content:`Error: ${e.message}`}]);
    }
    setChatLoading(false);
  };

  return(
    <div style={{background:SM.bgSec,borderRadius:8,border:`1px solid ${isExecuted?SM.green:SM.border}`,overflow:"hidden",transition:"border-color 0.2s"}}>
      <div style={{padding:"12px 14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:10}}>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,flexWrap:"wrap"}}>
              <span style={{fontSize:11,fontWeight:800,color:cat.color,fontFamily:"'JetBrains Mono',monospace",flexShrink:0}}>{String(idx+1).padStart(2,"0")}</span>
              <span style={{fontSize:12,fontWeight:700,color:SM.text}}>{dec.q}</span>
            </div>
            <div style={{background:`${cat.color}10`,borderRadius:6,padding:"9px 12px",border:`1px solid ${cat.color}25`}}>
              <div style={{fontSize:9,fontWeight:700,color:cat.color,marginBottom:3,letterSpacing:1,fontFamily:"'JetBrains Mono',monospace"}}>⚡ AETHER ANSWER</div>
              <div style={{fontSize:11,color:SM.text,lineHeight:1.6}}>{dec.a}</div>
              <div style={{marginTop:6,display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,color:SM.muted}}>Est. impact:</span>
                {editingImpact?(
                  <div style={{display:"flex",gap:5,alignItems:"center"}}>
                    <input value={impact} onChange={e=>setImpact(e.target.value)} onKeyDown={e=>e.key==="Enter"&&setEditingImpact(false)} style={{background:SM.bg,border:`1px solid ${cat.color}50`,borderRadius:4,padding:"2px 7px",fontSize:11,color:SM.green,fontWeight:800,outline:"none",fontFamily:"'JetBrains Mono',monospace",width:100}} autoFocus/>
                    <button onClick={()=>setEditingImpact(false)} style={{fontSize:10,color:SM.green,background:"none",border:"none",cursor:"pointer"}}>✓ Save</button>
                  </div>
                ):(
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span style={{fontSize:11,fontWeight:800,color:SM.green,fontFamily:"'JetBrains Mono',monospace"}}>{impact}</span>
                    <button onClick={()=>setEditingImpact(true)} title="Edit impact estimate" style={{fontSize:9,color:SM.muted,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit"}}>✎</button>
                  </div>
                )}
              </div>
            </div>
            {/* Details panel */}
            {detailsOpen&&(
              <div style={{marginTop:8,background:SM.bgCard,borderRadius:6,border:`1px solid ${SM.border}`,padding:"10px 14px",animation:"fadeIn 0.2s ease"}}>
                <div style={{fontSize:9,fontWeight:700,color:SM.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>Initiative Details</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {[
                    {label:"Category",   val:cat.label},
                    {label:"Est. Impact", val:impact, highlight:true},
                    {label:"Business",   val:`${dec.a.slice(0,90)}${dec.a.length>90?"...":""}`},
                    ...(dec.promo?[{label:"Suggested Promo", val:dec.promo.slice(0,100)+"..."}]:[]),
                  ].map((row,ri)=>(
                    <div key={ri} style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                      <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:SM.muted,minWidth:80,paddingTop:1,textTransform:"uppercase",letterSpacing:1}}>{row.label}</span>
                      <span style={{fontSize:11,color:row.highlight?SM.green:SM.text,fontWeight:row.highlight?800:400,lineHeight:1.5}}>{row.val}</span>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:10,paddingTop:8,borderTop:`1px solid ${SM.border}`,display:"flex",gap:8,flexWrap:"wrap"}}>
                  <div style={{fontSize:10,color:SM.muted}}>Once executed, this initiative will appear in your <span style={{color:SM.green,fontWeight:600}}>ROI Tracker</span> for month-on-month outcome tracking.</div>
                </div>
              </div>
            )}

            <button
              onClick={()=>setChatOpen(p=>!p)}
              style={{marginTop:8,fontSize:10,color:chatOpen?SM.muted:cat.color,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}
            >
              {chatOpen?"▲ Close follow-up":"▼ Ask a follow-up question — challenge the impact, request deeper analysis"}
            </button>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end",flexShrink:0}}>
            <button
              onClick={onExecute}
              disabled={isExecuted}
              style={{...sbtn(isExecuted?SM.muted:cat.color,{fontSize:10,padding:"6px 12px",opacity:isExecuted?0.6:1,background:isExecuted?SM.bgCard:cat.color,border:`1px solid ${cat.color}40`,color:isExecuted?SM.muted:"#fff"})}}
            >
              {isExecuted?"✓ Done":"Execute"}
            </button>
            <button
              onClick={()=>setDetailsOpen(p=>!p)}
              style={{fontSize:10,color:detailsOpen?SM.muted:cat.color,background:"none",border:`1px solid ${detailsOpen?SM.border:cat.color+'40'}`,borderRadius:5,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
            >
              {detailsOpen?"▲ Less":"+ Details"}
            </button>
          </div>
        </div>
      </div>

      {/* Inline follow-up chat */}
      {chatOpen&&(
        <div style={{borderTop:`1px solid ${SM.border}`,background:SM.bgCard,animation:"slideIn 0.2s ease"}}>
          <div style={{padding:"8px 14px",borderBottom:`1px solid ${SM.border}`,display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:18,height:18,borderRadius:"50%",background:`linear-gradient(135deg,${cat.color},${SM.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:800,color:"#fff"}}>A</div>
            <span style={{fontSize:10,fontWeight:700,color:cat.color}}>Follow-up Chat — Challenge impact · Request deeper analysis · Adjust estimate</span>
          </div>
          <div style={{height:220,overflowY:"auto",padding:"10px 14px",display:"flex",flexDirection:"column",gap:7}}>
            {chatMessages.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"88%",padding:"8px 11px",borderRadius:m.role==="user"?"7px 2px 7px 7px":"2px 7px 7px 7px",fontSize:11,lineHeight:1.55,background:m.role==="user"?cat.color:SM.bgSec,color:m.role==="user"?"#fff":SM.text,border:m.role==="assistant"?`1px solid ${SM.border}`:"none"}}>
                  <Md text={m.content}/>
                </div>
              </div>
            ))}
            {chatLoading&&<div style={{display:"flex",gap:4,padding:"7px 10px",background:SM.bgSec,borderRadius:"2px 6px 6px 6px",width:"fit-content",border:`1px solid ${SM.border}`}}>{[0,1,2].map(i=><div key={i} style={{width:4,height:4,borderRadius:"50%",background:cat.color,animation:`bounce 1.1s infinite ${i*0.18}s`}}/>)}</div>}
            <div ref={chatEndRef}/>
          </div>
          <div style={{padding:"8px 14px",borderTop:`1px solid ${SM.border}`,display:"flex",gap:6}}>
            <input
              value={chatInput}
              onChange={e=>setChatInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&sendChat()}
              placeholder={`Challenge the impact, ask for breakdown, or say "I think the impact is S$X/month"...`}
              style={{flex:1,background:SM.bg,border:`1px solid ${SM.border}`,borderRadius:6,padding:"7px 10px",fontSize:11,color:SM.text,outline:"none",fontFamily:"inherit"}}
            />
            <button onClick={sendChat} disabled={chatLoading||!chatInput.trim()} style={{...sbtn(cat.color,{padding:"7px 12px",opacity:chatLoading?0.5:1})}}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}


function SmeDashboard({industry, setPage, onExecute}){
  const[activeCat,setActiveCat]=useState("revenue");
  const[executed,setExecuted]=useState({});
  const cat=SME_VISIBLE_CATS.find(c=>c.id===activeCat)||SME_VISIBLE_CATS[0];

  // Get decisions/alerts/feedback for active cat
  const getItems=()=>{
    const d=industry.decisions||{};
    if(activeCat==="ops")      return d.ops||[];
    if(activeCat==="feedback") return d.feedback||[];
    return d[activeCat]||d.revenue||[];
  };
  const items=getItems();

  const handleExecute=(item,idx)=>{
    const key=`${activeCat}-${idx}`;
    setExecuted(p=>({...p,[key]:true}));
    onExecute({
      id:`${activeCat}-${idx}-${Date.now()}`,
      action:item.q||item.title||item.source,
      value:item.impact||item.value||"TBD",
      type:"revenue",
      cat:activeCat,
      prevMonth:"S$0",
    });
  };

  return(
    <div style={{flex:1,overflowY:"auto",padding:20,background:SM.bg,display:"flex",flexDirection:"column",gap:14}}>

      {/* KPI Grid */}
      <div>
        <div style={{fontSize:11,fontWeight:700,color:SM.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:2,fontFamily:"'JetBrains Mono',monospace"}}>Business Health — This Month</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
          {industry.kpis.map(k=>(
            <div key={k.label} style={{...scard(),position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${industry.color},transparent)`}}/>
              <div style={{fontSize:9,fontWeight:700,color:SM.muted,letterSpacing:1.5,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:6}}>{k.label}</div>
              <div style={{fontSize:20,fontWeight:800,color:SM.text,letterSpacing:-0.5,marginBottom:2}}>{k.value}</div>
              <span style={{fontSize:11,fontWeight:700,color:k.pos?SM.green:SM.red,fontFamily:"'JetBrains Mono',monospace"}}>{k.change}</span>
              <div style={{fontSize:10,color:SM.dim,marginTop:4}}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main two-col section: Decisions + WhatsApp */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:14,alignItems:"start"}}>

        {/* LEFT: My Decisions This Week */}
        <div style={scard()}>
          <div style={{fontSize:13,fontWeight:800,color:SM.text,marginBottom:2}}>My Decisions This Week</div>
          <div style={{fontSize:11,color:SM.muted,marginBottom:12}}>Select a category — Aether surfaces the top 3 actions with estimated impact.</div>

          {/* Category pills */}
          <div style={{display:"flex",gap:6,marginBottom:14,flexWrap:"wrap"}}>
            {SME_VISIBLE_CATS.map(c=>(
              <button key={c.id} onClick={()=>setActiveCat(c.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"6px 12px",borderRadius:20,border:`1.5px solid ${activeCat===c.id?c.color:SM.border}`,background:activeCat===c.id?`${c.color}15`:"transparent",color:activeCat===c.id?c.color:SM.muted,fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.15s",position:"relative"}}>
                {c.icon} {c.label}
                {c.id==="ops"&&(industry.decisions?.ops||[]).some(o=>o.sev==="critical")&&(
                  <span style={{position:"absolute",top:-3,right:-3,width:8,height:8,borderRadius:"50%",background:SM.red,border:`2px solid ${SM.bg}`}}/>
                )}
              </button>
            ))}
          </div>

          {/* OPS: Alert cards */}
          {activeCat==="ops"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {items.map((alert,i)=>(
                <OpsCard
                  key={`ops-${i}`}
                  alert={alert}
                  idx={i}
                  industry={industry}
                  isExecuted={!!executed[`ops-${i}`]}
                  onExecute={()=>!executed[`ops-${i}`]&&handleExecute(alert,i)}
                />
              ))}
            </div>
          )}

          {/* FEEDBACK: Source cards */}
          {activeCat==="feedback"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {items.map((fb,i)=>(
                <FeedbackCard
                  key={`feedback-${i}`}
                  fb={fb}
                  idx={i}
                  industry={industry}
                  isExecuted={!!executed[`feedback-${i}`]}
                  onExecute={()=>!executed[`feedback-${i}`]&&handleExecute(fb,i)}
                />
              ))}
            </div>
          )}

          {/* STANDARD decisions: top 3 with inline follow-up chat */}
          {activeCat!=="ops"&&activeCat!=="feedback"&&(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {items.slice(0,3).map((dec,i)=>{
                const key=`${activeCat}-${i}`;
                return(
                  <DecisionCard
                    key={key}
                    dec={dec}
                    idx={i}
                    cat={cat}
                    industry={industry}
                    isExecuted={!!executed[key]}
                    onExecute={()=>!executed[key]&&handleExecute(dec,i)}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: Customer Engagement via WhatsApp */}
        <div style={scard()}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
            <span style={{fontSize:16}}>💬</span>
            <div style={{fontSize:13,fontWeight:800,color:SM.text}}>Customer Engagement</div>
          </div>
          <div style={{fontSize:11,color:SM.muted,marginBottom:12}}>Generate & send targeted WhatsApp campaigns to your patients.</div>

          {/* Quick campaign starters */}
          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:12}}>
            {[
              {label:"Fill Tuesday slots",   ctx:`Tuesday appointments at ${industry.bizName} only 31% full. Offer existing patients a Tuesday exclusive discount to fill the slots.`},
              {label:"6-month recall",        ctx:`Send a friendly 6-month dental check-up reminder to patients of ${industry.bizName} who haven't visited recently.`},
              {label:"New service launch",    ctx:`${industry.bizName} now offers Invisalign. Invite suitable existing patients for a free consultation.`},
              {label:"Membership plan",       ctx:`Promote the ${industry.bizName} annual dental care plan at S$380/year to existing patients.`},
            ].map((c,i)=>(
              <QuickCampaign key={i} industry={industry} campaign={c}/>
            ))}
          </div>

          <div style={{borderTop:`1px solid ${SM.border}`,paddingTop:10}}>
            <div style={{fontSize:10,color:SM.muted,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:6}}>CUSTOM CAMPAIGN</div>
            <CustomCampaign industry={industry}/>
          </div>
        </div>
      </div>

      {/* Benchmarks */}
      <div style={scard()}>
        <div style={{fontSize:12,fontWeight:800,color:SM.text,marginBottom:10}}>How You Compare — SEA Industry Benchmarks</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {industry.benchmarks.map(b=>{
            const c=b.status==="above"?SM.red:b.status==="below"?SM.amber:SM.green;
            const label=b.status==="above"?"ABOVE NORM":b.status==="below"?"BELOW NORM":"ON TRACK";
            return(
              <div key={b.metric} style={{display:"grid",gridTemplateColumns:"2fr 80px 1fr 100px",gap:8,alignItems:"center",padding:"8px 10px",background:SM.bgSec,borderRadius:6}}>
                <span style={{fontSize:11,fontWeight:600,color:SM.text}}>{b.metric}</span>
                <span style={{fontSize:11,fontWeight:800,color:c,fontFamily:"'JetBrains Mono',monospace"}}>{b.yours}</span>
                <span style={{fontSize:10,color:SM.dim,fontFamily:"'JetBrains Mono',monospace"}}>{b.industry} industry</span>
                <STag c={c}>{label}</STag>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


// ── SME CO-PILOT PAGE ─────────────────────────────────────────────────────────
function SmeCopilot({industry}){
  const[activeQ,setActiveQ]=useState(null);
  const[allFiles,setAllFiles]=useState([]);
  const[pending,setPending]=useState([]);
  const[dragOver,setDragOver]=useState(false);
  const fileRef=useRef(null);

  const processFiles=async(rawFiles)=>{
    const arr=Array.from(rawFiles).filter(f=>/\.(xlsx|xls|pdf|csv)$/i.test(f.name));
    if(!arr.length)return;
    const parsed=[];
    for(const f of arr){
      try{
        if(/\.(xlsx|xls)$/i.test(f.name)){const text=await readExcel(f);parsed.push({name:f.name,type:"excel",content:text,size:f.size});}
        else if(/\.csv$/i.test(f.name)){const text=await readCsv(f);parsed.push({name:f.name,type:"csv",content:text,size:f.size});}
        else{const b64=await readPdf(f);parsed.push({name:f.name,type:"pdf",content:b64,size:f.size});}
      }catch(e){console.error(e);}
    }
    if(!parsed.length)return;
    setAllFiles(p=>[...p,...parsed]);
    setPending(p=>[...p,...parsed]);
  };

  const welcomeMsg=`## Hi! I'm your Aether Co-Pilot for ${industry.bizName} 👋\n\nI know your business — ${industry.outlets} outlets, ${industry.kpis[0].value} monthly revenue, and I can see where the opportunities are.\n\n**Ask me anything, upload a file, or pick a quick question below.**`;

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:SM.bg}}>
      {/* File Upload — identical behaviour to Enterprise */}
      <div style={{padding:"10px 20px",borderBottom:`1px solid ${SM.border}`,background:SM.bgCard,flexShrink:0}}>
        <div
          onDrop={e=>{e.preventDefault();setDragOver(false);processFiles(e.dataTransfer.files);}}
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onClick={()=>fileRef.current?.click()}
          style={{background:dragOver?T.primaryDim:SM.bgSec,border:`1.5px dashed ${dragOver?T.primary:SM.border}`,borderRadius:8,padding:"10px 16px",cursor:"pointer",transition:"all 0.15s"}}
        >
          <input ref={fileRef} type="file" multiple accept=".xlsx,.xls,.pdf,.csv" style={{display:"none"}} onChange={e=>processFiles(e.target.files)}/>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:30,height:30,borderRadius:7,background:T.primaryDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:T.primary,flexShrink:0}}>+</div>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:SM.text,marginBottom:1}}>Add External Data</div>
              <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:SM.muted}}>Drop or click · Excel (.xlsx/.xls) · CSV · PDF</div>
            </div>
            {allFiles.length>0&&<span style={stag(SM.green)}>{allFiles.length} FILE{allFiles.length>1?"S":""} LOADED</span>}
          </div>
          {allFiles.length>0&&(
            <div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>
              {allFiles.map((f,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5,background:SM.bgCard,border:`1px solid ${SM.border}`,borderRadius:4,padding:"3px 8px"}}>
                  <span style={{fontSize:10}}>{f.type==="pdf"?"📄":f.type==="csv"?"📋":"📊"}</span>
                  <span style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:SM.muted}}>{f.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{padding:"10px 20px",borderBottom:`1px solid ${SM.border}`,background:SM.bgCard,flexShrink:0}}>
        <div style={{fontSize:11,fontWeight:700,color:SM.text,marginBottom:6}}>Quick Questions — tap to ask instantly</div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {industry.questions.slice(0,6).map((q,i)=>(
            <button key={i} onClick={()=>setActiveQ(q)} style={{fontSize:11,padding:"5px 12px",borderRadius:20,border:`1px solid ${SM.border}`,background:SM.bgSec,color:SM.muted,cursor:"pointer",transition:"all 0.15s",fontFamily:"inherit"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=industry.color;e.currentTarget.style.color=industry.color;}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=SM.border;e.currentTarget.style.color=SM.muted;}}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
      <div style={{flex:1,padding:20,overflow:"hidden",display:"flex",flexDirection:"column",gap:0}}>
        <SmeMiniChat industry={industry} initialMsg={activeQ?`## ${activeQ}\n\nLet me look at your ${industry.bizName} data...`:welcomeMsg} compact={false} pendingFiles={pending} setPending={setPending}/>
      </div>
    </div>
  );
}

// ── SME ROI TRACKER ───────────────────────────────────────────────────────────
function SmeROITracker({industry, executedItems=[]}){
  // Combine static demo items with live executed items
  const allItems=[...industry.roiItems, ...executedItems];
  const thisMonth=allItems;
  const prevMonthTotal=industry.roiItems.reduce((s,r)=>{
    const prev=parseFloat((r.prevMonth||"0").replace(/[^0-9.]/g,""));
    return s+prev;
  },0);
  const thisTotal=thisMonth.reduce((s,r)=>{
    const num=parseFloat(r.value.replace(/[^0-9.]/g,""));
    return s+num;
  },0);
  const momDelta=thisTotal-prevMonthTotal;
  const fee=449;

  return(
    <div style={{flex:1,overflowY:"auto",padding:20,background:SM.bg,display:"flex",flexDirection:"column",gap:14}}>

      {/* Dark header */}
      <div style={{background:"#080c18",border:`1px solid ${SM.border}`,borderRadius:10,padding:20,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${industry.color},#06b6d4,transparent)`}}/>
        <div style={{fontSize:10,letterSpacing:2,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",color:"rgba(255,255,255,0.4)",marginBottom:12}}>Aether Value Delivered — This Month</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
          <div>
            <div style={{fontSize:28,fontWeight:900,color:"#34d399",letterSpacing:-1,fontFamily:"'JetBrains Mono',monospace"}}>{industry.currency}{thisTotal.toLocaleString()}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>Total value identified</div>
            <div style={{fontSize:10,color:momDelta>=0?"#34d399":"#f87171",marginTop:3,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>
              {momDelta>=0?"▲":"▼"} {industry.currency}{Math.abs(momDelta).toLocaleString()} vs last month
            </div>
          </div>
          <div>
            <div style={{fontSize:28,fontWeight:900,color:"#60a5fa",letterSpacing:-1,fontFamily:"'JetBrains Mono',monospace"}}>{Math.round(thisTotal/fee)}x</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>Return on subscription</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:3}}>{industry.currency}{fee}/month plan</div>
          </div>
          <div>
            <div style={{fontSize:28,fontWeight:900,color:"#f9a8d4",letterSpacing:-1,fontFamily:"'JetBrains Mono',monospace"}}>{thisMonth.length}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>Decisions tracked</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:3}}>{industry.roiItems.length} from last month</div>
          </div>
          <div>
            <div style={{fontSize:28,fontWeight:900,color:SM.amber,letterSpacing:-1,fontFamily:"'JetBrains Mono',monospace"}}>{industry.currency}{prevMonthTotal.toLocaleString()}</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.5)",marginTop:2}}>Previous month total</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:3}}>Baseline comparison</div>
          </div>
        </div>
      </div>

      {/* Month-on-month comparison */}
      <div style={scard()}>
        <div style={{fontSize:12,fontWeight:800,color:SM.text,marginBottom:12}}>Month-on-Month Outcome Comparison</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {label:"This Month",   val:thisTotal,   c:industry.color,  sub:`${thisMonth.length} decisions tracked`},
            {label:"Last Month",   val:prevMonthTotal, c:SM.muted,     sub:`${industry.roiItems.length} decisions tracked`},
          ].map(col=>(
            <div key={col.label} style={{background:SM.bgSec,borderRadius:8,padding:"12px 14px",border:`1px solid ${SM.border}`}}>
              <div style={{fontSize:10,color:SM.muted,letterSpacing:1,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:6}}>{col.label}</div>
              <div style={{fontSize:22,fontWeight:800,color:col.c,fontFamily:"'JetBrains Mono',monospace"}}>{industry.currency}{col.val.toLocaleString()}</div>
              <div style={{fontSize:10,color:SM.dim,marginTop:3}}>{col.sub}</div>
            </div>
          ))}
        </div>
        <div style={{background:momDelta>=0?SM.greenLight:SM.redLight,borderRadius:7,padding:"10px 14px",border:`1px solid ${momDelta>=0?SM.green:SM.red}30`}}>
          <span style={{fontSize:12,fontWeight:800,color:momDelta>=0?SM.green:SM.red}}>{momDelta>=0?"▲":""} {industry.currency}{Math.abs(momDelta).toLocaleString()} </span>
          <span style={{fontSize:11,color:SM.muted}}>{momDelta>=0?"improvement":"decline"} month-on-month — {momDelta>=0?"decisions are delivering value.":"review underperforming initiatives."}</span>
        </div>
      </div>

      {/* Decision breakdown */}
      <div style={scard()}>
        <div style={{fontSize:12,fontWeight:800,color:SM.text,marginBottom:12}}>Decision Outcomes — All Tracked Initiatives</div>
        {thisMonth.length===0&&<div style={{fontSize:11,color:SM.muted,textAlign:"center",padding:"20px 0"}}>No initiatives executed yet. Go to Dashboard → select a category and click Execute on any decision.</div>}
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {thisMonth.map((r,i)=>{
            const typeColor=r.type==="revenue"?SM.green:r.type==="saved"?"#06b6d4":r.type==="protected"?SM.purple:SM.amber;
            const typeLabel=r.type==="revenue"?"REVENUE":r.type==="saved"?"COST SAVED":r.type==="protected"?"PROTECTED":"RECOVERED";
            const prev=parseFloat((r.prevMonth||"0").replace(/[^0-9.]/g,""));
            const curr=parseFloat(r.value.replace(/[^0-9.]/g,""));
            const delta=curr-prev;
            const isNew=!r.prevMonth||r.prevMonth==="S$0"||r.prevMonth==="RM0";
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:SM.bgSec,borderRadius:8,padding:"12px 14px",border:`1px solid ${SM.border}`}}>
                <div style={{width:38,height:38,borderRadius:8,background:`${typeColor}15`,border:`1px solid ${typeColor}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                  {r.type==="revenue"?"📈":r.type==="saved"?"💰":r.type==="protected"?"🛡":"♻️"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,fontWeight:600,color:SM.text,marginBottom:3}}>{r.action}</div>
                  <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                    <STag c={typeColor}>{typeLabel}</STag>
                    {isNew&&<STag c={SM.accent}>NEW THIS MONTH</STag>}
                    {!isNew&&delta!==0&&<span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:delta>=0?SM.green:SM.red,fontWeight:700}}>{delta>=0?"▲":"▼"} {industry.currency}{Math.abs(delta).toLocaleString()} vs last month</span>}
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:16,fontWeight:800,color:typeColor,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{r.value}</div>
                  {!isNew&&<div style={{fontSize:9,color:SM.dim,fontFamily:"'JetBrains Mono',monospace"}}>prev: {r.prevMonth}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loop reminder */}
      <div style={{...scard(),background:`${industry.color}08`,border:`1px solid ${industry.color}20`}}>
        <div style={{fontSize:11,fontWeight:700,color:industry.color,marginBottom:8}}>How Aether Tracks This</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {["📤 Upload data","❓ Ask Aether","✅ Execute","📊 Track MoM outcome"].map((s,i)=>(
            <div key={i} style={{background:SM.bgCard,borderRadius:6,padding:"9px",textAlign:"center",border:`1px solid ${SM.border}`}}>
              <div style={{fontSize:11,color:SM.text}}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SME APP ───────────────────────────────────────────────────────────────────
const SME_NAV=[
  {id:"copilot",  label:"Co-Pilot Assist", icon:"◈"},
  {id:"dashboard",label:"My Dashboard",    icon:"⬡"},
  {id:"roi",      label:"ROI Tracker",     icon:"📊"},
];

function SmeApp({onBack}){
  const[industry,setIndustry]=useState(null);
  const[page,setPage]=useState("copilot");
  const[executedItems,setExecutedItems]=useState([]);

  const handleExecute=(item)=>{
    setExecutedItems(p=>[...p,{
      ...item,
      value:item.value||item.impact||"TBD",
      prevMonth:"S$0",
      executedAt:new Date().toLocaleTimeString(),
    }]);
  };

  // Industry selection screen
  if(!industry){
    return(
      <div style={{height:"100vh",background:SM.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,fontFamily:"'Inter',system-ui,sans-serif",color:SM.text}}>
        <style>{GS}</style>
        <button onClick={onBack} style={{position:"absolute",top:24,left:24,...sbtn("#64748b",{fontSize:11,padding:"6px 12px",background:"transparent",color:"#64748b",border:"1px solid #cbd5e1"})}}>← Back</button>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#1d4ed8,#0ea5e9)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,fontWeight:900,color:"#fff",margin:"0 auto 16px"}}>Æ</div>
          <div style={{fontSize:26,fontWeight:800,color:SM.text,marginBottom:6}}>What kind of business are you?</div>
          <div style={{fontSize:14,color:SM.muted}}>Aether tailors everything — benchmarks, questions, and analysis — to your industry.</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,width:"100%",maxWidth:580}}>
          {INDUSTRIES.map(ind=>(
            <button key={ind.id} onClick={()=>{setIndustry(ind);setExecutedItems([]);}} style={{...scard(),cursor:"pointer",textAlign:"left",border:`1.5px solid ${SM.border}`,transition:"all 0.18s",padding:"20px 22px",position:"relative",overflow:"hidden"}}
              onMouseEnter={e=>{e.currentTarget.style.border=`1.5px solid ${ind.color}60`;e.currentTarget.style.boxShadow=`0 4px 20px ${ind.color}20`;}}
              onMouseLeave={e=>{e.currentTarget.style.border=`1.5px solid ${SM.border}`;e.currentTarget.style.boxShadow="none";}}
            >
              <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${ind.color},transparent)`}}/>
              <div style={{fontSize:28,marginBottom:8}}>{ind.icon}</div>
              <div style={{fontSize:15,fontWeight:800,color:SM.text,marginBottom:4}}>{ind.label}</div>
              <div style={{fontSize:11,color:SM.muted,lineHeight:1.5}}>Demo: {ind.bizName} · {ind.location} · {ind.outlets} outlets</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full SME dashboard
  return(
    <div style={{display:"flex",height:"100vh",background:SM.bg,fontFamily:"'Inter',system-ui,sans-serif",color:SM.text,overflow:"hidden"}}>
      <style>{GS}</style>

      {/* Sidebar */}
      <aside style={{width:210,flexShrink:0,background:SM.bgCard,borderRight:`1px solid ${SM.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${SM.border}`,display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${industry.color},${SM.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{industry.icon}</div>
          <div>
            <div style={{fontSize:12,fontWeight:800,color:SM.text,letterSpacing:-0.3,lineHeight:1}}>{industry.bizName}</div>
            <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:SM.muted,marginTop:2,letterSpacing:0.5}}>{industry.location}</div>
          </div>
        </div>

        <div style={{padding:"8px 12px",borderBottom:`1px solid ${SM.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:6,height:6,borderRadius:"50%",background:SM.green,display:"inline-block",animation:"pulse 2s infinite"}}/>
            <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:SM.green}}>AETHER ACTIVE</span>
          </div>
        </div>

        <nav style={{flex:1,padding:8,display:"flex",flexDirection:"column",gap:2}}>
          {SME_NAV.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",width:"100%",transition:"all 0.12s",background:page===n.id?`${industry.color}12`:"transparent",color:page===n.id?industry.color:SM.muted,fontWeight:page===n.id?700:400,fontSize:13,fontFamily:"inherit"}}>
              <span style={{fontSize:14}}>{n.icon}</span>
              {n.label}
              {page===n.id&&<div style={{marginLeft:"auto",width:3,height:16,borderRadius:2,background:industry.color}}/>}
            </button>
          ))}
          <div style={{marginTop:8,borderTop:`1px solid ${SM.border}`,paddingTop:8}}>
            <button onClick={()=>setIndustry(null)} style={{display:"flex",alignItems:"center",gap:9,padding:"10px 12px",borderRadius:8,border:"none",cursor:"pointer",textAlign:"left",width:"100%",background:"transparent",color:SM.dim,fontSize:12,fontFamily:"inherit"}}>
              ⇄ Switch Industry
            </button>
          </div>
        </nav>

        <div style={{padding:"10px 12px",borderTop:`1px solid ${SM.border}`}}>
          <div style={{fontSize:10,color:SM.dim,marginBottom:6}}>Aether SME · {industry.currencyCode}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={stag(industry.color)}>STARTER PLAN</span>
            <button onClick={onBack} style={{fontSize:10,color:SM.dim,background:"none",border:"none",cursor:"pointer"}}>Enterprise →</button>
          </div>
          <div style={{display:"flex",justifyContent:"center",marginTop:8}}>
            <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,padding:"3px 12px",borderRadius:20,border:`1px solid ${industry.color}40`,color:industry.color,background:`${industry.color}10`}}>DEMO</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <div style={{height:50,borderBottom:`1px solid ${SM.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 20px",flexShrink:0,background:SM.bgCard}}>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:SM.text}}>{SME_NAV.find(n=>n.id===page)?.label||"Dashboard"}</div>
            <div style={{fontSize:10,fontFamily:"'JetBrains Mono',monospace",color:SM.muted}}>{industry.bizName} · {industry.outlets} outlets · {industry.location}</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <STag c={industry.color}>{industry.label.toUpperCase()}</STag>
            <STag c={SM.accent}>CLAUDE POWERED</STag>
          </div>
        </div>
        <div style={{flex:1,overflow:"hidden",display:"flex"}}>
          {page==="dashboard"&&<SmeDashboard industry={industry} setPage={setPage} onExecute={handleExecute}/>}
          {page==="copilot" &&<SmeCopilot  industry={industry}/>}
          {page==="roi"     &&<SmeROITracker industry={industry} executedItems={executedItems}/>}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LANDING SCREEN + ROOT APP
// ═══════════════════════════════════════════════════════════════════════════
function LandingScreen({onSelect}){
  const modes=[
    {
      id:"enterprise", icon:"🏢", label:"Enterprise", badge:"LARGE ORGANISATION",
      tagline:"Decision governance at scale", color:"#6366f1",
      features:["Multi-outlet / multi-country operations","Transformation governance & value tracking","Digital twin simulation","M&A, org design, and strategic agents","Full data integration (ERP, CRM, POS)"],
      target:"Ideal for: Heineken, Econsave, PE firms, management consultants",
    },
    {
      id:"sme", icon:"🏪", label:"SME", badge:"SMALL BUSINESS",
      tagline:"Your always-on business analyst", color:"#059669",
      features:["Clinic · Gym · F&B · Retail","Revenue, cost, people, pricing & expansion decisions","Pre-built industry question templates","ROI tracker — see value delivered this month","Plain English — no data analyst needed"],
      target:"Ideal for: 2–5 outlet owner-operated businesses in SEA",
    },
  ];

  return(
    <div style={{height:"100vh",background:"#080c18",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:40,fontFamily:"'Inter',system-ui,sans-serif"}}>
      <style>{GS}</style>
      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:48}}>
        <div style={{width:60,height:60,borderRadius:16,background:"linear-gradient(135deg,#6366f1,#06b6d4)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"#fff",margin:"0 auto 18px",boxShadow:"0 8px 32px rgba(99,102,241,0.4)"}}>Æ</div>
        <div style={{fontSize:36,fontWeight:900,color:"#fff",letterSpacing:-1,marginBottom:6}}>Aether</div>
        <div style={{fontSize:15,color:"#64748b"}}>Business Decision Intelligence · APAC · EU · US</div>
      </div>

      {/* Mode cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,width:"100%",maxWidth:700}}>
        {modes.map(m=>(
          <button key={m.id} onClick={()=>onSelect(m.id)} style={{background:"#0d1020",border:`1.5px solid rgba(255,255,255,0.08)`,borderRadius:14,padding:"28px 26px",cursor:"pointer",textAlign:"left",transition:"all 0.2s",position:"relative",overflow:"hidden"}}
            onMouseEnter={e=>{e.currentTarget.style.border=`1.5px solid ${m.color}60`;e.currentTarget.style.boxShadow=`0 8px 32px ${m.color}25`;e.currentTarget.style.transform="translateY(-2px)";}}
            onMouseLeave={e=>{e.currentTarget.style.border="1.5px solid rgba(255,255,255,0.08)";e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)";}}
          >
            <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,${m.color},transparent)`}}/>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
              <div style={{width:36,height:36,borderRadius:9,background:`${m.color}20`,border:`1px solid ${m.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{m.icon}</div>
              <div>
                <div style={{fontSize:18,fontWeight:800,color:"#fff",lineHeight:1}}>{m.label}</div>
                <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:m.color,letterSpacing:2,marginTop:2}}>{m.badge}</div>
              </div>
            </div>
            <div style={{fontSize:12,color:"#64748b",fontStyle:"italic",marginBottom:14}}>{m.tagline}</div>
            <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:14}}>
              {m.features.map((f,i)=>(
                <div key={i} style={{display:"flex",gap:7,alignItems:"flex-start"}}>
                  <span style={{color:m.color,fontSize:10,marginTop:1,flexShrink:0}}>›</span>
                  <span style={{fontSize:11,color:"#94a3b8",lineHeight:1.4}}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{fontSize:10,color:"#475569",fontStyle:"italic",borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:10}}>{m.target}</div>
            <div style={{marginTop:12,display:"flex",justifyContent:"flex-end"}}>
              <span style={{fontSize:11,fontWeight:700,color:m.color,padding:"5px 14px",borderRadius:20,border:`1px solid ${m.color}40`,background:`${m.color}10`}}>Enter {m.label} Mode →</span>
            </div>
          </button>
        ))}
      </div>

      <div style={{marginTop:24,fontSize:11,color:"#334155",fontFamily:"'JetBrains Mono',monospace",letterSpacing:1}}>POWERED BY CLAUDE · AETHER · DEMO</div>
    </div>
  );
}

export default function App(){
  const[mode,setMode]=useState(null); // null | "enterprise" | "sme"

  if(!mode) return <LandingScreen onSelect={setMode}/>;
  if(mode==="enterprise") return <EnterpriseApp onBack={()=>setMode(null)}/>;
  return <SmeApp onBack={()=>setMode(null)}/>;
}
