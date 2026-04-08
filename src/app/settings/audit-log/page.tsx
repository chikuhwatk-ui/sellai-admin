'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const sampleLogs = [
  { timestamp: 'Today, 10:32 AM', user: 'Admin', action: 'Approved verification', target: 'User #4521', severity: 'info' },
  { timestamp: 'Today, 09:15 AM', user: 'Admin', action: 'Updated user role', target: 'User #3982', severity: 'warning' },
  { timestamp: 'Yesterday, 4:45 PM', user: 'Admin', action: 'Rejected verification', target: 'User #4499', severity: 'danger' },
  { timestamp: 'Yesterday, 2:20 PM', user: 'Admin', action: 'Admin login', target: 'Dashboard', severity: 'info' },
];

export default function AuditLogPage() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Audit Log</h1>
        <p className="text-sm text-text-muted mt-1">Track all admin actions and system events</p>
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-medium text-text-muted">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Target</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-muted">Severity</th>
              </tr>
            </thead>
            <tbody>
              {sampleLogs.map((log, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-3 text-text-muted text-xs">{log.timestamp}</td>
                  <td className="px-4 py-3 text-text font-medium">{log.user}</td>
                  <td className="px-4 py-3 text-text">{log.action}</td>
                  <td className="px-4 py-3 text-text-muted">{log.target}</td>
                  <td className="px-4 py-3">
                    <Badge variant={log.severity === 'danger' ? 'danger' : log.severity === 'warning' ? 'warning' : 'info'}>
                      {log.severity}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 text-center text-sm text-text-muted">
          Full audit log integration coming soon — currently showing sample entries
        </div>
      </Card>
    </div>
  );
}
