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
    id:"clinic", label:"Aesthetic Clinic", icon:"🏥", color:"#059669",
    bizName:"Lumière Clinic", location:"Orchard Road, Singapore", outlets:2,
    currency:"S$", currencyCode:"SGD",
    kpis:[
      {label:"Monthly Revenue",    value:"S$128,400", change:"+8.2%",  pos:true,  sub:"vs S$118,600 last month"},
      {label:"Avg Revenue/Treatment",value:"S$380",   change:"-3.1%",  pos:false, sub:"Filler S$480 · Facial S$180"},
      {label:"Slot Utilisation",   value:"72%",       change:"-6pp",   pos:false, sub:"Tue/Wed underperforming"},
      {label:"Client Retention",   value:"68%",       change:"-5pp",   pos:false, sub:"Month-3 churn spike"},
      {label:"Profitability",      value:"S$24,800",  change:"+4.1%",  pos:true,  sub:"19.3% EBITDA margin"},
      {label:"Downtime Hours",     value:"38 hrs/mo", change:"-12%",   pos:true,  sub:"Unused appointment slots"},
    ],
    questions:[
      "Which treatments have the highest revenue per hour?",
      "Why are my Tuesdays so slow compared to Fridays?",
      "My senior aesthetician is leaving — do I hire now or redistribute?",
      "Should I add a laser treatment package? Will it sell?",
      "My competitor just reduced facial prices by 15% — should I match?",
      "Am I over-relying on one doctor for most of my revenue?",
      "Which clients are most at risk of churning?",
      "What's the ROI of running a Tuesday loyalty promotion?",
    ],
    decisions:[
      {cat:"Revenue",    q:"Best treatment to push this month?", a:"Filler treatments: S$480/hr, only 8% cancellation. Shift 2 facial slots/day → +S$4,200/month revenue."},
      {cat:"Cost",       q:"Where am I losing margin?",          a:"Tuesday 2–5pm is 38% utilised vs 91% Friday. Empty slots cost S$1,100/week in lost revenue."},
      {cat:"People",     q:"Should I hire to replace Dr Tan?",   a:"Her top 12 clients = S$8,400/month. Redistribute to Dr Chen + 1 part-time. Net saving: S$1,200/month vs full hire."},
      {cat:"Pricing",    q:"Can I raise filler prices?",         a:"Your pricing is 8% below the Orchard corridor benchmark. You can increase S$50/session without volume risk."},
      {cat:"Expansion",  q:"Is a 3rd outlet viable?",            a:"Current Outlet 2 at 72% utilisation. Recommend hitting 85% for 3 months before expanding. Timeline: Q3."},
    ],
    roiItems:[
      {action:"Shifted 2 facial slots to fillers", value:"S$4,200", type:"revenue"},
      {action:"Tuesday promo — 11 new bookings", value:"S$3,850", type:"revenue"},
      {action:"Right-sized hiring decision", value:"S$1,200", type:"saved"},
      {action:"Filler price increase (+S$50)", value:"S$2,100", type:"revenue"},
    ],
    benchmarks:[
      {metric:"Labour % of Revenue", yours:"31%", industry:"22–28%", status:"above"},
      {metric:"Treatment Utilisation", yours:"72%", industry:"80–88%", status:"below"},
      {metric:"Client Retention (3mo)", yours:"68%", industry:"75–82%", status:"below"},
      {metric:"EBITDA Margin", yours:"19.3%", industry:"18–24%", status:"ok"},
      {metric:"Revenue/SqFt/Month", yours:"S$210", industry:"S$280–380", status:"below"},
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
    decisions:[
      {cat:"Revenue",    q:"How do I grow recurring revenue?",   a:"RM199 unlimited pass viable at 35+ uptake. 180 drop-ins/month → 20% conversion = 36 members = RM7,164/month new MRR."},
      {cat:"Cost",       q:"Is my ad spend working?",           a:"RM8,000 ads → 22 new members at RM364 CAC. Retention programme: RM500/month keeps equivalent revenue. Rebalance: cut ads 30%."},
      {cat:"People",     q:"Approve trainer pay rise?",         a:"Top trainer drives RM22,000/month in class revenue. Pay rise RM800/month = 3.6% cost. Approve — attrition risk is costlier."},
      {cat:"Pricing",    q:"Am I priced right vs market?",      a:"Your RM180/month membership is 12% below Bangsar/Damansara corridor. Small increase to RM199 unlikely to trigger churn."},
      {cat:"Expansion",  q:"4th outlet in Bangsar — yes or no?", a:"Current 3 outlets averaging 63% utilisation. Recommend 75%+ threshold before expansion. Not yet — focus retention first."},
    ],
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
    decisions:[
      {cat:"Revenue",    q:"What should I promote this week?",  a:"Signature coffee + cake combo: S$18.50, 72% margin. Currently 12% of orders. Push to 20% → +S$3,200/month revenue."},
      {cat:"Cost",       q:"How do I reduce food cost to 30%?", a:"Top 3 leaks: Croissants (42% cost), avocado dishes (51% cost), daily specials waste. Removing or repricing saves S$4,100/month."},
      {cat:"People",     q:"Do I need more weekend staff?",     a:"Saturday lunch: 94% seat utilisation, 18min avg wait. Add 1 FTE Saturday only. Cost: S$800/month. Revenue recovery: S$3,400."},
      {cat:"Pricing",    q:"Are GrabFood orders profitable?",   a:"GrabFood at 30% commission: your net margin on delivery is 4.2% vs 19% dine-in. Raise delivery prices S$3–5 or limit SKU range."},
      {cat:"Expansion",  q:"Is a 2nd outlet ready?",           a:"Outlet 1 at 58% utilisation with declining margins. Optimize first — hit 75% utilisation and 13%+ EBITDA before expanding."},
    ],
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
    decisions:[
      {cat:"Revenue",    q:"What to push for the next 30 days?", a:"Scented candles: S$85 ASP, 68% margin, 6.2x turns/year. Currently 9% of revenue. Push to 15% → +S$6,700/month."},
      {cat:"Cost",       q:"How do I fix dead stock?",           a:"18% dead stock = S$20,160 tied up. Bundle slow SKUs with fast movers at 25% discount. Clear in 8 weeks, recover S$15,100."},
      {cat:"People",     q:"Do I need a full-time floor staff?", a:"Conversion rate 22% vs 30% industry. Mystery shop shows product knowledge gap. Part-time trained specialist: S$1,200/month, est. +S$4,800 revenue."},
      {cat:"Pricing",    q:"How do I respond to new competitor?",a:"New competitor is 12% cheaper on commodity items. Don't match — differentiate on curation and experience. Hold pricing, invest in in-store events."},
      {cat:"Expansion",  q:"Is Outlet 2 worth keeping open?",   a:"Outlet 2: S$31,200 revenue, S$29,800 cost. Net: S$1,400/month. Below opportunity cost. Recommend 90-day turnaround plan before closure decision."},
    ],
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
  {id:"revenue",   label:"Revenue",   icon:"📈", color:"#059669"},
  {id:"cost",      label:"Cost",      icon:"💰", color:"#dc2626"},
  {id:"people",    label:"People",    icon:"👥", color:"#7c3aed"},
  {id:"pricing",   label:"Pricing",   icon:"🏷", color:"#0ea5e9"},
  {id:"expansion", label:"Expansion", icon:"🗺", color:"#d97706"},
];

// ── SME HELPERS ───────────────────────────────────────────────────────────────
const scard = (extra={}) => ({ background:SM.bgCard, border:`1px solid ${SM.border}`, borderRadius:10, padding:16, ...extra });
const stag = (c) => ({ fontSize:9, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, padding:"2px 8px", borderRadius:20, border:`1px solid ${c}30`, color:c, background:`${c}12` });
const sbtn = (c="#1d4ed8",ex={}) => ({ display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", transition:"all 0.15s", background:c, color:"#fff", ...ex });

function STag({c,children}){return <span style={stag(c)}>{children}</span>;}

// ── SME MINI CHAT ─────────────────────────────────────────────────────────────
function SmeMiniChat({industry, initialMsg, compact=false}){
  const[messages,setMessages]=useState([{role:"assistant",content:initialMsg}]);
  const[input,setInput]=useState("");
  const[loading,setLoading]=useState(false);
  const endRef=useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const send=async(text)=>{
    const userText=text||input.trim();
    if(!userText||loading)return;
    setInput("");
    setMessages(p=>[...p,{role:"user",content:userText}]);
    setLoading(true);
    const system=`You are Aether SME — a plain-English business analyst co-pilot for a ${industry.label} business called "${industry.bizName}" in ${industry.location} with ${industry.outlets} outlets.

Business context:
${industry.kpis.map(k=>`- ${k.label}: ${k.value} (${k.change})`).join('\n')}

Your role: Give direct, specific, quantified answers to business questions. Always recommend a concrete action with an estimated ${industry.currency} impact. Keep responses under 200 words. Use plain English — no jargon. Format with short paragraphs and bullet points where helpful.`;

    const history=messages.slice(-8).map(m=>({role:m.role,content:String(m.content)}));
    try{
      const result=await callClaude([...history,{role:"user",content:userText}],system,false,userText);
      setMessages(p=>[...p,{role:"assistant",content:result.text}]);
    }catch(e){
      setMessages(p=>[...p,{role:"assistant",content:e.message==="API_KEY_MISSING"?"Add VITE_ANTHROPIC_KEY in Vercel to enable AI.":`Error: ${e.message}`}]);
    }
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
      <div style={{padding:8,borderTop:`1px solid ${SM.border}`,display:"flex",gap:6}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything about your business..." style={{flex:1,background:SM.bg,border:`1px solid ${SM.border}`,borderRadius:6,padding:"7px 10px",fontSize:11,color:SM.text,outline:"none",fontFamily:"inherit"}}/>
        <button onClick={()=>send()} disabled={loading||!input.trim()} style={{...sbtn(industry.color),padding:"7px 12px",opacity:loading?0.5:1}}>➤</button>
      </div>
    </div>
  );
}

// ── SME DASHBOARD ─────────────────────────────────────────────────────────────
function SmeDashboard({industry, setPage}){
  const [activeCat, setActiveCat]=useState("revenue");
  const activeDec=industry.decisions.find(d=>d.cat.toLowerCase()===activeCat)||industry.decisions[0];

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
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:11,fontWeight:700,color:k.pos?SM.green:SM.red,fontFamily:"'JetBrains Mono',monospace"}}>{k.change}</span>
              </div>
              <div style={{fontSize:10,color:SM.dim,marginTop:4}}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Decision Framework */}
      <div style={scard()}>
        <div style={{fontSize:12,fontWeight:800,color:SM.text,marginBottom:3}}>My Decisions This Week</div>
        <div style={{fontSize:11,color:SM.muted,marginBottom:12}}>Select a decision area — Aether gives you a specific, actionable answer.</div>
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          {SME_DECISION_CATS.map(c=>(
            <button key={c.id} onClick={()=>setActiveCat(c.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"7px 14px",borderRadius:20,border:`1.5px solid ${activeCat===c.id?c.color:SM.border}`,background:activeCat===c.id?`${c.color}12`:"transparent",color:activeCat===c.id?c.color:SM.muted,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        {activeDec&&(
          <div style={{background:SM.bgSec,borderRadius:8,padding:"14px 16px",border:`1px solid ${SM.border}`}}>
            <div style={{fontSize:11,fontWeight:600,color:SM.muted,marginBottom:4,textTransform:"uppercase",letterSpacing:1,fontFamily:"'JetBrains Mono',monospace"}}>{activeDec.cat} Question</div>
            <div style={{fontSize:13,fontWeight:700,color:SM.text,marginBottom:10}}>"{activeDec.q}"</div>
            <div style={{background:SM.bgCard,borderRadius:6,padding:"10px 14px",border:`1.5px solid ${industry.color}30`}}>
              <div style={{fontSize:10,fontWeight:700,color:industry.color,marginBottom:4,letterSpacing:1,fontFamily:"'JetBrains Mono',monospace"}}>⚡ AETHER ANSWER</div>
              <div style={{fontSize:12,color:SM.text,lineHeight:1.6}}>{activeDec.a}</div>
            </div>
            <button onClick={()=>setPage("copilot")} style={{...sbtn(industry.color,{marginTop:10,fontSize:11,padding:"6px 12px"}),...{background:"transparent",color:industry.color,border:`1px solid ${industry.color}40`}}}>
              Ask a follow-up question →
            </button>
          </div>
        )}
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
  const welcomeMsg=`## Hi! I'm your Aether Co-Pilot for ${industry.bizName} 👋\n\nI know your business — ${industry.outlets} outlets, ${industry.kpis[0].value} monthly revenue, and I can see where the opportunities are.\n\n**Ask me anything, or pick a question below to get started.**`;

  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:SM.bg}}>
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${SM.border}`,background:SM.bgCard,flexShrink:0}}>
        <div style={{fontSize:12,fontWeight:700,color:SM.text,marginBottom:6}}>Quick Questions — tap to ask instantly</div>
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
        <SmeMiniChat industry={industry} initialMsg={activeQ?`## ${activeQ}\n\nLet me look at your ${industry.bizName} data...`:welcomeMsg} compact={false}/>
      </div>
    </div>
  );
}

// ── SME ROI TRACKER ───────────────────────────────────────────────────────────
function SmeROITracker({industry}){
  const total=industry.roiItems.reduce((s,r)=>{
    const num=parseFloat(r.value.replace(/[^0-9.]/g,""));
    return s+num;
  },0);
  const fee=299;

  return(
    <div style={{flex:1,overflowY:"auto",padding:20,background:SM.bg,display:"flex",flexDirection:"column",gap:14}}>
      {/* Header stat */}
      <div style={{...scard(),background:SM.navy,border:"none"}}>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.5)",letterSpacing:2,textTransform:"uppercase",fontFamily:"'JetBrains Mono',monospace",marginBottom:8}}>Aether Value Delivered — This Month</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
          <div>
            <div style={{fontSize:32,fontWeight:900,color:"#34d399",letterSpacing:-1}}>{industry.currency}{total.toLocaleString()}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:2}}>Total value identified</div>
          </div>
          <div>
            <div style={{fontSize:32,fontWeight:900,color:"#60a5fa",letterSpacing:-1}}>{Math.round(total/fee)}x</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:2}}>Return on Aether subscription</div>
          </div>
          <div>
            <div style={{fontSize:32,fontWeight:900,color:"#f9a8d4",letterSpacing:-1}}>{industry.roiItems.length}</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",marginTop:2}}>Decisions tracked this month</div>
          </div>
        </div>
      </div>

      {/* Decisions breakdown */}
      <div style={scard()}>
        <div style={{fontSize:12,fontWeight:800,color:SM.text,marginBottom:12}}>Decision Outcomes — Tracked by Aether</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {industry.roiItems.map((r,i)=>{
            const typeColor=r.type==="revenue"?SM.green:r.type==="saved"?SM.blue:r.type==="protected"?SM.purple:SM.amber;
            const typeLabel=r.type==="revenue"?"REVENUE":r.type==="saved"?"COST SAVED":r.type==="protected"?"PROTECTED":"RECOVERED";
            return(
              <div key={i} style={{display:"flex",alignItems:"center",gap:12,background:SM.bgSec,borderRadius:8,padding:"12px 14px",border:`1px solid ${SM.border}`}}>
                <div style={{width:42,height:42,borderRadius:8,background:`${typeColor}15`,border:`1px solid ${typeColor}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>
                  {r.type==="revenue"?"📈":r.type==="saved"?"💰":r.type==="protected"?"🛡":"♻️"}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:600,color:SM.text,marginBottom:2}}>{r.action}</div>
                  <STag c={typeColor}>{typeLabel}</STag>
                </div>
                <div style={{fontSize:18,fontWeight:800,color:typeColor,fontFamily:"'JetBrains Mono',monospace",whiteSpace:"nowrap"}}>{r.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision loop reminder */}
      <div style={{...scard(),background:`${industry.color}08`,border:`1px solid ${industry.color}25`}}>
        <div style={{fontSize:12,fontWeight:700,color:industry.color,marginBottom:8}}>How Aether Tracks This</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
          {["📤 Upload your data","❓ Ask your question","✅ Decide & execute","📊 Track real outcome"].map((s,i)=>(
            <div key={i} style={{background:SM.bgCard,borderRadius:6,padding:"10px",textAlign:"center",border:`1px solid ${SM.border}`}}>
              <div style={{fontSize:12,color:SM.navy,fontWeight:500}}>{s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SME APP ───────────────────────────────────────────────────────────────────
const SME_NAV=[
  {id:"dashboard",label:"My Dashboard",    icon:"⬡"},
  {id:"copilot",  label:"Co-Pilot Assist", icon:"◈"},
  {id:"roi",      label:"ROI Tracker",     icon:"📊"},
];

function SmeApp({onBack}){
  const[industry,setIndustry]=useState(null);
  const[page,setPage]=useState("dashboard");

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
            <button key={ind.id} onClick={()=>setIndustry(ind)} style={{...scard(),cursor:"pointer",textAlign:"left",border:`1.5px solid ${SM.border}`,transition:"all 0.18s",padding:"20px 22px",position:"relative",overflow:"hidden"}}
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
          {page==="dashboard"&&<SmeDashboard industry={industry} setPage={setPage}/>}
          {page==="copilot" &&<SmeCopilot  industry={industry}/>}
          {page==="roi"     &&<SmeROITracker industry={industry}/>}
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
