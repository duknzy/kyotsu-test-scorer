import React from 'react';
import { MockExamSession, SubjectDefinition } from '../types';
import { SUBJECT_DEFINITIONS } from '../data/defaultSubjects';

interface RadarChartProps {
  session: MockExamSession;
}

export const SubjectRadarChart: React.FC<RadarChartProps> = ({ session }) => {
  const activeSubjects: SubjectDefinition[] = SUBJECT_DEFINITIONS.filter(
    (s) => session.scores[s.id]?.enabled
  );

  if (activeSubjects.length < 3) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        3科目以上有効にするとレーダーチャートが表示されます
      </div>
    );
  }

  const size = 280;
  const center = size / 2;
  const radius = 95;
  const count = activeSubjects.length;

  const getCoordinates = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    const r = radius * Math.max(0, Math.min(1, ratio));
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0];

  // Current score polygon
  const actualPoints = activeSubjects
    .map((subj, idx) => {
      const score = session.scores[subj.id]?.rawScore ?? 0;
      const coord = getCoordinates(idx, score / subj.maxScore);
      return `${coord.x},${coord.y}`;
    })
    .join(' ');

  // Target score polygon
  const targetPoints = activeSubjects
    .map((subj, idx) => {
      const target = session.scores[subj.id]?.targetScore ?? subj.defaultTarget;
      const coord = getCoordinates(idx, target / subj.maxScore);
      return `${coord.x},${coord.y}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Background polygons */}
        {rings.map((r, rIdx) => {
          const pts = activeSubjects
            .map((_, idx) => {
              const coord = getCoordinates(idx, r);
              return `${coord.x},${coord.y}`;
            })
            .join(' ');
          return (
            <polygon
              key={rIdx}
              points={pts}
              fill={rIdx === rings.length - 1 ? 'rgba(241, 245, 249, 0.4)' : 'none'}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={r === 0.75 ? '3 3' : undefined}
            />
          );
        })}

        {/* Axis lines & labels */}
        {activeSubjects.map((subj, idx) => {
          const end = getCoordinates(idx, 1);
          const labelPos = getCoordinates(idx, 1.24);
          const scoreData = session.scores[subj.id];
          const pct = Math.round(((scoreData?.rawScore ?? 0) / subj.maxScore) * 100);
          return (
            <g key={subj.id}>
              <line
                x1={center}
                y1={center}
                x2={end.x}
                y2={end.y}
                stroke="#cbd5e1"
                strokeWidth="1"
              />
              <text
                x={labelPos.x}
                y={labelPos.y - 5}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-slate-700 text-[11px] font-semibold"
              >
                {subj.shortName}
              </text>
              <text
                x={labelPos.x}
                y={labelPos.y + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-indigo-600 text-[10px] font-bold"
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Target Polygon */}
        <polygon
          points={targetPoints}
          fill="rgba(244, 63, 94, 0.08)"
          stroke="#f43f5e"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />

        {/* Actual Score Polygon */}
        <polygon
          points={actualPoints}
          fill="rgba(79, 70, 229, 0.25)"
          stroke="#4f46e5"
          strokeWidth="2.5"
        />

        {/* Vertices */}
        {activeSubjects.map((subj, idx) => {
          const score = session.scores[subj.id]?.rawScore ?? 0;
          const coord = getCoordinates(idx, score / subj.maxScore);
          return (
            <circle
              key={subj.id}
              cx={coord.x}
              cy={coord.y}
              r="3.5"
              className="fill-indigo-600 stroke-white stroke-2"
            />
          );
        })}
      </svg>

      <div className="mt-2 flex items-center gap-5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border-2 border-indigo-600 bg-indigo-500/30"></span>
          <span className="font-medium">今回の得点率</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-b-2 border-dashed border-rose-500"></span>
          <span className="font-medium">目標ライン</span>
        </div>
      </div>
    </div>
  );
};

interface TrendLineChartProps {
  sessions: MockExamSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
}

export const ScoreTrendChart: React.FC<TrendLineChartProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
}) => {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));

  const dataPoints = sorted.map((sess) => {
    let raw = 0;
    let max = 0;
    let target = 0;
    SUBJECT_DEFINITIONS.forEach((subj) => {
      const s = sess.scores[subj.id];
      if (s?.enabled) {
        raw += s.rawScore;
        max += subj.maxScore;
        target += s.targetScore;
      }
    });
    const pct = max > 0 ? (raw / max) * 100 : 0;
    const targetPct = max > 0 ? (target / max) * 100 : 0;
    return {
      id: sess.id,
      title: sess.title,
      date: sess.date,
      provider: sess.provider,
      raw,
      max,
      pct,
      targetPct,
    };
  });

  const width = 520;
  const height = 210;
  const padLeft = 42;
  const padRight = 28;
  const padTop = 24;
  const padBottom = 38;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const minY = 50; // 50%〜100%表示で推移を見やすく
  const maxY = 100;

  const getX = (index: number) => {
    if (dataPoints.length <= 1) return padLeft + chartW / 2;
    return padLeft + (index / (dataPoints.length - 1)) * chartW;
  };

  const getY = (pct: number) => {
    const clamped = Math.max(minY, Math.min(maxY, pct));
    return padTop + chartH - ((clamped - minY) / (maxY - minY)) * chartH;
  };

  const polylinePoints = dataPoints
    .map((d, i) => `${getX(i)},${getY(d.pct)}`)
    .join(' ');

  const targetLinePoints = dataPoints
    .map((d, i) => `${getX(i)},${getY(d.targetPct)}`)
    .join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[360px]">
        {/* Y-Axis grid lines */}
        {[50, 60, 70, 80, 90, 100].map((val) => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray={val === 80 ? 'none' : '3 3'}
                strokeWidth={val === 80 ? '1.5' : '1'}
              />
              <text
                x={padLeft - 8}
                y={y + 3}
                textAnchor="end"
                className="fill-slate-400 text-[10px]"
              >
                {val}%
              </text>
            </g>
          );
        })}

        {/* Target score line */}
        {dataPoints.length > 1 && (
          <polyline
            fill="none"
            stroke="#f43f5e"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            points={targetLinePoints}
          />
        )}

        {/* Score polyline */}
        {dataPoints.length > 1 && (
          <polyline
            fill="none"
            stroke="#4f46e5"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />
        )}

        {/* Data nodes */}
        {dataPoints.map((d, i) => {
          const x = getX(i);
          const y = getY(d.pct);
          const isSelected = d.id === activeSessionId;
          return (
            <g
              key={d.id}
              onClick={() => onSelectSession(d.id)}
              className="cursor-pointer transition-transform"
            >
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 7 : 5}
                className={
                  isSelected
                    ? 'fill-indigo-600 stroke-indigo-200 stroke-4'
                    : 'fill-white stroke-indigo-600 stroke-2 hover:fill-indigo-50'
                }
              />
              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                className={`text-[11px] font-bold ${
                  isSelected ? 'fill-indigo-700' : 'fill-slate-600'
                }`}
              >
                {d.raw}点 ({d.pct.toFixed(1)}%)
              </text>
              <text
                x={x}
                y={height - 18}
                textAnchor="middle"
                className={`text-[10px] ${
                  isSelected ? 'fill-indigo-700 font-bold' : 'fill-slate-500'
                }`}
              >
                {d.date.slice(5)} ({d.provider})
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

