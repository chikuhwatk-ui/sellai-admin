"use client";

import React from "react";

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number[];
  prefix?: string;
}

export function KPICard({
  title,
  value,
  change,
  subtitle,
  icon,
  trend,
  prefix,
}: KPICardProps) {
  const isPositive = change !== undefined && change >= 0;
  const formattedValue =
    typeof value === "number"
      ? prefix
        ? `${prefix}${value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`
        : value.toLocaleString()
      : value;

  return (
    <div className="bg-surface border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <span className="text-fg-muted text-sm font-medium">{title}</span>
        {icon && (
          <span className="text-fg-muted group-hover:text-primary transition-colors">
            {icon}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-fg">{formattedValue}</div>
          <div className="flex items-center gap-2 mt-1">
            {change !== undefined && (
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                  isPositive ? "text-primary" : "text-danger"
                }`}
              >
                <svg
                  className={`w-3 h-3 ${isPositive ? "" : "rotate-180"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 15.75l7.5-7.5 7.5 7.5"
                  />
                </svg>
                {isPositive ? "+" : ""}
                {change}%
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-fg-muted">{subtitle}</span>
            )}
          </div>
        </div>
        {trend && trend.length > 1 && (
          <svg
            width="72"
            height="32"
            viewBox="0 0 72 32"
            className="opacity-50 group-hover:opacity-80 transition-opacity"
          >
            <defs>
              <linearGradient
                id={`sparkline-${title.replace(/\s/g, "")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={isPositive ? "#10B981" : "#EF4444"}
                  stopOpacity="0.3"
                />
                <stop
                  offset="100%"
                  stopColor={isPositive ? "#10B981" : "#EF4444"}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            <path
              d={(() => {
                const min = Math.min(...trend);
                const max = Math.max(...trend);
                const range = max - min || 1;
                const points = trend.map((v, i) => {
                  const x = (i / (trend.length - 1)) * 68 + 2;
                  const y = 28 - ((v - min) / range) * 24;
                  return { x, y };
                });
                const line = points
                  .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
                  .join(" ");
                const fill = `${line} L${points[points.length - 1].x},30 L${points[0].x},30 Z`;
                return fill;
              })()}
              fill={`url(#sparkline-${title.replace(/\s/g, "")})`}
            />
            <polyline
              points={trend
                .map((v, i) => {
                  const min = Math.min(...trend);
                  const max = Math.max(...trend);
                  const range = max - min || 1;
                  const x = (i / (trend.length - 1)) * 68 + 2;
                  const y = 28 - ((v - min) / range) * 24;
                  return `${x},${y}`;
                })
                .join(" ")}
              fill="none"
              stroke={isPositive ? "#10B981" : "#EF4444"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

export default KPICard;
