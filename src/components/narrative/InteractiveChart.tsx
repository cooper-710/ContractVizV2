import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

interface InteractiveChartProps {
  data: any[];
  type?: 'bar' | 'line' | 'area';
  dataKey: string;
  xKey: string;
  color?: string;
  height?: number;
  valueIsPercent?: boolean;
  valueIsThreeDecimalRate?: boolean;
  yDomain?: [number, number];
}

export function InteractiveChart({ 
  data, 
  type = 'bar', 
  dataKey, 
  xKey, 
  color = '#A8B4BD',
  height = 300,
  valueIsPercent = false,
  valueIsThreeDecimalRate = false,
  yDomain: customYDomain,
}: InteractiveChartProps) {
  const isPercentKey = valueIsPercent || (typeof dataKey === 'string' && /pct/i.test(dataKey));
  const formatPercent = (value: number | string) => {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return String(value);
    const pct = num <= 1 ? num * 100 : num;
    return `${pct.toFixed(2)}%`;
  };
  const formatPercentTick = (value: number | string) => {
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return String(value);
    const pct = num <= 1 ? num * 100 : num;
    return `${Math.round(pct)}%`;
  };
  // Compute dynamic Y domain, always starting at 0 (no negatives)
  const numericValues = Array.isArray(data)
    ? data
        .map((d) => (typeof d?.[dataKey] === 'number' ? (d as any)[dataKey] : Number((d as any)[dataKey])))
        .filter((v) => Number.isFinite(v))
    : [];
  // Use custom domain if provided, otherwise compute dynamically
  const yDomain: [number, number] = customYDomain || (() => {
  const minVal = 0; // Always start at 0
  const maxVal = numericValues.length ? Math.max(...numericValues) : 0;
  const range = maxVal - minVal;
  const pad = range === 0 ? 1 : range * 0.1; // Add padding to max value
  // Y-axis always starts at 0, no negatives
    return [0, maxVal + pad];
  })();
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const raw = payload[0].value;
      const val = isPercentKey
        ? formatPercent(raw)
        : typeof raw === 'number'
          ? Number(raw).toFixed(3)
          : raw;
      return (
        <div className="bg-[#17181B] border border-[rgba(255,255,255,0.14)] rounded-lg p-3">
          <p className="text-[#ECEDEF] text-sm font-semibold">{payload[0].payload[xKey]}</p>
          <p className="text-[#A8B4BD]">{val}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === 'bar' && (
        <BarChart data={data} margin={{ top: 10, right: 10, left: 50, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey={xKey} 
            stroke="#A3A8B0" 
            style={{ fontSize: '11px' }} 
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#A3A8B0"
            style={{ fontSize: '12px' }}
            domain={yDomain}
            allowDecimals
            width={45}
            tickFormatter={(v) => {
              const num = typeof v === 'number' ? v : Number(v);
              if (!Number.isFinite(num)) return String(v);
              if (isPercentKey) return formatPercentTick(num);
              if (valueIsThreeDecimalRate) {
                const fixed = num.toFixed(3);
                return fixed.replace(/^0/, '');
              }
              return Math.round(num).toString();
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      )}
      {type === 'line' && (
        <LineChart data={data} margin={{ top: 10, right: 10, left: 50, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey={xKey} 
            stroke="#A3A8B0" 
            style={{ fontSize: '11px' }} 
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#A3A8B0"
            style={{ fontSize: '12px' }}
            domain={yDomain}
            allowDecimals
            width={45}
            tickFormatter={(v) => {
              const num = typeof v === 'number' ? v : Number(v);
              if (!Number.isFinite(num)) return String(v);
              if (isPercentKey) return formatPercentTick(num);
              if (valueIsThreeDecimalRate) {
                const fixed = num.toFixed(3);
                return fixed.replace(/^0/, '');
              }
              return Math.round(num).toString();
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ fill: color }} />
        </LineChart>
      )}
      {type === 'area' && (
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 50, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey={xKey} 
            stroke="#A3A8B0" 
            style={{ fontSize: '11px' }} 
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            stroke="#A3A8B0"
            style={{ fontSize: '12px' }}
            domain={yDomain}
            allowDecimals
            width={45}
            tickFormatter={(v) => {
              const num = typeof v === 'number' ? v : Number(v);
              if (!Number.isFinite(num)) return String(v);
              if (isPercentKey) return formatPercentTick(num);
              if (valueIsThreeDecimalRate) {
                const fixed = num.toFixed(3);
                return fixed.replace(/^0/, '');
              }
              return Math.round(num).toString();
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={`${color}20`} />
        </AreaChart>
      )}
    </ResponsiveContainer>
  );
}
