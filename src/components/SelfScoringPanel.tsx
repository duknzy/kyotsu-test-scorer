import React, { useState } from 'react';
import {
  MockExamSession,
  MistakeReason,
  SubjectDefinition,
  SubjectScoreData,
} from '../types';
import { SUBJECT_DEFINITIONS } from '../data/defaultSubjects';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Sliders,
} from 'lucide-react';

interface SelfScoringPanelProps {
  session: MockExamSession;
  onUpdateSubjectScore: (subjectId: string, updated: SubjectScoreData) => void;
}

const MISTAKE_REASONS: MistakeReason[] = [
  'ケアレスミス',
  '時間不足',
  '知識不足・未習',
  '読解・誘導乗り遅れ',
  'マークミス',
];

export const SelfScoringPanel: React.FC<SelfScoringPanelProps> = ({
  session,
  onUpdateSubjectScore,
}) => {
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    eng_r: true,
    math_1a: true,
  });

  const toggleExpand = (subjectId: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const handleToggleSubjectEnabled = (subj: SubjectDefinition) => {
    const current = session.scores[subj.id];
    if (!current) return;
    onUpdateSubjectScore(subj.id, {
      ...current,
      enabled: !current.enabled,
    });
  };

  const handleRawScoreChange = (subj: SubjectDefinition, val: number) => {
    const current = session.scores[subj.id];
    if (!current) return;
    const clamped = Math.max(0, Math.min(subj.maxScore, isNaN(val) ? 0 : val));
    onUpdateSubjectScore(subj.id, {
      ...current,
      rawScore: clamped,
      useSectionMode: false,
    });
  };

  const handleTargetScoreChange = (subj: SubjectDefinition, val: number) => {
    const current = session.scores[subj.id];
    if (!current) return;
    const clamped = Math.max(0, Math.min(subj.maxScore, isNaN(val) ? 0 : val));
    onUpdateSubjectScore(subj.id, {
      ...current,
      targetScore: clamped,
    });
  };

  const handleSectionScoreChange = (
    subj: SubjectDefinition,
    sectionId: string,
    maxSectionScore: number,
    val: number
  ) => {
    const current = session.scores[subj.id];
    if (!current) return;
    const clamped = Math.max(0, Math.min(maxSectionScore, isNaN(val) ? 0 : val));
    const updatedSections = {
      ...current.sections,
      [sectionId]: {
        ...(current.sections[sectionId] || { score: 0 }),
        score: clamped,
      },
    };

    // Sum all sections (capped at subj.maxScore in case optional sections are entered)
    const rawSum = Object.values(updatedSections).reduce(
      (acc, sec) => acc + (sec?.score || 0),
      0
    );

    onUpdateSubjectScore(subj.id, {
      ...current,
      useSectionMode: true,
      rawScore: Math.min(subj.maxScore, rawSum),
      sections: updatedSections,
    });
  };

  const handleToggleMistakeReason = (
    subj: SubjectDefinition,
    sectionId: string,
    reason: MistakeReason
  ) => {
    const current = session.scores[subj.id];
    if (!current) return;
    const secEntry = current.sections[sectionId] || { score: 0 };
    const existing = secEntry.mistakeReasons || [];
    const nextReasons = existing.includes(reason)
      ? existing.filter((r) => r !== reason)
      : [...existing, reason];

    onUpdateSubjectScore(subj.id, {
      ...current,
      sections: {
        ...current.sections,
        [sectionId]: {
          ...secEntry,
          mistakeReasons: nextReasons,
        },
      },
    });
  };

  const handleSectionMemoChange = (
    subj: SubjectDefinition,
    sectionId: string,
    memo: string
  ) => {
    const current = session.scores[subj.id];
    if (!current) return;
    const secEntry = current.sections[sectionId] || { score: 0 };
    onUpdateSubjectScore(subj.id, {
      ...current,
      sections: {
        ...current.sections,
        [sectionId]: {
          ...secEntry,
          memo,
        },
      },
    });
  };

  // Mistake analysis summary across the current session
  const mistakeCountMap: Record<MistakeReason, number> = {
    ケアレスミス: 0,
    時間不足: 0,
    '知識不足・未習': 0,
    '読解・誘導乗り遅れ': 0,
    マークミス: 0,
  };

  SUBJECT_DEFINITIONS.forEach((subj) => {
    const sData = session.scores[subj.id];
    if (!sData?.enabled) return;
    Object.values(sData.sections || {}).forEach((sec) => {
      (sec.mistakeReasons || []).forEach((r) => {
        mistakeCountMap[r] = (mistakeCountMap[r] || 0) + 1;
      });
    });
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Mistake Reason Quick Insights */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-950">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              自己採点・大問別失点原因トラッカー
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              素点の一括入力はもちろん、各大問ごとの得点・失点理由（時間不足・ケアレスミス等）や復習メモを残せます。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {MISTAKE_REASONS.map((reason) => (
              <div
                key={reason}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-2xs"
              >
                <span className="text-slate-500">{reason}:</span>
                <span className="font-bold text-indigo-600">{mistakeCountMap[reason]}箇所</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {SUBJECT_DEFINITIONS.map((subj) => {
          const scoreData = session.scores[subj.id] || {
            subjectId: subj.id,
            enabled: false,
            rawScore: 0,
            targetScore: subj.defaultTarget,
            useSectionMode: false,
            sections: {},
          };

          const isExpanded = !!expandedSubjects[subj.id];
          const pct = Math.round((scoreData.rawScore / subj.maxScore) * 100);
          const diffFromTarget = scoreData.rawScore - scoreData.targetScore;

          return (
            <div
              key={subj.id}
              className={`rounded-2xl border transition-all ${
                scoreData.enabled
                  ? 'border-slate-200 bg-white shadow-xs'
                  : 'border-slate-200/60 bg-slate-100/60 opacity-70'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={`enable-${subj.id}`}
                      checked={scoreData.enabled}
                      onChange={() => handleToggleSubjectEnabled(subj)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <label
                        htmlFor={`enable-${subj.id}`}
                        className="cursor-pointer text-base font-bold text-slate-900"
                      >
                        {subj.name}
                      </label>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                          {subj.category}
                        </span>
                        <span>満点: {subj.maxScore}点</span>
                        {scoreData.useSectionMode && (
                          <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-medium text-indigo-700">
                            大問合計連動中
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score Display Badge */}
                  {scoreData.enabled && (
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                          {scoreData.rawScore}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          / {subj.maxScore}
                        </span>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 text-xs">
                        <span className="font-semibold text-indigo-600">{pct}%</span>
                        <span
                          className={`font-semibold ${
                            diffFromTarget >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          ({diffFromTarget >= 0 ? `+${diffFromTarget}` : diffFromTarget})
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Input Controls */}
                {scoreData.enabled && (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {/* Raw Score Slider & Input */}
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span className="flex items-center gap-1">
                            <Sliders className="h-3.5 w-3.5 text-indigo-600" />
                            自己採点 素点
                          </span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={subj.maxScore}
                              value={scoreData.rawScore}
                              onChange={(e) =>
                                handleRawScoreChange(subj, parseInt(e.target.value, 10))
                              }
                              aria-label={`${subj.name}の自己採点素点`}
                              className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                            <span className="text-slate-500">点</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={subj.maxScore}
                          value={scoreData.rawScore}
                          onChange={(e) =>
                            handleRawScoreChange(subj, parseInt(e.target.value, 10))
                          }
                          aria-label={`${subj.name}の素点スライダー`}
                          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
                        />
                      </div>

                      {/* Target Score Input */}
                      <div className="rounded-xl bg-slate-50 p-3">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>目標得点</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={subj.maxScore}
                              value={scoreData.targetScore}
                              onChange={(e) =>
                                handleTargetScoreChange(subj, parseInt(e.target.value, 10))
                              }
                              aria-label={`${subj.name}の目標得点`}
                              className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-sm font-bold text-rose-600 focus:border-rose-500 focus:outline-none"
                            />
                            <span className="text-slate-500">点</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={subj.maxScore}
                          value={scoreData.targetScore}
                          onChange={(e) =>
                            handleTargetScoreChange(subj, parseInt(e.target.value, 10))
                          }
                          aria-label={`${subj.name}の目標点スライダー`}
                          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-rose-500"
                        />
                      </div>
                    </div>

                    {/* Progress bar with target marker */}
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (scoreData.rawScore / subj.maxScore) * 100)}%`,
                          backgroundColor: subj.color,
                        }}
                      />
                      <div
                        title={`目標: ${scoreData.targetScore}点`}
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-500"
                        style={{
                          left: `${Math.min(100, (scoreData.targetScore / subj.maxScore) * 100)}%`,
                        }}
                      />
                    </div>

                    {/* Expand / Collapse Section Input Button */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => toggleExpand(subj.id)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        {isExpanded
                          ? '大問別採点・失点分析を閉じる'
                          : `大問別採点・失点分析を開く (全${subj.sections.length}問)`}
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {diffFromTarget >= 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          目標達成！
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          目標まであと {Math.abs(diffFromTarget)} 点
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Section-by-Section Accordion */}
              {scoreData.enabled && isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      大問ごとの得点と失点タグ・復習メモ
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ※大問の点数を変更すると自動的に合計素点に反映されます
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {subj.sections.map((sec) => {
                      const entry = scoreData.sections[sec.id] || { score: 0 };
                      const secPct =
                        sec.maxScore > 0 ? Math.round((entry.score / sec.maxScore) * 100) : 0;

                      return (
                        <div
                          key={sec.id}
                          className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-slate-900">
                                {sec.name}
                              </span>
                              <span className="ml-2 text-xs text-slate-600">{sec.topic}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] font-semibold ${
                                  secPct >= 80
                                    ? 'text-emerald-600'
                                    : secPct >= 60
                                    ? 'text-amber-600'
                                    : 'text-rose-600'
                                }`}
                              >
                                {secPct}%
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={sec.maxScore}
                                  value={entry.score}
                                  onChange={(e) =>
                                    handleSectionScoreChange(
                                      subj,
                                      sec.id,
                                      sec.maxScore,
                                      parseInt(e.target.value, 10)
                                    )
                                  }
                                  aria-label={`${subj.name} ${sec.name}の得点`}
                                  className="w-14 rounded-md border border-slate-300 px-2 py-0.5 text-right text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                                />
                                <span className="text-xs text-slate-400">
                                  / {sec.maxScore}点
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Mistake tags & memo */}
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            {MISTAKE_REASONS.map((reason) => {
                              const active = (entry.mistakeReasons || []).includes(reason);
                              return (
                                <button
                                  key={reason}
                                  type="button"
                                  onClick={() =>
                                    handleToggleMistakeReason(subj, sec.id, reason)
                                  }
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                    active
                                      ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                  }`}
                                >
                                  {reason}
                                </button>
                              );
                            })}

                            <input
                              type="text"
                              placeholder="一言復習メモ（例: 誘導の式変形見落とし）"
                              value={entry.memo || ''}
                              onChange={(e) =>
                                handleSectionMemoChange(subj, sec.id, e.target.value)
                              }
                              className="ml-auto min-w-[180px] flex-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

