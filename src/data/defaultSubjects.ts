import {
  SubjectDefinition,
  TargetUniversity,
  MockExamSession,
  SubjectScoreData,
  SubjectCourseOption,
  SectionDefinition,
} from '../types';

export const SCIENCE_COURSE_OPTIONS: SubjectCourseOption[] = [
  // 基礎科目（各50点満点：文系受験者の2科目選択など）
  {
    id: 'chem_basic',
    name: '化学基礎（50点満点）',
    shortName: '化学基礎',
    maxScore: 50,
    defaultTarget: 40,
    sections: [
      { id: 'cb_1', name: '第1問', maxScore: 25, topic: '物質の構成・化学結合・物質量（小問集合）' },
      { id: 'cb_2', name: '第2問', maxScore: 25, topic: '酸と塩基・酸化還元・総合問題' },
    ],
  },
  {
    id: 'bio_basic',
    name: '生物基礎（50点満点）',
    shortName: '生物基礎',
    maxScore: 50,
    defaultTarget: 40,
    sections: [
      { id: 'bb_1', name: '第1問', maxScore: 17, topic: '生物と遺伝子・細胞とエネルギー' },
      { id: 'bb_2', name: '第2問', maxScore: 16, topic: '生物の体内環境の維持（自律神経・ホルモン・免疫）' },
      { id: 'bb_3', name: '第3問', name_sub: '', maxScore: 17, topic: '生物の多様性と生態系' } as SectionDefinition,
    ],
  },
  {
    id: 'phys_basic',
    name: '物理基礎（50点満点）',
    shortName: '物理基礎',
    maxScore: 50,
    defaultTarget: 40,
    sections: [
      { id: 'pb_1', name: '第1問', maxScore: 18, topic: '小問集合（運動・熱・波・電気・エネルギー）' },
      { id: 'pb_2', name: '第2問', maxScore: 16, topic: '力学・波動分野' },
      { id: 'pb_3', name: '第3問', maxScore: 16, topic: '熱・電磁気・エネルギー分野' },
    ],
  },
  {
    id: 'earth_basic',
    name: '地学基礎（50点満点）',
    shortName: '地学基礎',
    maxScore: 50,
    defaultTarget: 40,
    sections: [
      { id: 'eb_1', name: '第1問', maxScore: 15, topic: '固体地球・地層と地球の歴史' },
      { id: 'eb_2', name: '第2問', maxScore: 13, topic: '大気と海洋・気象' },
      { id: 'eb_3', name: '第3問', maxScore: 12, topic: '宇宙・太陽系と恒星' },
      { id: 'eb_4', name: '第4問', maxScore: 10, topic: '自然環境と防災' },
    ],
  },
  // 専門科目（各100点満点：理系受験者など）
  {
    id: 'phys',
    name: '物理（100点満点）',
    shortName: '物理',
    maxScore: 100,
    defaultTarget: 80,
    sections: [
      { id: 'ph_1', name: '第1問', maxScore: 25, topic: '小問集合' },
      { id: 'ph_2', name: '第2問', maxScore: 25, topic: '力学・電磁気' },
      { id: 'ph_3', name: '第3問', maxScore: 25, topic: '熱力学・波動' },
      { id: 'ph_4', name: '第4問', maxScore: 25, topic: '原子・総合探究' },
    ],
  },
  {
    id: 'chem',
    name: '化学（100点満点）',
    shortName: '化学',
    maxScore: 100,
    defaultTarget: 80,
    sections: [
      { id: 'ch_1', name: '第1問', maxScore: 20, topic: '物質の構成・状態' },
      { id: 'ch_2', name: '第2問', maxScore: 20, topic: '化学反応とエネルギー・平衡' },
      { id: 'ch_3', name: '第3問', maxScore: 20, topic: '無機物質' },
      { id: 'ch_4', name: '第4問', maxScore: 20, topic: '有機化合物・高分子' },
      { id: 'ch_5', name: '第5問', maxScore: 20, topic: '総合演習問題' },
    ],
  },
  {
    id: 'bio',
    name: '生物（100点満点）',
    shortName: '生物',
    maxScore: 100,
    defaultTarget: 80,
    sections: [
      { id: 'bi_1', name: '第1問', maxScore: 20, topic: '生命現象と物質・進化' },
      { id: 'bi_2', name: '第2問', maxScore: 20, topic: '生殖と発生・遺伝情報の発現' },
      { id: 'bi_3', name: '第3問', maxScore: 20, topic: '生物の環境応答' },
      { id: 'bi_4', name: '第4問', maxScore: 20, topic: '生態と環境' },
      { id: 'bi_5', name: '第5問', maxScore: 20, topic: '総合実験考察' },
    ],
  },
  {
    id: 'earth',
    name: '地学（100点満点）',
    shortName: '地学',
    maxScore: 100,
    defaultTarget: 80,
    sections: [
      { id: 'ea_1', name: '第1問', maxScore: 20, topic: '地球の概観と内部構造' },
      { id: 'ea_2', name: '第2問', maxScore: 20, topic: '地球の歴史と地質' },
      { id: 'ea_3', name: '第3問', maxScore: 20, topic: '大気と海洋' },
      { id: 'ea_4', name: '第4問', maxScore: 20, topic: '宇宙の構造' },
      { id: 'ea_5', name: '第5問', maxScore: 20, topic: '総合問題' },
    ],
  },
];

export const SOCIAL_COURSE_OPTIONS: SubjectCourseOption[] = [
  {
    id: 'geo',
    name: '地理総合、地理探究',
    shortName: '地理',
    maxScore: 100,
    defaultTarget: 80,
    sections: [
      { id: 'ge_1', name: '第1問', maxScore: 20, topic: '自然環境と自然災害・地図表現' },
      { id: 'ge_2', name: '第2問', maxScore: 20, topic: '資源と産業（農林水産業・工業）' },
      { id: 'ge_3', name: '第3問', maxScore: 20, topic: '人口・都市・村落・生活文化' },
      { id: 'ge_4', name: '第4問', maxScore: 20, topic: '世界地誌・比較地誌' },
      { id: 'ge_5', name: '第5問', maxScore: 20, topic: '地域調査・現代世界の諸課題' },
    ],
  },
  {
    id: 'jp_hist',
    name: '歴史総合、日本史探究',
    shortName: '日本史',
    maxScore: 100,
    defaultTarget: 80,
    sections: [
      { id: 'jh_1', name: '第1問', maxScore: 20, topic: '歴史総合（近代化と国際秩序）' },
      { id: 'jh_2', name: '第2問', maxScore: 16, topic: '原始・古代' },
      { id: 'jh_3', name: '第3問', maxScore: 16, topic: '中世' },
      { id: 'jh_4', name: '第4問', maxScore: 16, topic: '近世' },
      { id: 'jh_5', name: '第5問', maxScore: 16, topic: '近代' },
      { id: 'jh_6', name: '第6問', maxScore: 16, topic: '現代（戦後史）' },
    ],
  },
  {
    id: 'world_hist',
    name: '歴史総合、世界史探究',
    shortName: '世界史',
    maxScore: 100,
    defaultTarget: 80,
    sections: [
      { id: 'wh_1', name: '第1問', maxScore: 25, topic: '歴史総合（世界と日本の近現代）' },
      { id: 'wh_2', name: '第2問', maxScore: 20, topic: '諸地域の歴史的特徴・交流' },
      { id: 'wh_3', name: '第3問', maxScore: 20, topic: '時代・テーマ史①' },
      { id: 'wh_4', name: '第4問', maxScore: 20, topic: '時代・テーマ史②' },
      { id: 'wh_5', name: '第5問', maxScore: 15, topic: '資料読解・総合探究' },
    ],
  },
  {
    id: 'civ_pol',
    name: '公共、政治・経済',
    shortName: '公共・政経',
    maxScore: 100,
    defaultTarget: 80,
    sections: [
      { id: 'cp_1', name: '第1問', maxScore: 25, topic: '公共（社会参画・民主政治・法）' },
      { id: 'cp_2', name: '第2問', maxScore: 25, topic: '現代の政治と民主主義' },
      { id: 'cp_3', name: '第3問', maxScore: 25, topic: '市場経済・金融・財政・国民所得' },
      { id: 'cp_4', name: '第4問', maxScore: 25, topic: '国際政治・国際経済・現代社会の課題' },
    ],
  },
  {
    id: 'civ_eth',
    name: '公共、倫理',
    shortName: '公共・倫理',
    maxScore: 100,
    defaultTarget: 80,
    sections: [
      { id: 'ce_1', name: '第1問', maxScore: 25, topic: '公共（青年期・現代社会の倫理的課題）' },
      { id: 'ce_2', name: '第2問', maxScore: 25, topic: '源流思想（ギリシア・キリスト教・イスラーム・仏教・中国思想）' },
      { id: 'ce_3', name: '第3問', maxScore: 25, topic: '日本の思想（古代〜近現代）' },
      { id: 'ce_4', name: '第4問', maxScore: 25, topic: '西洋近現代思想・現代の諸課題' },
    ],
  },
  {
    id: 'combo_basic',
    name: '地理総合／歴史総合／公共（2科目選択）',
    shortName: '地総/歴総/公共',
    maxScore: 100,
    defaultTarget: 80,
    sections: [
      { id: 'cb_s1', name: '選択科目①', maxScore: 50, topic: '1科目目（50点満点）' },
      { id: 'cb_s2', name: '選択科目②', maxScore: 50, topic: '2科目目（50点満点）' },
    ],
  },
];

export const KOKUGO_COURSE_OPTIONS: SubjectCourseOption[] = [
  {
    id: 'kok_all',
    name: '国語（現代文・古文・漢文 200点満点）',
    shortName: '国語',
    maxScore: 200,
    defaultTarget: 160,
    sections: [
      { id: 'kok_1', name: '第1問', maxScore: 45, topic: '現代文（論理的な文章・評論）' },
      { id: 'kok_2', name: '第2問', maxScore: 45, topic: '現代文（文学的な文章・小説）' },
      { id: 'kok_3', name: '第3問', maxScore: 20, topic: '現代文（実用的な文章・資料分析）' },
      { id: 'kok_4', name: '第4問', maxScore: 45, topic: '古文' },
      { id: 'kok_5', name: '第5問', maxScore: 45, topic: '漢文' },
    ],
  },
  {
    id: 'kok_mod_kobun',
    name: '国語（現代文＋古文のみ 155点満点）',
    shortName: '国語(現古)',
    maxScore: 155,
    defaultTarget: 125,
    sections: [
      { id: 'kok_1', name: '第1問', maxScore: 45, topic: '現代文（評論）' },
      { id: 'kok_2', name: '第2問', maxScore: 45, topic: '現代文（小説）' },
      { id: 'kok_3', name: '第3問', maxScore: 20, topic: '現代文（実用的な文章）' },
      { id: 'kok_4', name: '第4問', maxScore: 45, topic: '古文' },
    ],
  },
  {
    id: 'kok_mod_only',
    name: '国語（近代以降の文章・現代文のみ 110点満点）',
    shortName: '国語(現代文)',
    maxScore: 110,
    defaultTarget: 90,
    sections: [
      { id: 'kok_1', name: '第1問', maxScore: 45, topic: '現代文（評論）' },
      { id: 'kok_2', name: '第2問', maxScore: 45, topic: '現代文（小説）' },
      { id: 'kok_3', name: '第3問', maxScore: 20, topic: '現代文（実用的な文章）' },
    ],
  },
];

export const SUBJECT_DEFINITIONS: SubjectDefinition[] = [
  {
    id: 'eng_r',
    name: '英語（リーディング）',
    shortName: '英語R',
    category: '英語',
    maxScore: 100,
    defaultTarget: 80,
    color: '#4f46e5',
    sections: [
      { id: 'er_1', name: '第1問', maxScore: 6, topic: '短文・案内文の読解' },
      { id: 'er_2', name: '第2問', maxScore: 12, topic: 'レポート・評論文の読解' },
      { id: 'er_3', name: '第3問', maxScore: 9, topic: '物語・エッセイの読解' },
      { id: 'er_4', name: '第4問', maxScore: 12, topic: '複数資料・図表の統合読解' },
      { id: 'er_5', name: '第5問', maxScore: 16, topic: '長文メール・ブログの読解' },
      { id: 'er_6', name: '第6問', maxScore: 15, topic: '論説文の要約・詳細読解' },
      { id: 'er_7', name: '第7問', maxScore: 16, topic: '複数記事・説明文の比較読解' },
      { id: 'er_8', name: '第8問', maxScore: 14, topic: '多様な意見の統合・論理構成' },
    ],
  },
  {
    id: 'eng_l',
    name: '英語（リスニング）',
    shortName: '英語L',
    category: '英語',
    maxScore: 100,
    defaultTarget: 80,
    color: '#6366f1',
    sections: [
      { id: 'el_1', name: '第1問', maxScore: 25, topic: '短文発話・イラスト選択（2回読み）' },
      { id: 'el_2', name: '第2問', maxScore: 16, topic: '対話とイラスト選択（2回読み）' },
      { id: 'el_3', name: '第3問', maxScore: 18, topic: '短い対話の質問応答（1回読み）' },
      { id: 'el_4', name: '第4問', maxScore: 12, topic: 'モノローグ・図表整理（1回読み）' },
      { id: 'el_5', name: '第5問', maxScore: 15, topic: '講義・ワークシート完成（1回読み）' },
      { id: 'el_6', name: '第6問', maxScore: 14, topic: '対話・複数人の議論（1回読み）' },
    ],
  },
  {
    id: 'math_1a',
    name: '数学I・数学A',
    shortName: '数I・A',
    category: '数学',
    maxScore: 100,
    defaultTarget: 80,
    color: '#0ea5e9',
    sections: [
      { id: 'm1a_1', name: '第1問', maxScore: 30, topic: '数と式・図形と計量（必答）' },
      { id: 'm1a_2', name: '第2問', maxScore: 30, topic: '2次関数・データの分析（必答）' },
      { id: 'm1a_3', name: '第3問', maxScore: 20, topic: '図形の性質（必答）' },
      { id: 'm1a_4', name: '第4問', maxScore: 20, topic: '場合の数と確率（必答）' },
    ],
  },
  {
    id: 'math_2bc',
    name: '数学II・数学B・数学C',
    shortName: '数II・B・C',
    category: '数学',
    maxScore: 100,
    defaultTarget: 80,
    color: '#0284c7',
    sections: [
      { id: 'm2bc_1', name: '第1問', maxScore: 15, topic: '三角関数・指数対数関数（必答）' },
      { id: 'm2bc_2', name: '第2問', maxScore: 15, topic: '微分法・積分法（必答）' },
      { id: 'm2bc_3', name: '第3問', maxScore: 22, topic: '微分・積分の応用（必答）' },
      { id: 'm2bc_4', name: '第4問(選択)', maxScore: 16, topic: '数列（第4〜7問から3問選択）', optionalGroup: 'm2bc_opt' },
      { id: 'm2bc_5', name: '第5問(選択)', maxScore: 16, topic: '統計的な推測（第4〜7問から3問選択）', optionalGroup: 'm2bc_opt' },
      { id: 'm2bc_6', name: '第6問(選択)', maxScore: 16, topic: 'ベクトル（第4〜7問から3問選択）', optionalGroup: 'm2bc_opt' },
      { id: 'm2bc_7', name: '第7問(選択)', maxScore: 16, topic: '平面上の曲線と複素数平面（第4〜7問から3問選択）', optionalGroup: 'm2bc_opt' },
    ],
  },
  {
    id: 'kokugo',
    name: '国語',
    shortName: '国語',
    category: '国語',
    maxScore: 200,
    defaultTarget: 160,
    color: '#ec4899',
    courseOptions: KOKUGO_COURSE_OPTIONS,
    defaultCourseId: 'kok_all',
    sections: KOKUGO_COURSE_OPTIONS[0].sections,
  },
  {
    id: 'sci_1',
    name: '理科①',
    shortName: '理科①',
    category: '理科',
    maxScore: 100,
    defaultTarget: 80,
    color: '#10b981',
    courseOptions: SCIENCE_COURSE_OPTIONS,
    defaultCourseId: 'phys',
    sections: SCIENCE_COURSE_OPTIONS[4].sections,
  },
  {
    id: 'sci_2',
    name: '理科②',
    shortName: '理科②',
    category: '理科',
    maxScore: 100,
    defaultTarget: 80,
    color: '#059669',
    courseOptions: SCIENCE_COURSE_OPTIONS,
    defaultCourseId: 'chem',
    sections: SCIENCE_COURSE_OPTIONS[5].sections,
  },
  {
    id: 'soc_1',
    name: '地歴公民①',
    shortName: '地歴公民①',
    category: '地歴公民',
    maxScore: 100,
    defaultTarget: 80,
    color: '#f59e0b',
    courseOptions: SOCIAL_COURSE_OPTIONS,
    defaultCourseId: 'geo',
    sections: SOCIAL_COURSE_OPTIONS[0].sections,
  },
  {
    id: 'soc_2',
    name: '地歴公民②',
    shortName: '地歴公民②',
    category: '地歴公民',
    maxScore: 100,
    defaultTarget: 80,
    color: '#d97706',
    courseOptions: SOCIAL_COURSE_OPTIONS,
    defaultCourseId: 'jp_hist',
    sections: SOCIAL_COURSE_OPTIONS[1].sections,
  },
  {
    id: 'info_1',
    name: '情報I',
    shortName: '情報I',
    category: '情報',
    maxScore: 100,
    defaultTarget: 80,
    color: '#8b5cf6',
    sections: [
      { id: 'inf_1', name: '第1問', maxScore: 20, topic: '情報社会の問題解決・法規・セキュリティ' },
      { id: 'inf_2', name: '第2問', maxScore: 30, topic: 'コミュニケーションと情報デザイン・モデル化' },
      { id: 'inf_3', name: '第3問', maxScore: 25, topic: 'コンピュータとプログラミング' },
      { id: 'inf_4', name: '第4問', maxScore: 25, topic: '情報通信ネットワークとデータの活用・分析' },
    ],
  },
];

// ユーザーの選択した具体科目（物理基礎50点・日本史100点など）に応じた実効科目定義を返すヘルパー
export function getEffectiveSubjectInfo(
  subj: SubjectDefinition,
  scoreData?: SubjectScoreData
): {
  id: string;
  slotName: string;
  name: string;
  shortName: string;
  category: SubjectDefinition['category'];
  maxScore: number;
  defaultTarget: number;
  color: string;
  sections: SectionDefinition[];
  selectedCourseId?: string;
} {
  if (subj.courseOptions && subj.courseOptions.length > 0) {
    const courseId = scoreData?.selectedCourseId || subj.defaultCourseId || subj.courseOptions[0].id;
    const found = subj.courseOptions.find((c) => c.id === courseId) || subj.courseOptions[0];
    return {
      id: subj.id,
      slotName: subj.name,
      name: `${subj.name}：${found.name}`,
      shortName: found.shortName,
      category: subj.category,
      maxScore: found.maxScore,
      defaultTarget: found.defaultTarget,
      color: subj.color,
      sections: found.sections,
      selectedCourseId: found.id,
    };
  }

  return {
    id: subj.id,
    slotName: subj.name,
    name: subj.name,
    shortName: subj.shortName,
    category: subj.category,
    maxScore: subj.maxScore,
    defaultTarget: subj.defaultTarget,
    color: subj.color,
    sections: subj.sections,
  };
}

export function createEmptyScores(): Record<string, SubjectScoreData> {
  const scores: Record<string, SubjectScoreData> = {};
  SUBJECT_DEFINITIONS.forEach((subj) => {
    scores[subj.id] = {
      subjectId: subj.id,
      selectedCourseId: subj.defaultCourseId,
      enabled: subj.id !== 'soc_2',
      rawScore: 0,
      targetScore: subj.defaultTarget,
      useSectionMode: false,
      sections: {},
    };
  });
  return scores;
}

export function createDefaultWeights(
  session?: MockExamSession
): Record<string, { enabled: boolean; convertedMax: number }> {
  const weights: Record<string, { enabled: boolean; convertedMax: number }> = {};
  SUBJECT_DEFINITIONS.forEach((subj) => {
    const scoreData = session?.scores[subj.id];
    const effective = getEffectiveSubjectInfo(subj, scoreData);
    const isEnabled = scoreData ? scoreData.enabled : subj.id !== 'soc_2';
    weights[subj.id] = {
      enabled: isEnabled,
      convertedMax: isEnabled ? effective.maxScore : 0,
    };
  });
  return weights;
}

export const INITIAL_EXAM_SESSIONS: MockExamSession[] = [];

export const INITIAL_UNIVERSITIES: TargetUniversity[] = [];
