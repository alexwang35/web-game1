export interface Player {
  name: string;
  base_score: number;
  stamina: number;
  available: boolean;
  role?: string;
}

export interface Item {
  id: string;
  name: string;
  count?: number;
  effect_desc?: string;
  effect?: string;
}

export interface MatchState {
  our_score: number;
  opp_score: number;
  total_points: number;
  required_score: number;
  last_team_score: number | null;
  last_synergy_applied: string | null;
}

export interface GameState {
  meta: {
    phase: string;
    turn: number;
    checkpoint_id: string;
    notes: string;
  };
  visible_state: {
    temperature: number;
    self_stamina: number;
    inventory: Item[];
  };
  match: MatchState;
  roster: {
    players: Player[];
  };
  lineup: {
    selected: string[];
    locked: boolean;
  };
  status_effects: {
    wangyue: {
      cold_buff_active: boolean;
      cold_buff_removed: boolean;
      vodka_active_rounds_left: number;
      toilet_pause_active_rounds_left: number;
      toilet_rebound_pending: boolean;
    };
  };
  synergy_tracker: {
    used_synergy_ids: string[];
    fallback_used_count: number;
  };
  story_flags_hidden: Record<string, boolean>;
  checkpoints: any[];
  history: string[]; // Keep history for logs if needed, or remove if not in new state (user didn't provide history in new JSON, but engine needs it usually. I'll make it optional or implicit)
}

export interface GameConfig {
  game: {
    target_final_score: { us: number; them: number };
    phases: string[];
    max_options_per_turn: number;
  };
  threshold_curve: { max_total_points_exclusive: number; required_score: number }[];
  stamina_tiers: Record<string, number>;
  scoring_rules: any;
  synergy_fallback: any;
  players: Record<string, any>;
  synergies: any[];
  wangyue_special: any;
  items: Record<string, any>;
}

export interface LineupModule {
  required_score: number;
  team_score: number;
  synergy_applied?: string;
  is_fallback?: boolean;
  effective_scores: Record<string, number>;
}

export interface GameOption {
  id: string;
  label: string;
  action_type: 'tactic' | 'item' | 'roster' | 'dialogue';
}

export interface EngineOutput {
  scene: string;
  objective: string;
  visible_state: {
    temperature: number;
    self_stamina: number;
    inventory: Item[];
  };
  lineup_module?: LineupModule;
  options: GameOption[];
  system: {
    message?: string;
    game_over?: boolean;
    victory?: boolean;
  };
  state: GameState;
}
