
import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
    data: { name: string; score: number }[];
    isDark?: boolean;
}

export const RechartsBarChart: React.FC<Props> = ({ data, isDark }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fontFamily: 'Vazirmatn', fill: isDark ? '#9ca3af' : '#6b7280' }} 
                    axisLine={false} 
                    tickLine={false} 
                />
                <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    formatter={(value: number) => [value, "امتیاز"]}
                    contentStyle={{ 
                        borderRadius: '8px', 
                        border: isDark ? '1px solid #374151' : 'none', 
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        backgroundColor: isDark ? '#1f2937' : '#fff',
                        color: isDark ? '#f3f4f6' : '#1f2937'
                    }}
                    labelStyle={{ fontFamily: 'Vazirmatn', color: isDark ? '#9ca3af' : '#888' }}
                />
                <Bar dataKey="score" radius={[4, 4, 4, 4]}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#22c55e' : entry.score >= 50 ? '#facc15' : '#f87171'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};
