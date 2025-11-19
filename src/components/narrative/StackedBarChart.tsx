import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface StackedBarChartProps {
  data: any[];
  xKey: string;
  dataKeys: { key: string; color: string; label: string }[];
  height?: number;
}

export function StackedBarChart({ 
  data, 
  xKey, 
  dataKeys,
  height = 300 
}: StackedBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-lg p-3">
          <p className="text-[#ECEDEF] text-sm font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => {
            // Format Team Payroll to 1 decimal place, other values as needed
            const formattedValue = entry.name === 'Team Payroll' 
              ? entry.value.toFixed(1) 
              : typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value;
            return (
              <p key={index} className="text-xs" style={{ color: entry.color }}>
                {entry.name}: ${formattedValue}M
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 50, bottom: data.length > 5 ? 40 : 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
        <XAxis 
          dataKey={xKey} 
          stroke="#A3A8B0" 
          style={{ fontSize: '12px' }}
          interval={0}
          tick={{ fill: '#A3A8B0' }}
        />
        <YAxis 
          stroke="#A3A8B0" 
          style={{ fontSize: '12px' }}
          width={45}
          tickFormatter={(value) => `$${value}M`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: '12px', color: '#A3A8B0' }}
          iconType="square"
        />
        {dataKeys.map((dk) => (
          <Bar 
            key={dk.key}
            dataKey={dk.key} 
            stackId="a"
            fill={dk.color} 
            name={dk.label}
            radius={dk.key === dataKeys[dataKeys.length - 1].key ? [4, 4, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
