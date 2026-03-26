'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
} from 'recharts';
import {
  competitors,
  getCompetitorName,
  getCompetitorColor,
  type CompetitorId,
} from '@/lib/demo-data';
import { useSignalGuard } from '@/hooks/use-dashboard-data';
import { Spinner } from '@/components/ui/spinner';
import { Shield, AlertTriangle } from 'lucide-react';

interface SignalGuardProps {
  selectedCompetitor: CompetitorId | 'all';
}

export function SignalGuard({ selectedCompetitor }: SignalGuardProps) {
  const [dismissedFlags, setDismissedFlags] = useState<Set<string>>(new Set());
  const { data, isLoading, error } = useSignalGuard(selectedCompetitor === 'all' ? undefined : selectedCompetitor);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="w-8 h-8 text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Failed to load signal guard data</p>
      </div>
    );
  }

  const filteredFlags = (selectedCompetitor === 'all'
    ? data.manipulationFlags
    : data.manipulationFlags.filter(f => f.competitor === selectedCompetitor)
  ).filter(f => !dismissedFlags.has(f.id));

  const activeFlags = filteredFlags.length;

  const handleDismiss = (id: string) => {
    setDismissedFlags(new Set([...dismissedFlags, id]));
  };

  const getTrustColor = (trust: 'high' | 'medium' | 'low') => {
    switch (trust) {
      case 'high':
        return 'bg-success';
      case 'medium':
        return 'bg-warning';
      case 'low':
        return 'bg-destructive';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {activeFlags > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-warning/10 border border-warning/20 rounded">
          <Shield className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm text-warning font-medium">
            {activeFlags} manipulation signal{activeFlags > 1 ? 's' : ''} detected this week. Review flagged sources.
          </p>
        </div>
      )}

      {/* Flags Table */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Adversarial Detection Flags</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredFlags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No active manipulation flags detected.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Competitor</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Signal Type</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Source</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Detected On</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Suspicion</th>
                    <th className="text-left py-2 px-3 text-muted-foreground font-medium">Evidence Summary</th>
                    <th className="text-right py-2 px-3 text-muted-foreground font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFlags.map((flag) => (
                    <tr key={flag.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-3">
                        <span 
                          className="font-medium"
                          style={{ color: getCompetitorColor(flag.competitor) }}
                        >
                          {getCompetitorName(flag.competitor)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 text-foreground">
                          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                          {flag.signalType}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{flag.source}</td>
                      <td className="py-3 px-3 text-muted-foreground">{flag.detectedOn}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${flag.suspicionScore}%`,
                                backgroundColor: flag.suspicionScore >= 70 ? '#C0392B' : flag.suspicionScore >= 40 ? '#C47A1A' : '#6B7280',
                              }}
                            />
                          </div>
                          <span className="text-xs font-medium text-foreground w-6">{flag.suspicionScore}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground max-w-xs">
                        {flag.evidenceSummary}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-warning text-warning hover:bg-warning/10"
                          >
                            Flag for Review
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-muted-foreground"
                            onClick={() => handleDismiss(flag.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Review Velocity Chart */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Review Velocity (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.reviewVelocity} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 10 }} 
                    stroke="var(--muted-foreground)"
                    tickFormatter={(value) => value % 5 === 0 ? value : ''}
                  />
                  <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  {/* Anomaly highlight */}
                  <ReferenceArea x1={21} x2={23} fill="rgba(192, 57, 43, 0.1)" />
                  {(selectedCompetitor === 'all' || selectedCompetitor === 'novasuite') && (
                    <Bar dataKey="novasuite" name="NovaSuite" fill="#0F7DC2" radius={[2, 2, 0, 0]} />
                  )}
                  {(selectedCompetitor === 'all' || selectedCompetitor === 'flowdesk') && (
                    <Bar dataKey="flowdesk" name="FlowDesk" fill="#1A7A4A" radius={[2, 2, 0, 0]} />
                  )}
                  {(selectedCompetitor === 'all' || selectedCompetitor === 'taskbridge') && (
                    <Bar dataKey="taskbridge" name="TaskBridge" fill="#C47A1A" radius={[2, 2, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="inline-block w-3 h-3 bg-destructive/10 mr-1 align-middle rounded"></span>
              Highlighted area indicates detected anomaly period
            </p>
          </CardContent>
        </Card>

        {/* Source Trust Matrix */}
        <Card className="border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Source Trust Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Source</th>
                    {competitors
                      .filter(c => selectedCompetitor === 'all' || c.id === selectedCompetitor)
                      .map((c) => (
                        <th key={c.id} className="text-center py-2 px-2 text-muted-foreground font-medium">
                          {c.name}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {data.sourceTrustMatrix.map((row) => (
                    <tr key={row.source} className="border-b border-border last:border-0">
                      <td className="py-2.5 px-2 text-foreground font-medium">{row.source}</td>
                      {selectedCompetitor === 'all' ? (
                        <>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`inline-block w-4 h-4 rounded-full ${getTrustColor(row.novasuite)}`} />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`inline-block w-4 h-4 rounded-full ${getTrustColor(row.flowdesk)}`} />
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <span className={`inline-block w-4 h-4 rounded-full ${getTrustColor(row.taskbridge)}`} />
                          </td>
                        </>
                      ) : (
                        <td className="py-2.5 px-2 text-center">
                          <span className={`inline-block w-4 h-4 rounded-full ${getTrustColor(row[selectedCompetitor])}`} />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-success" /> High Trust
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-warning" /> Medium Trust
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-destructive" /> Low Trust
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
