import React, { useState } from 'react';
import {
  MockExamSession,
  MistakeReason,
  SubjectDefinition,
  SubjectScoreData,
} from '../types';
import {
  SUBJECT_DEFINITIONS,
  getEffectiveSubjectInfo,
} from '../data/defaultSubjects';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
  Sliders,
  BookOpen,
} from 'lucide-react';

interface SelfScoringPanelProps {
  session: MockExamSession;
  onUpdateSubjectScore: (subjectId: string, updated: SubjectScoreData) => void;
  onBatchUpdateScores?: (nextScores: Record<string, SubjectScoreData>) => void;
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
  onBatchUpdateScores,
}) => {
  const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({
    eng_r: false,
    math_1a: false,
  });

  const toggleExpand = (subjectId: string) => {
    setExpandedSubjects((prev) => ({ ...prev, [subjectId]: !prev[subjectId] }));
  };

  const applyExamPattern = (
    pattern: 'bunkei_national' | 'rikei_national' | 'bunkei_private' | 'rikei_private'
  ) => {
    const nextScores: Record<string, SubjectScoreData> = { ...session.scores };

    const updateSlot = (
      id: string,
      enabled: boolean,
      courseId?: string
    ) => {
      const subj = SUBJECT_DEFINITIONS.find((s) => s.id === id)!;
      const existing = nextScores[id] || {
        subjectId: id,
        enabled: true,
        rawScore: 0,
        targetScore: subj.defaultTarget,
        useSectionMode: false,
        sections: {},
      };
      const nextCourseId = courseId ?? existing.selectedCourseId ?? subj.defaultCourseId;
      const effective = getEffectiveSubjectInfo(subj, {
        ...existing,
        selectedCourseId: nextCourseId,
      });

      // Clamp rawScore & adjust targetScore if maxScore changed (e.g. 100 -> 50)
      const prevEffective = getEffectiveSubjectInfo(subj, existing);
      const targetScore =
        prevEffective.maxScore !== effective.maxScore
          ? effective.defaultTarget
          : Math.min(effective.maxScore, existing.targetScore);

      const updatedSlot: SubjectScoreData = {
        ...existing,
        enabled,
        rawScore: Math.min(effective.maxScore, existing.rawScore),
        targetScore,
      };
      if (nextCourseId !== undefined) {
        updatedSlot.selectedCourseId = nextCourseId;
      } else {
        delete updatedSlot.selectedCourseId;
      }
      nextScores[id] = updatedSlot;
    };

    if (pattern === 'bunkei_national') {
      // 国公立文系（5教科8科目または6教科8科目：理科基礎50点×2 + 地歴公民100点×2）
      updateSlot('eng_r', true);
      updateSlot('eng_l', true);
      updateSlot('math_1a', true);
      updateSlot('math_2bc', true);
      updateSlot('kokugo', true, 'kok_all');
      const currentSci1 = nextScores['sci_1']?.selectedCourseId;
      const isSci1Basic = currentSci1?.endsWith('_basic');
      updateSlot('sci_1', true, isSci1Basic ? currentSci1 : 'chem_basic');

      const currentSci2 = nextScores['sci_2']?.selectedCourseId;
      const isSci2Basic = currentSci2?.endsWith('_basic');
      updateSlot('sci_2', true, isSci2Basic ? currentSci2 : 'bio_basic');

      updateSlot('soc_1', true, nextScores['soc_1']?.selectedCourseId || 'jp_hist');
      updateSlot('soc_2', true, nextScores['soc_2']?.selectedCourseId || 'civ_pol');
      updateSlot('info_1', true);
    } else if (pattern === 'rikei_national') {
      // 国公立理系（理科専門100点×2 + 地歴公民1科目）
      updateSlot('eng_r', true);
      updateSlot('eng_l', true);
      updateSlot('math_1a', true);
      updateSlot('math_2bc', true);
      updateSlot('kokugo', true, 'kok_all');
      const currentSci1 = nextScores['sci_1']?.selectedCourseId;
      const isSci1Adv = currentSci1 && !currentSci1.endsWith('_basic');
      updateSlot('sci_1', true, isSci1Adv ? currentSci1 : 'phys');

      const currentSci2 = nextScores['sci_2']?.selectedCourseId;
      const isSci2Adv = currentSci2 && !currentSci2.endsWith('_basic');
      updateSlot('sci_2', true, isSci2Adv ? currentSci2 : 'chem');

      updateSlot('soc_1', true, nextScores['soc_1']?.selectedCourseId || 'geo');
      updateSlot('soc_2', false);
      updateSlot('info_1', true);
    } else if (pattern === 'bunkei_private') {
      // 私大文系 3教科型（英語・国語・地歴公民1科目）
      updateSlot('eng_r', true);
      updateSlot('eng_l', true);
      updateSlot('math_1a', false);
      updateSlot('math_2bc', false);
      updateSlot('kokugo', true);
      updateSlot('sci_1', false);
      updateSlot('sci_2', false);
      updateSlot('soc_1', true, nextScores['soc_1']?.selectedCourseId || 'jp_hist');
      updateSlot('soc_2', false);
      updateSlot('info_1', false);
    } else if (pattern === 'rikei_private') {
      // 私大理系 3教科型（英語・数学・理科）
      updateSlot('eng_r', true);
      updateSlot('eng_l', true);
      updateSlot('math_1a', true);
      updateSlot('math_2bc', true);
      updateSlot('kokugo', false);
      const currentSci1 = nextScores['sci_1']?.selectedCourseId;
      const isSci1Adv = currentSci1 && !currentSci1.endsWith('_basic');
      updateSlot('sci_1', true, isSci1Adv ? currentSci1 : 'phys');
      updateSlot('sci_2', true, 'chem');
      updateSlot('soc_1', false);
      updateSlot('soc_2', false);
      updateSlot('info_1', false);
    }

    if (onBatchUpdateScores) {
      onBatchUpdateScores(nextScores);
    } else {
      Object.entries(nextScores).forEach(([id, data]) => {
        onUpdateSubjectScore(id, data);
      });
    }
  };

  const handleToggleSubjectEnabled = (subj: SubjectDefinition) => {
    const current = session.scores[subj.id];
    if (!current) return;
    onUpdateSubjectScore(subj.id, {
      ...current,
      enabled: !current.enabled,
    });
  };

  const handleCourseSelectChange = (subj: SubjectDefinition, newCourseId: string) => {
    const current = session.scores[subj.id] || {
      subjectId: subj.id,
      enabled: true,
      rawScore: 0,
      targetScore: subj.defaultTarget,
      useSectionMode: false,
      sections: {},
    };

    const prevEffective = getEffectiveSubjectInfo(subj, current);
    const nextEffective = getEffectiveSubjectInfo(subj, {
      ...current,
      selectedCourseId: newCourseId,
    });

    // 満点が変わる場合（例: 100点科目 → 50点基礎科目）は目標点と素点をスケールまたはクランプ
    const nextTarget =
      prevEffective.maxScore !== nextEffective.maxScore
        ? Math.round((current.targetScore / prevEffective.maxScore) * nextEffective.maxScore)
        : Math.min(nextEffective.maxScore, current.targetScore);

    onUpdateSubjectScore(subj.id, {
      ...current,
      selectedCourseId: newCourseId,
      rawScore: Math.min(nextEffective.maxScore, current.rawScore),
      targetScore: nextTarget,
      useSectionMode: false,
      sections: {},
    });
  };

  const handleRawScoreChange = (
    subj: SubjectDefinition,
    effectiveMax: number,
    val: number
  ) => {
    const current = session.scores[subj.id];
    if (!current) return;
    const clamped = Math.max(0, Math.min(effectiveMax, isNaN(val) ? 0 : val));
    onUpdateSubjectScore(subj.id, {
      ...current,
      rawScore: clamped,
      useSectionMode: false,
    });
  };

  const handleTargetScoreChange = (
    subj: SubjectDefinition,
    effectiveMax: number,
    val: number
  ) => {
    const current = session.scores[subj.id];
    if (!current) return;
    const clamped = Math.max(0, Math.min(effectiveMax, isNaN(val) ? 0 : val));
    onUpdateSubjectScore(subj.id, {
      ...current,
      targetScore: clamped,
    });
  };

  const handleSectionScoreChange = (
    subj: SubjectDefinition,
    effectiveMax: number,
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

    const rawSum = Object.values(updatedSections).reduce(
      (acc, sec) => acc + (sec?.score || 0),
      0
    );

    onUpdateSubjectScore(subj.id, {
      ...current,
      useSectionMode: true,
      rawScore: Math.min(effectiveMax, rawSum),
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
      {/* Top Banner: Exam Type / Subject Pattern Switcher & Mistake Tracker */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-white to-sky-50/80 p-5 shadow-sm space-y-4">
        {/* Pattern Quick Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-100/80 pb-4">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-950">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              文系・理系・受験科目パターンの一括切り替え
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              文系（理科基礎50点×2＋社会2科目）や理系（理科100点×2＋社会1科目）、私大型などをワンクリックでセットでき、各カード内のプルダウンから具体的な受験科目（化学基礎・生物基礎・日本史・公共政経など）を自由に選択できます。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => applyExamPattern('bunkei_national')}
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 shadow-2xs transition-colors hover:bg-rose-100"
            >
              🌸 国公立文系型（理科基礎50点×2＋地歴公民2科目）
            </button>
            <button
              type="button"
              onClick={() => applyExamPattern('rikei_national')}
              className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs transition-colors hover:bg-indigo-100"
            >
              🔬 国公立理系型（理科100点×2＋地歴公民1科目）
            </button>
            <button
              type="button"
              onClick={() => applyExamPattern('bunkei_private')}
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-2xs transition-colors hover:bg-amber-100"
            >
              🏛️ 私大文系3教科型
            </button>
            <button
              type="button"
              onClick={() => applyExamPattern('rikei_private')}
              className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-800 shadow-2xs transition-colors hover:bg-sky-100"
            >
              🧪 私大理系3教科型
            </button>
          </div>
        </div>

        {/* Mistake Tracker Summary */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span>大問別・失点原因の集計:</span>
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
            selectedCourseId: subj.defaultCourseId,
            enabled: false,
            rawScore: 0,
            targetScore: subj.defaultTarget,
            useSectionMode: false,
            sections: {},
          };

          const effective = getEffectiveSubjectInfo(subj, scoreData);
          const clampedRaw = Math.min(effective.maxScore, scoreData.rawScore);
          const clampedTarget = Math.min(effective.maxScore, scoreData.targetScore);

          const isExpanded = !!expandedSubjects[subj.id];
          const pct =
            effective.maxScore > 0 ? Math.round((clampedRaw / effective.maxScore) * 100) : 0;
          const diffFromTarget = clampedRaw - clampedTarget;

          // Group science options into Basic (50pt) and Advanced (100pt) for clarity
          const isScience = subj.category === '理科';
          const basicOptions = isScience
            ? subj.courseOptions?.filter((c) => c.maxScore === 50)
            : undefined;
          const advOptions = isScience
            ? subj.courseOptions?.filter((c) => c.maxScore === 100)
            : undefined;

          return (
            <div
              key={subj.id}
              className={`rounded-2xl border transition-all ${
                scoreData.enabled
                  ? 'border-slate-200 bg-white shadow-xs'
                  : 'border-slate-200/60 bg-slate-100/60 opacity-75'
              }`}
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      id={`enable-${subj.id}`}
                      checked={scoreData.enabled}
                      onChange={() => handleToggleSubjectEnabled(subj)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          htmlFor={`enable-${subj.id}`}
                          className="cursor-pointer text-base font-bold text-slate-900"
                        >
                          {subj.courseOptions ? `${subj.name}：` : subj.name}
                        </label>

                        {/* Course Selector Dropdown for Science / Social / Kokugo */}
                        {subj.courseOptions && subj.courseOptions.length > 0 && (
                          <select
                            value={effective.selectedCourseId}
                            onChange={(e) => handleCourseSelectChange(subj, e.target.value)}
                            aria-label={`${subj.name}の受験科目を選択`}
                            className="rounded-lg border border-indigo-200 bg-indigo-50/70 px-2.5 py-1 text-xs font-bold text-indigo-900 shadow-2xs transition-colors hover:bg-indigo-100 focus:border-indigo-500 focus:outline-none"
                          >
                            {isScience && basicOptions && advOptions ? (
                              <>
                                <optgroup label="基礎科目（50点満点・文系等）">
                                  {basicOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                      {opt.name}
                                    </option>
                                  ))}
                                </optgroup>
                                <optgroup label="専門科目（100点満点・理系等）">
                                  {advOptions.map((opt) => (
                                    <option key={opt.id} value={opt.id}>
                                      {opt.name}
                                    </option>
                                  ))}
                                </optgroup>
                              </>
                            ) : (
                              subj.courseOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.name}
                                </option>
                              ))
                            )}
                          </select>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                          {subj.category}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 font-bold ${
                            effective.maxScore === 50
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'text-slate-600'
                          }`}
                        >
                          満点: {effective.maxScore}点
                        </span>
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
                          {clampedRaw}
                        </span>
                        <span className="text-xs font-medium text-slate-400">
                          / {effective.maxScore}
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
                              max={effective.maxScore}
                              value={clampedRaw}
                              onChange={(e) =>
                                handleRawScoreChange(
                                  subj,
                                  effective.maxScore,
                                  parseInt(e.target.value, 10)
                                )
                              }
                              aria-label={`${effective.name}の自己採点素点`}
                              className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                            <span className="text-slate-500">点</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={effective.maxScore}
                          value={clampedRaw}
                          onChange={(e) =>
                            handleRawScoreChange(
                              subj,
                              effective.maxScore,
                              parseInt(e.target.value, 10)
                            )
                          }
                          aria-label={`${effective.name}の素点スライダー`}
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
                              max={effective.maxScore}
                              value={clampedTarget}
                              onChange={(e) =>
                                handleTargetScoreChange(
                                  subj,
                                  effective.maxScore,
                                  parseInt(e.target.value, 10)
                                )
                              }
                              aria-label={`${effective.name}の目標得点`}
                              className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-1 text-right text-sm font-bold text-rose-600 focus:border-rose-500 focus:outline-none"
                            />
                            <span className="text-slate-500">点</span>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={effective.maxScore}
                          value={clampedTarget}
                          onChange={(e) =>
                            handleTargetScoreChange(
                              subj,
                              effective.maxScore,
                              parseInt(e.target.value, 10)
                            )
                          }
                          aria-label={`${effective.name}の目標点スライダー`}
                          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-rose-500"
                        />
                      </div>
                    </div>

                    {/* Progress bar with target marker */}
                    <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (clampedRaw / effective.maxScore) * 100
                          )}%`,
                          backgroundColor: subj.color,
                        }}
                      />
                      <div
                        title={`目標: ${clampedTarget}点`}
                        className="absolute top-0 bottom-0 w-0.5 bg-rose-500"
                        style={{
                          left: `${Math.min(
                            100,
                            (clampedTarget / effective.maxScore) * 100
                          )}%`,
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
                          : `大問別採点・失点分析を開く (全${effective.sections.length}問)`}
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
                      {effective.shortName}：大問ごとの得点と失点タグ・復習メモ
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ※大問の点数を変更すると自動的に合計素点に反映されます
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {effective.sections.map((sec) => {
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
                                      effective.maxScore,
                                      sec.id,
                                      sec.maxScore,
                                      parseInt(e.target.value, 10)
                                    )
                                  }
                                  aria-label={`${effective.shortName} ${sec.name}の得点`}
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
