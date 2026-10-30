import { MockExamSession, TargetUniversity } from '../types';
import { SUBJECT_DEFINITIONS } from '../data/defaultSubjects';

export interface SessionRawSummary {
  totalRawScore: number;
  totalRawMax: number;
  totalTargetScore: number;
  percentage: number;
  targetGap: number;
}

export function calculateSessionRawSummary(session: MockExamSession): SessionRawSummary {
  let totalRawScore = 0;
  let totalRawMax = 0;
  let totalTargetScore = 0;

  for (const subj of SUBJECT_DEFINITIONS) {
    const scoreData = session.scores[subj.id];
    if (scoreData && scoreData.enabled) {
      totalRawScore += scoreData.rawScore;
      totalRawMax += subj.maxScore;
      totalTargetScore += scoreData.targetScore;
    }
  }

  const percentage = totalRawMax > 0 ? (totalRawScore / totalRawMax) * 100 : 0;
  const targetGap = totalRawScore - totalTargetScore;

  return {
    totalRawScore,
    totalRawMax,
    totalTargetScore,
    percentage,
    targetGap,
  };
}

export interface SubjectConvertedResult {
  subjectId: string;
  subjectName: string;
  shortName: string;
  rawScore: number;
  rawMax: number;
  convertedScore: number;
  convertedMax: number;
  targetConvertedScore: number;
  lossConverted: number; // 満点からの失点（換算後）
  gapToTargetConverted: number; // 目標点までの伸びしろ（換算後）
  weightMultiplier: number; // 素点1点あたりの換算価値
}

export interface UniversityEvaluationResult {
  university: TargetUniversity;
  convertedScore: number;
  convertedMax: number;
  convertedPercentage: number;
  judgment: 'A' | 'B' | 'C' | 'D' | 'E';
  pointsToRankA: number;
  pointsToNextRank: { nextRank: string; pointsNeeded: number } | null;
  requiredSecondaryScore: number; // 合格最低点に届くために二次試験で必要な点数
  requiredSecondaryPercentage: number;
  secondaryMargin: number; // 二次目標点 - 必要二次得点 (プラスなら余裕あり)
  subjectBreakdown: SubjectConvertedResult[];
  bestLeverageSubjects: SubjectConvertedResult[]; // 目標までの伸びしろ(換算点)が大きい順
}

export function evaluateUniversity(
  session: MockExamSession,
  university: TargetUniversity,
  customRawOverrides?: Record<string, number> // What-If シミュレーター用の上書き素点
): UniversityEvaluationResult {
  let convertedScore = 0;
  let convertedMax = 0;
  const subjectBreakdown: SubjectConvertedResult[] = [];

  for (const subj of SUBJECT_DEFINITIONS) {
    const weight = university.weights[subj.id];
    if (!weight || !weight.enabled || weight.convertedMax <= 0) continue;

    const scoreData = session.scores[subj.id];
    const rawScore =
      customRawOverrides && customRawOverrides[subj.id] !== undefined
        ? customRawOverrides[subj.id]
        : scoreData?.enabled
        ? scoreData.rawScore
        : 0;

    const targetRaw = scoreData?.targetScore ?? subj.defaultTarget;
    const ratio = subj.maxScore > 0 ? rawScore / subj.maxScore : 0;
    const targetRatio = subj.maxScore > 0 ? targetRaw / subj.maxScore : 0;

    const subjConverted = ratio * weight.convertedMax;
    const subjTargetConverted = targetRatio * weight.convertedMax;
    const weightMultiplier = subj.maxScore > 0 ? weight.convertedMax / subj.maxScore : 0;

    convertedScore += subjConverted;
    convertedMax += weight.convertedMax;

    subjectBreakdown.push({
      subjectId: subj.id,
      subjectName: subj.name,
      shortName: subj.shortName,
      rawScore,
      rawMax: subj.maxScore,
      convertedScore: subjConverted,
      convertedMax: weight.convertedMax,
      targetConvertedScore: subjTargetConverted,
      lossConverted: Math.max(0, weight.convertedMax - subjConverted),
      gapToTargetConverted: Math.max(0, subjTargetConverted - subjConverted),
      weightMultiplier,
    });
  }

  const convertedPercentage = convertedMax > 0 ? (convertedScore / convertedMax) * 100 : 0;
  const { rankA, rankB, rankC, rankD } = university.borderScoreRatio;

  let judgment: 'A' | 'B' | 'C' | 'D' | 'E' = 'E';
  let pointsToNextRank: { nextRank: string; pointsNeeded: number } | null = null;

  if (convertedPercentage >= rankA) {
    judgment = 'A';
    pointsToNextRank = null;
  } else if (convertedPercentage >= rankB) {
    judgment = 'B';
    pointsToNextRank = {
      nextRank: 'A判定',
      pointsNeeded: Math.max(0, (rankA / 100) * convertedMax - convertedScore),
    };
  } else if (convertedPercentage >= rankC) {
    judgment = 'C';
    pointsToNextRank = {
      nextRank: 'B判定',
      pointsNeeded: Math.max(0, (rankB / 100) * convertedMax - convertedScore),
    };
  } else if (convertedPercentage >= rankD) {
    judgment = 'D';
    pointsToNextRank = {
      nextRank: 'C判定',
      pointsNeeded: Math.max(0, (rankC / 100) * convertedMax - convertedScore),
    };
  } else {
    judgment = 'E';
    pointsToNextRank = {
      nextRank: 'D判定',
      pointsNeeded: Math.max(0, (rankD / 100) * convertedMax - convertedScore),
    };
  }

  const pointsToRankA = Math.max(0, (rankA / 100) * convertedMax - convertedScore);

  const requiredSecondaryScore = Math.max(0, university.totalPassMinimum - convertedScore);
  const requiredSecondaryPercentage =
    university.secondaryExamMax > 0
      ? (requiredSecondaryScore / university.secondaryExamMax) * 100
      : 0;
  const secondaryMargin = university.secondaryTargetScore - requiredSecondaryScore;

  const bestLeverageSubjects = [...subjectBreakdown].sort(
    (a, b) => b.gapToTargetConverted - a.gapToTargetConverted
  );

  return {
    university,
    convertedScore,
    convertedMax,
    convertedPercentage,
    judgment,
    pointsToRankA,
    pointsToNextRank,
    requiredSecondaryScore,
    requiredSecondaryPercentage,
    secondaryMargin,
    subjectBreakdown,
    bestLeverageSubjects,
  };
}

