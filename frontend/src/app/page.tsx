"use client";

import React, { useState, useEffect, useRef } from 'react';

// Components defined outside to ensure stable rendering
const RigTelemetry = ({ telemetry }: { telemetry: any[] }) => {
  const currentPt = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const risk = currentPt?.forecast_risk || 12;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-8">
      {/* Physics Gauges */}
      <div className="col-span-1 lg:col-span-2 flex flex-col space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center">
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Weight on Bit (WOB)</p>
            <p className="text-2xl font-mono font-bold text-slate-100">{currentPt?.wob_klbs.toFixed(1)} <span className="text-sm text-slate-500">klbs</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className={`absolute bottom-0 left-0 w-full h-1 ${currentPt?.rpm && currentPt.rpm < 80 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Rotary Speed</p>
            <p className={`text-2xl font-mono font-bold ${currentPt?.rpm && currentPt.rpm < 80 ? 'text-red-400' : 'text-slate-100'}`}>{currentPt?.rpm.toFixed(0)} <span className="text-sm text-slate-500">RPM</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className={`absolute bottom-0 left-0 w-full h-1 ${currentPt?.rop_fph && currentPt.rop_fph < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Rate of Penetration</p>
            <p className="text-2xl font-mono font-bold text-slate-100">{currentPt?.rop_fph.toFixed(0)} <span className="text-sm text-slate-500">ft/hr</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center">
            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Standpipe Pressure</p>
            <p className={`text-2xl font-mono font-bold ${currentPt?.spp_psi && currentPt.spp_psi < 2400 ? 'text-red-400' : 'text-slate-100'}`}>{currentPt?.spp_psi.toFixed(0)} <span className="text-sm text-slate-500">PSI</span></p>
          </div>
        </div>

        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-100">Live Torsional Dynamics</h3>
            {currentPt?.is_anomaly ? (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse">DYSFUNCTION DETECTED</span>
            ) : risk > 30 ? (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-xs font-bold shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse">STRESS BUILD-UP</span>
            ) : (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold">DYNAMICS STABLE</span>
            )}
          </div>
          <div className="flex-1 w-full relative border-l border-b border-slate-800 flex items-end justify-between px-2 pt-8 pb-2">
            {telemetry.map((pt, i) => (
              <div key={i} className="flex-1 mx-0.5 h-full relative flex flex-col justify-end">
                <div 
                  className={`w-full transition-all duration-300 rounded-t-sm ${pt.torque_ftlbs > 18000 ? 'bg-gradient-to-t from-red-600 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : pt.forecast_risk > 30 ? 'bg-gradient-to-t from-amber-500 to-orange-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-gradient-to-t from-emerald-600 to-teal-400'}`}
                  style={{ height: `${Math.min((pt.torque_ftlbs / 25000) * 100, 100)}%` }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="col-span-1 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2 flex items-center justify-between">
          <span>AI Co-Driller</span>
          <span className={`w-2 h-2 rounded-full ${risk > 70 ? 'bg-red-500 animate-ping' : risk > 30 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`}></span>
        </h3>

        {/* Live Prognostics Gauge */}
        <div className="flex flex-col items-center justify-center py-6 mb-6 bg-slate-950/40 rounded-2xl border border-slate-800/60 p-4 relative overflow-hidden">
          {/* Subtle background glow */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 blur-[40px] rounded-full opacity-10 transition-all duration-500 ${risk > 70 ? 'bg-red-500' : risk > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>

          <div className="relative w-36 h-36 flex items-center justify-center">
            {/* SVG circular track and gauge indicator */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="72" cy="72" r="60" stroke="#1e293b" strokeWidth="8" fill="none" className="translate-x-[-1px] translate-y-[-1px]" />
              <circle 
                cx="72" 
                cy="72" 
                r="60" 
                stroke={risk > 70 ? "#ef4444" : risk > 30 ? "#f59e0b" : "#10b981"} 
                strokeWidth="8" 
                fill="none" 
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - risk / 100)}`}
                className="transition-all duration-500 ease-out translate-x-[-1px] translate-y-[-1px]"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center text-center">
              <span className="text-3xl font-mono font-extrabold text-slate-100">{risk.toFixed(0)}%</span>
              <span className="text-[10px] tracking-widest uppercase text-slate-500 font-semibold mt-0.5">Threat Index</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center font-bold">
            {risk > 70 ? "CRITICAL RISK OF DYSFUNCTION" : risk > 30 ? "CAUTION: STRESS BUILD-UP DETECTED" : "NOMINAL OPERATION"}
          </p>
        </div>

        {/* Action Panel */}
        <div className="flex-1 flex flex-col justify-between">
          {currentPt?.is_anomaly ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <div className="flex items-center space-x-2 text-red-400 font-bold mb-2 uppercase text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>{currentPt.anomaly_type}</span>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">{currentPt.recommended_solution}</p>
              <button className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 py-3 rounded-xl font-bold shadow-lg text-white text-xs tracking-wider uppercase transition-all">Execute Emergency Override</button>
            </div>
          ) : risk > 30 ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <div className="flex items-center space-x-2 text-amber-400 font-bold mb-2 uppercase text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>PREDICTIVE MITIGATION</span>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">{currentPt?.proactive_alert || "Warning: Torsional dynamics approaching instability."}</p>
              <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 py-3 rounded-xl font-extrabold shadow-lg text-xs tracking-wider uppercase transition-all">Auto-Throttle Parameters</button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 opacity-60 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-3">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h4 className="text-sm font-bold text-slate-200 mb-1">Dynamics Stable</h4>
              <p className="text-xs text-slate-500 max-w-[200px]">Drillstring operating perfectly within safe stress parameters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TrajectoryOptimization = ({ currentDepth }: { currentDepth: number }) => {
  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        <div className="col-span-1 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg min-h-[400px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-100 mb-4">Wellbore Trajectory (TVD vs Departure)</h3>
          <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 relative flex items-center justify-center p-8">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 10,0 C 10,40 50,60 90,90" fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" strokeDasharray="2,2" />
              {(() => {
                const depthPct = Math.min(currentDepth / 12500, 1);
                const y = depthPct * 90;
                const actualX = 10 + Math.pow(depthPct, 1.5) * 80 + (currentDepth > 4000 ? Math.sin(currentDepth / 500) * 5 : 0);
                return (
                  <>
                    <path d={`M 10,0 Q 10,${y/2} ${actualX},${y}`} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                    <circle cx={actualX} cy={y} r="2" fill="#f59e0b" />
                  </>
                );
              })()}
            </svg>
          </div>
        </div>
        <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-bold text-slate-100 mb-4">RSS Steering Agent</h3>
          <div className="p-4 bg-teal-900/10 border border-teal-500/20 rounded">
            <p className="text-teal-400 font-bold mb-2">Target Status: On Path</p>
            <p className="text-xs text-slate-400">Continuous 3D optimization active. Lateral deviation within 2.5ft tolerance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const BHAControl = ({ currentDepth }: { currentDepth: number }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center">
        <h3 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest">BHA Schematic</h3>
        <div className="w-12 h-64 bg-slate-800 border-2 border-slate-700 rounded relative">
           <div className="absolute bottom-0 w-full h-10 bg-amber-600 rounded-b"></div>
        </div>
      </div>
      <div className="col-span-1 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-100 mb-4">Tool Health Diagnostics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="p-4 bg-slate-950 border border-slate-800 rounded">
              <p className="text-xs text-slate-500 mb-1">MWD Internal Temp</p>
              <p className="text-2xl font-mono text-slate-200">{(80 + (currentDepth / 80)).toFixed(1)} °C</p>
           </div>
           <div className="p-4 bg-slate-950 border border-slate-800 rounded">
              <p className="text-xs text-slate-500 mb-1">Lateral Vibration</p>
              <p className="text-2xl font-mono text-slate-200">2.4 G</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Rig Telemetry');
  const [currentDepth, setCurrentDepth] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const depthRef = useRef(0);
  const offsetRef = useRef(0);

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
      window.parent.postMessage({ type: 'REQUEST_SSO_SESSION' }, '*');
      
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  // Robust Tab Switching via Hash
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'trajectory') setActiveTab('Trajectory Optimization');
      else if (hash === 'bha') setActiveTab('BHA Control');
      else setActiveTab('Rig Telemetry');
      console.log('Tab switched to:', hash || 'rig');
    };
    window.addEventListener('hashchange', handleHash);
    if (window.location.hash) handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8006/api/drilling/processed_telemetry?offset=${offsetRef.current}&limit=30`);
        const result = await response.json();
        if (result && result.data) {
          setTelemetry(result.data.map((pt: any) => ({
            ...pt,
            timestamp: new Date(pt.timestamp).toLocaleTimeString()
          })));
          offsetRef.current = (offsetRef.current + 30) % 1000;
        }
      } catch (e) {
        console.error("Telemetry error:", e);
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      depthRef.current += 1.2;
      setCurrentDepth(depthRef.current);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen w-full bg-slate-950 items-center justify-center text-slate-400 font-mono text-xs tracking-widest">
         <div className="w-10 h-10 border-2 border-slate-800 border-t-amber-500 rounded-full animate-spin mb-4"></div>
         SYNCHRONIZING SECURE NODE IDENTITY...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-300 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col relative z-[100]">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-400">OMESHAM AI</h1>
          <p className="text-[10px] tracking-widest uppercase text-slate-500 mt-1">Drilling Command Center</p>
        </div>
        <nav className="flex-1 p-4 space-y-4" style={{ position: 'relative', zIndex: 1001 }}>
          {[
            { id: '', label: 'Rig Telemetry' },
            { id: 'trajectory', label: 'Trajectory Optimization' },
            { id: 'bha', label: 'BHA Control' }
          ].map(tab => (
            <button 
              key={tab.label}
              id={`tab-${tab.id || 'rig'}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Omesham: Forced Switch to", tab.label);
                setActiveTab(tab.label);
                window.location.hash = tab.id || 'rig';
              }}
              style={{ 
                cursor: 'pointer', 
                pointerEvents: 'auto', 
                display: 'block',
                width: '100%',
                position: 'relative',
                zIndex: 2000
              }}
              className={`text-left px-4 py-4 rounded-xl transition-all font-bold ${activeTab === tab.label ? 'bg-amber-500 text-slate-900 shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'text-slate-400 hover:bg-slate-800 border border-slate-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
           <h2 className="text-xl font-bold text-slate-100">{activeTab}</h2>
           <div className="text-right">
              <p className="text-xs text-slate-500 uppercase">Current Depth</p>
              <p className="text-lg font-mono font-bold text-amber-400">{currentDepth.toFixed(1)} ft</p>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative h-full">
          {/* Using display: none for more reliable iframe behavior */}
          <div style={{ display: activeTab === 'Rig Telemetry' ? 'block' : 'none' }} className="h-full">
            <RigTelemetry telemetry={telemetry} />
          </div>
          <div style={{ display: activeTab === 'Trajectory Optimization' ? 'block' : 'none' }} className="h-full">
            <TrajectoryOptimization currentDepth={currentDepth} />
          </div>
          <div style={{ display: activeTab === 'BHA Control' ? 'block' : 'none' }} className="h-full">
            <BHAControl currentDepth={currentDepth} />
          </div>
        </main>
      </div>
    </div>
  );
}
