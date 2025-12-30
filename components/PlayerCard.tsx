import React from 'react';
import { Player } from '../types';
import { User, Activity, Zap } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  isWangYue?: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, isWangYue = false }) => {
  const getStaminaColor = (val: number) => {
    if (val > 60) return 'text-emerald-400';
    if (val > 30) return 'text-yellow-400';
    return 'text-red-500';
  };

  return (
    <div className={`p-3 rounded-lg border ${isWangYue ? 'bg-slate-800 border-indigo-500/50' : 'bg-slate-900 border-slate-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <User size={16} className={isWangYue ? 'text-indigo-400' : 'text-slate-400'} />
          <span className={`font-bold ${isWangYue ? 'text-indigo-100' : 'text-slate-200'}`}>{player.name}</span>
        </div>
        <span className="text-xs font-mono text-slate-500">{player.role}</span>
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1">
          <Activity size={14} className="text-slate-500" />
          <span className="text-slate-400">评分:</span>
          <span className="font-mono">{player.base_score}</span>
        </div>
        <div className="flex items-center gap-1">
          <Zap size={14} className="text-slate-500" />
          <span className="text-slate-400">体力:</span>
          <span className={`font-mono font-bold ${getStaminaColor(player.stamina)}`}>{player.stamina}</span>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;