"use client";

import { useEffect, useState } from 'react';

type DrillingTelemetry = {
  timestamp: string;
  wob_klbs: number;
  rpm: number;
  rop_fph: number;
  spp_psi: number;
  torque_ftlbs: number;
  is_anomaly: boolean;
  anomaly_type: string;
  recommended_solution: string;
};

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<DrillingTelemetry[]>([]);
  const [offset, setOffset] = useState(0);
  const [activeRig, setActiveRig] = useState('Rig-01 (Deepwater)');
  const [isLoading, setIsLoading] = useState(true);
  const [currentDepth, setCurrentDepth] = useState(0);
  const [activeTab, setActiveTab] = useState('Rig Telemetry');

  useEffect(() => {
    const fetchTelemetry = async () => {
      try {
        const response = await fetch(`http://localhost:8006/api/drilling/processed_telemetry?offset=${offset}&limit=30`);
        const result = await response.json();
        
        if (result && result.data) {
          const formattedData = result.data.map((pt: any) => ({
            timestamp: new Date(pt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            wob_klbs: pt.wob_klbs,
            rpm: pt.rpm,
            rop_fph: pt.rop_fph,
            spp_psi: pt.spp_psi,
            torque_ftlbs: pt.torque_ftlbs,
            is_anomaly: pt.is_anomaly,
            anomaly_type: pt.anomaly_type,
            recommended_solution: pt.recommended_solution,
          }));
          setTelemetry(formattedData);
          setOffset(prev => (prev + 30) % (result.total_records || 1000));
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch drilling telemetry:", error);
      }
    };

    fetchTelemetry();
    
    // Simulate high-frequency data stream (1 second intervals)
    const interval = setInterval(() => {
      fetchTelemetry();
    }, 1000);
    return () => clearInterval(interval);
  }, [offset]);

  useEffect(() => {
    // Independent interval for depth progression so it doesn't get reset by data fetching
    const depthInterval = setInterval(() => {
      setCurrentDepth(prev => prev + 8.5);
    }, 1000);
    return () => clearInterval(depthInterval);
  }, []);

  const currentPt = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-300 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col relative z-20 shadow-2xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-400 mb-1 tracking-tight drop-shadow-sm">OMESHAM AI</h1>
          <p className="text-xs font-medium text-amber-500/80 tracking-widest uppercase">Drill AI Command Center</p>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('Rig Telemetry')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center ${activeTab === 'Rig Telemetry' ? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            Rig Telemetry
          </button>
          <button 
            onClick={() => setActiveTab('Trajectory Optimization')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center ${activeTab === 'Trajectory Optimization' ? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            Trajectory Optimization
          </button>
          <button 
            onClick={() => setActiveTab('BHA Control')}
            className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center ${activeTab === 'BHA Control' ? 'bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
            BHA Control
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></div>
            <span className="text-xs text-slate-400">ML Engine: Online</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        
        {/* Top Header */}
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md px-8 flex items-center justify-between z-10">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-slate-100 flex items-center">
              Active Asset:
            </h2>
            <select 
              value={activeRig} 
              onChange={(e) => setActiveRig(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-amber-400 font-bold text-lg rounded px-4 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer shadow-inner"
            >
              <option value="Rig-01 (Deepwater)">Rig-01 (Deepwater)</option>
              <option value="Rig-02 (Onshore)">Rig-02 (Onshore)</option>
            </select>
          </div>
          
          <div className="flex space-x-6 items-center">
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Current Depth</p>
              <p className="text-xl font-mono font-bold text-slate-200">{currentDepth.toFixed(1)} <span className="text-sm text-slate-500">ft</span></p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Target TVD</p>
              <p className="text-xl font-mono font-bold text-slate-200">12,500 <span className="text-sm text-slate-500">ft</span></p>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 z-10 relative">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500 mb-4"></div>
              <p className="text-slate-400 animate-pulse">Establishing secure link to rig telemetry...</p>
            </div>
          ) : activeTab === 'Rig Telemetry' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-8 animate-in fade-in duration-300">
              
              {/* Physics Gauges */}
              <div className="col-span-1 lg:col-span-2 flex flex-col space-y-6">
                
                {/* Critical Parameters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Weight on Bit (WOB)</p>
                    <p className="text-2xl font-mono font-bold text-slate-100">{currentPt?.wob_klbs.toFixed(1)} <span className="text-sm text-slate-500">klbs</span></p>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
                    <div className={`absolute bottom-0 left-0 w-full h-1 ${currentPt?.rpm && currentPt.rpm < 80 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
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

                {/* Primary Telemetry Stream */}
                <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col min-h-[350px]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-100">Live Torsional Dynamics</h3>
                    {currentPt?.is_anomaly ? (
                      <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.3)]">
                        DYSFUNCTION DETECTED
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-bold">
                        DYNAMICS STABLE
                      </span>
                    )}
                  </div>
                  
                  {/* Streaming Chart Mockup */}
                  <div className="flex-1 w-full relative border-l border-b border-slate-800 flex items-end justify-between px-2 pt-8 pb-2">
                    {/* Y-Axis Labels */}
                    <div className="absolute -left-12 top-0 h-full flex flex-col justify-between text-xs text-slate-500 py-2">
                      <span>25k</span>
                      <span>20k</span>
                      <span>15k</span>
                      <span>10k</span>
                    </div>
                    
                    {telemetry.map((pt, i) => {
                      const isHighTorque = pt.torque_ftlbs > 18000;
                      return (
                        <div key={i} className="flex flex-col items-center justify-end group cursor-crosshair flex-1 mx-0.5 h-full relative">
                          {pt.is_anomaly && <div className="absolute top-0 w-full h-full bg-red-500/10 rounded-sm"></div>}
                          <div 
                            className={`w-full transition-all duration-300 rounded-t-sm relative ${isHighTorque ? 'bg-gradient-to-t from-red-600 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-gradient-to-t from-amber-600 to-orange-400'}`}
                            style={{ height: `${Math.min((pt.torque_ftlbs / 25000) * 100, 100)}%` }}
                          ></div>
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block w-40 bg-slate-800 border border-slate-700 text-xs rounded p-2 z-30 shadow-xl pointer-events-none">
                              <p className={`font-bold ${pt.is_anomaly ? 'text-red-400' : 'text-amber-400'}`}>Torque: {pt.torque_ftlbs.toFixed(0)}</p>
                              <p>RPM: {pt.rpm.toFixed(0)}</p>
                              <p className="text-[10px] text-slate-500 mt-1">{pt.timestamp}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-slate-500 px-2">
                    <span>T-30s</span>
                    <span>T-15s</span>
                    <span>Live</span>
                  </div>
                </div>
              </div>

              {/* Agentic Driller Panel */}
              <div className="col-span-1 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-lg relative overflow-hidden">
                <div className="p-6 border-b border-slate-800 relative z-10 bg-slate-900/90 backdrop-blur-sm flex justify-between items-center">
                  <h3 className="text-xl font-bold text-slate-100 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    AI Co-Driller
                  </h3>
                  <div className="w-3 h-3 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto space-y-4 text-sm relative z-10 bg-slate-900">
                  {currentPt?.is_anomaly ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="p-5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-100 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)] relative overflow-hidden">
                        
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/20 blur-2xl rounded-full"></div>

                        <div className="flex items-center mb-3">
                          <svg className="w-6 h-6 mr-2 text-red-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                          <strong className="text-red-400 text-lg uppercase tracking-wider">{currentPt.anomaly_type}</strong>
                        </div>
                        
                        <div className="mb-4 bg-slate-950/50 p-3 rounded border border-red-500/20 text-xs font-mono">
                          <span className="text-slate-400 block mb-2 font-sans text-xs">TRIGGER TELEMETRY:</span>
                          <div className="grid grid-cols-2 gap-2">
                            <span className="text-amber-400">Torque: {currentPt.torque_ftlbs.toFixed(0)}</span>
                            <span className="text-red-400">RPM: {currentPt.rpm.toFixed(0)}</span>
                            <span className="text-amber-400">SPP: {currentPt.spp_psi.toFixed(0)}</span>
                            <span className="text-red-400">ROP: {currentPt.rop_fph.toFixed(0)}</span>
                          </div>
                        </div>

                        <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-500/30 mt-4 relative overflow-hidden">
                          <div className="absolute left-0 top-0 w-1 h-full bg-amber-500"></div>
                          <span className="text-amber-400 font-bold block mb-2 text-xs uppercase tracking-widest flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            Autonomous Command
                          </span>
                          <p className="text-amber-100 font-medium text-base mb-4">"{currentPt.recommended_solution}"</p>
                          
                          <button className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(217,119,6,0.4)] transition-all flex items-center justify-center border border-amber-400 hover:scale-[1.02] active:scale-[0.98]">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Execute via Auto-Driller
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 h-full flex flex-col justify-center items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <strong className="block text-emerald-400 text-xl tracking-wider uppercase mb-2">Dynamics Stable</strong>
                      <p className="text-emerald-200/70">Drill string vibration is within safe operating envelopes. ROP is optimized.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'Trajectory Optimization' ? (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                
                {/* 3D Directional Plot */}
                <div className="col-span-1 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                  <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-lg font-bold text-slate-100 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                      Wellbore Trajectory (TVD vs Departure)
                    </h3>
                    <div className="flex space-x-4">
                      <div className="flex items-center text-xs text-slate-400"><span className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500 mr-2"></span> Planned Path</div>
                      <div className="flex items-center text-xs text-slate-400"><span className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500 mr-2"></span> Actual Path</div>
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full bg-slate-950/50 rounded-lg border border-slate-800 relative shadow-inner overflow-hidden flex items-center justify-center p-8">
                    {/* Y-Axis Label */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-slate-600 font-bold tracking-widest uppercase">True Vertical Depth (ft)</div>
                    {/* X-Axis Label */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-slate-600 font-bold tracking-widest uppercase">Horizontal Departure (ft)</div>
                    
                    {/* Grid Lines */}
                    <div className="absolute inset-4 border-l border-t border-slate-800 opacity-50 pointer-events-none grid grid-cols-5 grid-rows-5">
                      {[...Array(25)].map((_, i) => <div key={i} className="border-r border-b border-slate-800"></div>)}
                    </div>

                    {/* SVG Trajectory Graph */}
                    <svg className="w-full h-full relative z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {/* Planned Path (Smooth curve) */}
                      <path d="M 10,0 C 10,40 50,60 90,90" fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" strokeDasharray="2,2" />
                      
                      {/* Dynamic Actual Path (calculated via current depth) */}
                      {/* Math: Convert depth to percentage. Max depth = 12500 */}
                      {(() => {
                        const depthPct = Math.min(currentDepth / 12500, 1);
                        // parametric curve for planned: x = 10 -> 90, y = 0 -> 90
                        const y = depthPct * 90;
                        const x = 10 + Math.pow(depthPct, 1.5) * 80;
                        
                        // Drift calculation (if depth > 4000, add drift)
                        const drift = currentDepth > 4000 ? Math.sin(currentDepth / 500) * 5 : 0;
                        const actualX = x + drift;

                        return (
                          <>
                            <path d={`M 10,0 Q 10,${y/2} ${actualX},${y}`} fill="none" stroke="rgba(245, 158, 11, 0.8)" strokeWidth="1.5" />
                            
                            {/* Drill Bit Head */}
                            <circle cx={actualX} cy={y} r="1.5" fill="#f59e0b" className="animate-pulse shadow-[0_0_10px_#f59e0b]" />
                            <circle cx={actualX} cy={y} r="3" fill="none" stroke="#f59e0b" strokeWidth="0.5" className="animate-ping" />
                            
                            {/* Deviation Alert Line if drifting */}
                            {Math.abs(drift) > 3 && (
                              <line x1={x} y1={y} x2={actualX} y2={y} stroke="#ef4444" strokeWidth="0.5" strokeDasharray="1,1" />
                            )}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                </div>

                {/* RSS Agentic Panel */}
                <div className="col-span-1 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="p-6 border-b border-slate-800 relative z-10 bg-slate-900/90 backdrop-blur-sm flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-100 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                      RSS Steering Agent
                    </h3>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto space-y-6 text-sm relative z-10 bg-slate-900">
                    {currentDepth > 4000 && Math.abs(Math.sin(currentDepth / 500) * 5) > 3 ? (
                      <div className="animate-in fade-in duration-500">
                        <div className="p-5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-100 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]">
                          <strong className="block text-red-400 text-lg uppercase tracking-wider mb-2">Deviation Detected</strong>
                          <p className="text-slate-300 mb-4">The drill bit has deviated from the planned trajectory due to high rock unconfined compressive strength (UCS).</p>
                          
                          <div className="bg-slate-950/50 p-3 rounded border border-red-500/20 text-xs font-mono mb-4">
                            <span className="text-red-400 block mb-1">Actual Departure: 4,120 ft</span>
                            <span className="text-emerald-400 block mb-1">Planned Departure: 4,050 ft</span>
                            <span className="text-amber-400">Deviation: +70 ft (East)</span>
                          </div>

                          <div className="bg-teal-900/20 p-4 rounded-lg border border-teal-500/30">
                            <span className="text-teal-400 font-bold block mb-2 text-xs uppercase tracking-widest">Calculated Correction</span>
                            <p className="text-teal-100 font-medium mb-4">"Downlink transmission: Engage push-the-bit RSS pads. Steer 2.4 degrees azimuth 270 (West) to return to planned path."</p>
                            
                            <button className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(20,184,166,0.4)] transition-all">
                              Transmit Downhole Command
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 h-full flex flex-col justify-center items-center text-center min-h-[300px]">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/40">
                          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <strong className="block text-emerald-400 text-xl tracking-wider uppercase mb-2">On Trajectory</strong>
                        <p className="text-emerald-200/70">The drill bit is perfectly aligned with the target 3D wellbore trajectory. No steering corrections required.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : activeTab === 'BHA Control' ? (
            <div className="flex flex-col h-full animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
                
                {/* Visual BHA Schematic */}
                <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg flex flex-col items-center relative overflow-hidden">
                  <h3 className="text-sm font-bold text-slate-100 mb-6 uppercase tracking-widest w-full text-center border-b border-slate-800 pb-4">
                    BHA Schematic
                  </h3>
                  
                  <div className="flex flex-col items-center w-full space-y-2 relative pt-4">
                    {/* Drill Pipe / Collars */}
                    <div className="w-12 h-24 bg-slate-700 border-2 border-slate-600 rounded-sm relative flex items-center justify-center group">
                      <div className="absolute left-16 w-32 text-xs text-slate-400 font-bold tracking-wider opacity-50 group-hover:opacity-100 transition-opacity">Heavy Weight Drill Pipe</div>
                      <div className="w-full h-1 bg-slate-800 absolute top-1/4"></div>
                      <div className="w-full h-1 bg-slate-800 absolute top-3/4"></div>
                    </div>
                    
                    {/* MWD/LWD Tools */}
                    <div className={`w-14 h-32 border-2 rounded-sm relative flex flex-col items-center justify-evenly group transition-colors ${currentDepth > 5600 ? 'bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-slate-700 border-emerald-500'}`}>
                      <div className="absolute right-20 w-32 text-xs text-slate-200 font-bold tracking-wider text-right opacity-80 group-hover:opacity-100">MWD / LWD Sensors</div>
                      <div className="w-8 h-2 bg-slate-800 rounded-full"></div>
                      <div className="w-8 h-2 bg-slate-800 rounded-full"></div>
                      <div className="w-8 h-2 bg-slate-800 rounded-full"></div>
                    </div>
                    
                    {/* Mud Motor */}
                    <div className="w-12 h-20 bg-slate-700 border-2 border-slate-600 rounded-sm relative flex items-center justify-center group">
                      <div className="absolute left-16 w-32 text-xs text-slate-400 font-bold tracking-wider opacity-50 group-hover:opacity-100 transition-opacity">PD Motor (7/8 Lobe)</div>
                      <svg className="w-8 h-8 text-slate-500 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                    
                    {/* RSS / Stabilizer */}
                    <div className="w-16 h-12 bg-slate-700 border-2 border-slate-600 rounded-sm relative flex items-center justify-between px-0.5 group">
                      <div className="absolute right-20 w-32 text-xs text-slate-400 font-bold tracking-wider text-right opacity-50 group-hover:opacity-100 transition-opacity">Rotary Steerable</div>
                      <div className="w-2 h-full bg-slate-500 rounded-sm"></div>
                      <div className="w-2 h-full bg-slate-500 rounded-sm"></div>
                    </div>
                    
                    {/* Drill Bit */}
                    <div className="w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-t-[40px] border-t-slate-500 relative mt-1 group">
                       <div className="absolute left-12 -top-6 w-32 text-xs text-amber-500 font-bold tracking-wider opacity-80 group-hover:opacity-100 transition-opacity">PDC Drill Bit</div>
                    </div>
                  </div>
                </div>

                {/* Tool Diagnostics */}
                <div className="col-span-1 lg:col-span-2 flex flex-col space-y-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg h-full flex flex-col">
                    <h3 className="text-lg font-bold text-slate-100 mb-6 flex items-center border-b border-slate-800 pb-4">
                      <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                      Tool Survivability Diagnostics
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                      {/* MWD Temp */}
                      {(() => {
                        const mwdTemp = 80 + (currentDepth / 80);
                        const isTempCritical = mwdTemp > 150;
                        return (
                          <div className={`p-5 rounded-lg border flex flex-col justify-center relative overflow-hidden transition-colors ${isTempCritical ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-950 border-slate-800'}`}>
                            {isTempCritical && <div className="absolute top-0 right-0 w-2 h-full bg-red-500 animate-pulse"></div>}
                            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">MWD Electronics Temp</p>
                            <p className={`text-4xl font-mono font-bold ${isTempCritical ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>{mwdTemp.toFixed(1)} <span className="text-lg text-slate-500">°C</span></p>
                            <div className="w-full bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
                              <div className={`h-full ${isTempCritical ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((mwdTemp / 175) * 100, 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 text-right">Limit: 150 °C</p>
                          </div>
                        );
                      })()}
                      
                      {/* Motor Diff Pressure */}
                      {(() => {
                        const diffPressure = 200 + Math.sin(currentDepth / 200) * 150;
                        const isStalling = diffPressure > 320;
                        return (
                          <div className={`p-5 rounded-lg border flex flex-col justify-center relative overflow-hidden transition-colors ${isStalling ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-950 border-slate-800'}`}>
                            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Motor Diff Pressure</p>
                            <p className={`text-4xl font-mono font-bold ${isStalling ? 'text-amber-400' : 'text-slate-100'}`}>{diffPressure.toFixed(0)} <span className="text-lg text-slate-500">PSI</span></p>
                            <div className="w-full bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden">
                              <div className={`h-full ${isStalling ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min((diffPressure / 400) * 100, 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 text-right">Stall Limit: 350 PSI</p>
                          </div>
                        );
                      })()}

                      {/* Lateral Vibration */}
                      {(() => {
                        const gForce = currentPt?.torque_ftlbs && currentPt.torque_ftlbs > 18000 ? 15.4 : 2.1 + Math.random();
                        const isShocking = gForce > 10;
                        return (
                          <div className={`p-5 rounded-lg border flex flex-col justify-center relative overflow-hidden transition-colors md:col-span-2 ${isShocking ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-950 border-slate-800'}`}>
                            {isShocking && <div className="absolute inset-0 bg-red-500/5 animate-ping pointer-events-none"></div>}
                            <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider font-semibold">Lateral Vibration (Shock)</p>
                            <p className={`text-4xl font-mono font-bold ${isShocking ? 'text-red-400 animate-bounce text-shadow-sm' : 'text-slate-100'}`}>{gForce.toFixed(1)} <span className="text-lg text-slate-500">G</span></p>
                            <div className="w-full bg-slate-800 h-1.5 mt-4 rounded-full overflow-hidden flex items-center">
                               {/* Shock Wave Simulation */}
                               {isShocking ? (
                                 <div className="w-full h-full bg-gradient-to-r from-red-500 to-amber-500 animate-pulse"></div>
                               ) : (
                                 <div className="h-full bg-emerald-500 w-1/4"></div>
                               )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2 text-right">Severe Threshold: 10.0 G</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Agentic Downlink Panel */}
                <div className="col-span-1 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="p-6 border-b border-slate-800 relative z-10 bg-slate-900/90 backdrop-blur-sm flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-100 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                      Downlink Agent
                    </h3>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto space-y-6 text-sm relative z-10 bg-slate-900">
                    {/* Check if MWD Temp > 150 */}
                    {(80 + (currentDepth / 80)) > 150 ? (
                      <div className="animate-in fade-in duration-500">
                        <div className="p-5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-100 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]">
                          <strong className="block text-red-400 text-lg uppercase tracking-wider mb-2">Critical Tool Temp</strong>
                          <p className="text-slate-300 mb-4">MWD electronics have exceeded 150°C. Catastrophic sensor failure is imminent if drilling continues without cooling.</p>

                          <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/30">
                            <span className="text-indigo-400 font-bold block mb-2 text-xs uppercase tracking-widest">Prescriptive Downlink</span>
                            <p className="text-indigo-100 font-medium mb-4">"Transmit mud-pulse sequence: Open Circulating Bypass Sub. Increase flow rate to 600 GPM to rapidly cool BHA electronics."</p>
                            
                            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all">
                              Execute Bypass Sequence
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : currentPt?.torque_ftlbs && currentPt.torque_ftlbs > 18000 ? (
                      <div className="animate-in fade-in duration-500">
                        <div className="p-5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-100 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]">
                          <strong className="block text-amber-400 text-lg uppercase tracking-wider mb-2">Severe Vibration</strong>
                          <p className="text-slate-300 mb-4">Lateral shocks exceeding 15G. Risk of shattering MWD directional sensors.</p>

                          <div className="bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/30">
                            <span className="text-indigo-400 font-bold block mb-2 text-xs uppercase tracking-widest">Prescriptive Downlink</span>
                            <p className="text-indigo-100 font-medium mb-4">"Reduce WOB by 10 klbs immediately to mitigate lateral resonance."</p>
                            
                            <button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all">
                              Execute WOB Reduction
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-100 h-full flex flex-col justify-center items-center text-center min-h-[300px]">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border border-emerald-500/40">
                          <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <strong className="block text-emerald-400 text-xl tracking-wider uppercase mb-2">Tools Nominal</strong>
                        <p className="text-emerald-200/70">All BHA components are operating within safe thermal and vibration limits. No downlink required.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
