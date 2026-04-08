'use client';

import { useApi } from '@/hooks/useApi';

export default function GeographicIntelligencePage() {
  const { data, loading } = useApi<any>('/api/admin/analytics/geographic');

  if (loading) return <div className="p-8 text-[#6B7280]">Loading...</div>;

  const cities = data?.cities || [];
  const routes = data?.corridors || [];
  const expansion = data?.expansion || [];

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
            {cities.length === 0 && (
              <text x="50" y="50" textAnchor="middle" fill="#6B7280" fontSize="4">No city data available</text>
            )}
            {cities.map((city: any) => (
              <g key={city.name}>
                <circle cx={city.x} cy={city.y} r={city.r} fill="#10B981" opacity="0.15" />
                <circle cx={city.x} cy={city.y} r={(city.r || 10) * 0.6} fill="#10B981" opacity="0.3" />
                <circle cx={city.x} cy={city.y} r={(city.r || 10) * 0.25} fill="#10B981" opacity="0.8" />
                <text x={city.x} y={city.y - (city.r || 10) - 2} textAnchor="middle" fill="#E5E7EB" fontSize="3.5" fontWeight="bold">
                  {city.name}
                </text>
                <text x={city.x} y={city.y + (city.r || 10) + 4} textAnchor="middle" fill="#6B7280" fontSize="2.5">
                  {city.demands} demands
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* City Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cities.map((city: any) => (
          <div key={city.name} className="bg-[#1A1D27] border border-[#2A2D37] rounded-xl p-4">
            <h3 className="text-white font-semibold mb-3">{city.name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#6B7280]">Users</span><span className="text-[#E5E7EB]">{(city.users || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Demands</span><span className="text-[#E5E7EB]">{(city.demands || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Fill Rate</span><span className="text-[#E5E7EB]">{city.fillRate || 0}%</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Revenue</span><span className="text-[#E5E7EB]">${(city.revenue || 0).toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-[#6B7280]">Growth</span><span className="text-[#10B981]">+{city.growth || 0}%</span></div>
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
              {routes.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-[#6B7280]">No route data available</td></tr>
              )}
              {routes.map((r: any, i: number) => (
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
              {expansion.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-[#6B7280]">No expansion data available</td></tr>
              )}
              {expansion.map((city: any) => {
                const scoreColor = (city.score || 0) >= 70 ? '#10B981' : (city.score || 0) >= 50 ? '#F59E0B' : '#EF4444';
                return (
                  <tr key={city.city} className="border-b border-[#2A2D37]/50">
                    <td className="py-2 text-[#E5E7EB] font-medium">{city.city}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-[#0F1117] rounded overflow-hidden">
                          <div className="h-full rounded" style={{ width: `${city.score || 0}%`, backgroundColor: scoreColor }} />
                        </div>
                        <span style={{ color: scoreColor }} className="text-sm font-medium">{city.score || 0}</span>
                      </div>
                    </td>
                    <td className="py-2 text-right text-[#E5E7EB]">{city.population}</td>
                    <td className="py-2 text-right text-[#E5E7EB]">{city.mobileMoney || 0}%</td>
                    <td className="py-2 text-right text-[#E5E7EB]">{city.signups || 0}</td>
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
