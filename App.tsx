import React, { useState, useEffect } from 'react';
import { GameState, GameConfig, EngineOutput } from './types';
import { INITIAL_CONFIG, INITIAL_STATE } from './constants';
import { generateNextTurn } from './services/geminiService';
import GameUI from './components/GameUI';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [gameConfig] = useState<GameConfig>(INITIAL_CONFIG);
  const [engineOutput, setEngineOutput] = useState<EngineOutput | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initial Logic: Check for API Key selection (specific to Project IDX/AI Studio env)
  useEffect(() => {
    const checkApiKey = async () => {
      // Logic for AI Studio embedded environment
      const aistudio = (window as any).aistudio;
      if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        if (!hasKey) {
          // If no key selected, force selection before starting
          try {
            await aistudio.openSelectKey();
            // Assume success after dialog close, or user will re-trigger
          } catch (e) {
            console.error("Key selection failed/cancelled", e);
            setError("需要选择 API Key 才能开始游戏。");
          }
        }
      }
    };
    checkApiKey();
  }, []);

  const handleTurn = async (action: string) => {
    setLoading(true);
    setError(null);
    try {
      // Important: Create a new GenAI instance or ensure the existing one picks up the key
      // The service layer handles environment variable access.
      // In the AI Studio iframe context, the env var is injected after selection.
      
      const response = await generateNextTurn(gameState, gameConfig, action);
      
      setEngineOutput(response);
      setGameState(response.state);
    } catch (err: any) {
      console.error(err);
      setError("与裁判引擎通信失败，请重试。（" + err.message + "）");
    } finally {
      setLoading(false);
    }
  };

  const startGame = () => {
    setHasStarted(true);
    handleTurn("开始游戏。我踏入赛场。");
  };

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-indigo-600 tracking-tighter">
            三好杯
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-light">
            浙江大学 · 海宁校区 · 极限飞盘
          </p>
          
          <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800 text-left space-y-4">
             <p className="text-slate-300 leading-relaxed">
               你是 <strong>王越</strong>，海宁校区飞盘队的新人队长。
               你们的对手是不可一世的校队霸主 —— <strong>Hawksoar（紫金港）</strong>。
             </p>
             <p className="text-slate-300 leading-relaxed">
               没有替补。身患高烧。
               管理体力，触发羁绊，做出正确的战术选择。
               你能带领队伍打出“真结局”吗？
             </p>
          </div>

          <div className="flex flex-col gap-4 items-center">
            {error && (
               <div className="bg-red-900/50 text-red-200 px-4 py-2 rounded border border-red-800 text-sm">
                 {error}
               </div>
            )}
            
            <button
              onClick={startGame}
              disabled={loading}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-indigo-500/50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : "进入赛场"}
            </button>
            
            <p className="text-xs text-slate-600">
               Powered by Gemini 2.5 · React 18 · Tailwind
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30">
      {engineOutput ? (
        <GameUI 
          engineOutput={engineOutput} 
          onOptionSelect={handleTurn} 
          loading={loading}
        />
      ) : (
        <div className="h-screen flex items-center justify-center">
           <Loader2 className="animate-spin text-indigo-500" size={48} />
        </div>
      )}
    </div>
  );
};

export default App;