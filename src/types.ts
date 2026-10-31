export type SubjectCategory = '英語' | '数学' | '国語' | '理科' | '地歴公民' | '情報';

export interface SectionDefinition {
  id: string;
  name: string;
  maxScore: number;
  topic: string;
  optionalGroup?: string; // 選択問題グループ（例: 数学I・Aの第3,4問や数学II・B・Cの第4〜7問）
}

export interface SubjectCourseOption {
  id: string;
  name: string; // 例: '物理基礎' / '物理' / '歴史総合、日本史探究'
  shortName: string; // 例: '物理基礎' / '物理' / '日本史'
  maxScore: number; // 基礎科目なら 50、専門科目なら 100、国語なら 200 (近代以降110 / 古漢90 等も可)
  defaultTarget: number;
  sections: SectionDefinition[];
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
  courseOptions?: SubjectCourseOption[]; // ユーザーが選択できる具体的な科目リスト（基礎科目・専門科目など）
  defaultCourseId?: string;
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
  selectedCourseId?: string; // 選択した具体科目ID（例: 'phys_basic', 'chem_adv', 'jp_hist' など）
  enabled: boolean;
  rawScore: number; // 合計素点
  targetScore: number; // 個人目標点
  useSectionMode: boolean; // 大問別入力を使うか
  sections: Record<string, SectionScoreEntry>; // sectionId -> entry
  overallMemo?: string;
}

export type ExamPatternPreset = 'bunkei_5_8' | 'rikei_5_7' | 'private_bunkei_3' | 'private_rikei_3' | 'custom';

export interface MockExamSession {
  id: string;
  title: string; // 例: "第3回 全統共通テスト模試 (10月)"
  date: string; // YYYY-MM-DD
  provider: '河合塾' | '駿台・ベネッセ' | '東進' | 'Z会' | '進研・ベネッセ' | '本番・過去問' | 'その他';
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
  faculty: string; // 例: "文科一類 / 理科一類"
  examType: '前期' | '後期' | '共通テスト利用';
  priority: 1 | 2 | 3 | 4 | 5; // 志望順位
  borderScoreRatio: {
    rankA: number; // A判定ライン (得点率%)
    rankB: number;
    rankC: number;
    rankD: number;
  };
  secondaryExamMax: number; // 二次試験の満点
  secondaryTargetScore: number; // 二次試験の自分の目標得点
  totalPassMinimum: number; // 総合合格最低点 (共テ換算 + 二次)
  weights: Record<string, UniversitySubjectWeight>; // subjectId -> weight
  notes?: string;
}
