import { GameState, GameConfig } from './types';

export const SYSTEM_PROMPT = `
你是一个“回合制互动叙事游戏引擎”，负责运行一款单人第一人称体育策略叙事游戏。

【游戏背景】
- 地点：浙江大学紫金港校区操场
- 赛事：“首届浙江大学‘三好杯’极限飞盘赛”
- 玩家角色：王越（海宁校区飞盘队队长，大一新生）
- 剧情背景：海宁校区首次参赛，由于校区隔离，无法借调紫金港校队（Hawksoar）的强力外援，只能依靠几名性格各异的队友。

【游戏目标】
- 通过对话选择、道具使用、阵容安排和羁绊管理来赢得比赛。
- 游戏包含多重结局。“真结局（True Ending）”需要满足特定前置条件，并在最终一分以 10:9 绝杀获胜。

【你的职责】
1. 裁判：严格执行比赛规则和数值逻辑。绝不放水，绝不作弊。
2. 旁白：用**简体中文**描述比赛过程。文风应紧张、克制、热血，避免过度夸张的修辞。
3. 引擎：维护游戏状态、比分、羁绊触发记录，并支持回合制推进。

【严格约束（禁止违反）】
- 所有输出必须是有效的 JSON 格式。
- **严禁**在 JSON 之外输出任何文本。
- **严禁**虚构输入中不存在的球员、羁绊、数值或规则。
- **严禁**向玩家暴露隐藏的剧情变量。
- 除非满足规则条件，**严禁**提前宣布胜利或失败。
- 所有剧情文本（scene, objective, options 等）必须使用**简体中文**。

你必须始终假设：这是一场真实、严肃的竞技比赛，而不是“剧情杀”的过家家。
`;

export const DEVELOPER_PROMPT = `
你将运行一个“固定机制，数值可配”的回合制比赛系统。

────────────────
【输入结构】
────────────────
每回合，用户提供两个 JSON 对象：
1) state: 当前游戏状态（包含 meta, visible_state, match, roster 等）
2) config: 配置参数（包含 threshold_curve, stamina_tiers, players, synergies 等）

你必须：
- 仅基于 config 和 state 进行计算。
- 如果 config 字段缺失，使用合理的默认值并在 system.message 中注明。

────────────────
【阶段规则 (PHASE RULES)】
────────────────
- 若 state.meta.phase 为 "night_before" 或 "matchday_pre"：
  - 这只是剧情/RPG 阶段。
  - options 必须为对话或行动选择。
  - **不得**要求玩家选择阵容 (Lineup)。
  - **不得**进行比赛得分计算。
  - lineup_module 在输出中应为空或 null。
  
- 若 state.meta.phase 切换到 "match_play"：
  - 进入正式比赛逻辑。
  - options 包含阵容调整、战术选择。
  - 必须输出 lineup_module 并进行得分判定。

────────────────
【UI 可见性规则（必须遵守）】
────────────────
【HUD（玩家可见）】
- 王越 体温 (state.visible_state.temperature)
- 王越 自身体力 (state.visible_state.self_stamina)
- 背包 (state.visible_state.inventory)

【阵容选择模块（半可见）- 仅在 match_play 阶段】
- 球员基础评分 (base_score)
- 球员体力 (stamina)
- 达标分 (required_score)
- 队伍总分 (team_score)
- 生效羁绊

**禁止**在任何地方显示：
- 隐藏剧情变量 (story_flags_hidden)
- 羁绊内部逻辑

────────────────
【比赛结构 (match_play)】
────────────────
- 比赛为回合制，逐分结算。
- 每一分（Point）= 一次“阵容属性结算”。
- 根据 state.match.total_points 和 config.threshold_curve 确定当前 required_score。

────────────────
【阈值系统】
────────────────
- 使用 config.threshold_curve
- 结构: { "max_total_points_exclusive": 8, "required_score": 35 }
- 含义: 若当前总分 < max_total_points_exclusive，则使用该 required_score。按顺序匹配。

────────────────
【有效评分计算 (Effective Score)】
────────────────
对于场上每位球员：
- T1, T2 读取自 config.stamina_tiers
- 体力 ≥ T1 → 有效分 = 基础分
- T2 ≤ 体力 < T1 → 有效分 = 基础分 - 1
- 体力 < T2 → 有效分 = 基础分 - 2
- 有效分最低根据 config.scoring_rules.min_effective_score (默认 1)

────────────────
【队伍总分计算 (Team Score)】
────────────────
team_score = Σ(场上球员有效分) + 羁绊加成
若 team_score ≥ required_score → 我方得 1 分 (state.match.our_score +1)。
否则，敌方得 1 分 (state.match.opp_score +1)。

────────────────
【羁绊系统 (Synergy)】
────────────────
- 每回合最多触发 config.scoring_rules.synergy_per_turn_limit 次。
- 数据来源 config.synergies。
- 检查 `requires` 列表中的球员是否都在场。
- 优先触发分数最高且未使用的羁绊。
- 若所有满足条件的羁绊都已使用，且 config.synergy_fallback.enabled 为真，且 state.synergy_tracker.fallback_used_count < max_uses，则触发保底（分数 * multiplier）。

────────────────
【体力与体温结算】
────────────────
- 每回合结束后，根据 config.players 定义消耗/恢复值。
- 王越的体力/体温变化受 config.wangyue_special 和 status_effects 影响。
- 处理物品效果 (state.visible_state.inventory)。

────────────────
【输出要求 (强制)】
────────────────
每回合必须输出包含以下字段的有效 JSON：
scene, objective, visible_state, lineup_module (仅 match_play), options, system, state
`;

export const USER_PROMPT_TEMPLATE = `
当前游戏状态 (State):
{{STATE_JSON}}

当前配置 (Config):
{{CONFIG_JSON}}

用户上一回合行动:
"{{USER_ACTION}}"

请根据以上信息推进一个回合。

要求：
1. 用简体中文描述当前场景（≤200字，写实比赛风格与心理描写）。
2. 给出当前阶段的目标（objective）。
3. 如果是比赛阶段 (match_play)，计算并展示 required_score 和 team_score。如果是剧情阶段，忽略此项。
4. 如果触发羁绊，显示 synergy_applied。
5. 提供 2–4 个可选行动。
6. 更新并返回新的 state。
7. 严格遵守 Phase Rules。

严格只输出 JSON。
`;

export const INITIAL_CONFIG: GameConfig = {
  game: {
    target_final_score: { us: 10, them: 9 },
    phases: ["night_before", "matchday_pre", "match_play"],
    max_options_per_turn: 4
  },

  threshold_curve: [
    { max_total_points_exclusive: 8, required_score: 35 },
    { max_total_points_exclusive: 14, required_score: 40 },
    { max_total_points_exclusive: 999, required_score: 45 }
  ],

  stamina_tiers: { T1: 60, T2: 30 },

  scoring_rules: {
    scheme: "B",
    min_effective_score: 1,
    synergy_apply_mode: "team_total_only",
    synergy_per_turn_limit: 1,
    synergy_choose_rule: "highest_untriggered_else_fallback"
  },

  synergy_fallback: {
    enabled: true,
    multiplier: 0.5,
    max_uses: 1
  },

  players: {
    "__default__": { base_score: 6, stamina_init: 100, on_field_cost: 20, rest_gain: 5 },

    "王越": { base_score: 10, stamina_init: 100, on_field_cost: 30, rest_gain: 0 },
    "李玥燊": { base_score: 8, stamina_init: 100, on_field_cost: 10, rest_gain: 5 },
    "林子超": { base_score: 9, stamina_init: 100, on_field_cost: 10, rest_gain: 5 },
    "刘恒宇": { base_score: 5, stamina_init: 100, on_field_cost: 20, rest_gain: 5 },
    "冯一郎": { base_score: 6, stamina_init: 100, on_field_cost: 10, rest_gain: 5 },
    "乔天同": { base_score: 6, stamina_init: 100, on_field_cost: 20, rest_gain: 5 }
  },

  synergies: [
    { id: "LQ15", name: "刘恒宇×乔天同 默契爆发", points: 15, requires: ["刘恒宇", "乔天同"], once_per_match: true },
    { id: "LL5", name: "李玥燊×林子超 双核联动", points: 5, requires: ["李玥燊", "林子超"], once_per_match: false },
    { id: "LF4", name: "李玥燊×冯一郎 稳定传导", points: 4, requires: ["李玥燊", "冯一郎"], once_per_match: false },
    { id: "CF5", name: "林子超×冯一郎 防守协作", points: 5, requires: ["林子超", "冯一郎"], once_per_match: false },
    { id: "LY3", "name": "刘恒宇×李玥燊 中场衔接", points: 3, requires: ["刘恒宇", "李玥燊"], once_per_match: false },
    { id: "LF5", "name": "刘恒宇×冯一郎 快攻转换", points: 5, requires: ["刘恒宇", "冯一郎"], once_per_match: false }
  ],

  wangyue_special: {
    auto_win_condition: { self_stamina_gt: 80, temperature_lt: 37.0 },
    cold_mode: { on_field_self_stamina_cost: 30, temperature_increase_per_field: 2, rest_gain: 0 },
    healthy_mode: { on_field_self_stamina_cost: 10, rest_gain: 5, temperature_lock: 35.0 }
  },

  items: {
    vodka: {
      id: "vodka",
      name: "小瓶vodka",
      effect: "lower_temperature",
      lower_temperature_amount: 2.0,
      duration_turns: 3,
      repeatable: false
    },
    toilet_pass: {
      id: "toilet_pass",
      name: "厕所通行卡",
      effect: "pause_temperature_increase",
      duration_turns: 1,
      rebound_next_turn_double_increase: true
    },
    cold_medicine: {
      id: "cold_medicine",
      name: "感冒药",
      effect: "remove_cold_buff_requires_choice",
      requires_water_choice: true,
      combo_with_vodka_required: true,
      after_turns: 2,
      result: "remove_cold_buff_and_lock_temp_35_and_change_stamina_rules"
    }
  }
};

export const INITIAL_STATE: GameState = {
  meta: {
    phase: "night_before",
    turn: 0,
    checkpoint_id: "CP0_NIGHT_START",
    notes: "比赛日前夜：对话与关键前置条件阶段"
  },

  visible_state: {
    temperature: 36.6,
    self_stamina: 100,
    inventory: []
  },

  match: {
    our_score: 0,
    opp_score: 0,
    total_points: 0,
    required_score: 35,
    last_team_score: null,
    last_synergy_applied: null
  },

  roster: {
    players: [
      { name: "王越", stamina: 100, base_score: 10, available: true, role: "队长" },
      { name: "李玥燊", stamina: 100, base_score: 8, available: true, role: "主力" },
      { name: "林子超", stamina: 100, base_score: 9, available: true, role: "主力" },
      { name: "刘恒宇", stamina: 100, base_score: 5, available: true, role: "辅助" },
      { name: "冯一郎", stamina: 100, base_score: 6, available: true, role: "辅助" },
      { name: "乔天同", stamina: 100, base_score: 6, available: true, role: "辅助" },
      { name: "队员A", stamina: 100, base_score: 6, available: true, role: "替补" },
      { name: "队员B", stamina: 100, base_score: 6, available: true, role: "替补" }
    ]
  },

  lineup: {
    selected: [],
    locked: false
  },

  status_effects: {
    wangyue: {
      cold_buff_active: true,
      cold_buff_removed: false,
      vodka_active_rounds_left: 0,
      toilet_pause_active_rounds_left: 0,
      toilet_rebound_pending: false
    }
  },

  synergy_tracker: {
    used_synergy_ids: [],
    fallback_used_count: 0
  },

  story_flags_hidden: {
    feng_joined: false,
    liu_qiao_trust_built: false,
    feng_carries_medicine: false,
    true_ending_eligible: false
  },

  checkpoints: [
    {
      id: "CP0_NIGHT_START",
      label: "比赛日前夜·起点",
      phase: "night_before",
      turn: 0
    }
  ],
  
  history: []
};
