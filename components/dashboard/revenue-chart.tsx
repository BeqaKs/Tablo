'use client';

import { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { formatGEL } from '@/lib/utils/currency';

export function RevenueChart({ data }: { data: any[] }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="h-[300px] w-full animate-pulse bg-white/5 rounded-xl" />;

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(347 78% 58%)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(347 78% 58%)" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(231 24% 16%)" vertical={false} />
                    <XAxis
                        dataKey="name"
                        stroke="hsl(220 15% 40%)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="hsl(220 15% 40%)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₾${value}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'hsl(231 24% 11%)',
                            borderColor: 'hsl(231 24% 16%)',
                            borderRadius: '12px',
                            color: 'white',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                        }}
                        itemStyle={{ color: 'hsl(347 78% 70%)' }}
                        formatter={(value: any) => [`₾${value}`, 'Revenue']}
                    />
                    <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(347 78% 65%)"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        activeDot={{ r: 6, fill: 'hsl(347 78% 70%)', stroke: '#1a1d24', strokeWidth: 4 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
