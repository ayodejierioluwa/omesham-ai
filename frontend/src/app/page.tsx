"use client";

import React, { useState, useEffect, useRef } from 'react';

// =====================================================================
//                       SYNTHETIC CYBERNETIC SOUNDS
// =====================================================================
const playRadarBeep = (frequency = 1100, duration = 0.12, type: OscillatorType = "sine") => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn("Audio Context init failed:", err);
  }
};

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('COMMAND DECK');
  const [currentDepth, setCurrentDepth] = useState(12482.4);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [alertLogs, setAlertLogs] = useState<any[]>([]);
  const [chaosMode, setChaosMode] = useState(false);
  const [dataSource, setDataSource] = useState('simulated');
  const [location, setLocation] = useState('utah_forge');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  
  const depthRef = useRef(12482.4);

  // Micro-Frontend SSO Handshake Listener
  useEffect(() => {
    if (typeof window !== 'undefined' && window.self !== window.top) {
      setIsAuthenticated(false);
      
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'SSO_SESSION_RESPONSE') {
          if (event.data.session) {
            console.log("Omesham SSO: Identity verified for user:", event.data.session.username);
            setIsAuthenticated(true);
          } else {
            console.warn("Omesham SSO: Active session rejected by parent.");
          }
        }
      };
      
      window.addEventListener('message', handleMessage);
      window.parent.postMessage({ type: 'SSO_SESSION_REQUEST' }, '*');
      
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  // SSE Real-Time Stream Receiver
  useEffect(() => {
    console.log(`Omesham: Tuning stream receiver to ${dataSource} | ${location} | Chaos: ${chaosMode}`);
    
    const endpoint = dataSource === 'field'
      ? `http://127.0.0.1:8006/api/field/drilling_stream?location=${location}${chaosMode ? "&chaos=true" : ""}`
      : `http://127.0.0.1:8006/api/drilling/telemetry_stream?location=${location}${chaosMode ? "&chaos=true" : ""}`;

    const eventSource = new EventSource(endpoint);
    
    eventSource.onmessage = (event) => {
      try {
        const pt = JSON.parse(event.data);
        const formattedTimestamp = new Date(pt.timestamp).toLocaleTimeString();
        
        // Handle physical depths
        if (pt.depth_ft !== undefined) {
          depthRef.current = pt.depth_ft;
          setCurrentDepth(pt.depth_ft);
          if (typeof window !== 'undefined') {
            window.parent.postMessage({
              type: 'OMESHAM_DEPTH_UPDATE',
              depth: pt.depth_ft
            }, '*');
          }
        }
        
        // Rolling buffer (holds up to 12 points for the Torque chart bars)
        setTelemetry(prev => {
          const updated = [...prev, { ...pt, timestamp: formattedTimestamp }];
          if (updated.length > 12) {
            return updated.slice(updated.length - 12);
          }
          return updated;
        });

        // Sync with PetroOne NOC shell
        if (typeof window !== 'undefined') {
          window.parent.postMessage({
            type: 'OMESHAM_TELEMETRY_UPDATE',
            risk: pt.forecast_risk,
            is_anomaly: pt.is_anomaly,
            anomaly_type: pt.is_anomaly ? pt.anomaly_type : null,
            proactive_alert: pt.proactive_alert
          }, '*');
        }

        // Anomaly warnings capture
        if (pt.is_anomaly || pt.forecast_risk > 30) {
          const alertType = pt.is_anomaly ? pt.anomaly_type : "Predictive Alert";
          const alertMsg = pt.is_anomaly ? pt.recommended_solution : pt.proactive_alert;
          
          setAlertLogs(prev => {
            const lastLog = prev[prev.length - 1];
            if (!lastLog || lastLog.message !== alertMsg || (Date.now() - lastLog.rawTime > 8000)) {
              return [...prev, {
                timestamp: formattedTimestamp,
                rawTime: Date.now(),
                type: alertType,
                message: alertMsg,
                risk: pt.forecast_risk
              }];
            }
            return prev;
          });
        }
      } catch (e) {
        console.error("Omesham SSE Parse Error:", e);
      }
    };

    eventSource.onerror = (err) => {
      console.error("Omesham SSE dropped, retrying...", err);
    };

    return () => {
      eventSource.close();
    };
  }, [chaosMode, dataSource, location]);

  // Synthetic depth incremental drift
  useEffect(() => {
    if (dataSource === 'field') return;
    
    const interval = setInterval(() => {
      depthRef.current += 0.24;
      setCurrentDepth(depthRef.current);
      if (typeof window !== 'undefined') {
        window.parent.postMessage({
          type: 'OMESHAM_DEPTH_UPDATE',
          depth: depthRef.current
        }, '*');
      }
    }, 200);
    return () => clearInterval(interval);
  }, [dataSource]);

  // Feedback Trigger
  const onFeedbackSubmit = async (correction: 'correct' | 'false_alarm') => {
    const currentPt = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
    if (!currentPt) return;
    try {
      const res = await fetch("http://127.0.0.1:8006/api/drilling/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          torque_ftlbs: currentPt.torque_ftlbs,
          rpm: currentPt.rpm,
          wob_klbs: currentPt.wob_klbs,
          spp_psi: currentPt.spp_psi,
          rop_fph: currentPt.rop_fph,
          formation_type: currentPt.formation_type,
          original_anomaly: currentPt.anomaly_type,
          operator_correction: correction
        })
      });
      const data = await res.json();
      if (data.status === "success") {
        setFeedbackToast(`Adapted to: ${correction === 'false_alarm' ? 'Ignore Violation' : 'Enforce Safety Boundary'}`);
        setTimeout(() => setFeedbackToast(null), 5000);
        playRadarBeep(880, 0.1, "sine");
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
    }
  };

  const currentPt = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  
  // Custom physics calculations for telemetry metrics (clamped to prevent negative drift)
  const wobVal = currentPt?.wob_klbs !== undefined ? Math.max(0.0, currentPt.wob_klbs) : 24.8;
  const rpmVal = currentPt?.rpm !== undefined ? Math.max(0, currentPt.rpm) : 142;
  const ropVal = currentPt?.rop_fph !== undefined ? Math.max(0.0, currentPt.rop_fph) : 45.2;
  const threatIndex = currentPt?.forecast_risk !== undefined ? Math.min(100, Math.max(0, currentPt.forecast_risk)) : 28;

  // Real-time lateral vibration index G
  const calculateVibration = () => {
    if (!currentPt) return 0.4;
    const baseVal = 0.3 + (Math.sin(currentDepth / 15) * 0.1);
    const geoMultiplier = currentPt.formation_type?.includes("Granite") ? 1.8 : 1.0;
    let finalVib = baseVal * geoMultiplier;
    
    if (currentPt.is_anomaly && (currentPt.anomaly_type?.includes("Stick-Slip") || currentPt.anomaly_type?.includes("Vibration"))) {
      finalVib += 3.4 + (Math.sin(Date.now() / 150) * 0.5);
    }
    return finalVib;
  };

  const vibrationG = calculateVibration();

  // Render authentic authentication synchronization screen
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#020617] items-center justify-center text-slate-400 font-mono text-xs tracking-widest relative">
        <div className="fixed inset-0 grid-bg z-0 pointer-events-none"></div>
        <div className="fixed inset-0 scanline z-10 pointer-events-none"></div>
        <div className="relative z-20 flex flex-col items-center">
          <div className="w-10 h-10 border-2 border-slate-800 border-t-amber-500 rounded-full animate-spin mb-4"></div>
          <span>SYNCHRONIZING SECURE NODE IDENTITY...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-[#e5e2e3] font-sans antialiased relative overflow-x-hidden">
      
      {/* Background Layers matching Stitch custom styles */}
      <div className="fixed inset-0 grid-bg z-0 pointer-events-none"></div>
      <div className="fixed inset-0 scanline z-10 pointer-events-none"></div>

      {/* 1. TOP NAVIGATION BAR */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#131315]/60 backdrop-blur-xl border-b border-[#46464c]/30 shadow-[0_0_20px_rgba(192,198,222,0.1)] no-print">
        <div className="flex items-center gap-6">
          <span className="text-xl font-black tracking-tighter text-[#c0c6de] font-mono select-none">OMESHAM AI</span>
          
          <nav className="hidden md:flex gap-4">
            
            {/* SIMULATED Dropdown Selector */}
            <div className="relative group">
              <div className="flex items-center gap-1 text-[#c6c6cd] hover:text-[#c0c6de] transition-colors duration-150 font-mono text-[11px] font-bold py-1 bg-[#131315]/40 border border-[#46464c]/20 rounded-xl px-3 cursor-pointer">
                <span>FEED: {dataSource.toUpperCase()}</span>
                <span className="material-symbols-outlined text-[16px] group-hover:rotate-180 transition-transform duration-300">expand_more</span>
              </div>
              <div className="absolute top-full left-0 mt-1 w-44 glass-panel bg-[#201f21]/90 backdrop-blur-xl border border-[#46464c]/30 py-1.5 rounded-lg opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-[60]">
                <button 
                  onClick={() => { setDataSource('simulated'); playRadarBeep(920, 0.08, "sine"); }}
                  className="w-full flex items-center px-4 py-1.5 text-[#c6c6cd] hover:bg-[#020617]/20 hover:text-[#c0c6de] transition-colors font-mono text-[10px] font-bold text-left"
                >
                  Standard Sim
                </button>
                <button 
                  onClick={() => { setDataSource('field'); playRadarBeep(920, 0.08, "sine"); }}
                  className="w-full flex items-center px-4 py-1.5 text-[#c6c6cd] hover:bg-[#020617]/20 hover:text-[#c0c6de] transition-colors font-mono text-[10px] font-bold text-left"
                >
                  Field Stream
                </button>
              </div>
            </div>

            {/* FIELD Location Dropdown Selector */}
            <div className="relative group">
              <div className="flex items-center gap-1 text-[#c6c6cd] hover:text-[#c0c6de] transition-colors duration-150 font-mono text-[11px] font-bold py-1 bg-[#131315]/40 border border-[#46464c]/20 rounded-xl px-3 cursor-pointer">
                <span>REGION: {location.replace('_', ' ').toUpperCase()}</span>
                <span className="material-symbols-outlined text-[16px] group-hover:rotate-180 transition-transform duration-300">expand_more</span>
              </div>
              <div className="absolute top-full left-0 mt-1 w-48 glass-panel bg-[#201f21]/90 backdrop-blur-xl border border-[#46464c]/30 py-1.5 rounded-lg opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-[60]">
                {['utah_forge', 'permian_basin', 'volve_field', 'gom_deepwater', 'arabian_basin'].map(loc => (
                  <button 
                    key={loc}
                    onClick={() => { setLocation(loc); playRadarBeep(920, 0.08, "sine"); }}
                    className="w-full flex items-center px-4 py-1.5 text-[#c6c6cd] hover:bg-[#020617]/20 hover:text-[#c0c6de] transition-colors font-mono text-[10px] font-bold text-left"
                  >
                    {loc.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

          </nav>
        </div>

        {/* Top bar right buttons */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setChaosMode(prev => !prev);
              playRadarBeep(chaosMode ? 600 : 1300, 0.15, "triangle");
            }}
            className={`bg-[#93000a]/25 border border-[#ffb4ab]/30 text-[#ffb4ab] px-4 py-1.5 font-mono text-[10px] font-bold rounded-full emergency-glow hover:scale-95 transition-all ${chaosMode ? 'animate-pulse shadow-[0_0_15px_rgba(147,0,10,0.6)]' : ''}`}
          >
            STRESS MODE
          </button>
          
          <div className="flex items-center gap-3 text-[#c6c6cd]">
            <span className="material-symbols-outlined cursor-pointer hover:text-[#c0c6de] text-[20px]">settings</span>
            <span className={`material-symbols-outlined cursor-pointer hover:text-[#c0c6de] text-[20px] ${alertLogs.length > 0 ? 'text-[#ffb4ab] animate-pulse' : ''}`}>notifications_active</span>
            <span className="material-symbols-outlined cursor-pointer text-[#c0c6de] text-[20px]">account_circle</span>
          </div>
        </div>
      </header>

      {/* 2. SIDEBAR NAVIGATION */}
      <aside className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col pt-20 bg-[#201f21]/40 backdrop-blur-2xl border-r border-[#46464c]/20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] no-print">
        <div className="px-6 mb-10">
          <h2 className="text-xl font-bold tracking-tight text-[#c0c6de] font-mono leading-none">MISSION CONTROL</h2>
          <p className="text-[9px] tracking-widest uppercase text-[#c6c6cd]/60 mt-1.5 font-bold">SECTOR 07-B</p>
        </div>

        {/* Navigation Buttons matched exactly to Stitch layout */}
        <nav className="flex-1 flex flex-col gap-1 px-2">
          {[
            { id: 'COMMAND DECK', icon: 'dashboard' },
            { id: 'TRAJECTORY', icon: 'explore' },
            { id: 'BHA CONTROL', icon: 'precision_manufacturing' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                playRadarBeep(1100, 0.08, "sine");
              }}
              className={`flex items-center gap-4 p-4 rounded-xl font-mono text-[11px] font-bold tracking-wider transition-all duration-150 text-left ${
                activeTab === tab.id 
                  ? 'bg-[#020617]/20 text-[#c0c6de] border-r-4 border-[#c0c6de]' 
                  : 'text-[#c6c6cd] hover:bg-[#353436]/10 hover:text-[#c0c6de]'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span>{tab.id}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar footer buttons */}
        <div className="p-6 mt-auto flex flex-col gap-4 border-t border-[#46464c]/20">
          <button 
            onClick={() => { setChaosMode(false); playRadarBeep(440, 0.3, "sawtooth"); }}
            className="w-full bg-[#ffb4ab] text-[#690005] py-3 font-mono text-[10px] font-extrabold tracking-widest rounded-lg shadow-lg shadow-[#ffb4ab]/10 hover:scale-[0.98] transition-transform uppercase"
          >
            EMERGENCY STOP
          </button>
          
          <div className="flex flex-col gap-2 opacity-75 font-mono text-[10px] font-bold">
            <div className="flex items-center gap-3 text-[#c6c6cd] hover:text-[#c0c6de] cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">analytics</span>
              <span>DIAGNOSTICS</span>
            </div>
            <div className="flex items-center gap-3 text-[#c6c6cd] hover:text-[#c0c6de] cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">help_center</span>
              <span>SYSTEM HELP</span>
            </div>
          </div>
        </div>

        {/* Hidden Signature Watermark Footer */}
        <div className="p-6 border-t border-[#46464c]/10 flex flex-col items-center justify-center opacity-10 hover:opacity-80 transition-all duration-500 select-none">
          <svg className="w-28 h-12 text-slate-500 hover:text-amber-400 transition-colors duration-300" viewBox="0 0 160 65" fill="none">
            {/* Main sweeping left S/E cursive loop */}
            <path 
              d="M 25,48 C 15,48 10,38 12,28 C 15,12 32,5 48,10 C 60,14 62,24 50,32 C 40,38 28,42 22,46 C 15,50 12,56 16,60 C 22,64 35,62 48,54 C 55,50 60,42 63,33 C 65,27 68,23 72,21" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* Middle connecting loops */}
            <path 
              d="M 72,21 C 76,20 80,24 82,28 C 84,32 82,38 85,42 C 87,45 92,42 95,38 C 98,34 98,28 101,24 C 103,20 106,18 109,21 C 112,24 110,32 113,38 C 115,42 118,44 122,42 C 126,40 129,35 132,30" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* High-speed bold underscore diagonal slash */}
            <path 
              d="M 14,48 L 18,48 C 24,48 45,52 65,51 C 85,50 110,44 135,38 L 155,34" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* Top right flourish dot */}
            <circle cx="118" cy="18" r="1.5" fill="currentColor" />
          </svg>
        </div>
      </aside>

      {/* 3. MAIN CANVAS VIEWPORT */}
      <main className="ml-64 pt-20 p-6 relative z-20 flex flex-col h-screen overflow-y-auto">
        
        {/* Dashboard Title Header */}
        <div className="flex justify-between items-end mb-8 shrink-0 no-print">
          <div>
            <h1 className="text-4xl text-[#c0c6de] font-extrabold tracking-tight select-none">STRATOS-09 DEPLOYMENT</h1>
            <div className="flex gap-4 mt-2 font-mono text-[11px]">
              <span className="bg-[#353436] px-3 py-1 rounded text-[#c0c6de] border border-[#46464c]/50">WELL ID: WH-NG-OML17</span>
              <span className="flex items-center gap-2 text-[#c6c6cd] font-bold tracking-wider">
                <span className={`w-2.5 h-2.5 rounded-full ${chaosMode ? 'bg-[#ffb4ab] animate-ping' : 'bg-[#c0c6de] animate-pulse'}`}></span>
                SYSTEM HEALTH: {chaosMode ? "CRITICAL RISK" : "NOMINAL"}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setShowReportModal(true);
                playRadarBeep(980, 0.12, "sine");
              }}
              className="glass-panel px-6 py-2.5 rounded-lg font-mono text-[11px] font-bold tracking-wider border border-[#c0c6de]/20 hover:border-[#c0c6de] text-slate-100 transition-all uppercase"
            >
              GENERATE SHIFT REPORT
            </button>
          </div>
        </div>

        {/* FEEDBACK TOAST IN CANVAS */}
        {feedbackToast && (
          <div className="mb-4 p-3 bg-[#131315]/90 border border-teal-500/30 text-teal-400 rounded-lg text-xs font-mono leading-normal shadow-[0_0_15px_rgba(45,212,191,0.25)] animate-fade-in text-center">
            {feedbackToast}
          </div>
        )}

        {/* =====================================================================
                              ACTIVE TAB: COMMAND DECK
           ===================================================================== */}
        {activeTab === 'COMMAND DECK' && (
          <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
            
            {/* Left 8-column Panel */}
            <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
              
              {/* Telemetry row (Depth, WOB, RPM, ROP) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Well Depth */}
                <div className="glass-panel p-5 relative overflow-hidden group rounded-lg">
                  <div className="absolute top-0 right-0 w-16 h-16 opacity-5 group-hover:opacity-10 transition-opacity">
                    <span className="material-symbols-outlined text-6xl text-[#c0c6de]">straighten</span>
                  </div>
                  <p className="font-mono text-[10px] text-[#c6c6cd] mb-4 uppercase tracking-widest">WELL DEPTH (MD)</p>
                  <p className="text-xl lg:text-2xl font-mono text-[#c0c6de] font-bold">
                    {currentDepth.toFixed(1)} <span className="text-xs text-[#c6c6cd]">m</span>
                  </p>
                  <div className="mt-4 h-1 w-full bg-[#353436] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#c0c6de] shadow-[0_0_8px_rgba(192,198,222,0.8)]"
                      style={{ width: `${Math.min((currentDepth / 15000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Weight on Bit */}
                <div className="glass-panel p-5 relative overflow-hidden group rounded-lg">
                  <p className="font-mono text-[10px] text-[#c6c6cd] mb-4 uppercase tracking-widest">WOB (LOAD)</p>
                  <p className="text-xl lg:text-2xl font-mono text-[#bec6e0] font-bold">
                    {wobVal.toFixed(1)} <span className="text-xs text-[#c6c6cd]">klbs</span>
                  </p>
                  <div className="mt-4 h-1 w-full bg-[#353436] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#bec6e0] shadow-[0_0_8px_rgba(190,198,224,0.8)]"
                      style={{ width: `${Math.min((wobVal / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Bit Rotation RPM */}
                <div className="glass-panel p-5 relative overflow-hidden group rounded-lg">
                  <p className="font-mono text-[10px] text-[#c6c6cd] mb-4 uppercase tracking-widest">BIT ROTATION</p>
                  <p className="text-xl lg:text-2xl font-mono text-[#e4bfaa] font-bold">
                    {rpmVal} <span className="text-xs text-[#c6c6cd]">RPM</span>
                  </p>
                  <div className="mt-4 h-1 w-full bg-[#353436] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#e4bfaa] shadow-[0_0_8px_rgba(228,191,170,0.8)]"
                      style={{ width: `${Math.min((rpmVal / 200) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Rate of Penetration ROP */}
                <div className="glass-panel p-5 relative overflow-hidden group rounded-lg">
                  <p className="font-mono text-[10px] text-[#c6c6cd] mb-4 uppercase tracking-widest">RATE OF PEN.</p>
                  <p className="text-xl lg:text-2xl font-mono text-[#c0c6de] font-bold">
                    {ropVal.toFixed(1)} <span className="text-xs text-[#c6c6cd]">m/hr</span>
                  </p>
                  <div className="mt-4 h-1 w-full bg-[#353436] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#c0c6de] shadow-[0_0_8px_rgba(192,198,222,0.8)]"
                      style={{ width: `${Math.min((ropVal / 120) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

              </div>

              {/* Real-time dynamics chart (Large card) */}
              <div className="glass-panel p-6 rounded-lg flex-1 min-h-[280px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-mono text-[11px] font-bold text-[#c0c6de] tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">monitoring</span> 
                    REAL-TIME TORQUE DYNAMICS
                  </h3>
                  <div className="flex gap-2">
                    <span className={`w-2 h-2 rounded-full bg-[#c0c6de] ${currentPt?.is_anomaly ? 'animate-ping' : ''}`}></span>
                    <span className="w-2 h-2 rounded-full bg-[#e4bfaa]"></span>
                  </div>
                </div>

                {/* Chart body */}
                <div className="flex-1 flex space-x-4">
                  {/* Y Axis scale */}
                  <div className="flex flex-col justify-between text-[9px] text-[#c6c6cd]/60 font-mono font-bold py-2 border-r border-[#46464c]/20 pr-3 select-none h-full h-[200px]">
                    <span>45k ft-lbs</span>
                    <span>30k ft-lbs</span>
                    <span>15k ft-lbs</span>
                    <span>0 ft-lbs</span>
                  </div>

                  <div className="flex-1 flex items-end gap-2 px-2 h-[200px] bg-[#1b1b1d]/20 border-l border-b border-[#46464c]/30 rounded-bl relative pt-4 pb-1">
                    {/* 12 columns representing physical real-time telemetry elements */}
                    {telemetry.slice(-12).map((pt, idx) => {
                      const heightPct = Math.min((pt.torque_ftlbs / 45000) * 100, 100);
                      const isAnomaly = pt.is_anomaly;
                      
                      return (
                        <div key={idx} className="flex-1 flex flex-col justify-end h-full group relative">
                          <div 
                            className={`w-full rounded-t border-t transition-all duration-300 crt-flicker ${
                              isAnomaly 
                                ? 'bg-gradient-to-t from-[#93000a]/10 to-[#93000a]/60 border-[#ffb4ab] shadow-[0_0_8px_#ffb4ab]' 
                                : 'bg-gradient-to-t from-[#c0c6de]/5 to-[#c0c6de]/40 border-[#c0c6de]/50'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* BHA Assembly Visualizer */}
              <div className="glass-panel p-6 rounded-lg grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-mono text-[11px] font-bold text-[#c6c6cd] mb-6 tracking-widest uppercase">BHA ASSEMBLY 14A</h3>
                  <div className="space-y-4 font-mono text-[10px] font-bold">
                    <div className="border-l-2 border-[#c0c6de] pl-4">
                      <p className="opacity-60 text-[9px] text-[#c6c6cd]">MOTOR STATUS</p>
                      <p className="text-[#c0c6de]">
                        {currentPt?.bha_state ? currentPt.bha_state.toUpperCase() : 'OPERATIONAL - 14.5k hrs'}
                      </p>
                    </div>
                    <div className="border-l-2 border-[#e4bfaa] pl-4">
                      <p className="opacity-60 text-[9px] text-[#c6c6cd]">VIBRATION (AXIAL)</p>
                      <p className="text-[#e4bfaa] uppercase">
                        {vibrationG > 4.5 ? `DYSFUNCTION ${vibrationG.toFixed(1)}G` : `STABLE < ${vibrationG.toFixed(1)}G`}
                      </p>
                    </div>
                    <div className="border-l-2 border-slate-500 pl-4">
                      <p className="opacity-60 text-[9px] text-[#c6c6cd]">ORIENTATION</p>
                      <p className="text-[#e5e2e3]">{(currentPt?.toolface_deg || 342).toFixed(0)}° AZIMUTH</p>
                    </div>
                  </div>
                </div>

                {/* Animated SVG Schematic */}
                <div className="flex justify-center items-center h-48 bg-[#1b1b1d]/20 rounded border border-[#46464c]/10 p-2">
                  <svg className="h-full drop-shadow-[0_0_15px_rgba(192,198,222,0.3)]" viewBox="0 0 100 200" fill="none">
                    <defs>
                      <linearGradient id="bhaMetal" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="50%" stopColor="#64748b" />
                        <stop offset="100%" stopColor="#1e293b" />
                      </linearGradient>
                      <linearGradient id="bhaMotorActive" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#312e81" />
                        <stop offset="50%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#312e81" />
                      </linearGradient>
                    </defs>

                    {/* Drill pipe connections */}
                    <rect x="40" y="10" width="20" height="30" fill="url(#bhaMetal)" stroke="#c0c6de" strokeWidth="1" rx="0.5" />
                    <rect x="42" y="40" width="16" height="60" fill="url(#bhaMetal)" stroke="#c0c6de" strokeWidth="0.75" rx="0.5" />
                    
                    {/* Motor bent assembly (Glows inside Sliding steering mode) */}
                    {(() => {
                      const isSliding = currentPt?.bha_state?.includes("Sliding");
                      return (
                        <rect 
                          x="35" y="100" width="30" height="40" 
                          fill={isSliding ? "url(#bhaMotorActive)" : "none"} 
                          stroke="#c0c6de" strokeWidth="1" 
                          className={isSliding ? 'animate-pulse' : ''} 
                          rx="0.5"
                        />
                      );
                    })()}

                    {/* PDC drill bit (Rotates inside Rotating mode) */}
                    {(() => {
                      const isRotating = currentPt?.bha_state?.includes("Rotating") || (!currentPt?.bha_state && rpmVal > 0);
                      return (
                        <g className={isRotating ? 'animate-[spin_3s_linear_infinite]' : ''} style={{ transformOrigin: "50px 160px" }}>
                          <path d="M40 140 L30 180 L70 180 L60 140 Z" fill="#c0c6de" opacity="0.4" stroke="#c0c6de" strokeWidth="1" />
                          <circle cx="50" cy="180" fill="#e4bfaa" r="8" className="radar-pulse" />
                        </g>
                      );
                    })()}
                  </svg>
                </div>
              </div>

            </div>

            {/* Right 4-column Panel (AI Threat Index, Recommendations, and Geology Map) */}
            <div className="col-span-12 xl:col-span-4 space-y-6 flex flex-col justify-between">
              
              {/* Threat Index circular gauge */}
              <div className="glass-panel p-6 flex flex-col items-center rounded-lg">
                <h3 className="font-mono text-[11px] font-bold text-[#c0c6de] mb-6 w-full text-center tracking-widest uppercase">AI THREAT INDEX</h3>
                <div className="relative w-44 h-44 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="45" stroke="#353436" strokeWidth="8"></circle>
                    <circle 
                      className="transition-all duration-700" 
                      cx="50" cy="50" fill="none" r="45" 
                      stroke={threatIndex > 30 ? "#ffb4ab" : "#c0c6de"} 
                      strokeDasharray="282.7" 
                      strokeDashoffset={282.7 - (282.7 * Math.min(threatIndex, 100)) / 100} 
                      strokeWidth="8"
                      strokeLinecap="round"
                    ></circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
                    <span className="text-3xl text-[#c0c6de] font-bold">{threatIndex.toFixed(0)}%</span>
                    <span className={`text-[9px] tracking-widest mt-1 font-bold ${threatIndex > 30 ? 'text-[#ffb4ab]' : 'text-[#c6c6cd]'}`}>
                      {threatIndex > 45 ? 'HIGH RISK' : threatIndex > 25 ? 'MODERATE RISK' : 'LOW RISK'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 w-full space-y-2 font-mono text-[10px] font-bold border-t border-[#46464c]/10 pt-4">
                  <div className="flex justify-between">
                    <span>CHANCE OF KICK</span>
                    <span className="text-[#bec6e0]">{(threatIndex * 0.15).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>TOOL STICK SLIP</span>
                    <span className={threatIndex > 30 ? 'text-[#ffb4ab]' : 'text-[#e4bfaa]'}>
                      {threatIndex > 45 ? 'SEVERE' : threatIndex > 25 ? 'MODERATE' : 'STABLE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI recommendations */}
              <div className="glass-panel p-6 rounded-lg flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-4 border-b border-[#46464c]/20 pb-3">
                  <span className="material-symbols-outlined text-[#c0c6de]" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  <h3 className="font-mono text-[11px] font-bold text-[#c0c6de] uppercase tracking-widest">AI Recommendations</h3>
                </div>

                {currentPt?.is_anomaly ? (
                  <div className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="bg-[#93000a]/10 p-4 border-l-4 border-[#ffb4ab] rounded-r">
                      <p className="font-mono text-[10px] text-[#ffb4ab] mb-1 font-bold uppercase tracking-wider">FORMATION DYSFUNCTION TRIGGERED</p>
                      <p className="text-xs text-slate-300 leading-normal font-sans font-medium">{currentPt.recommended_solution}</p>
                    </div>

                    <button 
                      onClick={() => onFeedbackSubmit('correct')}
                      className="w-full bg-[#ffb4ab] text-[#690005] font-extrabold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <span>EXECUTE OPTIMIZATION</span>
                      <span className="material-symbols-outlined text-xs font-bold">arrow_forward</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-[#020617]/20 p-4 border-l-4 border-[#c0c6de] rounded-r">
                      <p className="font-mono text-[10px] text-[#c0c6de] mb-1 font-bold uppercase tracking-wider">TRANSITION ADVICE</p>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">Maintain active rotary setpoint parameters. Safe operating envelope is physically balanced.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Geology Map Card */}
              <div className="glass-panel overflow-hidden rounded-lg">
                <img 
                  className="w-full h-40 object-cover opacity-60 hover:opacity-90 transition-all duration-500" 
                  alt="Scientific visualization of deep earth geological layers" 
                  src="/images/geological_cross_section.png"
                />
                <div className="p-4 bg-[#201f21]/60 backdrop-blur-md border-t border-[#46464c]/20">
                  <p className="font-mono text-[11px] font-bold text-[#c0c6de] uppercase tracking-widest">CURRENT FORMATION: BASALT STRATA</p>
                  <p className="text-[10px] text-[#c6c6cd] font-medium mt-0.5 leading-normal">Estimated thickness: 450m | Porosity: 12%</p>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* =====================================================================
                              ACTIVE TAB: TRAJECTORY
           ===================================================================== */}
        {activeTab === 'TRAJECTORY' && (
          <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 animate-fade-in">
            <div className="col-span-12 xl:col-span-8 glass-panel p-6 rounded-lg flex flex-col h-full min-h-[420px]">
              <h3 className="font-mono text-[11px] font-bold text-[#c0c6de] tracking-widest mb-6">WELLBORE TRAJECTORY (TVD VS DEPARTURE)</h3>
              
              <div className="flex-1 flex space-x-4">
                <div className="flex flex-col justify-between text-[9px] text-[#c6c6cd]/50 font-mono font-bold py-4 border-r border-[#46464c]/20 pr-3 select-none h-full min-h-[280px]">
                  <span>0 ft (Surface)</span>
                  <span>4,000 ft</span>
                  <span>8,000 ft</span>
                  <span>12,500 ft (TD)</span>
                </div>

                <div className="flex-1 flex flex-col h-full">
                  <div className="flex-1 bg-slate-950/40 rounded-lg border border-[#46464c]/20 relative flex items-center justify-center p-8 h-[280px]">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M 10,0 C 10,40 50,60 90,90" fill="none" stroke="rgba(192, 198, 222, 0.2)" strokeWidth="1.2" strokeDasharray="3,3" />
                      {(() => {
                        const depthPct = Math.min(currentDepth / 12500, 1);
                        const y = depthPct * 90;
                        const actualX = 10 + Math.pow(depthPct, 1.5) * 80 + (currentDepth > 4000 ? Math.sin(currentDepth / 500) * 4 : 0);
                        return (
                          <>
                            <path d={`M 10,0 Q 10,${y/2} ${actualX},${y}`} fill="none" stroke="#e4bfaa" strokeWidth="2" />
                            <circle cx={actualX} cy={y} r="2" fill="none" stroke="#e4bfaa" strokeWidth="0.5" opacity="0.8">
                              <animate attributeName="r" values="2;12" dur="2s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                            </circle>
                            <circle cx={actualX} cy={y} r="2.2" fill="#e4bfaa" className="shadow-[0_0_12px_rgba(228,191,170,0.6)]" />
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-[#c6c6cd]/50 font-mono font-bold pt-2 px-1 select-none">
                    <span>0 ft (Vertical)</span>
                    <span>2,000 ft Departure</span>
                    <span>4,000 ft Departure</span>
                    <span>6,000 ft Departure (Target)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-12 xl:col-span-4 glass-panel p-6 rounded-lg flex flex-col justify-between">
              <div>
                <h3 className="font-mono text-[11px] font-bold text-[#c0c6de] tracking-widest mb-4">RSS STEERING AGENT</h3>
                <div className="p-4 bg-teal-950/10 border border-teal-500/20 rounded mb-6">
                  <p className="font-mono text-[11px] text-teal-400 font-bold mb-1 uppercase">Target Status: On Path</p>
                  <p className="text-xs text-slate-400 leading-normal">Continuous closed-loop guidance system active. Trajectory drift is strictly within the 2.5ft tolerance limit.</p>
                </div>

                <div className="space-y-4 font-mono text-[10px] font-bold">
                  <div className="border-l-2 border-[#c0c6de] pl-4">
                    <p className="opacity-60 text-[9px] text-[#c6c6cd]">Azimuth Setpoint</p>
                    <p className="text-[#c0c6de]">342° North</p>
                  </div>
                  <div className="border-l-2 border-[#e4bfaa] pl-4">
                    <p className="opacity-60 text-[9px] text-[#c6c6cd]">Build Rate</p>
                    <p className="text-[#e4bfaa]">2.4° / 100 ft</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
                              ACTIVE TAB: BHA CONTROL
           ===================================================================== */}
        {activeTab === 'BHA CONTROL' && (
          <div className="glass-panel p-8 rounded-lg flex flex-col gap-6 animate-fade-in font-mono text-xs font-bold text-[#c6c6cd] pb-8">
            <h3 className="text-sm font-bold text-[#c0c6de] uppercase tracking-widest mb-2">BHA Sub-System Diagnostic Deck</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 bg-[#0e0e0f] border border-[#46464c]/20 rounded-lg">
                <p className="opacity-60 text-[10px] mb-2">PDC Bit Wear Indicator</p>
                <p className="text-[#c0c6de] text-lg">94.2% Health</p>
              </div>
              <div className="p-5 bg-[#0e0e0f] border border-[#46464c]/20 rounded-lg">
                <p className="opacity-60 text-[10px] mb-2">Downhole Mud Motor Stall Margin</p>
                <p className="text-[#e4bfaa] text-lg">82% Clear</p>
              </div>
              <div className="p-5 bg-[#0e0e0f] border border-[#46464c]/20 rounded-lg">
                <p className="opacity-60 text-[10px] mb-2">Wireless MWD Pressure Pulse Amplitude</p>
                <p className="text-teal-400 text-lg">Normal (14.2 psi)</p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* =====================================================================
                             SHIFT REPORT MODAL
         ===================================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 no-print">
          <div className="glass-panel max-w-2xl w-full p-8 border border-primary/30 rounded-lg relative overflow-hidden shadow-2xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            
            <div className="border-b border-[#46464c]/30 pb-6 mb-6">
              <p className="font-mono text-primary tracking-[0.3em] mb-2 text-xs font-bold text-[#c0c6de]">OFFICIAL SHIFT DOCUMENTATION</p>
              <h2 className="text-3xl font-black text-[#e5e2e3] font-mono">OPERATIONAL REPORT #2944</h2>
              <div className="flex justify-between mt-4 font-mono text-[9px] text-[#c6c6cd]/60 font-bold uppercase tracking-wider">
                <span>DATE: {new Date().toLocaleDateString()}</span>
                <span>OPERATOR: AYODEJI ERIOLUWA</span>
                <span>SECURITY: CLEARANCE LEVEL 4</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-8 font-mono">
                <div>
                  <h4 className="text-xs text-primary mb-3 uppercase tracking-widest font-bold text-[#c0c6de]">SUMMARY METRICS</h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between border-b border-[#46464c]/10 pb-1">
                      <span className="text-[#c6c6cd] font-bold">Total Progress</span>
                      <span className="text-slate-100 font-bold">{currentDepth.toFixed(1)} m</span>
                    </div>
                    <div className="flex justify-between border-b border-[#46464c]/10 pb-1">
                      <span className="text-[#c6c6cd] font-bold">Avg ROP</span>
                      <span className="text-slate-100 font-bold">
                        {(telemetry.reduce((acc, val) => acc + val.rop_fph, 0) / Math.max(telemetry.length, 1)).toFixed(1)} m/hr
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-[#46464c]/10 pb-1">
                      <span className="text-[#c6c6cd] font-bold">Non-Productive Time</span>
                      <span className="text-red-400 font-bold">
                        {alertLogs.length > 0 ? `${(alertLogs.length * 0.4).toFixed(1)}m` : '0.0m'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs text-primary mb-3 uppercase tracking-widest font-bold text-[#c0c6de]">CRITICAL EVENTS</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2 pr-2 text-[10px] font-bold">
                    {alertLogs.length === 0 ? (
                      <p className="text-[9px] text-[#c6c6cd] italic">No critical downhole vibrational or hydraulic events logged during this shift.</p>
                    ) : (
                      alertLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-[10px] bg-[#131315] border border-[#46464c]/20 p-2 rounded">
                          <span className={log.type === "Predictive Alert" ? "text-[#e4bfaa] shrink-0" : "text-[#ffb4ab] shrink-0"}>●</span>
                          <span className="text-[#e5e2e3] leading-normal font-medium">{log.timestamp} - {log.type}: {log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Handover comments input */}
              <div className="bg-[#c0c6de]/5 p-4 rounded border border-[#c0c6de]/10 font-mono">
                <p className="text-[10px] text-[#c0c6de] mb-2 uppercase tracking-widest font-bold">OPERATOR HANDOVER NOTES</p>
                <textarea 
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-xs h-24 p-0 placeholder-slate-600 text-[#e5e2e3]" 
                  placeholder="Enter secure well handover instructions, motor tool status, or formation anomalies here..."
                ></textarea>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t border-[#46464c]/25 pt-6 font-mono text-[10px] font-bold">
              <button 
                onClick={() => {
                  setShowReportModal(false);
                  playRadarBeep(600, 0.1, "sine");
                }}
                className="px-6 py-2.5 hover:bg-[#353436]/20 rounded tracking-wider uppercase"
              >
                CANCEL
              </button>
              <button 
                onClick={() => {
                  setShowReportModal(false);
                  playRadarBeep(1400, 0.2, "sine");
                }}
                className="px-8 py-2.5 bg-[#c0c6de] text-[#2a3043] font-black uppercase rounded shadow-lg shadow-[#c0c6de]/10 tracking-widest"
              >
                AUTHORIZE & SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. HUD OVERLAY ICONS (Bottom Right HUD overlays) */}
      <div className="fixed bottom-8 right-8 z-50 flex gap-4 no-print">
        <div className="glass-panel w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:bg-[#c0c6de]/20 hover:text-[#c0c6de] transition-all">
          <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
        </div>
        <div 
          onClick={() => { setChaosMode(prev => !prev); playRadarBeep(1200, 0.1, "triangle"); }}
          className="glass-panel w-12 h-12 rounded-full flex items-center justify-center cursor-pointer border-[#ffb4ab]/50 text-[#ffb4ab] hover:bg-[#ffb4ab]/25 transition-all emergency-glow animate-pulse"
        >
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
        </div>
      </div>

    </div>
  );
}
