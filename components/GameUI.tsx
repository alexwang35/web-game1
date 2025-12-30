import React, { useRef, useEffect } from 'react';
import { EngineOutput } from '../types';
import PlayerCard from './PlayerCard';
import { Thermometer, HeartPulse, Trophy, Box, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GameUIProps {
  engineOutput: EngineOutput;
  onOptionSelect: (optionLabel: string) => void;
  loading: boolean;
}

const GameUI: React.FC<GameUIProps> = ({ engineOutput, onOptionSelect, loading }) => {
  const { scene, objective, visible_state, lineup_module, options, state } = engineOutput;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [scene]);

  const scoreDiff = visible_state.score_us - visible_state.score_enemy;

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-2rem)]">
      
      {/* LEFT COLUMN: Narrative & Context */}
      <div className="lg:col-span-7 flex flex-col gap-6 h-full overflow-hidden">
        
        {/* Scoreboard Header */}
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 shadow-lg flex justify-between items-center shrink-0">
          <div className="flex flex-col items-center">
             <span className="text-xs text-slate-400 uppercase tracking-widest">海宁 (我方)</span>
             <span className="text-4xl font-mono font-bold text-emerald-400">{visible_state.score_us}</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-mono text-slate-500">TURN {state.turn}</span>
            <div className="h-px w-12 bg-slate-700"></div>
            <span className="text-xs font-mono text-slate-500">VS</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-xs text-slate-400 uppercase tracking-widest">Hawksoar (敌方)</span>
             <span className="text-4xl font-mono font-bold text-rose-500">{visible_state.score_enemy}</span>
          </div>
        </div>

        {/* Narrative Box */}
        <div className="flex-grow bg-slate-950 rounded-xl border border-slate-800 p-6 overflow-y-auto relative shadow-inner">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-20"></div>
           
           <div className="space-y-6">
             {/* Objective */}
             <div className="flex items-start gap-3 bg-indigo-950/30 p-3 rounded border border-indigo-500/20">
                <Trophy className="text-indigo-400 shrink-0 mt-1" size={18} />
                <div>
                  <h4 className="text-xs font-bold text-indigo-300 uppercase mb-1">当前目标</h4>
                  <p className="text-sm text-indigo-100">{objective}</p>
                </div>
             </div>

             {/* Scene Text */}
             <div className="prose prose-invert prose-lg max-w-none">
               <p className="leading-relaxed text-slate-200 whitespace-pre-wrap font-serif tracking-wide">{scene}</p>
             </div>
             
             <div ref={messagesEndRef} />
           </div>
        </div>

        {/* Options */}
        <div className="shrink-0 space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">可用行动</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onOptionSelect(opt.label)}
                disabled={loading}
                className="group relative px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-indigo-400 rounded-lg text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                   <span className="font-semibold text-slate-200 group-hover:text-white">{opt.label}</span>
                   {opt.action_type === 'item' && <Box size={16} className="text-amber-400" />}
                   {opt.action_type === 'tactic' && <Trophy size={16} className="text-purple-400" />}
                </div>
                {loading && <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center rounded-lg">...</div>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: HUD & Stats */}
      <div className="lg:col-span-5 flex flex-col gap-6 h-full overflow-y-auto pr-1">
        
        {/* Wang Yue Status (HUD) */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <UserIconLarge />
          </div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">王越 [队长]</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-slate-300">
                <Thermometer size={18} className={visible_state.temperature > 37.5 ? 'text-red-500' : 'text-emerald-500'} />
                <span className="text-xs uppercase">体温</span>
              </div>
              <span className={`text-2xl font-mono font-bold ${visible_state.temperature > 38 ? 'text-red-400' : 'text-slate-100'}`}>
                {visible_state.temperature.toFixed(1)}°C
              </span>
              {visible_state.temperature > 38 && <span className="text-xs text-red-500 animate-pulse">高烧警告</span>}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-slate-300">
                <HeartPulse size={18} className={visible_state.self_stamina < 30 ? 'text-red-500' : 'text-emerald-500'} />
                <span className="text-xs uppercase">体力</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-mono font-bold text-slate-100">{visible_state.self_stamina}</span>
                <span className="text-xs text-slate-500">/ 100</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${visible_state.self_stamina < 30 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${visible_state.self_stamina}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className="mt-6">
            <h4 className="text-xs text-slate-500 uppercase mb-2">背包物品</h4>
            <div className="flex gap-2 flex-wrap">
              {visible_state.inventory.map((item, idx) => (
                <div key={idx} className="bg-slate-800 px-2 py-1 rounded border border-slate-700 text-xs text-amber-200 flex items-center gap-1" title={item.effect_desc}>
                  <Box size={12} />
                  {item.name} x{item.count}
                </div>
              ))}
              {visible_state.inventory.length === 0 && <span className="text-xs text-slate-600 italic">空</span>}
            </div>
          </div>
        </div>

        {/* Tactical Analysis (Lineup Module) */}
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-700 shadow-lg flex-grow">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">场上局势</h3>
           
           <div className="mb-6 flex items-center justify-between bg-slate-950 p-4 rounded-lg border border-slate-800">
             <div className="text-center">
               <div className="text-xs text-slate-500 mb-1">本回合达标分</div>
               <div className="text-2xl font-mono font-bold text-indigo-400">{lineup_module.required_score}</div>
             </div>
             <div className="text-slate-700 font-mono">VS</div>
             <div className="text-center">
               <div className="text-xs text-slate-500 mb-1">队伍总潜力</div>
               <div className={`text-2xl font-mono font-bold ${lineup_module.team_score >= lineup_module.required_score ? 'text-emerald-400' : 'text-red-400'}`}>
                 {lineup_module.team_score}
               </div>
             </div>
           </div>

           {lineup_module.synergy_applied && (
             <div className={`mb-6 p-3 rounded border ${lineup_module.is_fallback ? 'bg-amber-900/20 border-amber-500/30' : 'bg-indigo-900/20 border-indigo-500/30'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className={lineup_module.is_fallback ? 'text-amber-400' : 'text-indigo-400'} />
                  <span className={`text-xs font-bold uppercase ${lineup_module.is_fallback ? 'text-amber-300' : 'text-indigo-300'}`}>
                    {lineup_module.is_fallback ? '羁绊保底触发' : '羁绊已激活'}
                  </span>
                </div>
                <div className="text-sm text-slate-200 font-medium">
                  {lineup_module.synergy_applied}
                </div>
             </div>
           )}

           <div className="space-y-2">
             <h4 className="text-xs text-slate-500 uppercase mb-2">阵容状态</h4>
             <div className="grid grid-cols-1 gap-2">
               {state.players.map(p => (
                 <PlayerCard key={p.id} player={p} isWangYue={p.id === 'wang_yue'} />
               ))}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

const UserIconLarge = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" className="text-white">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
  </svg>
);

export default GameUI;