import { SubjectDefinition, TargetUniversity, MockExamSession, SubjectScoreData } from '../types';

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
    name: '国語（現代文・古文・漢文）',
    shortName: '国語',
    category: '国語',
    maxScore: 200,
    defaultTarget: 160,
    color: '#ec4899',
    sections: [
      { id: 'kok_1', name: '第1問', maxScore: 45, topic: '現代文（論理的な文章・評論）' },
      { id: 'kok_2', name: '第2問', maxScore: 45, topic: '現代文（文学的な文章・小説）' },
      { id: 'kok_3', name: '第3問', maxScore: 20, topic: '現代文（実用的な文章・資料分析）' },
      { id: 'kok_4', name: '第4問', maxScore: 45, topic: '古文' },
      { id: 'kok_5', name: '第5問', maxScore: 45, topic: '漢文' },
    ],
  },
  {
    id: 'sci_1',
    name: '理科①（物理 / 化学 / 生物）',
    shortName: '理科①',
    category: '理科',
    maxScore: 100,
    defaultTarget: 80,
    color: '#10b981',
    sections: [
      { id: 'sc1_1', name: '第1問', maxScore: 25, topic: '大問1' },
      { id: 'sc1_2', name: '第2問', maxScore: 25, topic: '大問2' },
      { id: 'sc1_3', name: '第3問', maxScore: 25, topic: '大問3' },
      { id: 'sc1_4', name: '第4問', maxScore: 25, topic: '大問4' },
    ],
  },
  {
    id: 'sci_2',
    name: '理科②（化学 / 生物 / 地学）',
    shortName: '理科②',
    category: '理科',
    maxScore: 100,
    defaultTarget: 80,
    color: '#059669',
    sections: [
      { id: 'sc2_1', name: '第1問', maxScore: 20, topic: '大問1' },
      { id: 'sc2_2', name: '第2問', maxScore: 20, topic: '大問2' },
      { id: 'sc2_3', name: '第3問', maxScore: 20, topic: '大問3' },
      { id: 'sc2_4', name: '第4問', maxScore: 20, topic: '大問4' },
      { id: 'sc2_5', name: '第5問', maxScore: 20, topic: '大問5' },
    ],
  },
  {
    id: 'soc_1',
    name: '地歴公民①（地理 / 日本史 / 世界史 / 公共）',
    shortName: '地歴公民①',
    category: '地歴公民',
    maxScore: 100,
    defaultTarget: 80,
    color: '#f59e0b',
    sections: [
      { id: 'so1_1', name: '第1問', maxScore: 20, topic: '大問1' },
      { id: 'so1_2', name: '第2問', maxScore: 20, topic: '大問2' },
      { id: 'so1_3', name: '第3問', maxScore: 20, topic: '大問3' },
      { id: 'so1_4', name: '第4問', maxScore: 20, topic: '大問4' },
      { id: 'so1_5', name: '第5問', maxScore: 20, topic: '大問5' },
    ],
  },
  {
    id: 'soc_2',
    name: '地歴公民②（2科目目）',
    shortName: '地歴公民②',
    category: '地歴公民',
    maxScore: 100,
    defaultTarget: 80,
    color: '#d97706',
    sections: [
      { id: 'so2_1', name: '第1問', maxScore: 25, topic: '大問1' },
      { id: 'so2_2', name: '第2問', maxScore: 25, topic: '大問2' },
      { id: 'so2_3', name: '第3問', maxScore: 25, topic: '大問3' },
      { id: 'so2_4', name: '第4問', maxScore: 25, topic: '大問4' },
    ],
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

export function createEmptyScores(): Record<string, SubjectScoreData> {
  const scores: Record<string, SubjectScoreData> = {};
  SUBJECT_DEFINITIONS.forEach((subj) => {
    scores[subj.id] = {
      subjectId: subj.id,
      enabled: subj.id !== 'soc_2',
      rawScore: 0,
      targetScore: subj.defaultTarget,
      useSectionMode: false,
      sections: {},
    };
  });
  return scores;
}

export function createDefaultWeights(): Record<string, { enabled: boolean; convertedMax: number }> {
  const weights: Record<string, { enabled: boolean; convertedMax: number }> = {};
  SUBJECT_DEFINITIONS.forEach((subj) => {
    weights[subj.id] = {
      enabled: subj.id !== 'soc_2',
      convertedMax: subj.id !== 'soc_2' ? subj.maxScore : 0,
    };
  });
  return weights;
}

export const INITIAL_EXAM_SESSIONS: MockExamSession[] = [];

export const INITIAL_UNIVERSITIES: TargetUniversity[] = [];
