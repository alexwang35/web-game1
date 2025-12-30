export interface Player {
  id: string;
  name: string;
  base_score: number;
  stamina: number;
  role: string;
}

export interface Item {
  id: string;
  name: string;
  count: number;
  effect_desc: string;
}

export interface Synergy {
  id: string;
  name: string;
  condition_desc: string;
  bonus: number;
  triggered: boolean;
}

export interface GameState {
  turn: number;
  score_us: number;
  score_enemy: number;
  self_stamina: number; // Wang Yue's stamina
  temperature: number; // Wang Yue's temperature
  players: Player[];
  inventory: Item[];
  triggered_synergies: string[]; // List of IDs
  history: string[]; // Log of previous turns
  active_buffs: string[];
}

export interface ThresholdCurve {
  range: [number, number];
  required: number;
}

export interface GameConfig {
  threshold_curve: ThresholdCurve[];
  stamina_tiers: {
    t1: number;
    t2: number;
  };
  synergies: Synergy[];
  synergy_fallback: {
    enabled: boolean;
    max_uses: number;
    multiplier: number;
  };
  items: any[]; // Simplified for config
  players_metadata: any[];
}

export interface LineupModule {
  required_score: number;
  team_score: number;
  synergy_applied?: string;
  is_fallback?: boolean;
  effective_scores: Record<string, number>; // player_id -> effective score
}

export interface GameOption {
  id: string;
  label: string;
  action_type: 'tactic' | 'item' | 'roster';
}

export interface EngineOutput {
  scene: string;
  objective: string;
  visible_state: {
    temperature: number;
    self_stamina: number;
    score_us: number;
    score_enemy: number;
    inventory: Item[];
  };
  lineup_module: LineupModule;
  options: GameOption[];
  system: {
    message?: string;
    game_over?: boolean;
    victory?: boolean;
  };
  state: GameState;
}
