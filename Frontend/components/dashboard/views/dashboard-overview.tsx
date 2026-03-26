'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  getCompetitorName,
  getCompetitorColor,
  calculatePriority,
  type CompetitorId
} from '@/lib/demo-data';
import { useDashboardOverview } from '@/hooks/use-dashboard-data';
import { Spinner } from '@/components/ui/spinner';
import { PriorityBadge } from '../priority-badge';
import { CompetitorAvatar } from '../competitor-avatar';
import { cn } from '@/lib/utils';
import { Activity, AlertTriangle, FlaskConical, Shield, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface DashboardOverviewProps {
  selectedCompetitor: CompetitorId | 'all';
}



const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DashboardOverview({ selectedCompetitor }: DashboardOverviewProps) {
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const { data, isLoading, error } = useDashboardOverview(selectedCompetitor === 'all' ? undefined : selectedCompetitor);

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
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  const filteredSignals = selectedCompetitor === 'all' 
    ? data.recentSignals 
    : data.recentSignals.filter(s => s.competitor === selectedCompetitor);

  const filteredNarrativeShifts = selectedCompetitor === 'all'
    ? data.narrativeShifts
    : data.narrativeShifts.filter(n => n.competitor === selectedCompetitor);

  const kpiDataDynamic = [
    { label: 'Signals Monitored', value: data.kpis.signalsMonitored, icon: Activity, color: 'text-accent', trend: data.kpis.trendsSignals },
    { label: 'High Priority Alerts', value: data.kpis.highPriorityAlerts, icon: AlertTriangle, color: 'text-destructive', bgTint: 'bg-destructive/5', trend: data.kpis.trendsAlerts },
    { label: 'Narrative Shifts', value: data.kpis.narrativeShifts, icon: FlaskConical, color: 'text-foreground', trend: data.kpis.trendsNarratives },
    { label: 'Avg SNVR Score', value: data.kpis.avgSnvrScore, icon: Shield, color: 'text-warning', bgTint: 'bg-warning/5', trend: data.kpis.trendsSnvr },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {kpiDataDynamic.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className={cn('border-border', kpi.bgTint)}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <p className={cn('text-3xl font-semibold mt-1', kpi.color)}>{kpi.value}</p>
                  </div>
                  <Icon className={cn('w-8 h-8', kpi.color)} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-5 gap-6">
        {/* Left Column - 60% */}
        <div className="col-span-3 space-y-6">
          {/* Strategic Shift Timeline */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Strategic Shift Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.snvrTimeline} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--card)', 
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '12px'
                      }} 
                    />
                    <Legend />
                    {(selectedCompetitor === 'all' || selectedCompetitor === 'novasuite') && (
                      <Line 
                        type="monotone" 
                        dataKey="novasuite" 
                        name="NovaSuite"
                        stroke="#0F7DC2" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    )}
                    {(selectedCompetitor === 'all' || selectedCompetitor === 'flowdesk') && (
                      <Line 
                        type="monotone" 
                        dataKey="flowdesk" 
                        name="FlowDesk"
                        stroke="#1A7A4A" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    )}
                    {(selectedCompetitor === 'all' || selectedCompetitor === 'taskbridge') && (
                      <Line 
                        type="monotone" 
                        dataKey="taskbridge" 
                        name="TaskBridge"
                        stroke="#C47A1A" 
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Signals */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Recent Signals</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border">
                {filteredSignals.slice(0, 5).map((signal) => (
                  <div key={signal.id} className="py-3">
                    <button
                      onClick={() => setExpandedSignal(expandedSignal === signal.id ? null : signal.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3">
                        <CompetitorAvatar competitorId={signal.competitor} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground">{signal.summary}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs px-1.5 py-0.5 bg-secondary rounded text-secondary-foreground">
                              {signal.source}
                            </span>
                            <span className="text-xs text-muted-foreground">{signal.timestamp}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={signal.priority} score={signal.snvrScore} />
                          {expandedSignal === signal.id ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </button>
                    {expandedSignal === signal.id && (
                      <div className="mt-3 ml-9 p-3 bg-card-tint rounded text-sm">
                        <p className="text-muted-foreground">
                          <strong className="text-foreground">Competitor:</strong> {getCompetitorName(signal.competitor)}
                        </p>
                        <p className="text-muted-foreground mt-1">
                          <strong className="text-foreground">SNVR Score:</strong> {signal.snvrScore} ({signal.priority} Priority)
                        </p>
                        <p className="text-muted-foreground mt-1">
                          <strong className="text-foreground">Source:</strong> {signal.source}
                        </p>
                        <Button size="sm" variant="outline" className="mt-3">
                          View Full Analysis
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - 40% */}
        <div className="col-span-2 space-y-6">
          {/* Top Narrative Shifts */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Top Narrative Shifts This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredNarrativeShifts.map((shift) => (
                <div 
                  key={shift.id} 
                  className="p-3 bg-card-tint rounded border-l-2"
                  style={{ borderLeftColor: getCompetitorColor(shift.competitor) }}
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {getCompetitorName(shift.competitor)}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <span className="text-muted-foreground line-through">{shift.oldNarrative}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <ArrowRight className="w-3 h-3 text-accent shrink-0" />
                    <span className="text-sm text-foreground font-medium">{shift.newNarrative}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <PriorityBadge priority={calculatePriority(shift.snvrScore)} score={shift.snvrScore} />
                    <Button size="sm" variant="ghost" className="text-accent hover:text-accent h-7 px-2">
                      View Experiment
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Competitor Activity Heatmap */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Competitor Activity Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {/* Header Row */}
                <div className="grid grid-cols-8 gap-1.5">
                  <div className="text-xs text-muted-foreground"></div>
                  {days.map((day) => (
                    <div key={day} className="text-xs text-muted-foreground text-center">{day}</div>
                  ))}
                </div>
                {/* Data Rows */}
                {data.heatmap
                  .filter(row => selectedCompetitor === 'all' || row.competitor === selectedCompetitor)
                  .map((row) => (
                    <div key={row.competitor} className="grid grid-cols-8 gap-1.5 items-center">
                      <div className="text-xs text-foreground font-medium truncate">
                        {getCompetitorName(row.competitor).slice(0, 8)}
                      </div>
                      {row.days.map((value, i) => {
                        const intensity = Math.min(value / 8, 1);
                        return (
                          <div
                            key={i}
                            className="aspect-square rounded-sm"
                            style={{
                              backgroundColor: `rgba(15, 125, 194, ${0.1 + intensity * 0.8})`,
                            }}
                            title={`${value} signals`}
                          />
                        );
                      })}
                    </div>
                  ))}
              </div>
              <div className="flex items-center justify-end gap-1 mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-0.5">
                  {[0.15, 0.35, 0.55, 0.75, 0.95].map((opacity, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: `rgba(15, 125, 194, ${opacity})` }}
                    />
                  ))}
                </div>
                <span>More</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
