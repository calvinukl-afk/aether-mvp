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
const card = { background:T.bgCard, border:`1px solid ${T.border}`, borderRadius:8, padding:16 };
const mono = { fontFamily:"'JetBrains Mono',monospace", fontSize:11 };
const lbl = { fontFamily:"'JetBrains Mono',monospace", fontSize:9, letterSpacing:2, color:T.muted, textTransform:"uppercase" };
const tag = (c) => ({ fontSize:9, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1.2, padding:"2px 7px", borderRadius:3, border:`1px solid ${c}35`, color:c, background:`${c}10` });
const btn = (v="primary",extra={}) => ({ display:"inline-flex", alignItems:"center", gap:6, padding:"7px 14px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", transition:"all 0.15s", ...(v==="primary"?{background:T.primary,color:"#fff"}:v==="green"?{background:T.green,color:"#fff"}:v==="red"?{background:T.red,color:"#fff"}:{background:T.bgSec,color:T.dim,border:`1px solid ${T.border}`}), ...extra });

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
const kitchens = [{loc:"Singapore (3 kitchens)",cost:2.8,prod:45,c:T.red},{loc:"Malaysia (1 kitchen)",cost:1.2,prod:30,c:T.yellow},{loc:"Vietnam (1 kitchen)",cost:0.6,prod:25,c:T.green}];
const benchmarks = [{metric:"Revenue/SqFt",store:"£312",peer:"£428",industry:"£395",st:"below"},{metric:"Staff Productivity",store:"68%",peer:"84%",industry:"79%",st:"below"},{metric:"Payment Success Rate",store:"95.8%",peer:"98.3%",industry:"98.1%",st:"below"},{metric:"Customer Satisfaction",store:"3.2",peer:"4.1",industry:"3.9",st:"below"},{metric:"Peak Hour Coverage",store:"87%",peer:"96%",industry:"92%",st:"warning"}];

const INIT_RECS = [
  {pri:"CRITICAL",title:"Replace Terminal 3 Card Reader",impact:"+£1,800/wk",effort:"LOW",time:"24h",desc:"Immediate hardware replacement. £300/day quick win recoverable immediately.",id:"r1"},
  {pri:"CRITICAL",title:"Accelerated Manager Onboarding",impact:"+£2,400/wk",effort:"MEDIUM",time:"2 weeks",desc:"Pair with experienced mentor, daily operational reviews, clear decision authority.",id:"r2"},
  {pri:"HIGH",title:"Staff Retention Program",impact:"+£1,500/wk",effort:"MEDIUM",time:"3 weeks",desc:"Retention bonuses + schedule stability to rebuild the workforce.",id:"r3"},
  {pri:"HIGH",title:"Targeted Recovery Promotion",impact:"+£800/wk",effort:"LOW",time:"1 week",desc:"10% loyalty promotion to rebuild customer confidence during the recovery period.",id:"r4"},
];

const INIT_INITIATIVES = [
  {name:"Manager Onboarding Program",expected:"£2,400/wk",actual:"£800/wk",pct:33,status:"under",id:"i1"},
  {name:"Payment Terminal Replacement",expected:"£2,100/wk",actual:"£1,950/wk",pct:93,status:"track",id:"i2"},
  {name:"Staff Retention Program",expected:"£1,500/wk",actual:"£1,200/wk",pct:80,status:"track",id:"i3"},
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
function Tag({c,children}){return <span style={tag(c)}>{children}</span>;}
function Dot({status}){const c=status==="critical"?T.red:status==="warning"?T.yellow:T.green;return <span style={{width:6,height:6,borderRadius:"50%",background:c,display:"inline-block",marginRight:6,flexShrink:0,boxShadow:`0 0 5px ${c}`}}/>;}
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

// ── REAL API CALLS ────────────────────────────────────────────────────────────
async function fetchWorldBankData(indicator, countryCode="GB", label="") {
  try {
    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicator}?format=json&mrv=5&per_page=5`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data[1] || !data[1].length) return null;
    const entries = data[1].filter(d=>d.value!==null).slice(0,4).map(d=>({year:d.date, value:d.value}));
    return { label, entries, source:"World Bank" };
  } catch(e) { return null; }
}

async function fetchGoogleTrends(keyword) {
  try {
    // Use a CORS proxy to hit the unofficial Google Trends API
    const encoded = encodeURIComponent(keyword);
    const url = `https://corsproxy.io/?${encodeURIComponent(`https://trends.google.com/trends/api/dailytrends?hl=en-GB&tz=-60&geo=GB&ns=15`)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const text = await res.text();
    const json = JSON.parse(text.replace(")]}',\n",""));
    const topics = json.default?.trendingSearchesDays?.[0]?.trendingSearches?.slice(0,5).map(t=>t.title?.query)||[];
    return { topics, source:"Google Trends (UK)" };
  } catch(e) { return null; }
}

async function buildExternalContext(sources) {
  const active = sources.filter(s=>s.active);
  if (!active.length) return "";
  let context = "\n\n=== LIVE EXTERNAL DATA ===\n";
  for (const src of active) {
    if (src.id === "worldbank") {
      const gdp = await fetchWorldBankData("NY.GDP.MKTP.KD.ZG","GB","UK GDP Growth Rate (%)");
      const cpi = await fetchWorldBankData("FP.CPI.TOTL.ZG","GB","UK Inflation Rate (CPI %)");
      const retail = await fetchWorldBankData("NE.CON.PRVT.KD.ZG","GB","UK Private Consumption Growth (%)");
      [gdp,cpi,retail].filter(Boolean).forEach(d=>{
        context += `\n${d.label}: `;
        context += d.entries.map(e=>`${e.year}: ${typeof e.value==="number"?e.value.toFixed(2):e.value}`).join(", ");
        context += ` [Source: ${d.source}]`;
      });
    }
    if (src.id === "googletrends") {
      const trends = await fetchGoogleTrends("restaurant food delivery UK");
      if (trends) {
        context += `\nGoogle Trends UK — Today's top trending searches: ${trends.topics.join(", ")} [Source: ${trends.source}]`;
      }
    }
    if (src.id === "nielsen") {
      context += `\nIndustry Benchmark Data (QSR/Retail): Labour cost benchmark 28-34% of revenue; Food cost benchmark 28-32%; Occupancy 8-12%; EBITDA benchmark 12-18%. Average QSR transaction value UK: £8.50-£12.50. Delivery mix industry average: 35-45% of orders. [Source: Industry benchmarks, AI-synthesised]`;
    }
    if (src.id === "competitor") {
      context += `\nCompetitor Pricing Estimate (AI-generated): Pizza delivery avg ticket UK market £22-28. Domino's avg order £24.50. Papa John's avg order £26.10. Local competitors avg £19-22. Premium segment £28-35. [Source: AI-estimated from public data — indicative only]`;
    }
  }
  return context;
}

// ── CLAUDE API ────────────────────────────────────────────────────────────────
async function callClaude(system, messages, maxTokens=2000) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "x-api-key":apiKey,
      "anthropic-version":"2023-06-01",
      "anthropic-dangerous-direct-browser-access":"true"
    },
    body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:maxTokens,system,messages})
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || "No response.";
}

// ── MINI CHAT (reusable) ──────────────────────────────────────────────────────
function MiniChat({ systemPrompt, welcomeMsg, onApprove, placeholder="Type a message..." }) {
  const [messages, setMessages] = useState([{role:"assistant",content:welcomeMsg}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");
    setMessages(p=>[...p,{role:"user",content:userText}]);

    // Check for approve keyword
    if (userText.toLowerCase().includes("approve")) {
      setMessages(p=>[...p,{role:"assistant",content:"✅ **Approved!** This recovery initiative has been added to the Recommendations tab. Navigating you there now..."}]);
      setTimeout(()=>onApprove && onApprove(userText), 1500);
      return;
    }

    setLoading(true);
    try {
      const history = messages.slice(-8).map(m=>({role:m.role,content:String(m.content)}));
      const text = await callClaude(systemPrompt, [...history, {role:"user",content:userText}], 1000);
      setMessages(p=>[...p,{role:"assistant",content:text}]);
    } catch(e) {
      setMessages(p=>[...p,{role:"assistant",content:e.message==="API_KEY_MISSING"?"**API key missing** — add VITE_ANTHROPIC_KEY in Vercel environment variables.":`**Error:** ${e.message}`}]);
    }
    setLoading(false);
  };

  return (
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

// ── AI ASSISTANT PAGE ─────────────────────────────────────────────────────────
function AssistantPage() {
  const [messages, setMessages] = useState([{role:"assistant",content:`## Welcome to Aether AI Assistant\n\nI'm powered by Claude with access to live external data when toggled on.\n\n**I can help you with:**\n- Analysing uploaded cost data (P&L, budgets, expense reports)\n- Identifying cost saving levers with real industry benchmarks\n- Operational improvement recommendations\n- Store diagnostics and strategic planning\n\nUpload an Excel or PDF file above, or ask me anything.\n\nTry: *"What are typical cost saving levers for a restaurant operation?"*`,files:[]}]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [allFiles, setAllFiles] = useState([]);
  const [pending, setPending] = useState([]);
  const [sources, setSources] = useState([
    {id:"nielsen",label:"Industry Benchmarks",icon:"📊",active:false,desc:"QSR/Retail cost & ops benchmarks"},
    {id:"googletrends",label:"Google Trends",icon:"📈",active:false,desc:"Live UK trending topics"},
    {id:"worldbank",label:"World Bank Macro",icon:"🌍",active:false,desc:"Live GDP, inflation, consumption data"},
    {id:"competitor",label:"Competitor Pricing",icon:"🔍",active:false,desc:"AI-estimated market pricing"},
  ]);
  const [loadingExt, setLoadingExt] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages]);

  const toggle = async (id) => {
    const src = sources.find(s=>s.id===id);
    const newActive = !src.active;
    setSources(p=>p.map(s=>s.id===id?{...s,active:newActive}:s));
    if (newActive) {
      setLoadingExt(true);
      // Fetch a preview of the data when toggled on
      if (id==="worldbank") {
        const gdp = await fetchWorldBankData("NY.GDP.MKTP.KD.ZG","GB","UK GDP Growth %");
        const cpi = await fetchWorldBankData("FP.CPI.TOTL.ZG","GB","UK CPI Inflation %");
        let preview = "## 🌍 World Bank Live Data Loaded\n\n";
        if(gdp) preview += `**${gdp.label}:** ${gdp.entries.map(e=>`${e.year}: ${e.value?.toFixed(2)}%`).join(" | ")}\n`;
        if(cpi) preview += `**${cpi.label}:** ${cpi.entries.map(e=>`${e.year}: ${e.value?.toFixed(2)}%`).join(" | ")}\n`;
        preview += "\nThis live data will now be included in all my responses. Ask me anything about macroeconomic conditions.";
        setMessages(p=>[...p,{role:"assistant",content:preview,files:[]}]);
      }
      if (id==="googletrends") {
        setMessages(p=>[...p,{role:"assistant",content:"## 📈 Google Trends Connected\n\nLive UK trending data will be pulled and included in my analysis. Ask me about current consumer trends or market signals.",files:[]}]);
      }
      if (id==="nielsen") {
        setMessages(p=>[...p,{role:"assistant",content:"## 📊 Industry Benchmarks Active\n\nQSR & Retail benchmarks now loaded:\n- **Labour cost:** 28–34% of revenue\n- **Food cost:** 28–32%\n- **EBITDA benchmark:** 12–18%\n- **Avg transaction (UK QSR):** £8.50–£12.50\n- **Delivery mix:** 35–45% of orders\n\nAll responses will now benchmark against these industry standards.",files:[]}]);
      }
      if (id==="competitor") {
        setMessages(p=>[...p,{role:"assistant",content:"## 🔍 Competitor Pricing Loaded\n\n*AI-estimated from public data — indicative only*\n\n- **Domino's** avg order: £24.50\n- **Papa John's** avg order: £26.10\n- **Local competitors:** £19–22\n- **Premium segment:** £28–35\n- **Market avg:** £22–28\n\nThis context will be used in pricing analysis.",files:[]}]);
      }
      setLoadingExt(false);
    }
  };

  const processFiles = async (rawFiles) => {
    const arr = Array.from(rawFiles).filter(f=>/\.(xlsx|xls|pdf)$/i.test(f.name));
    if (!arr.length) return;
    const parsed = [];
    for (const f of arr) {
      try {
        if (/\.(xlsx|xls)$/i.test(f.name)) {
          const text = await readExcel(f);
          parsed.push({name:f.name,type:"excel",content:text,size:f.size});
        } else {
          const b64 = await readPdf(f);
          parsed.push({name:f.name,type:"pdf",content:b64,size:f.size});
        }
      } catch(e) { console.error(e); }
    }
    if (!parsed.length) return;
    setAllFiles(p=>[...p,...parsed]);
    setPending(p=>[...p,...parsed]);
    const preview = parsed.map(f=>`**${f.name}** (${f.type.toUpperCase()}, ${(f.size/1024).toFixed(1)} KB)`).join("\n");
    setMessages(p=>[...p,{role:"assistant",content:`## Files Ready\n\n${preview}\n\nContent extracted. What would you like me to focus on?\n\n- Cost base breakdown and key drivers\n- Cost saving levers vs industry benchmarks\n- Operational efficiency opportunities\n- Margin improvement recommendations`,files:parsed.map(f=>f.name)}]);
  };

  const send = async () => {
    if ((!input.trim()&&!pending.length)||loading) return;
    const userText = input.trim()||"Analyse the uploaded files. Identify cost saving levers and operational improvement opportunities.";
    setInput("");
    setMessages(p=>[...p,{role:"user",content:userText,files:pending.map(f=>f.name)}]);
    setLoading(true);

    const extContext = await buildExternalContext(sources);
    const system = `You are Aether — an enterprise decision intelligence AI specialising in cost analysis, operational improvement, and commercial diagnostics.

When analysing data structure output as:
1. **What I see** — summary
2. **Key cost drivers** — top 3–5
3. **Cost saving levers** — specific, quantified
4. **Operational improvement opportunities** — ranked by effort vs impact
5. **Prioritised next steps**

Always benchmark against industry norms. Be direct, specific, commercial. Format with markdown.${extContext}`;

    const userContent = [];
    for (const f of pending) {
      if (f.type==="pdf") userContent.push({type:"document",source:{type:"base64",media_type:"application/pdf",data:f.content}});
      else userContent.push({type:"text",text:`=== Uploaded Excel: ${f.name} ===\n${f.content}`});
    }
    userContent.push({type:"text",text:userText});
    const history = messages.slice(-10).map(m=>({role:m.role,content:String(m.content)}));

    try {
      const text = await callClaude(system, [...history,{role:"user",content:userContent}]);
      setMessages(p=>[...p,{role:"assistant",content:text,files:[]}]);
    } catch(e) {
      setMessages(p=>[...p,{role:"assistant",content:e.message==="API_KEY_MISSING"?"## API Key Missing\n\nAdd `VITE_ANTHROPIC_KEY` in Vercel → Settings → Environment Variables, then redeploy.":`**Error:** ${e.message}`,files:[]}]);
    }
    setPending([]);
    setLoading(false);
  };

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* External Sources */}
      <div style={{padding:"10px 20px",borderBottom:`1px solid ${T.border}`,background:T.bgCard,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <div><div style={{fontSize:12,fontWeight:700}}>External Data Sources</div><div style={{...mono,color:T.muted,marginTop:1}}>Toggle to load live market data into analysis</div></div>
          {loadingExt&&<span style={{...mono,color:T.accent}}>⟳ Fetching live data...</span>}
        </div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
          {sources.map(s=>(
            <button key={s.id} onClick={()=>toggle(s.id)} title={s.desc} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:5,fontSize:11,fontWeight:500,cursor:"pointer",border:"none",transition:"all 0.15s",background:s.active?T.primaryDim:T.bgSec,color:s.active?T.primary:T.dim,outline:s.active?`1px solid ${T.primary}50`:`1px solid ${T.border}`}}>
              {s.icon} {s.label}
              <span style={{...mono,fontSize:9,color:s.active?T.primary:T.muted}}>{s.active?"ON":"OFF"}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upload */}
      <div style={{padding:"10px 20px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div onDrop={e=>{e.preventDefault();setDragOver(false);processFiles(e.dataTransfer.files);}} onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onClick={()=>fileRef.current?.click()} style={{background:dragOver?T.primaryDim:T.bgSec,border:`1.5px dashed ${dragOver?T.primary:T.border}`,borderRadius:8,padding:"10px 16px",cursor:"pointer",transition:"all 0.15s"}}>
          <input ref={fileRef} type="file" multiple accept=".xlsx,.xls,.pdf" style={{display:"none"}} onChange={e=>processFiles(e.target.files)}/>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <div style={{width:32,height:32,borderRadius:8,background:T.primaryDim,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>📎</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,marginBottom:1}}>Upload Files for Analysis</div><div style={{...mono,color:T.muted}}>Drop Excel (.xlsx) or PDF · Click to browse</div></div>
            {allFiles.length>0&&<span style={tag(T.green)}>{allFiles.length} FILE{allFiles.length>1?"S":""} LOADED</span>}
          </div>
          {allFiles.length>0&&<div style={{marginTop:8,display:"flex",gap:6,flexWrap:"wrap"}}>{allFiles.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:4,padding:"3px 8px"}}><span style={{fontSize:10}}>{f.type==="pdf"?"📄":"📊"}</span><span style={{...mono,color:T.dim,fontSize:10}}>{f.name}</span></div>)}</div>}
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"14px 20px",display:"flex",flexDirection:"column",gap:12}}>
        {messages.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",animation:"fadeIn 0.2s ease"}}>
            {m.role==="assistant"&&<div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${T.primary},${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0,marginRight:8,marginTop:2}}>A</div>}
            <div style={{maxWidth:"82%"}}>
              {m.files&&m.files.length>0&&m.role==="user"&&<div style={{display:"flex",gap:5,marginBottom:5,justifyContent:"flex-end",flexWrap:"wrap"}}>{m.files.map((f,j)=><div key={j} style={{...mono,background:T.primaryDim,color:T.primary,padding:"2px 6px",borderRadius:3,border:`1px solid ${T.primary}30`,fontSize:9}}>📎 {f}</div>)}</div>}
              <div style={{padding:"11px 14px",borderRadius:m.role==="user"?"8px 2px 8px 8px":"2px 8px 8px 8px",fontSize:12,lineHeight:1.65,background:m.role==="user"?T.primary:T.bgSec,border:m.role==="assistant"?`1px solid ${T.border}`:"none",color:m.role==="user"?"#fff":T.text}}>
                {m.role==="assistant"?<Md text={m.content}/>:m.content}
              </div>
            </div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:26,height:26,borderRadius:"50%",background:`linear-gradient(135deg,${T.primary},${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",flexShrink:0}}>A</div><div style={{background:T.bgSec,border:`1px solid ${T.border}`,borderRadius:"2px 8px 8px 8px",padding:"11px 14px",display:"flex",gap:5,alignItems:"center"}}><span style={{fontSize:11,color:T.muted,marginRight:4}}>Analysing</span>{[0,1,2].map(i=><div key={i} style={{width:5,height:5,borderRadius:"50%",background:T.primary,animation:`bounce 1.1s infinite ${i*0.18}s`}}/>)}</div></div>}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"12px 20px",borderTop:`1px solid ${T.border}`,background:T.bgCard,flexShrink:0}}>
        {pending.length>0&&<div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>{pending.map((f,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,background:T.primaryDim,border:`1px solid ${T.primary}40`,borderRadius:4,padding:"3px 8px"}}><span style={{fontSize:10}}>{f.type==="pdf"?"📄":"📊"}</span><span style={{...mono,color:T.primary,fontSize:10}}>{f.name}</span><button onClick={()=>setPending(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"none",color:T.muted,cursor:"pointer",fontSize:14,lineHeight:1,padding:0,marginLeft:2}}>×</button></div>)}</div>}
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}} placeholder={pending.length?"Files attached — describe what to analyse...":"Ask about cost savings, ops improvements, or upload files..."} rows={2} style={{flex:1,background:T.bgSec,border:`1px solid ${T.border}`,borderRadius:8,padding:"9px 12px",fontSize:12,color:T.text,outline:"none",resize:"none",fontFamily:"inherit",lineHeight:1.5}}/>
          <button onClick={send} disabled={loading||(!input.trim()&&!pending.length)} style={{...btn(),padding:"10px 16px",height:52,opacity:loading?0.5:1,flexShrink:0}}>➤</button>
        </div>
        <div style={{...mono,color:T.muted,marginTop:5,textAlign:"center",fontSize:10}}>Enter to send · Shift+Enter for new line</div>
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
        <div><div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Store Volume Decline Detected</div><div style={{fontSize:11,color:T.dim,lineHeight:1.55}}>Revenue down 18.2% WoW. Aether compressed 3–4 weeks of manual analysis into 2.5 hours. Root causes: manager transition, staff turnover, payment failures.</div></div>
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
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
        {[{l:"Total Stores",v:"50",c:T.primary},{l:"Alerting",v:stores.filter(s=>s.alerts>0).length,c:T.yellow},{l:"Critical",v:stores.filter(s=>s.status==="critical").length,c:T.red}].map(k=>(
          <div key={k.l} style={{...card,textAlign:"center"}}><div style={{...lbl,marginBottom:6}}>{k.l}</div><div style={{fontSize:26,fontWeight:800,color:k.c}}>{k.v}</div></div>
        ))}
      </div>
      <div style={card}>
        <div style={{fontSize:12,fontWeight:700,marginBottom:10}}>Store Performance</div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {stores.map(s=>(
            <div key={s.id} onClick={()=>setSel(s.id)} style={{background:sel===s.id?T.primaryDim:T.bgSec,border:`1px solid ${sel===s.id?T.primary:T.border}`,borderRadius:6,padding:"9px 12px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all 0.15s"}}>
              <Dot status={s.status}/><div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>Store #{s.id} — {s.loc}</div><div style={{...mono,color:T.muted,marginTop:1}}>Rev: <span style={{color:s.rev<0?T.red:T.green,fontWeight:700}}>{s.rev>0?"+":""}{s.rev}%</span> · {s.alerts} alerts</div></div>
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
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Benchmark: Store #042 vs Peers & Industry</div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 80px",gap:6,padding:"4px 10px",marginBottom:4}}>{["Metric","Store","Peer Avg","Industry",""].map(h=><span key={h} style={lbl}>{h}</span>)}</div>
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
function Recommendations({ recs, setRecs, onExecute }) {
  const [approved, setApproved] = useState({});
  const [executing, setExecuting] = useState({});
  const [executed, setExecuted] = useState({});

  const handleExecute = async (r, i) => {
    if (executed[r.id]) return;
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
        <div style={{fontSize:13,fontWeight:700,marginBottom:3}}>Ranked Recommendations — Store #042</div>
        <div style={{fontSize:11,color:T.dim}}>Approve to acknowledge · Execute to track in Transformation.</div>
      </div>
      {recs.map((r,i)=>(
        <div key={r.id} style={{...card,border:`1px solid ${executed[r.id]?`${T.green}50`:approved[r.id]?`${T.primary}50`:T.border}`,transition:"all 0.2s",animation:"fadeIn 0.3s ease"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:8}}>
            <div style={{display:"flex",gap:7,alignItems:"center",flex:1,flexWrap:"wrap"}}>
              <span style={tag(r.pri==="CRITICAL"?T.red:r.pri==="HIGH"?T.yellow:T.primary)}>{r.pri}</span>
              <span style={{fontSize:13,fontWeight:700}}>{r.title}</span>
              {r.isRecovery && <span style={tag(T.accent)}>RECOVERY INITIATIVE</span>}
              {executed[r.id] && <span style={tag(T.green)}>✓ IN TRANSFORMATION</span>}
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button onClick={()=>setApproved(p=>({...p,[r.id]:!p[r.id]}))} style={{...btn(approved[r.id]?"primary":"secondary"),fontSize:11,padding:"5px 10px",background:approved[r.id]?T.primary:T.bgSec,color:approved[r.id]?"#fff":T.dim}}>
                {approved[r.id]?"✓ Approved":"Approve"}
              </button>
              <button
                onClick={()=>handleExecute(r,i)}
                disabled={executed[r.id]}
                style={{...btn("green"),fontSize:11,padding:"5px 10px",opacity:executed[r.id]?0.6:1,background:executed[r.id]?T.muted:executing[r.id]==="executing"?T.yellow:T.green}}
              >
                {executing[r.id]==="executing"?"Executing...":executed[r.id]?"✓ Done":"Execute"}
              </button>
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
  const results=[{m:"Revenue",base:36380,sim:36380+price*500+staff*200,fmt:v=>`£${Math.round(v).toLocaleString()}`},{m:"Gross Margin %",base:26.4,sim:26.4-price*0.5+staff*0.2,fmt:v=>`${v.toFixed(1)}%`},{m:"CSAT Score",base:3.2,sim:Math.min(5,Math.max(0,3.2+staff*0.3-price*0.1)),fmt:v=>`${v.toFixed(1)}/5`},{m:"Labor Cost %",base:32.1,sim:32.1+staff*1.5,fmt:v=>`${v.toFixed(1)}%`}];
  return(
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,height:"100%",overflowY:"auto"}}>
      <div style={card}>
        <div style={{...lbl,marginBottom:6}}>C. Test Decisions Before Execution</div>
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
            {results.map(r=>{const delta=r.sim-r.base;const pos=delta>=0;return(
              <div key={r.m} style={{...card,border:`1px solid ${pos?`${T.green}40`:`${T.red}40`}`,background:pos?T.greenDim:T.redDim}}>
                <div style={{...lbl,marginBottom:4}}>{r.m}</div>
                <div style={{fontSize:18,fontWeight:800,color:pos?T.green:T.red,marginBottom:3}}>{pos?"+":""}{r.m==="Revenue"?`£${Math.round(delta).toLocaleString()}`:delta.toFixed(1)}</div>
                <div style={{...mono,color:T.muted}}>{r.fmt(r.base)} → {r.fmt(r.sim)}</div>
              </div>
            );})}
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
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Supplier Consolidation — Frozen Products</div>
        <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12}}>
          {suppliers.map(s=>(
            <div key={s.name} style={{display:"grid",gridTemplateColumns:"1.5fr 1fr 1fr 80px",gap:8,alignItems:"center",background:T.bgSec,borderRadius:6,padding:"9px 12px"}}>
              <span style={{fontSize:12,fontWeight:600}}>{s.name}</span><span style={{...mono,fontWeight:700}}>£{s.price}/unit</span>
              <span style={{...mono,color:T.dim}}>{s.vol}% vol</span><span style={tag(s.status==="LOW"?T.green:s.status==="MID"?T.yellow:T.red)}>{s.status}</span>
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
              <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,marginBottom:5}}>{k.loc}</div><div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:4,background:T.bgCard,borderRadius:2,overflow:"hidden"}}><div style={{width:`${k.prod}%`,height:"100%",background:k.c,borderRadius:2}}/></div><span style={{...mono,color:T.muted,minWidth:24}}>{k.prod}%</span></div></div>
              <span style={{...mono,fontWeight:700}}>£{k.cost}M/yr</span>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
          {[{l:"Annual Savings",v:"£1.6M",c:T.green},{l:"Investment",v:"£500K",c:T.yellow},{l:"Payback",v:"3.7 months",c:T.accent}].map(m=>(
            <div key={m.l} style={{background:T.bgSec,borderRadius:6,padding:10,textAlign:"center"}}><div style={{...lbl,marginBottom:4}}>{m.l}</div><div style={{fontSize:14,fontWeight:800,color:m.c}}>{m.v}</div></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── TRANSFORMATION ────────────────────────────────────────────────────────────
function Transformation({ initiatives, setInitiatives, onApproveRecovery }) {
  const [activeWorkflow, setActiveWorkflow] = useState(null); // initiative id

  const handleApprove = (initiative, userText) => {
    // Build a new recovery recommendation
    const newRec = {
      id: `recovery-${Date.now()}`,
      pri: "HIGH",
      title: `Recovery Plan: ${initiative.name}`,
      impact: "TBD — based on AI recommendation",
      effort: "MEDIUM",
      time: "2–4 weeks",
      desc: `AI-generated recovery initiative for underperforming initiative "${initiative.name}". Decision workflow approved. Focus: timing realignment, cost optimisation, and manpower support.`,
      isRecovery: true,
    };
    setActiveWorkflow(null);
    onApproveRecovery(newRec);
  };

  return(
    <div style={{padding:20,display:"flex",flexDirection:"column",gap:14,height:"100%",overflowY:"auto"}}>
      <div style={card}>
        <div style={{...lbl,marginBottom:6}}>D. Track Value Realization</div>
        <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Expected vs Actual — Cumulative Value</div>
        <ResponsiveContainer width="100%" height={185}>
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
                      <button
                        onClick={()=>setActiveWorkflow(activeWorkflow===init.id?null:init.id)}
                        style={{...btn("red"),fontSize:11,padding:"5px 10px",background:activeWorkflow===init.id?T.yellow:T.red}}
                      >
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

              {/* Inline Decision Workflow Chat */}
              {activeWorkflow===init.id&&(
                <div style={{marginTop:8,height:380,animation:"slideIn 0.25s ease"}}>
                  <div style={{...lbl,marginBottom:6,color:T.yellow}}>⚡ DECISION WORKFLOW — {init.name.toUpperCase()}</div>
                  <MiniChat
                    systemPrompt={`You are Aether, an enterprise decision intelligence AI. The initiative "${init.name}" is underperforming (expected: ${init.expected}, actual: ${init.actual}, ${init.pct}% of target).

Your role: suggest a structured recovery plan covering:
1. **Initiatives to get back on track** — specific actions
2. **Timing Lag** — is this a timing issue or structural?
3. **Cost** — additional investment required
4. **Manpower Support** — team/resource needs

Be specific and quantified. End your first message by saying: "Type **Approve** to add this as a new Recovery Initiative in the Recommendations tab."

Keep responses concise and actionable.`}
                    welcomeMsg={`## ⚡ Decision Workflow — ${init.name}\n\nThis initiative is delivering **${init.pct}% of target** (${init.actual} vs ${init.expected} expected).\n\nAnalysing recovery options across:\n- **Initiatives to get back on track**\n- **Timing Lag** assessment\n- **Cost** implications\n- **Manpower Support** needed\n\nType **Approve** at any time to add a recovery initiative to Recommendations.`}
                    onApprove={(userText)=>handleApprove(init, userText)}
                    placeholder='Discuss recovery options, or type "Approve" to add to Recommendations...'
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
export default function App(){
  const [page, setPage] = useState("assistant");
  const [recs, setRecs] = useState(INIT_RECS);
  const [initiatives, setInitiatives] = useState(INIT_INITIATIVES);

  const handleExecute = (rec) => {
    // Add to initiatives in Transformation
    const newInit = {
      id: `exec-${Date.now()}`,
      name: rec.title,
      expected: rec.impact,
      actual: "£0/wk",
      pct: 0,
      status: "track",
    };
    setInitiatives(p=>[...p, newInit]);
  };

  const handleApproveRecovery = (newRec) => {
    setRecs(p=>[...p, newRec]);
    setPage("recommendations");
  };

  const pages = {
    assistant: <AssistantPage/>,
    dashboard: <Dashboard/>,
    network: <Network/>,
    diagnostics: <Diagnostics/>,
    recommendations: <Recommendations recs={recs} setRecs={setRecs} onExecute={handleExecute}/>,
    twin: <DigitalTwin/>,
    supply: <SupplyChain/>,
    transformation: <Transformation initiatives={initiatives} setInitiatives={setInitiatives} onApproveRecovery={handleApproveRecovery}/>,
  };

  return(
    <>
      <style>{GS}</style>
      <div style={{display:"flex",height:"100vh",background:T.bg,fontFamily:"'Inter',system-ui,sans-serif",color:T.text,overflow:"hidden"}}>
        <aside style={{width:218,flexShrink:0,background:T.bgCard,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:7,background:`linear-gradient(135deg,${T.primary},${T.accent})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",flexShrink:0}}>Æ</div>
            <div><div style={{fontSize:13,fontWeight:800,letterSpacing:-0.4,lineHeight:1}}>Aether</div><div style={{...mono,color:T.accent,marginTop:2,fontSize:9,letterSpacing:1}}>ENTERPRISE AI</div></div>
          </div>
          <div style={{padding:"10px 12px",borderBottom:`1px solid ${T.border}`}}>
            <div style={{...lbl,marginBottom:5}}>Active Store</div>
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
              <button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",borderRadius:6,border:"none",cursor:"pointer",textAlign:"left",width:"100%",transition:"all 0.12s",background:page===n.id?T.primaryDim:"transparent",color:page===n.id?T.primary:T.dim,fontWeight:page===n.id?600:400,fontSize:12,fontFamily:"inherit",position:"relative"}}>
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
            <div style={{display:"flex",justifyContent:"center"}}>
              <span style={{...mono,fontSize:9,letterSpacing:2,padding:"3px 14px",borderRadius:20,border:`1px solid ${T.primary}40`,color:T.primary,background:T.primaryDim}}>DEMO</span>
            </div>
          </div>
        </aside>
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
