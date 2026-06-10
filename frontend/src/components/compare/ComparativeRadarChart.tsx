"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Tooltip, Legend } from 'recharts';

const data = [
  { subject: 'Liquidity', A: 85, B: 65, fullMark: 100 },
  { subject: 'Value', A: 90, B: 70, fullMark: 100 },
  { subject: 'Yield', A: 80, B: 85, fullMark: 100 },
  { subject: 'Location', A: 75, B: 95, fullMark: 100 },
  { subject: 'Appreciation', A: 88, B: 60, fullMark: 100 },
];

export function ComparativeRadarChart() {
  return (
    <div className="w-full h-full min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#3f3f46" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
            itemStyle={{ color: '#e4e4e7' }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
          <Radar name="Marina One Residences" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.4} />
          <Radar name="The Sail @ Marina Bay" dataKey="B" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
