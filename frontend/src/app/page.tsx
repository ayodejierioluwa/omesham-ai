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
    
    // Smooth pitch sweep for a futuristic radar sound
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + duration);
    
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    console.warn("Audio Context init failed or blocked:", err);
  }
};

// =====================================================================
//                       COMPONENT: RIG TELEMETRY
// =====================================================================
const RigTelemetry = ({ 
  telemetry, 
  currentDepth, 
  onFeedbackSubmit, 
  feedbackToast 
}: { 
  telemetry: any[], 
  currentDepth: number,
  onFeedbackSubmit: (correction: 'correct' | 'false_alarm') => void,
  feedbackToast: string | null
}) => {
  const currentPt = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const risk = currentPt?.forecast_risk || 12;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-8">
      {/* Physics Gauges and Dynamics Chart */}
      <div className="col-span-1 lg:col-span-2 flex flex-col space-y-6">
        
        {/* Core Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          {/* Well Depth Card */}
          <div className="glass-panel p-5 relative overflow-hidden group rounded-xl">
            <div className="absolute top-0 right-0 w-12 h-12 opacity-5 group-hover:opacity-10 transition-opacity">
              <span className="material-symbols-outlined text-4xl text-primary">straighten</span>
            </div>
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-3 uppercase tracking-wider font-semibold">Well Depth (MD)</p>
            <p className="font-telemetry-lg text-telemetry-lg text-primary font-mono">
              {currentDepth.toFixed(1)} <span className="text-xs text-on-surface-variant">ft</span>
            </p>
            <div className="mt-4 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary shadow-[0_0_8px_rgba(192,198,222,0.8)] transition-all duration-300"
                style={{ width: `${Math.min((currentDepth / 15000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Weight on Bit Card */}
          <div className="glass-panel p-5 relative overflow-hidden group rounded-xl">
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-3 uppercase tracking-wider font-semibold">WOB (Load)</p>
            <p className="font-telemetry-lg text-telemetry-lg text-secondary font-mono">
              {currentPt?.wob_klbs !== undefined ? currentPt.wob_klbs.toFixed(1) : "0.0"} <span className="text-xs text-on-surface-variant">klbs</span>
            </p>
            <div className="mt-4 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary shadow-[0_0_8px_rgba(190,198,224,0.8)] transition-all duration-300"
                style={{ width: `${Math.min(((currentPt?.wob_klbs || 0) / 50) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Rotational RPM Card */}
          <div className="glass-panel p-5 relative overflow-hidden group rounded-xl">
            <div className={`absolute top-0 left-0 w-full h-0.5 ${currentPt?.rpm && currentPt.rpm < 80 ? 'bg-red-500 animate-pulse' : 'bg-primary/20'}`}></div>
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-3 uppercase tracking-wider font-semibold">Bit Rotation</p>
            <p className={`font-telemetry-lg text-telemetry-lg font-mono ${currentPt?.rpm && currentPt.rpm < 80 ? 'text-red-400' : 'text-tertiary'}`}>
              {currentPt?.rpm !== undefined ? currentPt.rpm.toFixed(0) : "0"} <span className="text-xs text-on-surface-variant">RPM</span>
            </p>
            <div className="mt-4 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className={`h-full shadow-lg transition-all duration-300 ${currentPt?.rpm && currentPt.rpm < 80 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-tertiary shadow-[0_0_8px_rgba(228,191,170,0.8)]'}`}
                style={{ width: `${Math.min(((currentPt?.rpm || 0) / 220) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Rate of Penetration (ROP) Card */}
          <div className="glass-panel p-5 relative overflow-hidden group rounded-xl">
            <p className="font-label-caps text-label-caps text-on-surface-variant mb-3 uppercase tracking-wider font-semibold">Rate of Pen.</p>
            <p className="font-telemetry-lg text-telemetry-lg text-primary font-mono">
              {currentPt?.rop_fph !== undefined ? currentPt.rop_fph.toFixed(1) : "0.0"} <span className="text-xs text-on-surface-variant">ft/hr</span>
            </p>
            <div className="mt-4 h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary shadow-[0_0_8px_rgba(192,198,222,0.8)] transition-all duration-300"
                style={{ width: `${Math.min(((currentPt?.rop_fph || 0) / 120) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

        </div>

        {/* Live Dynamics Chart Area */}
        <div className="glass-panel p-6 rounded-xl flex flex-col min-h-[350px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-label-caps text-label-caps text-primary tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">monitoring</span> 
              REAL-TIME TORQUE DYNAMICS
            </h3>
            <div className="flex items-center gap-3">
              {currentPt?.is_anomaly ? (
                <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-bold shadow-[0_0_12px_rgba(239,68,68,0.35)] animate-pulse uppercase tracking-wider">dysfunction active</span>
              ) : risk > 30 ? (
                <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-bold animate-pulse uppercase tracking-wider">vibration warning</span>
              ) : (
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold uppercase tracking-wider">dynamics stable</span>
              )}
            </div>
          </div>

          <div className="flex-1 flex space-x-4">
            {/* Torque scale labels */}
            <div className="flex flex-col justify-between text-[9px] text-slate-500 font-mono font-bold py-2 border-r border-outline-variant/20 pr-3 select-none h-[220px]">
              <span>45k ft-lbs</span>
              <span>30k ft-lbs</span>
              <span>15k ft-lbs</span>
              <span>0 ft-lbs</span>
            </div>

            <div className="flex-1 flex items-end gap-2 px-2 h-[220px] bg-slate-950/20 border-l border-b border-outline-variant/30 rounded-bl relative pt-4 pb-1">
              {/* Dynamic Chart columns */}
              {telemetry.slice(-16).map((pt, idx) => {
                const heightPct = Math.min((pt.torque_ftlbs / 45000) * 100, 100);
                const isAnomaly = pt.is_anomaly;
                const isWarning = pt.forecast_risk > 30;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col justify-end h-full group relative">
                    <div 
                      className={`w-full rounded-t border-t transition-all duration-300 crt-flicker ${
                        isAnomaly 
                          ? 'bg-gradient-to-t from-red-600/10 to-red-500/50 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]' 
                          : isWarning 
                            ? 'bg-gradient-to-t from-amber-500/10 to-amber-500/50 border-amber-400' 
                            : 'bg-gradient-to-t from-primary/10 to-primary/40 border-primary/50'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    ></div>
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-surface-container border border-outline rounded text-[9px] font-mono font-bold text-slate-100 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none whitespace-nowrap shadow-lg">
                      {pt.torque_ftlbs.toFixed(0)} ft-lbs
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* AI Recommendation Panel and Feedback calibrator */}
      <div className="col-span-1 flex flex-col space-y-6">
        
        {/* Real-time recommendations */}
        <div className="glass-panel p-6 rounded-xl flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-4 border-b border-outline-variant/20 pb-3">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
            <h3 className="font-label-caps text-label-caps text-primary uppercase tracking-widest">AI Decision Engine</h3>
          </div>

          {currentPt?.is_anomaly ? (
            <div className="flex-1 flex flex-col justify-between">
              <div className="bg-red-500/10 p-4 border-l-4 border-red-500 rounded-r relative overflow-hidden mb-4">
                <div className="absolute top-0 right-0 w-8 h-8 opacity-10">
                  <span className="material-symbols-outlined text-2xl text-red-500">warning</span>
                </div>
                <p className="font-label-caps text-[10px] text-red-400 mb-1.5 uppercase tracking-widest font-bold">DYSFUNCTION TRIGGERED</p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">{currentPt.recommended_solution}</p>
              </div>

              {/* Action Optimization loop */}
              <div className="border-t border-outline-variant/20 pt-4 mt-auto">
                <button 
                  onClick={() => onFeedbackSubmit('correct')}
                  className="w-full bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-slate-950 font-bold py-2.5 rounded-lg text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 mb-3"
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  <span>EXECUTE DAMPING AUTOPILOT</span>
                </button>

                <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/10">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-2">Audit AI System Accuracy:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => onFeedbackSubmit('correct')}
                      className="flex items-center justify-center gap-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 font-bold rounded text-[9px] uppercase tracking-wider transition-all"
                    >
                      <span className="material-symbols-outlined text-xs">thumb_up</span>
                      <span>Correct</span>
                    </button>
                    <button 
                      onClick={() => onFeedbackSubmit('false_alarm')}
                      className="flex items-center justify-center gap-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 font-bold rounded text-[9px] uppercase tracking-wider transition-all"
                    >
                      <span className="material-symbols-outlined text-xs">thumb_down</span>
                      <span>False Alarm</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="bg-primary/5 p-4 border-l-4 border-primary rounded-r">
                  <p className="font-label-caps text-[10px] text-primary mb-1.5 uppercase tracking-widest font-bold">STATE CONTROL: PASSIVE MONITORING</p>
                  <p className="text-xs text-slate-300 leading-relaxed">Drillstring torsional envelopes and lateral vibrations are currently within normal baseline guidelines.</p>
                </div>
                
                <div className="bg-surface-container-high/20 p-4 border-l-4 border-slate-500/50 rounded-r">
                  <p className="font-label-caps text-[10px] text-slate-400 mb-1.5 uppercase tracking-widest font-bold">HYDRAULIC STATUS</p>
                  <p className="text-xs text-slate-300 leading-relaxed">Standpipe pressure is stable at {currentPt?.spp_psi !== undefined ? currentPt.spp_psi.toFixed(0) : "2450"} psi. No flow anomalies detected.</p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center text-center py-6 opacity-60">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-400 font-black">verified</span>
                </div>
                <h4 className="text-xs font-bold text-slate-200">No Action Required</h4>
                <p className="text-[10px] text-slate-500 max-w-[180px] mt-0.5">Operating envelope remains balanced.</p>
              </div>
            </div>
          )}

          {/* Feedback Toast */}
          {feedbackToast && (
            <div className="mt-4 p-3 bg-teal-950/80 border border-teal-500/30 text-teal-400 rounded text-[10px] font-mono leading-normal shadow-[0_0_15px_rgba(45,212,191,0.25)] animate-fade-in text-center">
              {feedbackToast}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

// =====================================================================
//                       COMPONENT: TRAJECTORY OPTIMIZATION
// =====================================================================
const TrajectoryOptimization = ({ currentDepth }: { currentDepth: number }) => {
  useEffect(() => {
    // Generate soft, continuous structural radar sonics on component load
    playRadarBeep(1050, 0.25, "sine");
    const interval = setInterval(() => {
      playRadarBeep(1050, 0.15, "sine");
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full space-y-6 pb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        
        {/* Path Map */}
        <div className="col-span-1 lg:col-span-2 glass-panel p-6 rounded-xl min-h-[420px] flex flex-col">
          <h3 className="font-label-caps text-label-caps text-primary tracking-widest flex items-center gap-2 mb-6">
            <span className="material-symbols-outlined text-[16px]">explore</span>
            WELLBORE TRAJECTORY (TVD VS DEPARTURE)
          </h3>

          <div className="flex-1 flex space-x-4">
            {/* TVD vertical axis scale */}
            <div className="flex flex-col justify-between text-[9px] text-slate-500 font-mono font-bold py-4 border-r border-outline-variant/25 pr-3 select-none h-full min-h-[280px]">
              <span>0 ft (Surface)</span>
              <span>4,000 ft</span>
              <span>8,000 ft</span>
              <span>12,500 ft (TD)</span>
            </div>

            <div className="flex-1 flex flex-col h-full">
              <div className="flex-1 bg-slate-950/40 rounded-lg border border-outline-variant/20 relative flex items-center justify-center p-8 h-[280px]">
                {/* Reference Grid Overlay */}
                <div className="absolute inset-x-0 top-1/3 border-t border-outline-variant/5 pointer-events-none"></div>
                <div className="absolute inset-x-0 top-2/3 border-t border-outline-variant/5 pointer-events-none"></div>
                <div className="absolute inset-y-0 left-1/3 border-l border-outline-variant/5 pointer-events-none"></div>
                <div className="absolute inset-y-0 left-2/3 border-l border-outline-variant/5 pointer-events-none"></div>

                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Ideal Path Curve */}
                  <path d="M 10,0 C 10,40 50,60 90,90" fill="none" stroke="rgba(192, 198, 222, 0.2)" strokeWidth="1.2" strokeDasharray="3,3" />
                  
                  {(() => {
                    const depthPct = Math.min(currentDepth / 12500, 1);
                    const y = depthPct * 90;
                    const actualX = 10 + Math.pow(depthPct, 1.5) * 80 + (currentDepth > 4000 ? Math.sin(currentDepth / 500) * 4 : 0);
                    
                    return (
                      <>
                        {/* Actual Drilled Path */}
                        <path d={`M 10,0 Q 10,${y/2} ${actualX},${y}`} fill="none" stroke="#e4bfaa" strokeWidth="2" />
                        
                        {/* Interactive pulsing radar rings */}
                        <circle cx={actualX} cy={y} r="2" fill="none" stroke="#e4bfaa" strokeWidth="0.5" opacity="0.8">
                          <animate attributeName="r" values="2;12" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle cx={actualX} cy={y} r="2" fill="none" stroke="#c0c6de" strokeWidth="0.3" opacity="0.6">
                          <animate attributeName="r" values="2;18" dur="2s" begin="0.7s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.6;0" dur="2s" begin="0.7s" repeatCount="indefinite" />
                        </circle>

                        {/* Solid drillbit locator node */}
                        <circle cx={actualX} cy={y} r="2.2" fill="#e4bfaa" className="shadow-[0_0_12px_rgba(228,191,170,0.6)]" />
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Horizontal scales */}
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono font-bold pt-2 px-1 select-none">
                <span>0 ft (Vertical)</span>
                <span>2,000 ft Departure</span>
                <span>4,000 ft Departure</span>
                <span>6,000 ft Departure (Target)</span>
              </div>
            </div>
          </div>
        </div>

        {/* RSS steering panel */}
        <div className="col-span-1 glass-panel p-6 rounded-xl flex flex-col justify-between">
          <div>
            <h3 className="font-label-caps text-label-caps text-primary tracking-widest flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[16px]">explore</span>
              STEERING AGENT
            </h3>
            
            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg mb-6">
              <p className="font-label-caps text-[11px] text-emerald-400 font-bold mb-1">TARGET STATUS: ON PATH</p>
              <p className="text-xs text-slate-400 leading-normal">Closed-loop geometric trajectory optimizer active. Target deviation remains strictly within the 2.5ft allowance window.</p>
            </div>

            <div className="space-y-4">
              <div className="border-l-2 border-primary/40 pl-4">
                <p className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Inclination</p>
                <p className="text-base font-mono text-slate-200 mt-0.5">{(34.2 + Math.sin(currentDepth / 1000) * 5).toFixed(2)}°</p>
              </div>
              <div className="border-l-2 border-primary/40 pl-4">
                <p className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Azimuth Angle</p>
                <p className="text-base font-mono text-slate-200 mt-0.5">342° <span className="text-[10px] text-slate-500">N</span></p>
              </div>
              <div className="border-l-2 border-primary/40 pl-4">
                <p className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider">Build Rate (DLS)</p>
                <p className="text-base font-mono text-slate-200 mt-0.5">2.4°/100ft</p>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low/40 p-3 rounded-lg border border-outline-variant/10 text-[9px] text-slate-500 font-mono text-center">
            LAST SIGNAL UPDATED: JUST NOW
          </div>
        </div>

      </div>
    </div>
  );
};

// =====================================================================
//                       COMPONENT: BHA CONTROL
// =====================================================================
const BHAControl = ({ currentDepth, telemetry = [] }: { currentDepth: number, telemetry?: any[] }) => {
  const currentPt = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

  const calculateVibration = () => {
    if (!currentPt) return 1.8;
    const baseVal = 1.2 + (Math.sin(currentDepth / 10) * 0.3) + (Math.cos(currentPt.rpm / 20) * 0.1);
    const geoMultiplier = currentPt.formation_type?.includes("Granite") ? 1.9 : 1.0;
    const rpmMultiplier = 1.0 + (currentPt.rpm / 150) * 0.4;
    let finalVib = baseVal * geoMultiplier * rpmMultiplier;
    
    if (currentPt.is_anomaly) {
      if (currentPt.anomaly_type?.includes("Stick-Slip") || currentPt.anomaly_type?.includes("Vibration")) {
        finalVib += 5.2 + (Math.sin(Date.now() / 200) * 0.9);
      } else if (currentPt.anomaly_type?.includes("Washout")) {
        finalVib += 0.8;
      }
    }
    return finalVib;
  };

  const vibrationG = calculateVibration();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full pb-8">
      
      {/* Schematic Graphic card */}
      <div className="col-span-1 glass-panel p-6 rounded-xl flex flex-col items-center">
        <h3 className="font-label-caps text-label-caps text-primary mb-4 uppercase tracking-widest w-full text-center">BHA ASSEMBLY 14A</h3>
        <div className="w-full max-w-[210px] aspect-[1/1.5] relative flex items-center justify-center p-2 bg-slate-950/30 rounded-xl border border-outline-variant/20">
          <svg className="w-full h-full" viewBox="0 0 170 300" fill="none">
            <defs>
              <linearGradient id="metalGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="30%" stopColor="#475569" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="70%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="slideGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#312e81" />
                <stop offset="50%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#312e81" />
              </linearGradient>
              <linearGradient id="stabilizerBlade" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="50%" stopColor="#334155" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
              <linearGradient id="glowingTeal" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0d9488" />
                <stop offset="50%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#0d9488" />
              </linearGradient>
            </defs>

            {/* Dotted references */}
            <line x1="15" y1="10" x2="85" y2="10" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="15" y1="290" x2="85" y2="290" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="50" y1="10" x2="50" y2="290" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4,4" />

            {/* Labels and lines */}
            <line x1="58" y1="30" x2="92" y2="30" stroke="#475569" strokeWidth="0.75" strokeDasharray="2,2" />
            <circle cx="92" cy="30" r="1" fill="#475569" />
            <text x="98" y="33" fill="#94a3b8" fontSize="6.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">DRILL COLLAR</text>

            <line x1="62" y1="80" x2="92" y2="80" stroke="#2dd4bf" strokeWidth="0.75" strokeDasharray="2,2" />
            <circle cx="92" cy="80" r="1" fill="#2dd4bf" />
            <text x="98" y="83" fill="#2dd4bf" fontSize="6.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">MWD/LWD COLLAR</text>

            <line x1="72" y1="142" x2="92" y2="142" stroke="#64748b" strokeWidth="0.75" strokeDasharray="2,2" />
            <circle cx="92" cy="142" r="1" fill="#64748b" />
            <text x="98" y="145" fill="#94a3b8" fontSize="6.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">STABILIZERS</text>

            <line x1="63" y1="210" x2="92" y2="210" stroke="#818cf8" strokeWidth="0.75" strokeDasharray="2,2" />
            <circle cx="92" cy="210" r="1" fill="#818cf8" />
            <text x="98" y="213" fill="#818cf8" fontSize="6.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">DOWNHOLE MOTOR</text>

            <line x1="70" y1="275" x2="92" y2="275" stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="2,2" />
            <circle cx="92" cy="275" r="1" fill="#f59e0b" />
            <text x="98" y="278" fill="#f59e0b" fontSize="6.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">PDC DRILL BIT</text>

            {/* Drill Pipe */}
            <rect x="42" y="10" width="16" height="40" fill="url(#metalGlow)" rx="1" />
            <line x1="42" y1="20" x2="58" y2="20" stroke="#0f172a" strokeWidth="1" />
            <line x1="42" y1="30" x2="58" y2="30" stroke="#0f172a" strokeWidth="1" />
            <line x1="42" y1="40" x2="58" y2="40" stroke="#0f172a" strokeWidth="1" />

            {/* MWD */}
            <rect x="38" y="50" width="24" height="60" fill="url(#glowingTeal)" rx="1" className="opacity-80" />
            <rect x="42" y="55" width="16" height="50" fill="url(#metalGlow)" rx="0.5" />
            <circle cx="50" cy="70" r="2.5" fill="#2dd4bf" className="animate-ping" />
            <circle cx="50" cy="90" r="2.5" fill="#2dd4bf" className="animate-pulse" />
            <path d="M 28,65 Q 18,70 28,75" fill="none" stroke="#2dd4bf" strokeWidth="1.5" className="animate-pulse" />
            <path d="M 72,65 Q 82,70 72,75" fill="none" stroke="#2dd4bf" strokeWidth="1.5" className="animate-pulse" />

            {/* Collar and stabilizers */}
            <rect x="36" y="110" width="28" height="70" fill="url(#metalGlow)" rx="1" />
            <rect x="28" y="125" width="8" height="35" rx="1" fill={vibrationG > 4.5 ? "#ef4444" : "url(#stabilizerBlade)"} className={vibrationG > 4.5 ? 'animate-pulse' : ''} />
            <rect x="64" y="125" width="8" height="35" rx="1" fill={vibrationG > 4.5 ? "#ef4444" : "url(#stabilizerBlade)"} className={vibrationG > 4.5 ? 'animate-pulse' : ''} />
            <rect x="47" y="125" width="6" height="35" rx="1" fill="url(#stabilizerBlade)" />
            <path d="M 36,115 L 64,130" stroke="#0f172a" strokeWidth="1.5" />
            <path d="M 36,135 L 64,150" stroke="#0f172a" strokeWidth="1.5" />
            <path d="M 36,155 L 64,170" stroke="#0f172a" strokeWidth="1.5" />

            {/* Mud Motor Bent Sub */}
            {(() => {
              const isSliding = currentPt?.bha_state?.includes("Sliding");
              return (
                <g>
                  <path d="M 36,180 L 33,240 L 61,240 L 64,180 Z" fill={isSliding ? "url(#slideGlow)" : "url(#metalGlow)"} className="transition-all duration-500" />
                  <path d="M 48,185 Q 42,210 46,235" fill="none" stroke={isSliding ? "#818cf8" : "#1e293b"} strokeWidth="2" className={isSliding ? "animate-pulse" : ""} />
                </g>
              );
            })()}

            {/* Bit drive */}
            <rect x="40" y="240" width="20" height="20" fill="url(#metalGlow)" />
            <circle cx="50" cy="250" r="4" fill="#0f172a" />

            {/* Drill bit rotating assembly */}
            {(() => {
              const isRotating = currentPt?.bha_state?.includes("Rotating") || (!currentPt?.bha_state && currentPt?.rpm > 0);
              return (
                <g className={isRotating ? "animate-[spin_2.5s_linear_infinite]" : ""} style={{ transformOrigin: "50px 275px" }}>
                  <path d="M 30,260 L 70,260 L 66,285 L 58,290 L 42,290 L 34,285 Z" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                  <rect x="32" y="263" width="6" height="15" rx="0.5" fill="#f59e0b" />
                  <rect x="62" y="263" width="6" height="15" rx="0.5" fill="#f59e0b" />
                  <rect x="47" y="263" width="6" height="24" rx="0.5" fill="#d97706" />
                  <circle cx="35" cy="281" r="2.5" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
                  <circle cx="65" cy="281" r="2.5" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
                  <circle cx="44" cy="288" r="2.5" fill="#1e293b" />
                  <circle cx="56" cy="288" r="2.5" fill="#1e293b" />
                </g>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Health metrics and charts */}
      <div className="col-span-1 lg:col-span-3 glass-panel p-6 rounded-xl flex flex-col justify-between">
        <div>
          <h3 className="font-label-caps text-label-caps text-primary tracking-widest mb-6">BHA TELEMETRY HEALTH</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/40 border border-outline-variant/15 rounded-lg">
              <p className="text-[10px] text-slate-500 font-mono font-bold tracking-wider uppercase mb-1">MWD Internal Temp</p>
              <p className="text-xl font-mono text-slate-200">{(78 + (currentDepth / 90)).toFixed(1)} <span className="text-xs text-slate-500">°C</span></p>
            </div>
            
            <div className="p-4 bg-slate-950/40 border border-outline-variant/15 rounded-lg relative overflow-hidden">
              {vibrationG > 4.5 && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 animate-pulse"></div>
              )}
              <p className="text-[10px] text-slate-500 font-mono font-bold tracking-wider uppercase mb-1">Lateral Vibration</p>
              <p className={`text-xl font-mono font-bold ${vibrationG > 4.5 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                {vibrationG.toFixed(2)} <span className="text-xs text-slate-500">G</span>
              </p>
            </div>

            <div className="p-4 bg-slate-950/40 border border-outline-variant/15 rounded-lg">
              <p className="text-[10px] text-slate-500 font-mono font-bold tracking-wider uppercase mb-1">Azimuth Toolface</p>
              <p className="text-xl font-mono text-slate-200">{(currentPt?.toolface_deg || 14).toFixed(1)}° <span className="text-xs text-slate-500">DEG</span></p>
            </div>

            <div className="p-4 bg-slate-950/40 border border-outline-variant/15 rounded-lg">
              <p className="text-[10px] text-slate-500 font-mono font-bold tracking-wider uppercase mb-1">Bit Operating hours</p>
              <p className="text-xl font-mono text-slate-200">14.5 <span className="text-xs text-slate-500">hrs</span></p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 mt-6 flex justify-between items-center text-xs text-slate-400">
          <span>Continuous diagnostic frequency: 10 Hz</span>
          <span className="font-mono text-[10px] text-primary">STATUS: HEALTHY</span>
        </div>
      </div>

    </div>
  );
};

// =====================================================================
//                       CORE SCREEN VIEWPORT
// =====================================================================
export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Rig Telemetry');
  const [currentDepth, setCurrentDepth] = useState(12450.0);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [alertLogs, setAlertLogs] = useState<any[]>([]);
  const [chaosMode, setChaosMode] = useState(false);
  const [dataSource, setDataSource] = useState('simulated');
  const [location, setLocation] = useState('utah_forge');
  const [handoverNotes, setHandoverNotes] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  
  const depthRef = useRef(12450.0);

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
        
        // Rolling buffer
        setTelemetry(prev => {
          const updated = [...prev, { ...pt, timestamp: formattedTimestamp }];
          if (updated.length > 25) {
            return updated.slice(updated.length - 25);
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
        setFeedbackToast(`Autopilot Calibrated! Adapted to: ${correction === 'false_alarm' ? 'Ignore Vibration' : 'Enforce Safety Boundary'}`);
        setTimeout(() => setFeedbackToast(null), 6000);
        playRadarBeep(880, 0.1, "sine");
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
    }
  };

  const currentPt = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const threatIndex = currentPt?.forecast_risk || 15;

  // Render authentic authentication synchronization screen
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#020617] items-center justify-center text-slate-400 font-mono text-xs tracking-widest relative">
        <div className="fixed inset-0 grid-bg z-0 pointer-events-none"></div>
        <div className="fixed inset-0 scanline z-10 pointer-events-none"></div>
        <div className="relative z-20 flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-slate-800 border-t-amber-500 rounded-full animate-spin mb-4"></div>
          <span>SYNCHRONIZING SECURE NODE IDENTITY...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#020617] text-slate-300 font-sans overflow-hidden relative">
      
      {/* Background Grid & CRT scanlines */}
      <div className="fixed inset-0 grid-bg z-0 pointer-events-none"></div>
      <div className="fixed inset-0 scanline z-10 pointer-events-none"></div>

      {/* 1. TOP HEADER NAVIGATION BAR */}
      <header className="fixed top-0 left-0 w-full h-16 z-50 flex justify-between items-center px-6 bg-surface/60 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_0_20px_rgba(192,198,222,0.1)] no-print">
        <div className="flex items-center gap-6">
          <span className="text-xl font-black tracking-tighter text-primary">OMESHAM AI</span>
          
          {/* Active dropdown selectors for stream targets */}
          <div className="hidden md:flex gap-4">
            
            {/* Simulated selector */}
            <div className="flex items-center space-x-2 bg-slate-900/50 border border-outline-variant/20 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">FEED:</span>
              <select 
                value={dataSource}
                onChange={(e) => {
                  setDataSource(e.target.value);
                  playRadarBeep(920, 0.08, "sine");
                }}
                className="bg-transparent text-slate-300 font-mono font-bold text-[11px] focus:outline-none border-none cursor-pointer"
              >
                <option value="simulated" className="bg-[#0e0e0f] text-slate-300">SIMULATED</option>
                <option value="field" className="bg-[#0e0e0f] text-slate-300">FIELD RAW</option>
              </select>
            </div>

            {/* Geological selector */}
            <div className="flex items-center space-x-2 bg-slate-900/50 border border-outline-variant/20 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-[10px] text-slate-500 font-mono font-bold uppercase">REGION:</span>
              <select 
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  playRadarBeep(920, 0.08, "sine");
                }}
                className="bg-transparent text-slate-300 font-mono font-bold text-[11px] focus:outline-none border-none cursor-pointer"
              >
                <option value="utah_forge" className="bg-[#0e0e0f] text-slate-300">UTAH FORGE</option>
                <option value="permian_basin" className="bg-[#0e0e0f] text-slate-300">PERMIAN BASIN</option>
                <option value="volve_field" className="bg-[#0e0e0f] text-slate-300">VOLVE FIELD</option>
                <option value="gom_deepwater" className="bg-[#0e0e0f] text-slate-300">GULF OF MEXICO</option>
                <option value="arabian_basin" className="bg-[#0e0e0f] text-slate-300">MIDDLE EAST</option>
              </select>
            </div>

          </div>
        </div>

        {/* Header Right toggles */}
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2 bg-slate-900/50 border border-outline-variant/20 rounded-xl px-3 py-1.5 h-9">
            <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase font-mono">Stress Mode</span>
            <button
              onClick={() => {
                setChaosMode(prev => !prev);
                playRadarBeep(chaosMode ? 600 : 1300, 0.15, "triangle");
              }}
              className={`w-8 h-4.5 rounded-full transition-all duration-300 relative flex items-center p-0.5 ${chaosMode ? 'bg-gradient-to-r from-red-600 to-amber-500 shadow-[0_0_12px_rgba(239,68,68,0.45)]' : 'bg-slate-800'}`}
            >
              <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-all duration-300 ${chaosMode ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
            </button>
          </div>

          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined cursor-pointer hover:text-primary text-[20px]">settings</span>
            <span className={`material-symbols-outlined cursor-pointer hover:text-primary text-[20px] ${alertLogs.length > 0 ? 'text-amber-500 animate-pulse' : ''}`}>notifications_active</span>
          </div>
        </div>
      </header>

      {/* 2. SIDEBAR MISSION CONTROL */}
      <aside className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col pt-20 bg-surface-container/40 backdrop-blur-2xl border-r border-outline-variant/20 shadow-[10px_0_30px_rgba(0,0,0,0.5)] no-print">
        <div className="px-6 mb-8">
          <h2 className="font-headline-md text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-400 leading-none">MISSION CONTROL</h2>
          <p className="font-label-caps text-[9px] text-on-surface-variant opacity-60 mt-1 tracking-widest font-bold">SECTOR 07-B</p>
        </div>

        {/* Sidebar Nav anchors */}
        <nav className="flex-1 flex flex-col gap-1 px-2">
          {[
            { id: 'Rig Telemetry', icon: 'dashboard' },
            { id: 'Trajectory Optimization', icon: 'explore' },
            { id: 'BHA Control', icon: 'precision_manufacturing' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                playRadarBeep(1200, 0.08, "sine");
              }}
              className={`flex items-center gap-4 p-3.5 rounded-xl font-label-caps text-xs tracking-wider font-bold transition-all duration-200 text-left ${
                activeTab === tab.id 
                  ? 'bg-primary-container/20 text-primary border-r-4 border-primary shadow-lg shadow-primary-container/10' 
                  : 'text-on-surface-variant hover:bg-surface-variant/10 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
              <span>{tab.id.toUpperCase()}</span>
            </button>
          ))}
        </nav>

        {/* Hidden Signature Watermark Footer */}
        <div className="p-6 border-t border-outline-variant/10 flex flex-col items-center justify-center opacity-10 hover:opacity-80 transition-all duration-500 select-none">
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

      {/* 3. MAIN COMMAND CANVAS CONTAINER */}
      <main className="ml-64 flex-1 pt-20 p-6 relative z-20 flex flex-col h-screen overflow-y-auto">
        
        {/* Dynamic Section Header */}
        <div className="flex justify-between items-end mb-8 shrink-0 no-print">
          <div>
            <h1 className="font-display-lg text-4xl text-primary font-black tracking-tight uppercase">STRATOS-09 DEPLOYMENT</h1>
            <div className="flex gap-4 mt-2">
              <span className="bg-slate-900 border border-outline-variant/30 px-3 py-1 rounded text-primary font-mono text-[10px] tracking-wide">WELL ID: WH-NG-OML17</span>
              <span className="flex items-center gap-2 text-on-surface-variant font-mono text-[10px] font-bold tracking-wider">
                <span className={`w-2 h-2 rounded-full ${chaosMode ? 'bg-red-500 animate-ping' : 'bg-primary animate-pulse'}`}></span>
                SYSTEM FEED: {chaosMode ? "STRESS ACTIVE" : "NOMINAL"}
              </span>
            </div>
          </div>
          <div>
            <button 
              onClick={() => {
                setShowReportModal(true);
                playRadarBeep(980, 0.12, "sine");
              }}
              className="glass-panel px-5 py-2.5 rounded-lg font-label-caps text-xs tracking-wider uppercase border-primary/20 hover:border-primary text-slate-100 font-bold transition-all"
            >
              GENERATE SHIFT REPORT
            </button>
          </div>
        </div>

        {/* GRID SPLITTER (Layout split between Tab Contents and side widgets) */}
        <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* Main viewport panels */}
          <div className="col-span-12 xl:col-span-8 flex flex-col h-full">
            {activeTab === 'Rig Telemetry' && (
              <RigTelemetry 
                telemetry={telemetry} 
                currentDepth={currentDepth} 
                onFeedbackSubmit={onFeedbackSubmit}
                feedbackToast={feedbackToast}
              />
            )}
            {activeTab === 'Trajectory Optimization' && (
              <TrajectoryOptimization currentDepth={currentDepth} />
            )}
            {activeTab === 'BHA Control' && (
              <BHAControl currentDepth={currentDepth} telemetry={telemetry} />
            )}
          </div>

          {/* AI Side widgets panel (Gauges and geology profile) */}
          <div className="col-span-12 xl:col-span-4 space-y-6 shrink-0 no-print">
            
            {/* Threat index circle gauge */}
            <div className="glass-panel p-6 rounded-xl flex flex-col items-center">
              <h3 className="font-label-caps text-label-caps text-primary mb-6 w-full text-center tracking-widest uppercase">AI Threat Index</h3>
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" fill="none" r="45" stroke="#1b1b1d" strokeWidth="6"></circle>
                  <circle 
                    className="transition-all duration-500" 
                    cx="50" cy="50" fill="none" r="45" 
                    stroke={threatIndex > 30 ? "#f59e0b" : "#c0c6de"} 
                    strokeDasharray="282.7" 
                    strokeDashoffset={282.7 - (282.7 * Math.min(threatIndex, 100)) / 100} 
                    strokeWidth="6"
                    strokeLinecap="round"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display-lg text-4xl text-slate-100 font-mono font-bold">{threatIndex.toFixed(0)}%</span>
                  <span className={`font-label-caps text-[9px] tracking-widest uppercase mt-1 font-bold ${threatIndex > 30 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {threatIndex > 45 ? 'HIGH RISK' : threatIndex > 25 ? 'STRESS WARNING' : 'LOW RISK'}
                  </span>
                </div>
              </div>

              {/* Threat factors */}
              <div className="mt-5 w-full space-y-2 border-t border-outline-variant/10 pt-4">
                <div className="flex justify-between font-label-caps text-[10px] tracking-wide font-medium">
                  <span>Downhole Motor stall risk:</span>
                  <span className={threatIndex > 30 ? 'text-amber-400 font-mono' : 'text-slate-400 font-mono'}>{(threatIndex * 0.4).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between font-label-caps text-[10px] tracking-wide font-medium">
                  <span>Torsional stick-slip:</span>
                  <span className={threatIndex > 45 ? 'text-red-400 font-mono font-bold' : 'text-slate-400 font-mono'}>
                    {threatIndex > 45 ? 'SEVERE' : threatIndex > 25 ? 'MODERATE' : 'STABLE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Geological Map Layer displaying our local asset */}
            <div className="glass-panel rounded-xl overflow-hidden shadow-lg border border-outline-variant/20">
              <div className="relative h-44 overflow-hidden border-b border-outline-variant/10 bg-slate-950">
                <img 
                  className="w-full h-full object-cover opacity-80" 
                  alt="Scientific visualization of deep earth geological layers" 
                  src="/images/geological_cross_section.png"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent pointer-events-none"></div>
              </div>
              <div className="p-4 bg-slate-900/60 backdrop-blur-sm">
                <p className="font-label-caps text-label-caps text-primary uppercase tracking-widest font-bold">CURRENT GEOLOGY: BASALT STRATA</p>
                <p className="text-[10px] text-on-surface-variant font-medium mt-1 leading-normal font-sans">
                  Estimated Strata Depth: 12,000 ft - 13,500 ft | Compressive Strength: Hard | Porosity: 8%
                </p>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* =====================================================================
                             SHIFT REPORT MODAL
         ===================================================================== */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
          <div className="glass-panel max-w-2xl w-full p-8 border-primary/30 rounded-2xl relative overflow-hidden shadow-2xl">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            
            <div className="border-b border-outline-variant/30 pb-6 mb-6">
              <p className="font-label-caps text-primary tracking-[0.3em] mb-2 text-xs font-bold">OFFICIAL SHIFT DOCUMENTATION</p>
              <h2 className="font-display-lg text-3xl font-black text-slate-100 uppercase">OPERATIONAL REPORT #2944</h2>
              <div className="flex justify-between mt-4 font-mono text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                <span>DATE: {new Date().toLocaleDateString()}</span>
                <span>OPERATOR: AYODEJI ERIOLUWA</span>
                <span>SYSTEM: OMESHAM AI CO-PILOT</span>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-label-caps text-xs text-primary mb-3 uppercase tracking-widest font-bold">SUMMARY METRICS</h4>
                  <div className="space-y-2.5 text-sm">
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1 font-sans">
                      <span className="text-slate-400 font-medium">Total Shift Depth</span>
                      <span className="font-mono text-slate-100 font-bold">{currentDepth.toFixed(1)} ft</span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1 font-sans">
                      <span className="text-slate-400 font-medium">Avg Rotary Speed</span>
                      <span className="font-mono text-slate-100 font-bold">
                        {(telemetry.reduce((acc, val) => acc + val.rpm, 0) / Math.max(telemetry.length, 1)).toFixed(0)} rpm
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-outline-variant/10 pb-1 font-sans">
                      <span className="text-slate-400 font-medium">Non-Productive Time</span>
                      <span className="font-mono text-red-400 font-bold">
                        {alertLogs.length > 0 ? `${(alertLogs.length * 0.4).toFixed(1)} mins` : '0.0 mins'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-label-caps text-xs text-primary mb-3 uppercase tracking-widest font-bold">DYSFUNCTION EVENTS LOG</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2 pr-2">
                    {alertLogs.length === 0 ? (
                      <p className="text-[10px] text-slate-500 italic">No drillstring dysfunctions or hydraulic anomalies logged during this shift.</p>
                    ) : (
                      alertLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-[10px] bg-[#0e0e0f] border border-outline-variant/10 p-2 rounded">
                          <span className={log.type === "Predictive Alert" ? "text-amber-500 font-black shrink-0" : "text-red-500 font-black shrink-0"}>●</span>
                          <span className="text-slate-300 leading-normal font-sans font-medium">{log.timestamp} - {log.type}: {log.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Handover comments input */}
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                <p className="font-label-caps text-[10px] text-primary mb-2 uppercase tracking-widest font-bold">SECURE OPERATOR HANDOVER NOTES</p>
                <textarea 
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  className="w-full bg-slate-950/50 border border-outline-variant/15 focus:border-primary focus:ring-0 text-xs h-24 p-3 rounded-lg placeholder-slate-600 text-slate-200" 
                  placeholder="Enter secure well handover instructions, motor tool status, or formation anomalies here..."
                ></textarea>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4 border-t border-outline-variant/10 pt-6">
              <button 
                onClick={() => {
                  setShowReportModal(false);
                  playRadarBeep(600, 0.1, "sine");
                }}
                className="px-6 py-2.5 font-label-caps text-xs tracking-wider uppercase hover:bg-surface-variant/20 rounded-lg font-bold"
              >
                CANCEL
              </button>
              <button 
                onClick={() => {
                  setShowReportModal(false);
                  playRadarBeep(1400, 0.2, "sine");
                }}
                className="px-8 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold font-label-caps text-xs tracking-wider uppercase rounded-lg shadow-lg shadow-amber-500/10"
              >
                AUTHORIZE & SUBMIT
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
