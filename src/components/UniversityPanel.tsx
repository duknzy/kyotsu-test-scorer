import React, { useState, useId } from 'react';
import { MockExamSession, TargetUniversity } from '../types';
import {
  SUBJECT_DEFINITIONS,
  createDefaultWeights,
} from '../data/defaultSubjects';
import { evaluateUniversity, UniversityEvaluationResult } from '../utils/calculations';
import { LightDismissDialog } from './LightDismissDialog';
import {
  GraduationCap,
  Plus,
  Settings2,
  Trash2,
  TrendingUp,
  Award,
  Sparkles,
  Calculator,
  RotateCcw,
  Check,
} from 'lucide-react';

interface UniversityPanelProps {
  session: MockExamSession;
  universities: TargetUniversity[];
  onSaveUniversity: (uni: TargetUniversity) => void;
  onDeleteUniversity: (id: string) => void;
}

const JUDGMENT_STYLES: Record<
  'A' | 'B' | 'C' | 'D' | 'E',
  { badge: string; text: string; desc: string }
> = {
  A: {
    badge: 'bg-emerald-600 text-white ring-emerald-200',
    text: 'text-emerald-700',
    desc: '合格可能性 80%以上（安全圏）',
  },
  B: {
    badge: 'bg-sky-600 text-white ring-sky-200',
    text: 'text-sky-700',
    desc: '合格可能性 65%前後（有望圏）',
  },
  C: {
    badge: 'bg-amber-500 text-white ring-amber-200',
    text: 'text-amber-700',
    desc: '合格可能性 50%前後（合否ライン）',
  },
  D: {
    badge: 'bg-orange-500 text-white ring-orange-200',
    text: 'text-orange-700',
    desc: '合格可能性 35%前後（努力圏）',
  },
  E: {
    badge: 'bg-rose-600 text-white ring-rose-200',
    text: 'text-rose-700',
    desc: '合格可能性 20%以下（要対策・二次逆転）',
  },
};

export const UniversityPanel: React.FC<UniversityPanelProps> = ({
  session,
  universities,
  onSaveUniversity,
  onDeleteUniversity,
}) => {
  const dialogTitleId = useId();
  const [editingUni, setEditingUni] = useState<TargetUniversity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // What-If Simulator state
  const [selectedSimUniId, setSelectedSimUniId] = useState<string>(
    universities[0]?.id || ''
  );
  const [whatIfOverrides, setWhatIfOverrides] = useState<Record<string, number>>({});

  // Evaluate all universities for the current session
  const evaluations: UniversityEvaluationResult[] = [...universities]
    .sort((a, b) => a.priority - b.priority)
    .map((u) => evaluateUniversity(session, u));

  const activeSimUni =
    universities.find((u) => u.id === selectedSimUniId) || universities[0];
  const simEvaluation = activeSimUni
    ? evaluateUniversity(session, activeSimUni, whatIfOverrides)
    : null;
  const baselineEvaluation = activeSimUni
    ? evaluateUniversity(session, activeSimUni)
    : null;

  const openCreateModal = () => {
    setEditingUni({
      id: `uni_${Date.now()}`,
      name: '',
      faculty: '',
      examType: '前期',
      priority: (Math.min(5, universities.length + 1) as 1 | 2 | 3 | 4 | 5) || 1,
      borderScoreRatio: { rankA: 85, rankB: 80, rankC: 75, rankD: 70 },
      secondaryExamMax: 400,
      secondaryTargetScore: 240,
      totalPassMinimum: 1000,
      weights: createDefaultWeights(),
      notes: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (uni: TargetUniversity) => {
    setEditingUni(JSON.parse(JSON.stringify(uni)));
    setIsModalOpen(true);
  };

  const applyEnglishRatioHelper = (totalEngConverted: number, rRatio: number, lRatio: number) => {
    if (!editingUni) return;
    const sum = rRatio + lRatio;
    if (sum <= 0) return;
    const rMax = Number(((totalEngConverted * rRatio) / sum).toFixed(2));
    const lMax = Number(((totalEngConverted * lRatio) / sum).toFixed(2));
    setEditingUni({
      ...editingUni,
      weights: {
        ...editingUni.weights,
        eng_r: { enabled: true, convertedMax: rMax },
        eng_l: { enabled: true, convertedMax: lMax },
      },
    });
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUni) return;
    const finalUni: TargetUniversity = {
      ...editingUni,
      name: editingUni.name.trim() || '未設定大学',
      faculty: editingUni.faculty.trim() || '一般学部',
    };
    onSaveUniversity(finalUni);
    if (!selectedSimUniId) {
      setSelectedSimUniId(finalUni.id);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            志望校・傾斜配点判定＆二次逆転計算
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            自分の志望校と各科目の傾斜配点（圧縮配点・英語R:L比率・特定科目の比重変更）を登録すると、A〜E判定および二次試験で必要な得点を自動算出します。
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          志望校を追加・傾斜登録
        </button>
      </div>

      {universities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-slate-900">
            まだ志望校が登録されていません
          </h3>
          <p className="mt-1 max-w-md text-xs text-slate-500">
            「志望校を追加・傾斜登録」ボタンから、あなたの志望大学・学部・配点比率を登録して傾斜計算を開始しましょう。
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            最初の志望校を登録する
          </button>
        </div>
      ) : (
        <>
          {/* Responsive Comparison Table (Guide: responsive-table) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div
              tabIndex={0}
              role="region"
              aria-labelledby="uni-comparison-table-caption"
              className="table-wrapper rounded-xl border border-slate-200"
            >
              <table className="responsive-data-table text-left text-sm">
                <caption
                  id="uni-comparison-table-caption"
                  className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-left text-xs font-bold text-slate-700"
                >
                  登録済み志望校の傾斜配点換算・判定比較一覧（選択中の模試：{session.title}）
                </caption>
                <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-600">
                  <tr>
                    <th className="px-4 py-3">志望順位・大学・学部</th>
                    <th className="px-4 py-3">傾斜満点</th>
                    <th className="px-4 py-3">換算得点</th>
                    <th className="px-4 py-3">傾斜得点率</th>
                    <th className="px-4 py-3">判定</th>
                    <th className="px-4 py-3">A判定まで</th>
                    <th className="px-4 py-3">二次必要得点</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {evaluations.map((ev) => {
                    const { university: uni } = ev;
                    const style = JUDGMENT_STYLES[ev.judgment];
                    return (
                      <tr key={uni.id} className="hover:bg-slate-50/80">
                        <th className="px-4 py-3 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-extrabold text-indigo-700">
                              {uni.priority}
                            </span>
                            <div>
                              <div className="text-sm font-bold text-slate-900">
                                {uni.name} <span className="text-slate-600">{uni.faculty}</span>
                              </div>
                              <div className="text-[11px] font-normal text-slate-500">
                                {uni.examType}
                              </div>
                            </div>
                          </div>
                        </th>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {ev.convertedMax.toFixed(1)} 点
                        </td>
                        <td className="px-4 py-3 font-extrabold text-indigo-700">
                          {ev.convertedScore.toFixed(1)} 点
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {ev.convertedPercentage.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm font-black ring-2 ${style.badge}`}
                          >
                            {ev.judgment}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">
                          {ev.pointsToRankA <= 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600">
                              <Check className="h-4 w-4" /> A判定クリア
                            </span>
                          ) : (
                            <span className="text-rose-600">
                              あと {ev.pointsToRankA.toFixed(1)} 点
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {uni.secondaryExamMax > 0 ? (
                            <div>
                              <span className="font-bold text-slate-900">
                                {ev.requiredSecondaryScore.toFixed(1)}
                              </span>
                              <span className="text-xs text-slate-500">
                                {' '}
                                / {uni.secondaryExamMax}点 ({ev.requiredSecondaryPercentage.toFixed(1)}
                                %)
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">共テ単独判定</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed University Cards */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {evaluations.map((ev) => {
              const { university: uni } = ev;
              const style = JUDGMENT_STYLES[ev.judgment];
              const topLeverage = ev.bestLeverageSubjects.slice(0, 3);

              return (
                <div
                  key={uni.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                            第{uni.priority}志望 / {uni.examType}
                          </span>
                          <h3 className="text-lg font-extrabold text-slate-900">
                            {uni.name}・{uni.faculty}
                          </h3>
                        </div>
                        {uni.notes && (
                          <p className="mt-1 text-xs text-slate-500">{uni.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(uni)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-indigo-600"
                          title="傾斜配点・ボーダーを編集"
                        >
                          <Settings2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteUniversity(uni.id)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Score & Judgment Banner */}
                    <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl font-black shadow-sm ring-4 ${style.badge}`}
                        >
                          <span className="text-[10px] font-semibold opacity-90">判定</span>
                          <span className="text-2xl leading-none">{ev.judgment}</span>
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-500">
                            傾斜配点 換算スコア
                          </div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-slate-900">
                              {ev.convertedScore.toFixed(1)}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              / {ev.convertedMax.toFixed(1)}点 ({ev.convertedPercentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className={`mt-0.5 text-xs font-bold ${style.text}`}>
                            {ev.pointsToNextRank
                              ? `${ev.pointsToNextRank.nextRank}まで あと ${ev.pointsToNextRank.pointsNeeded.toFixed(1)} 点`
                              : style.desc}
                          </div>
                        </div>
                      </div>

                      {/* Secondary Exam Target Box */}
                      <div className="flex flex-col justify-center border-t border-slate-200/80 pt-3 sm:border-t-0 sm:border-l sm:pl-4 sm:pt-0">
                        {uni.secondaryExamMax > 0 ? (
                          <>
                            <div className="text-xs font-semibold text-slate-500">
                              合格最低点 ({uni.totalPassMinimum}点) への二次必要点
                            </div>
                            <div className="mt-0.5 flex items-baseline gap-1.5">
                              <span className="text-xl font-black text-indigo-700">
                                {ev.requiredSecondaryScore.toFixed(1)}
                              </span>
                              <span className="text-xs text-slate-500">
                                / 二次 {uni.secondaryExamMax}点満点 (
                                {ev.requiredSecondaryPercentage.toFixed(1)}%)
                              </span>
                            </div>
                            <div
                              className={`mt-0.5 text-xs font-semibold ${
                                ev.secondaryMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {ev.secondaryMargin >= 0
                                ? `二次目標(${uni.secondaryTargetScore}点)で +${ev.secondaryMargin.toFixed(1)}点の余裕`
                                : `二次目標(${uni.secondaryTargetScore}点)から ${Math.abs(ev.secondaryMargin).toFixed(1)}点不足`}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-600">
                            <div className="font-bold text-slate-800">共通テスト利用入試</div>
                            <div className="mt-1">
                              合格目安ライン ({uni.totalPassMinimum}点) まで:{' '}
                              <span className="font-bold text-indigo-600">
                                {Math.max(0, uni.totalPassMinimum - ev.convertedScore).toFixed(1)}点
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Subject Converted Breakdown Pills */}
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>科目別の傾斜配点換算内訳</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          換算得点 / 傾斜満点 (素点1点の重み)
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {ev.subjectBreakdown.map((item) => (
                          <div
                            key={item.subjectId}
                            className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-2 text-xs"
                          >
                            <div className="flex items-center justify-between font-bold text-slate-800">
                              <span>{item.shortName}</span>
                              <span className="text-[10px] font-semibold text-indigo-600">
                                ×{item.weightMultiplier.toFixed(2)}倍
                              </span>
                            </div>
                            <div className="mt-1 flex items-baseline justify-between">
                              <span className="text-sm font-extrabold text-slate-900">
                                {item.convertedScore.toFixed(1)}
                              </span>
                              <span className="text-[11px] text-slate-500">
                                / {item.convertedMax}点
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Priority Study Recommendation ("Cospa" Analysis) */}
                  <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                      <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
                      この大学の傾斜配点における最優先・伸びしろ科目
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {topLeverage.map((sub, i) => (
                        <span
                          key={sub.subjectId}
                          className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-2xs"
                        >
                          <span className="text-indigo-600">{i + 1}位:</span> {sub.shortName}
                          <span className="text-emerald-600">
                            (目標達成で +{sub.gapToTargetConverted.toFixed(1)}点)
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive "What-If" Score Simulator */}
          {activeSimUni && simEvaluation && baselineEvaluation && (
            <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/50 p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-100 pb-4">
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                    <Sparkles className="h-3.5 w-3.5" />
                    本番・次回模試「タラレバ（What-If）」傾斜シミュレーター
                  </span>
                  <h3 className="mt-1 text-base font-extrabold text-slate-900">
                    「もしこの科目があと○点高かったら、傾斜判定や二次必要点はどう変わる？」をリアルタイム検証
                  </h3>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={activeSimUni.id}
                    onChange={(e) => setSelectedSimUniId(e.target.value)}
                    aria-label="シミュレーション対象の志望校を選択"
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none"
                  >
                    {universities.map((u) => (
                      <option key={u.id} value={u.id}>
                        第{u.priority}志望：{u.name}（{u.faculty}）
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setWhatIfOverrides({})}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    現在の自己採点に戻す
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Sliders for each enabled subject in this university */}
                <div className="space-y-3 lg:col-span-2">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {simEvaluation.subjectBreakdown.map((item) => {
                      const baseRaw =
                        session.scores[item.subjectId]?.rawScore ?? 0;
                      const diffRaw = item.rawScore - baseRaw;

                      return (
                        <div
                          key={item.subjectId}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-800">
                              {item.shortName}{' '}
                              <span className="font-normal text-slate-500">
                                (傾斜 {item.convertedMax}点)
                              </span>
                            </span>
                            <div className="flex items-center gap-1.5">
                              {diffRaw !== 0 && (
                                <span
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    diffRaw > 0
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-rose-100 text-rose-700'
                                  }`}
                                >
                                  {diffRaw > 0 ? `+${diffRaw}` : diffRaw}点
                                </span>
                              )}
                              <span className="font-extrabold text-indigo-700">
                                素点 {item.rawScore}/{item.rawMax}
                              </span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={item.rawMax}
                            value={item.rawScore}
                            onChange={(e) =>
                              setWhatIfOverrides((prev) => ({
                                ...prev,
                                [item.subjectId]: parseInt(e.target.value, 10),
                              }))
                            }
                            aria-label={`${item.shortName}のWhat-If素点スライダー`}
                            className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                          />
                          <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                            <span>現在: {baseRaw}点</span>
                            <span className="font-semibold text-slate-700">
                              換算後: {item.convertedScore.toFixed(1)} / {item.convertedMax}点
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Simulation Result Card */}
                <div className="flex flex-col justify-between rounded-2xl border border-indigo-200 bg-white p-5 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
                      <Calculator className="h-4 w-4" />
                      シミュレーション結果
                    </div>
                    <h4 className="mt-1 text-base font-extrabold text-slate-900">
                      {activeSimUni.name}（{activeSimUni.faculty}）
                    </h4>

                    <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-4">
                      <div>
                        <div className="text-xs text-slate-500">シミュレート換算点</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-black text-indigo-700">
                            {simEvaluation.convertedScore.toFixed(1)}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            / {simEvaluation.convertedMax.toFixed(1)}点
                          </span>
                        </div>
                        <div className="mt-1 text-xs font-bold text-emerald-600">
                          現在比:{' '}
                          {simEvaluation.convertedScore - baselineEvaluation.convertedScore >= 0
                            ? `+${(
                                simEvaluation.convertedScore - baselineEvaluation.convertedScore
                              ).toFixed(1)}`
                            : (
                                simEvaluation.convertedScore - baselineEvaluation.convertedScore
                              ).toFixed(1)}{' '}
                          点 ({simEvaluation.convertedPercentage.toFixed(1)}%)
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-[10px] font-bold text-slate-400">判定変化</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-base font-bold text-slate-400">
                            {baselineEvaluation.judgment}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl font-black ring-2 ${
                              JUDGMENT_STYLES[simEvaluation.judgment].badge
                            }`}
                          >
                            {simEvaluation.judgment}
                          </span>
                        </div>
                      </div>
                    </div>

                    {activeSimUni.secondaryExamMax > 0 && (
                      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-xs">
                        <div className="font-semibold text-slate-600">
                          二次試験の必要得点ハードル変化:
                        </div>
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="text-slate-500">
                            現在: {baselineEvaluation.requiredSecondaryScore.toFixed(1)}点
                          </span>
                          <span className="text-sm font-black text-indigo-700">
                            → {simEvaluation.requiredSecondaryScore.toFixed(1)} /{' '}
                            {activeSimUni.secondaryExamMax}点 (
                            {simEvaluation.requiredSecondaryPercentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const targetOverrides: Record<string, number> = {};
                      SUBJECT_DEFINITIONS.forEach((s) => {
                        if (session.scores[s.id]?.enabled) {
                          targetOverrides[s.id] = session.scores[s.id].targetScore;
                        }
                      });
                      setWhatIfOverrides(targetOverrides);
                    }}
                    className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-50 px-4 py-2.5 text-xs font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    <Award className="h-4 w-4" />
                    全科目「目標点」を達成した場合の判定を見る
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Dialog for Creating / Editing University & Tilted Weights */}
      <LightDismissDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        titleId={dialogTitleId}
        title="志望校・傾斜配点（圧縮率・ボーダー）の設定"
        subtitle="大学・学部名と、各科目の換算満点・判定ボーダーを設定してください。"
      >
        {editingUni && (
          <form onSubmit={handleSaveModal} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">
                  大学名
                </label>
                <input
                  type="text"
                  required
                  placeholder="大学名を入力"
                  value={editingUni.name}
                  onChange={(e) =>
                    setEditingUni({ ...editingUni, name: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700">
                  学部・学科・類
                </label>
                <input
                  type="text"
                  required
                  placeholder="学部・学科を入力"
                  value={editingUni.faculty}
                  onChange={(e) =>
                    setEditingUni({ ...editingUni, faculty: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    日程・方式
                  </label>
                  <select
                    value={editingUni.examType}
                    onChange={(e) =>
                      setEditingUni({
                        ...editingUni,
                        examType: e.target.value as TargetUniversity['examType'],
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm font-semibold"
                  >
                    <option value="前期">前期</option>
                    <option value="後期">後期</option>
                    <option value="共通テスト利用">共テ利用</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">
                    志望順位
                  </label>
                  <select
                    value={editingUni.priority}
                    onChange={(e) =>
                      setEditingUni({
                        ...editingUni,
                        priority: parseInt(e.target.value, 10) as 1 | 2 | 3 | 4 | 5,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm font-semibold"
                  >
                    {[1, 2, 3, 4, 5].map((p) => (
                      <option key={p} value={p}>
                        第{p}志望
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* English R:L Ratio Quick Helper */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-indigo-950">
                  英語 リーディング(R) : リスニング(L) 比率クイック計算（200点満点基準）
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: '4 : 1 (R160 / L40)', r: 4, l: 1, total: 200 },
                    { label: '7 : 3 (R140 / L60)', r: 7, l: 3, total: 200 },
                    { label: '3 : 1 (R150 / L50)', r: 3, l: 1, total: 200 },
                    { label: '1 : 1 (R100 / L100)', r: 1, l: 1, total: 200 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        applyEnglishRatioHelper(preset.total, preset.r, preset.l)
                      }
                      className="rounded-md border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Subject Weights Grid */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  各科目の傾斜配点（素点満点 → 大学独自の換算満点）
                </span>
                <span className="text-xs font-bold text-indigo-600">
                  傾斜満点合計:{' '}
                  {Object.values(editingUni.weights)
                    .filter((w) => w.enabled)
                    .reduce((acc, w) => acc + (w.convertedMax || 0), 0)
                    .toFixed(1)}{' '}
                  点
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {SUBJECT_DEFINITIONS.map((subj) => {
                  const w = editingUni.weights[subj.id] || {
                    enabled: false,
                    convertedMax: 0,
                  };
                  return (
                    <div
                      key={subj.id}
                      className={`flex items-center justify-between rounded-xl border p-2.5 ${
                        w.enabled
                          ? 'border-slate-300 bg-white'
                          : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-800">
                        <input
                          type="checkbox"
                          checked={w.enabled}
                          onChange={() =>
                            setEditingUni({
                              ...editingUni,
                              weights: {
                                ...editingUni.weights,
                                [subj.id]: {
                                  ...w,
                                  enabled: !w.enabled,
                                  convertedMax:
                                    !w.enabled && w.convertedMax === 0
                                      ? subj.maxScore
                                      : w.convertedMax,
                                },
                              },
                            })
                          }
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        />
                        <span>
                          {subj.shortName}{' '}
                          <span className="font-normal text-slate-400">
                            (素点{subj.maxScore})
                          </span>
                        </span>
                      </label>

                      {w.enabled && (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-400">換算満点:</span>
                          <input
                            type="number"
                            step="0.1"
                            min={0}
                            max={1000}
                            value={w.convertedMax}
                            onChange={(e) =>
                              setEditingUni({
                                ...editingUni,
                                weights: {
                                  ...editingUni.weights,
                                  [subj.id]: {
                                    ...w,
                                    convertedMax: parseFloat(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                            className="w-20 rounded-md border border-slate-300 px-2 py-1 text-right text-xs font-bold text-slate-900"
                          />
                          <span className="text-xs text-slate-500">点</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Border & Secondary Exam Settings */}
            <div className="grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <div className="text-xs font-bold text-slate-700">
                  共テ判定ボーダーライン（得点率 %）
                </div>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {(
                    [
                      ['rankA', 'A判定'],
                      ['rankB', 'B判定'],
                      ['rankC', 'C判定'],
                      ['rankD', 'D判定'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-[11px] font-semibold text-slate-500">
                        {label} (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editingUni.borderScoreRatio[key]}
                        onChange={(e) =>
                          setEditingUni({
                            ...editingUni,
                            borderScoreRatio: {
                              ...editingUni.borderScoreRatio,
                              [key]: parseFloat(e.target.value) || 0,
                            },
                          })
                        }
                        className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-xs font-bold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs font-bold text-slate-700">
                  二次試験配点・総合合格最低点（逆算用）
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500">
                      二次満点
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editingUni.secondaryExamMax}
                      onChange={(e) =>
                        setEditingUni({
                          ...editingUni,
                          secondaryExamMax: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500">
                      二次目標点
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editingUni.secondaryTargetScore}
                      onChange={(e) =>
                        setEditingUni({
                          ...editingUni,
                          secondaryTargetScore: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500">
                      総合合格最低点
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editingUni.totalPassMinimum}
                      onChange={(e) =>
                        setEditingUni({
                          ...editingUni,
                          totalPassMinimum: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-right text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
              >
                この設定で志望校を保存
              </button>
            </div>
          </form>
        )}
      </LightDismissDialog>
    </div>
  );
};
