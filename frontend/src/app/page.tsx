"use client";

import React, { useState, useEffect, useRef } from 'react';

// Components defined outside to ensure stable rendering
const RigTelemetry = ({ telemetry, currentDepth }: { telemetry: any[], currentDepth: number }) => {
  const currentPt = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;
  const risk = currentPt?.forecast_risk || 12;

  const [feedbackToast, setFeedbackToast] = React.useState<string | null>(null);

  const onFeedbackSubmit = async (correction: 'correct' | 'false_alarm') => {
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
        setFeedbackToast(`Omesham AI Calibrated! Brain threshold envelope has adapted to: ${correction === 'false_alarm' ? 'Ignore High Torque' : 'Reinforce Boundary'}`);
        setTimeout(() => setFeedbackToast(null), 6000);
      }
    } catch (err) {
      console.error("Feedback submit error:", err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-8">
      {/* Physics Gauges */}
      <div className="col-span-1 lg:col-span-2 flex flex-col space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-full h-1 bg-teal-500 animate-pulse"></div>
            <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Well Depth</p>
            <p className="text-xl lg:text-2xl font-mono font-bold text-slate-100">{currentDepth !== undefined ? currentDepth.toFixed(0) : (currentPt?.depth_ft || 12450).toFixed(0)} <span className="text-xs text-slate-500">ft</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center">
            <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Weight on Bit</p>
            <p className="text-xl lg:text-2xl font-mono font-bold text-slate-100">{currentPt?.wob_klbs !== undefined ? currentPt.wob_klbs.toFixed(1) : "0.0"} <span className="text-xs text-slate-500">klbs</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className={`absolute bottom-0 left-0 w-full h-1 ${currentPt?.rpm && currentPt.rpm < 80 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Rotary Speed</p>
            <p className={`text-xl lg:text-2xl font-mono font-bold ${currentPt?.rpm && currentPt.rpm < 80 ? 'text-red-400' : 'text-slate-100'}`}>{currentPt?.rpm !== undefined ? currentPt.rpm.toFixed(0) : "0"} <span className="text-xs text-slate-500">rpm</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className={`absolute bottom-0 left-0 w-full h-1 ${currentPt?.rop_fph && currentPt.rop_fph < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">ROP (Penetration)</p>
            <p className="text-xl lg:text-2xl font-mono font-bold text-slate-100">{currentPt?.rop_fph !== undefined ? currentPt.rop_fph.toFixed(0) : "0"} <span className="text-xs text-slate-500">fph</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center">
            <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Standpipe Pres.</p>
            <p className={`text-xl lg:text-2xl font-mono font-bold ${currentPt?.spp_psi && currentPt.spp_psi < 2400 ? 'text-red-400' : 'text-slate-100'}`}>{currentPt?.spp_psi !== undefined ? currentPt.spp_psi.toFixed(0) : "0"} <span className="text-xs text-slate-500">psi</span></p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-center relative overflow-hidden">
            <div className={`absolute bottom-0 left-0 w-full h-1 ${currentPt?.bha_state?.includes('Sliding') ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Active BHA State</p>
            <p className={`text-xs lg:text-sm font-bold tracking-wider uppercase ${currentPt?.bha_state?.includes('Sliding') ? 'text-indigo-400' : 'text-emerald-400'}`}>
              {(currentPt?.bha_state || "ROTARY").toUpperCase().replace(" (DIRECTIONAL)", "").replace(" (ROTARY)", "")}
            </p>
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
          
          {/* Chart Area with Axis Labels */}
          <div className="flex-1 flex space-x-4">
            {/* Y-Axis scale label bar */}
            <div className="flex flex-col justify-between text-[9px] text-slate-500 font-mono font-bold py-2 border-r border-slate-850/60 pr-2 select-none h-[220px]">
              <span>45k ft-lbs</span>
              <span>30k ft-lbs</span>
              <span>15k ft-lbs</span>
              <span>0 ft-lbs</span>
            </div>
            
            <div className="flex-1 flex flex-col">
              {/* Plot Area */}
              <div className="h-[220px] w-full relative border-l border-b border-slate-800 flex items-end justify-between px-2 pt-8 pb-2 bg-slate-950/20 rounded-br">
                {/* Horizontal grid reference lines */}
                <div className="absolute inset-x-0 top-1/3 border-t border-slate-850/10 pointer-events-none"></div>
                <div className="absolute inset-x-0 top-2/3 border-t border-slate-850/10 pointer-events-none"></div>
                
                {telemetry.map((pt, i) => (
                  <div key={i} className="flex-1 mx-0.5 h-full relative flex flex-col justify-end group">
                    <div 
                      className={`w-full transition-all duration-300 rounded-t-sm ${pt.torque_ftlbs > 18000 ? 'bg-gradient-to-t from-red-600 to-amber-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' : pt.forecast_risk > 30 ? 'bg-gradient-to-t from-amber-500 to-orange-400 shadow-[0_0_8px_rgba(245,158,11,0.3)]' : 'bg-gradient-to-t from-emerald-600 to-teal-400'}`}
                      style={{ height: `${Math.min((pt.torque_ftlbs / 45000) * 100, 100)}%` }}
                    ></div>
                    {/* Tooltip on Hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded text-[9px] font-mono font-bold text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl whitespace-nowrap">
                      {pt.torque_ftlbs.toFixed(0)} ft-lbs
                    </div>
                  </div>
                ))}
              </div>
              
              {/* X-Axis labels */}
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono font-bold pt-2 px-1 select-none">
                <span>T-30 cycles</span>
                <span>T-15 cycles</span>
                <span>Live Feed</span>
              </div>
            </div>
          </div>
        </div>

        {/* WITSML XML Stream Viewer */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 animate-pulse"></span>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">WITSML XML Telemetry Stream</h3>
            </div>
            <span className="text-[9px] bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-mono px-2 py-0.5 rounded font-bold uppercase tracking-widest">WITSML v1.4.1.1 SOAP Standard</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-850 rounded-lg p-4 font-mono text-[10px] text-indigo-300 overflow-x-auto max-h-[160px] shadow-inner select-all whitespace-pre leading-relaxed">
            {currentPt?.witsml_xml || "Initializing WITSML SOAP Stream XML Parser..."}
          </div>
        </div>
      </div>

      <div className="col-span-1 flex flex-col h-full bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-slate-100 mb-4 border-b border-slate-800 pb-2 flex items-center justify-between">
          <span>AI Co-Driller</span>
          <span className={`w-2 h-2 rounded-full ${risk > 70 ? 'bg-red-500 animate-ping' : risk > 30 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-ping'}`}></span>
        </h3>

        {/* Geological Lithology HUD Card */}
        <div className="mb-4 p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl relative overflow-hidden flex items-center justify-between shadow-inner">
          <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/5 blur-[20px] rounded-full"></div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Current Lithology</p>
            <h4 className="text-sm font-bold text-slate-200 mt-1 flex items-center space-x-1.5 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)] animate-pulse"></span>
              <span>{currentPt?.formation_type || "Clay & Soil"}</span>
            </h4>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Hardness Index</p>
            <p className="text-xs font-mono font-bold text-teal-400 mt-1">
              {(() => {
                const name = currentPt?.formation_type || "Clay & Soil";
                if (name.includes("Granite") || name.includes("Diorite")) return "9.5 / 10";
                if (name.includes("Limestone") || name.includes("Tuff")) return "7.2 / 10";
                if (name.includes("Shale") || name.includes("Chalk")) return "4.5 / 10";
                return "1.5 / 10";
              })()}
            </p>
          </div>
        </div>

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
          {feedbackToast && (
            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px] uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.2)] animate-pulse leading-relaxed">
              {feedbackToast}
            </div>
          )}

          {currentPt?.is_anomaly ? (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-100 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <div className="flex items-center space-x-2 text-red-400 font-bold mb-2 uppercase text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>{currentPt.anomaly_type}</span>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">{currentPt.recommended_solution}</p>
              
              <button className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 py-2.5 rounded-xl font-bold shadow-lg text-white text-xs tracking-wider uppercase transition-all mb-3">Execute Emergency Override</button>
              
              <div className="border-t border-red-500/15 pt-3">
                <p className="text-[10px] font-bold text-red-400/80 uppercase tracking-widest font-mono mb-2">Train Omesham's Brain:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onFeedbackSubmit('correct')}
                    className="flex items-center justify-center space-x-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all"
                  >
                    <span>👍 Correct</span>
                  </button>
                  <button 
                    onClick={() => onFeedbackSubmit('false_alarm')}
                    className="flex items-center justify-center space-x-1 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all"
                  >
                    <span>👎 False Alarm</span>
                  </button>
                </div>
              </div>
            </div>
          ) : risk > 30 ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-100 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <div className="flex items-center space-x-2 text-amber-400 font-bold mb-2 uppercase text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>PREDICTIVE MITIGATION</span>
              </div>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">{currentPt?.proactive_alert || "Warning: Torsional dynamics approaching instability."}</p>
              
              <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 py-2.5 rounded-xl font-extrabold shadow-lg text-xs tracking-wider uppercase transition-all mb-3">Auto-Throttle Parameters</button>

              <div className="border-t border-amber-500/15 pt-3">
                <p className="text-[10px] font-bold text-amber-400/80 uppercase tracking-widest font-mono mb-2">Calibrate Warning Margin:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onFeedbackSubmit('correct')}
                    className="flex items-center justify-center space-x-1 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all"
                  >
                    <span>👍 Correct</span>
                  </button>
                  <button 
                    onClick={() => onFeedbackSubmit('false_alarm')}
                    className="flex items-center justify-center space-x-1 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all"
                  >
                    <span>👎 False Alarm</span>
                  </button>
                </div>
              </div>
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
          
          <div className="flex-1 flex space-x-4">
            {/* TVD Vertical Axis Scale */}
            <div className="flex flex-col justify-between text-[9px] text-slate-500 font-mono font-bold py-4 border-r border-slate-850/60 pr-2 select-none h-full min-h-[280px]">
              <span>0 ft (Surface)</span>
              <span>4,000 ft</span>
              <span>8,000 ft</span>
              <span>12,500 ft (TD)</span>
            </div>
            
            <div className="flex-1 flex flex-col h-full">
              {/* SVG Area */}
              <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 relative flex items-center justify-center p-8 h-[280px]">
                {/* Horizontal reference lines */}
                <div className="absolute inset-x-0 top-1/3 border-t border-slate-850/5 pointer-events-none"></div>
                <div className="absolute inset-x-0 top-2/3 border-t border-slate-850/5 pointer-events-none"></div>
                
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M 10,0 C 10,40 50,60 90,90" fill="none" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" strokeDasharray="2,2" />
                  {(() => {
                    const depthPct = Math.min(currentDepth / 12500, 1);
                    const y = depthPct * 90;
                    const actualX = 10 + Math.pow(depthPct, 1.5) * 80 + (currentDepth > 4000 ? Math.sin(currentDepth / 500) * 5 : 0);
                    return (
                      <>
                        <path d={`M 10,0 Q 10,${y/2} ${actualX},${y}`} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                        
                        {/* Double Sonar Radar Beep Ring 1 */}
                        <circle cx={actualX} cy={y} r="2" fill="none" stroke="#f59e0b" strokeWidth="0.4" opacity="0.8">
                          <animate attributeName="r" values="2;10" dur="1.8s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
                        </circle>
                        
                        {/* Double Sonar Radar Beep Ring 2 (Offset phase delay) */}
                        <circle cx={actualX} cy={y} r="2" fill="none" stroke="#f59e0b" strokeWidth="0.2" opacity="0.5">
                          <animate attributeName="r" values="2;16" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;0" dur="1.8s" begin="0.6s" repeatCount="indefinite" />
                        </circle>
                        
                        {/* Solid core drillbit center */}
                        <circle cx={actualX} cy={y} r="2.2" fill="#f59e0b" className="shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                      </>
                    );
                  })()}
                </svg>
              </div>
              
              {/* Horizontal Departure Axis Scale */}
              <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono font-bold pt-2 px-1 select-none">
                <span>0 ft (Vertical)</span>
                <span>2,000 ft Departure</span>
                <span>4,000 ft Departure</span>
                <span>6,000 ft Departure (Target)</span>
              </div>
            </div>
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

const BHAControl = ({ currentDepth, telemetry = [] }: { currentDepth: number, telemetry?: any[] }) => {
  const currentPt = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

  // Calculate dynamic lateral vibration physically based on rotational speed, geology, and dysfunctions
  const calculateVibration = () => {
    if (!currentPt) return 1.8;
    
    // Baseline physics fluctuation (between 1.2 and 1.8G)
    const baseVal = 1.2 + (Math.sin(currentDepth / 10) * 0.3) + (Math.cos(currentPt.rpm / 20) * 0.1);
    
    // Hard rock resonance (granite basement fracturing causes higher continuous vibrations)
    const geoMultiplier = currentPt.formation_type?.includes("Granite") ? 1.9 : 1.0;
    
    // Centripetal acceleration factor at higher RPMs
    const rpmMultiplier = 1.0 + (currentPt.rpm / 150) * 0.4;
    
    let finalVib = baseVal * geoMultiplier * rpmMultiplier;
    
    // Spike massively if there is an active stick-slip vibrational dysfunction
    if (currentPt.is_anomaly) {
      if (currentPt.anomaly_type?.includes("Stick-Slip") || currentPt.anomaly_type?.includes("Vibration")) {
        finalVib += 5.2 + (Math.sin(Date.now() / 200) * 0.9); // Vibrational whip spikes to 6-8G
      } else if (currentPt.anomaly_type?.includes("Washout")) {
        finalVib += 0.8; // Mild hydraulic flutter
      }
    }
    
    return finalVib;
  };

  const vibrationG = calculateVibration();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
      <div className="col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col items-center">
        <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">BHA Schematic</h3>
        <div className="w-full max-w-[210px] aspect-[1/1.5] relative flex items-center justify-center p-2 bg-slate-950 rounded-lg border border-slate-850">
          <svg className="w-full h-full" viewBox="0 0 170 300" fill="none">
            {/* Definitions for gorgeous gradient maps */}
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

            {/* Background reference grid lines */}
            <line x1="15" y1="10" x2="85" y2="10" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="15" y1="290" x2="85" y2="290" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="50" y1="10" x2="50" y2="290" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4,4" />

            {/* Dotted Component Label Guides & Texts */}
            {/* Label 1: Drill Pipe */}
            <line x1="58" y1="30" x2="92" y2="30" stroke="#475569" strokeWidth="0.75" strokeDasharray="2,2" />
            <circle cx="92" cy="30" r="1" fill="#475569" />
            <text x="98" y="33" fill="#94a3b8" fontSize="6.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">DRILL COLLAR</text>

            {/* Label 2: MWD Telemetry */}
            <line x1="62" y1="80" x2="92" y2="80" stroke="#2dd4bf" strokeWidth="0.75" strokeDasharray="2,2" />
            <circle cx="92" cy="80" r="1" fill="#2dd4bf" />
            <text x="98" y="83" fill="#2dd4bf" fontSize="6.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">MWD/LWD COLLAR</text>

            {/* Label 3: Stabilizers */}
            <line x1="72" y1="142" x2="92" y2="142" stroke="#64748b" strokeWidth="0.75" strokeDasharray="2,2" />
            <circle cx="92" cy="142" r="1" fill="#64748b" />
            <text x="98" y="145" fill="#94a3b8" fontSize="6.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">STABILIZERS</text>

            {/* Label 4: Mud Motor */}
            <line x1="63" y1="210" x2="92" y2="210" stroke="#818cf8" strokeWidth="0.75" strokeDasharray="2,2" />
            <circle cx="92" cy="210" r="1" fill="#818cf8" />
            <text x="98" y="213" fill="#818cf8" fontSize="6.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">DOWNHOLE MOTOR</text>

            {/* Label 5: PDC Bit */}
            <line x1="70" y1="275" x2="92" y2="275" stroke="#f59e0b" strokeWidth="0.75" strokeDasharray="2,2" />
            <circle cx="92" cy="275" r="1" fill="#f59e0b" />
            <text x="98" y="278" fill="#f59e0b" fontSize="6.5" fontWeight="bold" fontFamily="monospace" letterSpacing="0.05em">PDC DRILL BIT</text>

            {/* 1. Drill Pipe Connection (y: 10 - 50) */}
            <rect x="42" y="10" width="16" height="40" fill="url(#metalGlow)" rx="1" />
            <line x1="42" y1="20" x2="58" y2="20" stroke="#0f172a" strokeWidth="1" />
            <line x1="42" y1="30" x2="58" y2="30" stroke="#0f172a" strokeWidth="1" />
            <line x1="42" y1="40" x2="58" y2="40" stroke="#0f172a" strokeWidth="1" />

            {/* 2. MWD Telemetry Collar (y: 50 - 110) */}
            <rect x="38" y="50" width="24" height="60" fill="url(#glowingTeal)" rx="1" className="opacity-80 shadow-[0_0_8px_rgba(45,212,191,0.3)]" />
            <rect x="42" y="55" width="16" height="50" fill="url(#metalGlow)" rx="0.5" />
            <circle cx="50" cy="70" r="2.5" fill="#2dd4bf" className="animate-ping" />
            <circle cx="50" cy="90" r="2.5" fill="#2dd4bf" className="animate-pulse" />
            
            {/* Wireless Telemetry mud-pulse waves (Blinks dynamically) */}
            <path d="M 28,65 Q 18,70 28,75" fill="none" stroke="#2dd4bf" strokeWidth="1.5" className="animate-pulse" />
            <path d="M 72,65 Q 82,70 72,75" fill="none" stroke="#2dd4bf" strokeWidth="1.5" className="animate-pulse" />
            <path d="M 24,60 Q 12,70 24,80" fill="none" stroke="#0d9488" strokeWidth="1" className="animate-ping" />
            <path d="M 76,60 Q 88,70 76,80" fill="none" stroke="#0d9488" strokeWidth="1" className="animate-ping" />

            {/* 3. Drill Collars with Stabilizer Blades (y: 110 - 180) */}
            <rect x="36" y="110" width="28" height="70" fill="url(#metalGlow)" rx="1" />
            
            {/* Stabilizer Blades (Flashes warnings in red if vibration is excessive!) */}
            <rect x="28" y="125" width="8" height="35" rx="1" fill={vibrationG > 4.5 ? "#ef4444" : "url(#stabilizerBlade)"} className={`transition-all duration-300 ${vibrationG > 4.5 ? 'animate-pulse shadow-[0_0_10px_#ef4444]' : ''}`} />
            <rect x="64" y="125" width="8" height="35" rx="1" fill={vibrationG > 4.5 ? "#ef4444" : "url(#stabilizerBlade)"} className={`transition-all duration-300 ${vibrationG > 4.5 ? 'animate-pulse shadow-[0_0_10px_#ef4444]' : ''}`} />
            <rect x="47" y="125" width="6" height="35" rx="1" fill="url(#stabilizerBlade)" />
            
            {/* Helical spiral groove cuts on collar */}
            <path d="M 36,115 L 64,130" stroke="#0f172a" strokeWidth="1.5" />
            <path d="M 36,135 L 64,150" stroke="#0f172a" strokeWidth="1.5" />
            <path d="M 36,155 L 64,170" stroke="#0f172a" strokeWidth="1.5" />

            {/* 4. Directional Mud Motor - Bent Sub (y: 180 - 240) */}
            {/* If in Sliding mode (Directional) it glows, showing active steering bend orientation */}
            {(() => {
              const isSliding = currentPt?.bha_state?.includes("Sliding");
              return (
                <g>
                  {/* Subtle curved bend assembly */}
                  <path 
                    d="M 36,180 L 33,240 L 61,240 L 64,180 Z" 
                    fill={isSliding ? "url(#slideGlow)" : "url(#metalGlow)"} 
                    className="transition-all duration-500" 
                  />
                  {/* Internal power rotor spiral axis indicator */}
                  <path 
                    d="M 48,185 Q 42,210 46,235" 
                    fill="none" 
                    stroke={isSliding ? "#818cf8" : "#1e293b"} 
                    strokeWidth="2" 
                    className={isSliding ? "animate-pulse" : ""} 
                  />
                  {isSliding && (
                    <text x="50" y="215" fill="#e0e7ff" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle" className="animate-pulse tracking-wide">SLIDE ACTIVE</text>
                  )}
                </g>
              );
            })()}

            {/* 5. Rotary PDC Bit Drive Shank & Ring (y: 240 - 260) */}
            <rect x="40" y="240" width="20" height="20" fill="url(#metalGlow)" />
            <circle cx="50" cy="250" r="4" fill="#0f172a" />

            {/* 6. Tungsten-Carbide PDC Drill Bit (y: 260 - 290) */}
            {/* This whole block rotates around (50, 275) if rotating state is active */}
            {(() => {
              const isRotating = currentPt?.bha_state?.includes("Rotating") || (!currentPt?.bha_state && activeTab === 'Rig Telemetry');
              return (
                <g 
                  className={isRotating ? "animate-[spin_2.5s_linear_infinite]" : ""} 
                  style={{ transformOrigin: "50px 275px" }}
                >
                  {/* Bit Body Matrix (Tapered crown) */}
                  <path d="M 30,260 L 70,260 L 66,285 L 58,290 L 42,290 L 34,285 Z" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                  
                  {/* Cutter blades & nozzles details */}
                  <rect x="32" y="263" width="6" height="15" rx="0.5" fill="#f59e0b" />
                  <rect x="62" y="263" width="6" height="15" rx="0.5" fill="#f59e0b" />
                  <rect x="47" y="263" width="6" height="24" rx="0.5" fill="#d97706" />
                  
                  {/* Individual carbide cutting teeth nodes */}
                  <circle cx="35" cy="281" r="2.5" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
                  <circle cx="65" cy="281" r="2.5" fill="#475569" stroke="#1e293b" strokeWidth="0.5" />
                  
                  <circle cx="44" cy="288" r="2.5" fill="#1e293b" />
                  <circle cx="56" cy="288" r="2.5" fill="#1e293b" />
                  
                  {/* Fluid discharge jets (cutting paths) */}
                  <path d="M 38,265 L 38,280" stroke="#38bdf8" strokeWidth="1" opacity="0.8" strokeDasharray="2,1" />
                  <path d="M 62,265 L 62,280" stroke="#38bdf8" strokeWidth="1" opacity="0.8" strokeDasharray="2,1" />
                </g>
              );
            })()}
          </svg>
        </div>
      </div>
      <div className="col-span-1 lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-bold text-slate-100 mb-4">Tool Health Diagnostics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="p-4 bg-slate-950 border border-slate-800 rounded">
              <p className="text-xs text-slate-500 mb-1">MWD Internal Temp</p>
              <p className="text-2xl font-mono text-slate-200">{(80 + (currentDepth / 80)).toFixed(1)} °C</p>
           </div>
           <div className="p-4 bg-slate-950 border border-slate-800 rounded relative overflow-hidden">
              {vibrationG > 4.5 && (
                <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 animate-pulse"></div>
              )}
              <p className="text-xs text-slate-500 mb-1">Lateral Vibration</p>
              <p className={`text-2xl font-mono font-bold transition-all ${vibrationG > 4.5 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>
                {vibrationG.toFixed(2)} <span className="text-xs text-slate-500">G</span>
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('Rig Telemetry');
  const [currentDepth, setCurrentDepth] = useState(12450.0);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [alertLogs, setAlertLogs] = useState<any[]>([]);
  const [chaosMode, setChaosMode] = useState(false);
  const [dataSource, setDataSource] = useState('simulated');
  const [location, setLocation] = useState('permian_basin');
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

  // Sub-Second SSE Telemetry Stream connection
  useEffect(() => {
    console.log(`Omesham: Connecting to SSE telemetry stream... Source: ${dataSource}, Geology: ${location}, Chaos: ${chaosMode}`);
    
    // Reset buffer when swapping data feeds to avoid mixing simulation with real FORGE data
    setTelemetry([]);

    const endpoint = dataSource === 'field'
      ? `http://127.0.0.1:8006/api/field/drilling_stream?location=${location}${chaosMode ? "&chaos=true" : ""}`
      : `http://127.0.0.1:8006/api/drilling/telemetry_stream?location=${location}${chaosMode ? "&chaos=true" : ""}`;

    const eventSource = new EventSource(endpoint);
    
    eventSource.onmessage = (event) => {
      try {
        const pt = JSON.parse(event.data);
        const formattedTimestamp = new Date(pt.timestamp).toLocaleTimeString();
        
        // Handle physical real-world depths from the geothermal well logs
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
        
        // Push to rolling buffer
        setTelemetry(prev => {
          const updated = [...prev, { ...pt, timestamp: formattedTimestamp }];
          if (updated.length > 30) {
            return updated.slice(updated.length - 30);
          }
          return updated;
        });

        // Post message to parent to power the main executive NOC
        if (typeof window !== 'undefined') {
          window.parent.postMessage({
            type: 'OMESHAM_TELEMETRY_UPDATE',
            risk: pt.forecast_risk,
            is_anomaly: pt.is_anomaly,
            anomaly_type: pt.is_anomaly ? pt.anomaly_type : null,
            proactive_alert: pt.proactive_alert
          }, '*');
        }

        // Capture predictive warning alerts and anomalies dynamically for logging
        if (pt.is_anomaly || pt.forecast_risk > 30) {
          const alertType = pt.is_anomaly ? pt.anomaly_type : "Predictive Alert";
          const alertMsg = pt.is_anomaly ? pt.recommended_solution : pt.proactive_alert;
          
          setAlertLogs(prev => {
            const lastLog = prev[prev.length - 1];
            // Deduplicate alerts inside an 8 second window
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
      console.error("Omesham SSE connection dropped, retrying...", err);
    };

    return () => {
      console.log("Omesham: Uncoupling SSE telemetry listener.");
      eventSource.close();
    };
  }, [chaosMode, dataSource, location]);

  // Sync Depth incrementor (only active during synthetic simulation)
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

  // Helper selectors for the operations report
  const getAverage = (key: string) => {
    if (telemetry.length === 0) return 0;
    return telemetry.reduce((acc, val) => acc + val[key], 0) / telemetry.length;
  };

  const getMin = (key: string) => {
    if (telemetry.length === 0) return 0;
    return Math.min(...telemetry.map(pt => pt[key]));
  };

  const getMax = (key: string) => {
    if (telemetry.length === 0) return 0;
    return Math.max(...telemetry.map(pt => pt[key]));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col h-screen w-full bg-slate-950 items-center justify-center text-slate-400 font-mono text-xs tracking-widest">
         <div className="w-10 h-10 border-2 border-slate-800 border-t-amber-500 rounded-full animate-spin mb-4"></div>
         SYNCHRONIZING SECURE NODE IDENTITY...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-300 font-sans overflow-hidden relative">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, header, main, .no-print {
            display: none !important;
          }
          #printable-report {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            color: black !important;
            z-index: 999999 !important;
            padding: 30px !important;
          }
        }
      `}} />

      {/* Sidebar - HIDDEN during print */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col relative z-[100] no-print">
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

      {/* Main Content - HIDDEN during print */}
      <div className="flex-1 flex flex-col relative overflow-x-auto h-full no-print">
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8">
           <h2 className="text-xl font-bold text-slate-100">{activeTab}</h2>
           <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Data Feed Selector */}
              <div className="flex items-center space-x-2 bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-1.5 h-10">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Feed:</span>
                <select
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  className="bg-slate-900 border border-slate-850 rounded-lg text-xs font-bold text-slate-200 px-2.5 py-1 outline-none cursor-pointer hover:border-slate-700 transition-all font-mono"
                >
                  <option value="simulated">Clean Sim</option>
                  <option value="field">Live Utah FORGE</option>
                </select>
              </div>

              {/* Basin Geology (Calibration) Selector */}
              <div className="flex items-center space-x-2 bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-1.5 h-10">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Geology:</span>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-slate-900 border border-slate-850 rounded-lg text-xs font-bold text-slate-200 px-2.5 py-1 outline-none cursor-pointer hover:border-slate-700 transition-all font-mono"
                >
                  <option value="permian_basin">Permian Basin</option>
                  <option value="volve_field">Volve Field</option>
                  <option value="gom_deepwater">GoM Deepwater</option>
                  <option value="arabian_basin">Middle East</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 bg-slate-950/40 border border-slate-800 rounded-xl px-3 py-1.5 h-10 flex-shrink-0">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Stress Mode</span>
                <button
                  onClick={() => {
                    setChaosMode(prev => !prev);
                    console.log("Omesham: Toggled Stress Test Mode:", !chaosMode);
                  }}
                  className={`w-8 h-4.5 rounded-full transition-all duration-300 relative flex items-center p-0.5 ${chaosMode ? 'bg-gradient-to-r from-red-600 to-amber-500 shadow-[0_0_12px_rgba(239,68,68,0.45)]' : 'bg-slate-800'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-all duration-300 ${chaosMode ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
                </button>
              </div>
              <button 
                 onClick={() => setShowReportModal(true)}
                 className="px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-lg flex items-center space-x-1.5 flex-shrink-0 h-10"
              >
                 <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                 <span>Shift Report</span>
              </button>
              <div className="text-right flex-shrink-0 pl-1">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono leading-none">Current Depth</p>
                 <p className="text-sm font-mono font-bold text-amber-400 mt-1 leading-none">{currentDepth.toFixed(1)} <span className="text-[10px] text-slate-600">ft</span></p>
              </div>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 relative h-full">
          <div style={{ display: activeTab === 'Rig Telemetry' ? 'block' : 'none' }} className="h-full">
            <RigTelemetry telemetry={telemetry} currentDepth={currentDepth} />
          </div>
          <div style={{ display: activeTab === 'Trajectory Optimization' ? 'block' : 'none' }} className="h-full">
            <TrajectoryOptimization currentDepth={currentDepth} />
          </div>
          <div style={{ display: activeTab === 'BHA Control' ? 'block' : 'none' }} className="h-full">
            <BHAControl currentDepth={currentDepth} telemetry={telemetry} />
          </div>
        </main>
      </div>

      {/* --- PREMIUM PRINTABLE GLASSMORPHIC OPERATIONS REPORT OVERLAY --- */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[99999] flex items-center justify-center p-6 overflow-y-auto no-print">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col justify-between">
            {/* Modal Header Controls */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  <span>Operations Shift Report — Rig-01</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wider">Automated Drilling Diagnostics Document</p>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-all"
                >
                  Print / Save PDF
                </button>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs uppercase tracking-wider transition-all"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Document Frame */}
            <div id="printable-report" className="bg-slate-950 border border-slate-800 rounded-xl p-8 font-mono text-xs text-slate-300 leading-relaxed shadow-inner">
              {/* Header Box */}
              <div className="border-b-2 border-slate-700 pb-6 mb-6 flex justify-between items-start">
                <div>
                  <h1 className="text-lg font-bold text-slate-100 uppercase tracking-widest">OMESHAM RIG INTELLIGENCE CORE</h1>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold uppercase font-mono">Security Identity: SSO OPERATOR SECURE NODE</p>
                  <p className="text-[10px] text-slate-400 mt-1">Generated: {new Date().toLocaleString()}</p>
                </div>
                <div className="text-right border-l border-slate-800 pl-6 font-mono">
                  <p className="text-slate-500 uppercase font-semibold text-[10px]">Shift Summary Status</p>
                  <p className="text-emerald-400 font-bold text-sm uppercase tracking-wide mt-1">✓ Nominally Standard</p>
                  <p className="text-slate-400 mt-1">Interval Depth: {currentDepth.toFixed(1)} ft</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="mb-6">
                <h2 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">1. Torsional & Hydraulic Performance Averages</h2>
                <div className="grid grid-cols-4 gap-4 bg-slate-900/50 border border-slate-800/80 rounded-lg p-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Weight on Bit</span>
                    <span className="text-slate-200 text-sm font-bold font-mono block mt-1">{getAverage('wob_klbs').toFixed(1)} <span className="text-[10px] text-slate-500">klbs</span></span>
                    <span className="text-[10px] text-slate-600 font-mono mt-0.5 block">Min: {getMin('wob_klbs').toFixed(1)} / Max: {getMax('wob_klbs').toFixed(1)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Rotary Speed</span>
                    <span className="text-slate-200 text-sm font-bold font-mono block mt-1">{getAverage('rpm').toFixed(0)} <span className="text-[10px] text-slate-500">RPM</span></span>
                    <span className="text-[10px] text-slate-600 font-mono mt-0.5 block">Min: {getMin('rpm').toFixed(0)} / Max: {getMax('rpm').toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Standpipe Pressure</span>
                    <span className="text-slate-200 text-sm font-bold font-mono block mt-1">{getAverage('spp_psi').toFixed(0)} <span className="text-[10px] text-slate-500">PSI</span></span>
                    <span className="text-[10px] text-slate-600 font-mono mt-0.5 block">Min: {getMin('spp_psi').toFixed(0)} / Max: {getMax('spp_psi').toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Avg ROP rate</span>
                    <span className="text-slate-200 text-sm font-bold font-mono block mt-1">{getAverage('rop_fph').toFixed(1)} <span className="text-[10px] text-slate-500">ft/hr</span></span>
                    <span className="text-[10px] text-slate-600 font-mono mt-0.5 block">Min: {getMin('rop_fph').toFixed(0)} / Max: {getMax('rop_fph').toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Trajectory Optimization Card */}
              <div className="mb-6">
                <h2 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">2. Wellbore Trajectory Optimization Profile</h2>
                <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-lg space-y-2">
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Vertical Depth (TVD):</span>
                    <span className="font-bold text-slate-200">{(currentDepth * 0.95).toFixed(1)} ft</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/60 pb-1">
                    <span className="text-slate-400">Total Departure:</span>
                    <span className="font-bold text-slate-200">{(currentDepth * 0.15).toFixed(1)} ft</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-400">Steering Method / Mode:</span>
                    <span className="font-bold text-teal-400">3D Continuous RSS steering</span>
                  </div>
                </div>
              </div>

              {/* AI Alert Logs */}
              <div>
                <h2 className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-3 border-b border-slate-800 pb-1">3. Live AI Co-Driller Preventive Action Logs</h2>
                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-2">
                  {alertLogs.length === 0 ? (
                    <p className="text-slate-500 italic p-4 text-center border border-slate-800/60 rounded bg-slate-900/30">No torsional anomalies or preventive hazards detected during this shift. Well dynamics remaining stable.</p>
                  ) : (
                    alertLogs.map((log, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-slate-900/40 border border-slate-800 rounded text-[11px]">
                        <div className="flex-1 pr-6">
                          <p className={`font-bold ${log.type === "Predictive Alert" ? 'text-amber-400' : 'text-red-400'} uppercase flex items-center space-x-1.5`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{log.type} ({log.risk.toFixed(0)}% risk)</span>
                          </p>
                          <p className="text-slate-400 mt-1 font-sans text-xs">{log.message}</p>
                        </div>
                        <div className="text-right text-[10px] text-slate-500 font-mono shrink-0">
                          {log.timestamp}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="border-t border-slate-800 mt-8 pt-8 flex justify-between font-mono">
                <div className="border-t border-slate-700 w-44 pt-2 text-center text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                  Drilling Superintendent
                </div>
                <div className="border-t border-slate-700 w-44 pt-2 text-center text-[9px] uppercase tracking-wider text-slate-500 font-semibold">
                  Authorized AI Auditor
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
