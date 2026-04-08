'use client';

import { useMemo } from 'react';

export default function GeographicIntelligencePage() {
  const cities = useMemo(() => [
    { name: 'Harare', x: 62, y: 38, r: 28, users: 3420, demands: 1840, fillRate: 72, revenue: 45200, growth: 14.2 },
    { name: 'Bulawayo', x: 35, y: 72, r: 20, users: 1860, demands: 920, fillRate: 65, revenue: 22100, growth: 8.5 },
    { name: 'Mutare', x: 82, y: 42, r: 14, users: 680, demands: 340, fillRate: 58, revenue: 8400, growth: 22.1 },
    { name: 'Gweru', x: 45, y: 55, r: 12, users: 420, demands: 210, fillRate: 51, revenue: 5100, growth: 11.3 },
    { name: 'Masvingo', x: 58, y: 68, r: 8, users: 240, demands: 120, fillRate: 45, revenue: 2800, growth: 6.7 },
  ], []);

  const routes = useMemo(() => [
    { from: 'Harare CBD', to: 'Borrowdale', volume: 342, avgTime: '28min' },
    { from: 'Harare CBD', to: 'Avondale', volume: 287, avgTime: '22min' },
    { from: 'Bulawayo CBD', to: 'Hillside', volume: 198, avgTime: '18min' },
    { from: 'Harare CBD', to: 'Eastlea', volume: 176, avgTime: '15min' },
    { from: 'Harare CBD', to: 'Mbare', volume: 154, avgTime: '20min' },
    { from: 'Mutare CBD', to: 'Murambi', volume: 112, avgTime: '25min' },
    { from: 'Borrowdale', to: 'Mt Pleasant', volume: 98, avgTime: '16min' },
    { from: 'Bulawayo CBD', to: 'Burnside', volume: 87, avgTime: '14min' },
    { from: 'Gweru CBD', to: 'Mkoba', volume: 65, avgTime: '12min' },
    { from: 'Avondale', to: 'Harare CBD', volume: 54, avgTime: '24min' },
  ], []);

  const expansion = useMemo(() => [
    { city: 'Chitungwiza', score: 78, population: '356K', mobileMoney: 72, signups: 145 },
    { city: 'Epworth', score: 65, population: '228K', mobileMoney: 64, signups: 67 },
    { city: 'Kadoma', score: 52, population: '91K', mobileMoney: 58, signups: 34 },
    { city: 'Kwekwe', score: 48, population: '100K', mobileMoney: 55, signups: 28 },
    { city: 'Chinhoyi', score: 42, population: '79K', mobileMoney: 51, signups: 18 },
    { city: 'Zvishavane', score: 35, population: '45K', mobileMoney: 47, signups: 12 },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Geographic Intelligence</h1>
        <p className="text-[#6B7280] text-sm">Demand distribution, delivery corridors, and expansion opportunities</p>
      </div>

      {/* Demand Heatmap */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Demand Hotspots — Zimbabwe</h2>
        <div className="relative w-full h-[400px] bg-[#0F1117] rounded-lg border border-[#2A2D37] overflow-hidden">
          <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* Country outline approximation */}
            <path
              d="M 20,15 L 75,12 L 88,30 L 90,55 L 80,75 L 60,85 L 35,82 L 18,70 L 10,50 L 15,30 Z"
              fill="none"
              stroke="#2A2D37"
              strokeWidth="0.5"
            />
            <text x="50" y="95" textAnchor="middle" fill="#2A2D37" fontSize="3">ZIMBABWE</text>
            {/* City hotspots */}
            {cities.map(city => (
              <g key={city.name}>
                <circle cx={city.x} cy={city.y} r={city.r} fill="#10B981" opacity="0.15" />
                <circle cx={city.x} cy={city.y} r={city.r * 0.6} fill="#10B981" opacity="0.3" />
                <circle cx={city.x} cy={city.y} r={city.r * 0.25} fill="#10B981" opacity="0.8" />
                <text x={city.x} y={city.y - city.r - 2} textAnchor="middle" fill="#E5E7EB" fontSize="3.5" fontWeight="bold">
                  {city.name}
                </text>
                <text x={city.x} y={city.y + city.r + 4} textAnchor="middle" fill="#6B7280" fontSize="2.5">
                  {city.demands} demands
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* City Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cities.map(city => (
          <div key={city.name} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">{city.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#6B7280]">Users</span><span className="text-[#E5E7EB]">{city.users.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Demands</span><span className="text-[#E5E7EB]">{city.demands.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Fill Rate</span><span className="text-[#E5E7EB]">{city.fillRate}%</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Revenue</span><span className="text-[#E5E7EB]">${city.revenue.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Growth</span><span className="text-[#10B981]">+{city.growth}%</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Routes */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Top Delivery Corridors</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2D37]">
                <th className="text-left py-2 text-[#6B7280] font-medium">#</th>
                <th className="text-left py-2 text-[#6B7280] font-medium">Pickup</th>
                <th className="text-left py-2 text-[#6B7280] font-medium"></th>
                <th className="text-left py-2 text-[#6B7280] font-medium">Delivery</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Volume</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Avg Time</th>
              </tr>
            </thead>
            <tbody>
              {routes.map((r, i) => (
                <tr key={i} className="border-b border-[#2A2D37]/50">
                  <td className="py-2 text-[#6B7280]">{i + 1}</td>
                  <td className="py-2 text-[#E5E7EB]">{r.from}</td>
                  <td className="py-2 text-[#10B981]">→</td>
                  <td className="py-2 text-[#E5E7EB]">{r.to}</td>
                  <td className="py-2 text-right text-[#E5E7EB]">{r.volume}</td>
                  <td className="py-2 text-right text-[#06B6D4]">{r.avgTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expansion Readiness */}
      <div className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Expansion Readiness</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2A2D37]">
                <th className="text-left py-2 text-[#6B7280] font-medium">City</th>
                <th className="text-left py-2 text-[#6B7280] font-medium">Readiness Score</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Population</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Mobile Money %</th>
                <th className="text-right py-2 text-[#6B7280] font-medium">Current Signups</th>
              </tr>
            </thead>
            <tbody>
              {expansion.map(city => {
                const scoreColor = city.score >= 70 ? '#10B981' : city.score >= 50 ? '#F59E0B' : '#EF4444';
                return (
                  <tr key={city.city} className="border-b border-[#2A2D37]/50">
                    <td className="py-2 text-[#E5E7EB] font-medium">{city.city}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#0F1117] rounded overflow-hidden">
                          <div className="h-full rounded" style={{ width: `${city.score}%`, backgroundColor: scoreColor }} />
                        </div>
                        <span style={{ color: scoreColor }} className="text-sm font-medium">{city.score}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right text-[#E5E7EB]">{city.population}</td>
                    <td className="py-2 text-right text-[#E5E7EB]">{city.mobileMoney}%</td>
                    <td className="py-2 text-right text-[#E5E7EB]">{city.signups}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
