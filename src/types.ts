export type SubjectCategory = '英語' | '数学' | '国語' | '理科' | '地歴公民' | '情報';

export interface SectionDefinition {
  id: string;
  name: string;
  maxScore: number;
  topic: string;
  optionalGroup?: string; // 選択問題グループ（例: 数学I・Aの第3,4問や数学II・B・Cの第4〜7問）
}

export interface SubjectDefinition {
  id: string;
  name: string;
  shortName: string;
  category: SubjectCategory;
  maxScore: number;
  defaultTarget: number;
  color: string;
  sections: SectionDefinition[];
}

export type MistakeReason = 'ケアレスミス' | '時間不足' | '知識不足・未習' | '読解・誘導乗り遅れ' | 'マークミス';

export interface SectionScoreEntry {
  score: number;
  timeSpentMin?: number;
  mistakeReasons?: MistakeReason[];
  memo?: string;
}

export interface SubjectScoreData {
  subjectId: string;
  enabled: boolean;
  rawScore: number; // 合計素点
  targetScore: number; // 個人目標点
  useSectionMode: boolean; // 大問別入力を使うか
  sections: Record<string, SectionScoreEntry>; // sectionId -> entry
  overallMemo?: string;
}

export interface MockExamSession {
  id: string;
  title: string; // 例: "第3回 全統共通テスト模試 (10月)"
  date: string; // YYYY-MM-DD
  provider: '河合塾' | '駿台・ベネッセ' | '東進' | 'Z会' | '本番・過去問' | 'その他';
  scores: Record<string, SubjectScoreData>; // subjectId -> SubjectScoreData
}

export interface UniversitySubjectWeight {
  subjectId: string;
  enabled: boolean;
  convertedMax: number; // 素点maxScoreを何点満点に換算するか
  englishRtoLRatio?: {
    readingWeight: number; // 例: 4 (または 160)
    listeningWeight: number; // 例: 1 (または 40)
  }; // 英語R/Lの比率指定用（オプション）
}

export interface TargetUniversity {
  id: string;
  name: string; // 例: "東京大学"
  faculty: string; // 例: "理科一類"
  examType: '前期' | '後期' | '共通テスト利用';
  priority: 1 | 2 | 3 | 4 | 5; // 志望順位
  borderScoreRatio: {
    rankA: number; // A判定ライン (得点率% または 換算点) - ここでは換算後満点に対する得点率(%)または点数で保持
    rankB: number;
    rankC: number;
    rankD: number;
  };
  secondaryExamMax: number; // 二次試験の満点 (例: 440)
  secondaryTargetScore: number; // 二次試験の自分の目標得点 (例: 240)
  totalPassMinimum: number; // 総合合格最低点 (共テ換算 + 二次)
  weights: Record<string, UniversitySubjectWeight>; // subjectId -> weight
  notes?: string;
}

