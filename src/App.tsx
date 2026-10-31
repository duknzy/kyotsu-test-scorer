import React, { useState, useEffect, useId, useRef } from 'react';
import { User } from 'firebase/auth';
import { MockExamSession, SubjectScoreData, TargetUniversity } from './types';
import {
  INITIAL_EXAM_SESSIONS,
  INITIAL_UNIVERSITIES,
  SUBJECT_DEFINITIONS,
  createEmptyScores,
  getEffectiveSubjectInfo,
} from './data/defaultSubjects';
import {
  calculateSessionRawSummary,
  evaluateUniversity,
} from './utils/calculations';
import { SelfScoringPanel } from './components/SelfScoringPanel';
import { UniversityPanel } from './components/UniversityPanel';
import { SubjectRadarChart, ScoreTrendChart } from './components/Charts';
import { LightDismissDialog } from './components/LightDismissDialog';
import { AuthModal } from './components/AuthModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { subscribeAuth, logout } from './firebase/authService';
import { isFirebaseConfigured } from './firebase/config';
import {
  saveExamSessionToFirestore,
  deleteExamSessionFromFirestore,
  saveUniversityToFirestore,
  deleteUniversityFromFirestore,
  fetchUserDataFromFirestore,
  syncLocalDataToFirestore,
} from './firebase/firestoreService';
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
  Cloud,
  CloudCheck,
  CloudOff,
  User as UserIcon,
  LogIn,
  LogOut,
  Settings,
  RefreshCw,
} from 'lucide-react';

const STORAGE_KEY_SESSIONS = 'kyotsu_nav_sessions_v2';
const STORAGE_KEY_UNIVERSITIES = 'kyotsu_nav_universities_v2';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'local'>('local');

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const [sessions, setSessions] = useState<MockExamSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
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
      // ignore
    }
    return INITIAL_UNIVERSITIES;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[sessions.length - 1]?.id || '';
  });

  const [activeTab, setActiveTab] = useState<'scoring' | 'university' | 'analytics'>('scoring');

  // New exam session dialog
  const newSessionDialogTitleId = useId();
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionProvider, setNewSessionProvider] = useState<MockExamSession['provider']>('河合塾');
  const [newSessionDate, setNewSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newSessionPattern, setNewSessionPattern] = useState<'inherit' | 'bunkei' | 'rikei' | 'private_bunkei' | 'private_rikei'>('inherit');

  // Local storage backup
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

  // Auth observer and Firestore initial hydration
  useEffect(() => {
    const unsub = subscribeAuth(async (user) => {
      setCurrentUser(user);
      if (user) {
        setSyncStatus('syncing');
        try {
          const cloudData = await fetchUserDataFromFirestore(user.uid);
          if (cloudData.sessions.length > 0 || cloudData.universities.length > 0) {
            setSessions(cloudData.sessions);
            setUniversities(cloudData.universities);
            if (cloudData.sessions.length > 0) {
              setActiveSessionId(cloudData.sessions[cloudData.sessions.length - 1].id);
            }
          } else if (sessions.length > 0 || universities.length > 0) {
            // Upload existing local data to cloud on first login
            await syncLocalDataToFirestore(user.uid, sessions, universities);
          }
          setSyncStatus('synced');
        } catch (e) {
          console.error('Firestore hydration error:', e);
          setSyncStatus('offline');
        }
      } else {
        setSyncStatus(isFirebaseConfigured ? 'local' : 'offline');
      }
    });

    return () => unsub();
  }, []);

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

  const handleUpdateSubjectScore = async (subjectId: string, updated: SubjectScoreData) => {
    if (!currentSession) return;
    const updatedSession: MockExamSession = {
      ...currentSession,
      scores: {
        ...currentSession.scores,
        [subjectId]: updated,
      },
    };

    setSessions((prev) =>
      prev.map((sess) => (sess.id !== currentSession.id ? sess : updatedSession))
    );

    if (currentUser) {
      setSyncStatus('syncing');
      try {
        await saveExamSessionToFirestore(currentUser.uid, updatedSession);
        setSyncStatus('synced');
      } catch (e) {
        console.error('Failed to sync session to cloud:', e);
        setSyncStatus('offline');
      }
    }
  };

  const handleBatchUpdateScores = async (nextScores: Record<string, SubjectScoreData>) => {
    if (!currentSession) return;
    const updatedSession: MockExamSession = {
      ...currentSession,
      scores: nextScores,
    };

    setSessions((prev) =>
      prev.map((sess) => (sess.id !== currentSession.id ? sess : updatedSession))
    );

    if (currentUser) {
      setSyncStatus('syncing');
      try {
        await saveExamSessionToFirestore(currentUser.uid, updatedSession);
        setSyncStatus('synced');
      } catch (e) {
        console.error('Failed to sync batch session to cloud:', e);
        setSyncStatus('offline');
      }
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const baseScores: Record<string, SubjectScoreData> = {};

    SUBJECT_DEFINITIONS.forEach((subj) => {
      const prevSubj = currentSession?.scores[subj.id];
      let enabled = prevSubj ? prevSubj.enabled : subj.id !== 'soc_2';
      let selectedCourseId = prevSubj?.selectedCourseId || subj.defaultCourseId;

      if (newSessionPattern === 'bunkei') {
        enabled = true;
        if (subj.id === 'sci_1') selectedCourseId = 'chem_basic';
        if (subj.id === 'sci_2') selectedCourseId = 'bio_basic';
        if (subj.id === 'soc_1') selectedCourseId = 'jp_hist';
        if (subj.id === 'soc_2') selectedCourseId = 'civ_pol';
      } else if (newSessionPattern === 'rikei') {
        enabled = subj.id !== 'soc_2';
        if (subj.id === 'sci_1') selectedCourseId = 'phys';
        if (subj.id === 'sci_2') selectedCourseId = 'chem';
        if (subj.id === 'soc_1') selectedCourseId = 'geo';
      } else if (newSessionPattern === 'private_bunkei') {
        enabled = ['eng_r', 'eng_l', 'kokugo', 'soc_1'].includes(subj.id);
        if (subj.id === 'soc_1') selectedCourseId = 'jp_hist';
      } else if (newSessionPattern === 'private_rikei') {
        enabled = ['eng_r', 'eng_l', 'math_1a', 'math_2bc', 'sci_1', 'sci_2'].includes(subj.id);
        if (subj.id === 'sci_1') selectedCourseId = 'phys';
        if (subj.id === 'sci_2') selectedCourseId = 'chem';
      }

      const eff = getEffectiveSubjectInfo(subj, {
        subjectId: subj.id,
        selectedCourseId,
        enabled,
        rawScore: 0,
        targetScore: subj.defaultTarget,
        useSectionMode: false,
        sections: {},
      });

      baseScores[subj.id] = {
        subjectId: subj.id,
        selectedCourseId,
        enabled,
        rawScore: 0,
        targetScore:
          newSessionPattern === 'inherit' && prevSubj
            ? Math.min(eff.maxScore, prevSubj.targetScore)
            : eff.defaultTarget,
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

    const nextSessions = [...sessions, newSess];
    setSessions(nextSessions);
    setActiveSessionId(newSess.id);
    setNewSessionTitle('');
    setIsNewSessionModalOpen(false);

    if (currentUser) {
      setSyncStatus('syncing');
      try {
        await saveExamSessionToFirestore(currentUser.uid, newSess);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to sync new session:', err);
        setSyncStatus('offline');
      }
    }
  };

  const handleDeleteCurrentSession = async () => {
    if (!currentSession) return;
    const targetId = currentSession.id;
    const nextSessions = sessions.filter((s) => s.id !== targetId);
    setSessions(nextSessions);
    setActiveSessionId(nextSessions[nextSessions.length - 1]?.id || '');

    if (currentUser) {
      setSyncStatus('syncing');
      try {
        await deleteExamSessionFromFirestore(currentUser.uid, targetId);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to delete session from cloud:', err);
        setSyncStatus('offline');
      }
    }
  };

  const handleSaveUniversity = async (uni: TargetUniversity) => {
    setUniversities((prev) => {
      const exists = prev.some((u) => u.id === uni.id);
      if (exists) {
        return prev.map((u) => (u.id === uni.id ? uni : u));
      }
      return [...prev, uni];
    });

    if (currentUser) {
      setSyncStatus('syncing');
      try {
        await saveUniversityToFirestore(currentUser.uid, uni);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to save university to cloud:', err);
        setSyncStatus('offline');
      }
    }
  };

  const handleDeleteUniversity = async (id: string) => {
    setUniversities((prev) => prev.filter((u) => u.id !== id));

    if (currentUser) {
      setSyncStatus('syncing');
      try {
        await deleteUniversityFromFirestore(currentUser.uid, id);
        setSyncStatus('synced');
      } catch (err) {
        console.error('Failed to delete university from cloud:', err);
        setSyncStatus('offline');
      }
    }
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
      const eff = getEffectiveSubjectInfo(subj, sData);
      eff.sections.forEach((sec) => {
        const entry = sData.sections[sec.id];
        if (!entry) return;
        const pct = sec.maxScore > 0 ? Math.round((entry.score / sec.maxScore) * 100) : 0;
        if (pct < 80 || (entry.mistakeReasons && entry.mistakeReasons.length > 0) || entry.memo) {
          weakSectionsList.push({
            subjectName: eff.shortName,
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

          {/* Center/Right Actions: Auth, Cloud Sync, Session Selector */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Cloud Sync Status Indicator */}
            <div
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                syncStatus === 'synced'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : syncStatus === 'syncing'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse'
                  : syncStatus === 'offline'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
              title={
                currentUser
                  ? 'クラウド（Firestore）に自動保存中'
                  : '未ログイン（ローカル保存中）'
              }
            >
              {syncStatus === 'synced' ? (
                <>
                  <Cloud className="h-3.5 w-3.5 text-emerald-600" />
                  <span>クラウド同期済</span>
                </>
              ) : syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                  <span>同期中...</span>
                </>
              ) : syncStatus === 'offline' ? (
                <>
                  <CloudOff className="h-3.5 w-3.5 text-rose-600" />
                  <span>オフライン</span>
                </>
              ) : (
                <>
                  <CloudOff className="h-3.5 w-3.5 text-slate-400" />
                  <span>ローカル保存</span>
                </>
              )}
            </div>

            {/* Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="avatar"
                    className="h-5 w-5 rounded-full"
                  />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                    {currentUser.displayName ? currentUser.displayName[0] : 'U'}
                  </div>
                )}
                <span className="max-w-[100px] truncate font-bold text-slate-700">
                  {currentUser.displayName || currentUser.email || 'ゲスト'}
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  title="ログアウト"
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-600"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-indigo-700"
              >
                <LogIn className="h-3.5 w-3.5" />
                ログイン / 保存
              </button>
            )}

            {/* Firebase Settings button */}
            <button
              type="button"
              onClick={() => setIsConfigModalOpen(true)}
              title="Firebase 接続設定"
              className={`rounded-xl border p-2 text-xs font-bold transition-colors ${
                isFirebaseConfigured
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Settings className="h-4 w-4" />
            </button>

            {/* Exam Session Selector */}
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
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
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
        {!currentUser && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/70 p-4 text-xs text-slate-700 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-indigo-600" />
                <span className="font-bold text-indigo-950">
                  アカウントを作成してクラウド保存を有効にしませんか？
                </span>
                <span className="hidden sm:inline text-slate-500">
                  Googleアカウントやメールでログインすると、スマホ・タブレット・PC間でデータが自動同期されます。
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
              >
                <LogIn className="h-3.5 w-3.5" />
                ログイン / 登録
              </button>
            </div>
          </div>
        )}

        {!currentSession ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-white p-12 text-center shadow-2xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <BookOpenCheck className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-extrabold text-slate-900">
              最初の模試・過去問演習を作成して自己採点を始めましょう
            </h2>
            <p className="mt-2 max-w-md text-xs text-slate-500">
              「新規模試を追加」から模試名を入力すると、科目別・大問別の自己採点や志望校の傾斜配点計算が利用できます。
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
                onBatchUpdateScores={handleBatchUpdateScores}
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
        subtitle="模試名と受験型（文系・理系など）を選択して自己採点を開始します。"
      >
        <form onSubmit={handleCreateSession} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700">
              模試・演習タイトル
            </label>
            <input
              type="text"
              required
              placeholder="例: 進研マーク / 第3回 全統共通テスト模試"
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
                <option value="進研・ベネッセ">進研・ベネッセ（マーク模試）</option>
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

          <div>
            <label className="block text-xs font-bold text-slate-700">
              初期の受験科目パターン（作成後も各科目カードで自由に変更可能）
            </label>
            <select
              value={newSessionPattern}
              onChange={(e) =>
                setNewSessionPattern(
                  e.target.value as 'bunkei' | 'rikei' | 'private_bun' | 'private_ri'
                )
              }
              className="mt-1 w-full rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-sm font-bold text-indigo-950 focus:border-indigo-500 focus:outline-none"
            >
              <option value="bunkei">
                🌸 国公立文系型（理科基礎50点×2 ＋ 地歴公民2科目 ＋ 英数国情 / 1000点）
              </option>
              <option value="rikei">
                🔬 国公立理系型（専門理科100点×2 ＋ 地歴公民1科目 ＋ 英数国情 / 1000点）
              </option>
              <option value="private_bun">
                🏛️ 私大文系3教科型（英語・国語・地歴公民1科目 / 500点）
              </option>
              <option value="private_ri">
                ⚙️ 私大理系3教科型（英語・数IA・数IIBC・専門理科1科目 / 500点）
              </option>
            </select>
            <p className="mt-1 text-[11px] text-slate-500">
              ※化学基礎・生物基礎・物理基礎・地学基礎などの50点科目や、日本史・世界史・地理・公共政経なども後からカード上で1科目ずつ選択できます。
            </p>
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onOpenConfig={() => setIsConfigModalOpen(true)}
      />

      {/* Firebase Config Modal */}
      <FirebaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
      />
    </div>
  );
}
