import React, { useState, useEffect, useId } from 'react';
import { MockExamSession, SubjectScoreData, TargetUniversity } from './types';
import {
  INITIAL_EXAM_SESSIONS,
  INITIAL_UNIVERSITIES,
  SUBJECT_DEFINITIONS,
  createEmptyScores,
} from './data/defaultSubjects';
import {
  calculateSessionRawSummary,
  evaluateUniversity,
} from './utils/calculations';
import { SelfScoringPanel } from './components/SelfScoringPanel';
import { UniversityPanel } from './components/UniversityPanel';
import { SubjectRadarChart, ScoreTrendChart } from './components/Charts';
import { LightDismissDialog } from './components/LightDismissDialog';
import {
  BookOpenCheck,
  GraduationCap,
  BarChart3,
  PlusCircle,
  Calendar,
  TrendingUp,
  Target,
  Award,
  AlertCircle,
  Download,
  Trash2,
} from 'lucide-react';

const STORAGE_KEY_SESSIONS = 'kyotsu_nav_sessions_v2';
const STORAGE_KEY_UNIVERSITIES = 'kyotsu_nav_universities_v2';

export function App() {
  const [sessions, setSessions] = useState<MockExamSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_EXAM_SESSIONS;
  });

  const [universities, setUniversities] = useState<TargetUniversity[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNIVERSITIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_UNIVERSITIES;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[sessions.length - 1]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<'scoring' | 'university' | 'analytics'>(
    'scoring'
  );

  // New exam session dialog
  const newSessionDialogTitleId = useId();
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionProvider, setNewSessionProvider] =
    useState<MockExamSession['provider']>('河合塾');
  const [newSessionDate, setNewSessionDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch {
      // ignore
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNIVERSITIES, JSON.stringify(universities));
    } catch {
      // ignore
    }
  }, [universities]);

  const currentSession: MockExamSession | undefined =
    sessions.find((s) => s.id === activeSessionId) || sessions[sessions.length - 1];

  const fallbackEmptySession: MockExamSession = {
    id: 'empty',
    title: '未登録',
    date: new Date().toISOString().slice(0, 10),
    provider: 'その他',
    scores: createEmptyScores(),
  };

  const activeSession = currentSession || fallbackEmptySession;
  const rawSummary = calculateSessionRawSummary(activeSession);

  // First-choice university evaluation for top KPI banner
  const sortedUniversities = [...universities].sort((a, b) => a.priority - b.priority);
  const firstChoiceUni = sortedUniversities[0];
  const firstChoiceEval =
    firstChoiceUni && currentSession
      ? evaluateUniversity(currentSession, firstChoiceUni)
      : null;

  const handleUpdateSubjectScore = (subjectId: string, updated: SubjectScoreData) => {
    if (!currentSession) return;
    setSessions((prev) =>
      prev.map((sess) => {
        if (sess.id !== currentSession.id) return sess;
        return {
          ...sess,
          scores: {
            ...sess.scores,
            [subjectId]: updated,
          },
        };
      })
    );
  };

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const baseScores: Record<string, SubjectScoreData> = {};
    SUBJECT_DEFINITIONS.forEach((subj) => {
      const prevSubj = currentSession?.scores[subj.id];
      baseScores[subj.id] = {
        subjectId: subj.id,
        enabled: prevSubj ? prevSubj.enabled : subj.id !== 'soc_2',
        rawScore: 0,
        targetScore: prevSubj ? prevSubj.targetScore : subj.defaultTarget,
        useSectionMode: false,
        sections: {},
      };
    });

    const newSess: MockExamSession = {
      id: `exam_${Date.now()}`,
      title: newSessionTitle.trim() || '共通テスト模試',
      date: newSessionDate || new Date().toISOString().slice(0, 10),
      provider: newSessionProvider,
      scores: baseScores,
    };

    setSessions((prev) => [...prev, newSess]);
    setActiveSessionId(newSess.id);
    setNewSessionTitle('');
    setIsNewSessionModalOpen(false);
  };

  const handleDeleteCurrentSession = () => {
    if (!currentSession) return;
    const nextSessions = sessions.filter((s) => s.id !== currentSession.id);
    setSessions(nextSessions);
    setActiveSessionId(nextSessions[nextSessions.length - 1]?.id || '');
  };

  const handleSaveUniversity = (uni: TargetUniversity) => {
    setUniversities((prev) => {
      const exists = prev.some((u) => u.id === uni.id);
      if (exists) {
        return prev.map((u) => (u.id === uni.id ? uni : u));
      }
      return [...prev, uni];
    });
  };

  const handleDeleteUniversity = (id: string) => {
    setUniversities((prev) => prev.filter((u) => u.id !== id));
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify({ sessions, universities }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kyotsu-score-backup-${activeSession.date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Weakness items list for Analytics tab
  const weakSectionsList: {
    subjectName: string;
    sectionName: string;
    topic: string;
    score: number;
    maxScore: number;
    pct: number;
    reasons: string[];
    memo?: string;
  }[] = [];

  if (currentSession) {
    SUBJECT_DEFINITIONS.forEach((subj) => {
      const sData = currentSession.scores[subj.id];
      if (!sData?.enabled) return;
      subj.sections.forEach((sec) => {
        const entry = sData.sections[sec.id];
        if (!entry) return;
        const pct = sec.maxScore > 0 ? Math.round((entry.score / sec.maxScore) * 100) : 0;
        if (pct < 80 || (entry.mistakeReasons && entry.mistakeReasons.length > 0) || entry.memo) {
          weakSectionsList.push({
            subjectName: subj.shortName,
            sectionName: sec.name,
            topic: sec.topic,
            score: entry.score,
            maxScore: sec.maxScore,
            pct,
            reasons: entry.mistakeReasons || [],
            memo: entry.memo,
          });
        }
      });
    });
  }

  weakSectionsList.sort((a, b) => a.pct - b.pct);

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top App Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                  共テナビ Pro
                </h1>
                <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                  新課程・情報I対応
                </span>
              </div>
              <p className="text-xs text-slate-500">
                共通テスト模試 自己採点・志望校傾斜配点＆二次逆算システム
              </p>
            </div>
          </div>

          {/* Exam Session Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {sessions.length > 0 && currentSession && (
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <select
                  value={currentSession.id}
                  onChange={(e) => setActiveSessionId(e.target.value)}
                  aria-label="採点対象の模試を選択"
                  className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none sm:text-sm"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.date})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsNewSessionModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-indigo-700"
            >
              <PlusCircle className="h-4 w-4" />
              新規模試を追加
            </button>

            {currentSession && (
              <button
                type="button"
                onClick={handleDeleteCurrentSession}
                title="選択中の模試を削除"
                className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {(sessions.length > 0 || universities.length > 0) && (
              <button
                type="button"
                onClick={handleExportJson}
                title="採点・志望校データをJSON保存"
                className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 pt-6 sm:px-6">
        {!currentSession ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-white p-12 text-center shadow-2xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpenCheck className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-slate-900">
              最初の模試・過去問演習を作成して自己採点を始めましょう
            </h2>
            <p className="mt-2 max-w-md text-xs text-slate-500">
              プリセットデータはすべてクリアされています。「新規模試を追加」から今回自己採点する模試名を入力すると、科目別・大問別の採点や志望校の傾斜配点計算が利用できます。
            </p>
            <button
              type="button"
              onClick={() => setIsNewSessionModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-700"
            >
              <PlusCircle className="h-5 w-5" />
              最初の模試を追加する
            </button>
          </div>
        ) : (
          <>
            {/* Top Real-time KPI Summary Cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Total Raw Score */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>総合素点（{currentSession.provider}）</span>
                  <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-700">
                    得点率 {rawSummary.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black tracking-tight text-slate-900">
                    {rawSummary.totalRawScore}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">
                    / {rawSummary.totalRawMax} 点
                  </span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${Math.min(100, rawSummary.percentage)}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Gap to Target Score */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>目標合計点との差分</span>
                  <Target className="h-4 w-4 text-rose-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span
                    className={`text-3xl font-black tracking-tight ${
                      rawSummary.targetGap >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {rawSummary.targetGap >= 0
                      ? `+${rawSummary.targetGap}`
                      : rawSummary.targetGap}{' '}
                    点
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    (目標: {rawSummary.totalTargetScore}点)
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {rawSummary.targetGap >= 0
                    ? '個人目標ラインを突破しています！'
                    : `目標達成まで全科目合計であと ${Math.abs(rawSummary.targetGap)} 点`}
                </p>
              </div>

              {/* Card 3: First Choice Tilted Score & Judgment */}
              {firstChoiceEval ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>
                      第1志望：{firstChoiceEval.university.name}（
                      {firstChoiceEval.university.faculty}）
                    </span>
                    <Award className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-indigo-700">
                          {firstChoiceEval.convertedScore.toFixed(1)}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          / {firstChoiceEval.convertedMax.toFixed(1)}点
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-600">
                        傾斜得点率: {firstChoiceEval.convertedPercentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                      <span className="text-[9px] font-bold opacity-80">判定</span>
                      <span className="text-xl font-black leading-none">
                        {firstChoiceEval.judgment}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="text-xs font-bold text-slate-500">第1志望 傾斜換算</div>
                  <div className="mt-3 text-xs text-slate-400">
                    「2. 志望校・傾斜配点」タブから志望校を登録してください
                  </div>
                </div>
              )}

              {/* Card 4: First Choice Secondary Exam Required Score */}
              {firstChoiceEval && firstChoiceEval.university.secondaryExamMax > 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>第1志望 合格最低点への二次必要点</span>
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900">
                      {firstChoiceEval.requiredSecondaryScore.toFixed(1)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      / 二次 {firstChoiceEval.university.secondaryExamMax}点 (
                      {firstChoiceEval.requiredSecondaryPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-xs font-semibold ${
                      firstChoiceEval.secondaryMargin >= 0
                        ? 'text-emerald-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {firstChoiceEval.secondaryMargin >= 0
                      ? `二次目標(${firstChoiceEval.university.secondaryTargetScore}点)に対して +${firstChoiceEval.secondaryMargin.toFixed(1)}点のリード`
                      : `二次目標(${firstChoiceEval.university.secondaryTargetScore}点)まであと ${Math.abs(firstChoiceEval.secondaryMargin).toFixed(1)}点上積み必要`}
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="text-xs font-bold text-slate-500">最優先で伸ばすべき科目</div>
                  <div className="mt-2 text-sm font-bold text-slate-800">
                    {firstChoiceEval?.bestLeverageSubjects[0]?.subjectName || '志望校未登録'}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    目標点達成で最も傾斜換算点が伸びる科目です
                  </p>
                </div>
              )}
            </section>

            {/* Navigation Tabs */}
            <nav
              aria-label="メイン機能切り替え"
              className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs"
            >
              <button
                type="button"
                onClick={() => setActiveTab('scoring')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                  activeTab === 'scoring'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpenCheck className="h-4 w-4" />
                1. 自己採点入力（素点・大問別・ミス原因）
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('university')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                  activeTab === 'university'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="h-4 w-4" />
                2. 志望校・傾斜配点計算＆タラレバ判定 ({universities.length}校)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all sm:text-sm ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                3. 成績推移・レーダー分析＆復習リスト
              </button>
            </nav>

            {/* Tab 1: Self-Scoring Panel */}
            {activeTab === 'scoring' && (
              <SelfScoringPanel
                session={currentSession}
                onUpdateSubjectScore={handleUpdateSubjectScore}
              />
            )}

            {/* Tab 2: University Tilted Scoring & What-If Simulator */}
            {activeTab === 'university' && (
              <UniversityPanel
                session={currentSession}
                universities={universities}
                onSaveUniversity={handleSaveUniversity}
                onDeleteUniversity={handleDeleteUniversity}
              />
            )}

            {/* Tab 3: Analytics, Radar Chart, Trend Chart & Mistake Review List */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Radar Chart */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <h3 className="text-base font-bold text-slate-900">
                      科目別バランス分析（得点率 vs 目標ライン）
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      赤の破線（目標）に対して凹んでいる科目が一目で分かります
                    </p>
                    <div className="mt-4">
                      <SubjectRadarChart session={currentSession} />
                    </div>
                  </div>

                  {/* Score Trend Chart across mock exams */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <h3 className="text-base font-bold text-slate-900">
                      模試別 トータル得点率推移（クリックで模試切替）
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      全{sessions.length}回の共通テスト模試・過去問演習の成長推移グラフ
                    </p>
                    <div className="mt-4">
                      <ScoreTrendChart
                        sessions={sessions}
                        activeSessionId={currentSession.id}
                        onSelectSession={(id) => setActiveSessionId(id)}
                      />
                    </div>
                  </div>
                </div>

                {/* Priority Review & Weak Section Action List */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-bold text-slate-900">
                        <AlertCircle className="h-5 w-5 text-rose-500" />
                        大問別・弱点分野＆復習アクションリスト（得点率順）
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        自己採点タブで入力された大問のうち、得点率80%未満または失点原因メモがある大問を自動抽出しています。
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                      要復習: {weakSectionsList.length} 大問
                    </span>
                  </div>

                  {weakSectionsList.length === 0 ? (
                    <div className="py-8 text-center text-sm text-slate-500">
                      現在、要復習の大問データはありません（自己採点タブで大問別得点を入力すると自動抽出されます）。
                    </div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {weakSectionsList.map((w, idx) => (
                        <div
                          key={`${w.subjectName}-${w.sectionName}-${idx}`}
                          className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-3.5"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800">
                                {w.subjectName} / {w.sectionName}
                              </span>
                              <span
                                className={`text-xs font-extrabold ${
                                  w.pct < 60 ? 'text-rose-600' : 'text-amber-600'
                                }`}
                              >
                                {w.score} / {w.maxScore}点 ({w.pct}%)
                              </span>
                            </div>
                            <div className="mt-1.5 text-xs font-bold text-slate-800">
                              分野: {w.topic}
                            </div>
                            {w.reasons.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {w.reasons.map((r) => (
                                  <span
                                    key={r}
                                    className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700"
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {w.memo && (
                            <div className="mt-2 rounded-lg bg-white p-2 text-xs text-slate-700 shadow-2xs">
                              📝 {w.memo}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Dialog for Adding a New Mock Exam Session */}
      <LightDismissDialog
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        titleId={newSessionDialogTitleId}
        title="新しい共通テスト模試・過去問演習を追加"
        subtitle="模試名と実施日を入力して自己採点を開始します。"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              模試・演習タイトル
            </label>
            <input
              type="text"
              required
              placeholder="例: 第3回 全統共通テスト模試"
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700">
                主催予備校・種別
              </label>
              <select
                value={newSessionProvider}
                onChange={(e) =>
                  setNewSessionProvider(e.target.value as MockExamSession['provider'])
                }
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
              >
                <option value="河合塾">河合塾（全統共テ模試）</option>
                <option value="駿台・ベネッセ">駿台・ベネッセ（共テ模試）</option>
                <option value="東進">東進（共通テスト本番レベル）</option>
                <option value="Z会">Z会（共テ実戦模試）</option>
                <option value="本番・過去問">本番・過去問演習</option>
                <option value="その他">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700">
                実施日
              </label>
              <input
                type="date"
                required
                value={newSessionDate}
                onChange={(e) => setNewSessionDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={() => setIsNewSessionModalOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              模試を作成して採点開始
            </button>
          </div>
        </form>
      </LightDismissDialog>
    </div>
  );
}
