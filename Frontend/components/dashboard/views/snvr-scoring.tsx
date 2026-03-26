'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  competitors,
  getCompetitorName,
  getCompetitorColor,
  calculatePriority,
  type CompetitorId,
} from '@/lib/demo-data';
import { useSNVR } from '@/hooks/use-dashboard-data';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';

interface SNVRScoringProps {
  selectedCompetitor: CompetitorId | 'all';
}

interface ScoreBarProps {
  label: string;
  code: string;
  score: number;
  description: string;
  isWarning?: boolean;
}

function ScoreBar({ label, code, score, description, isWarning }: ScoreBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          <span className="font-mono text-accent">{code}</span> — {label}
        </span>
        <span className={cn(
          'text-sm font-semibold',
          isWarning ? 'text-warning' : 'text-foreground'
        )}>
          {score}/100
        </span>
      </div>
      <div className="h-2 bg-border rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isWarning ? 'bg-warning' : 'bg-accent'
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className={cn(
        'text-xs',
        isWarning ? 'text-warning' : 'text-muted-foreground'
      )}>
        {description}
      </p>
    </div>
  );
}

export function SNVRScoring({ selectedCompetitor }: SNVRScoringProps) {
  const [scoreCompetitor, setScoreCompetitor] = useState<CompetitorId>(
    selectedCompetitor === 'all' ? 'novasuite' : selectedCompetitor
  );
  const [visibleLines, setVisibleLines] = useState({
    score: true,
    saturation: false,
    novelty: false,
    velocity: false,
    reliability: false,
  });
  const { data, isLoading, error } = useSNVR(selectedCompetitor === 'all' ? undefined : selectedCompetitor);

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
        <p className="text-muted-foreground">Failed to load SNVR data</p>
      </div>
    );
  }

  const currentBreakdown = data.breakdowns.find(b => b.competitor === scoreCompetitor);
  const currentHistory = data.history[scoreCompetitor] || [];
  const priority = currentBreakdown ? calculatePriority(currentBreakdown.totalScore) : 'LOW';

  const toggleLine = (key: keyof typeof visibleLines) => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getScoreDescription = (type: string, score: number) => {
    switch (type) {
      case 'saturation':
        return score >= 70 ? 'High saturation — claim is overused in market' : 
               score >= 40 ? 'Moderate saturation — some market presence' : 
               'Low saturation — unique positioning';
      case 'novelty':
        return score >= 70 ? 'High novelty — strong differentiation detected' :
               score >= 40 ? 'Moderate novelty — some unique elements' :
               'Low novelty — following market patterns';
      case 'velocity':
        return score >= 70 ? 'High velocity — rapid strategic changes' :
               score >= 40 ? 'Moderate change velocity' :
               'Low velocity — stable positioning';
      case 'reliability':
        return score >= 70 ? 'High reliability — consistent cross-source signals' :
               score >= 40 ? 'Moderate reliability — some inconsistencies' :
               'Low reliability — cross-source inconsistency detected';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <p className="text-muted-foreground">
        SNVR Score Explorer — Understand how competitor threat scores are calculated
      </p>

      {/* Score Breakdown Panel */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Score Breakdown</CardTitle>
            <Select
              value={scoreCompetitor}
              onValueChange={(value) => setScoreCompetitor(value as CompetitorId)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {competitors.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-8">
            {/* Large Score Display */}
            <div className="flex flex-col items-center justify-center">
              <div
                className={cn(
                  'text-7xl font-bold',
                  priority === 'HIGH' && 'text-destructive',
                  priority === 'MEDIUM' && 'text-warning',
                  priority === 'LOW' && 'text-muted-foreground'
                )}
              >
                {currentBreakdown?.totalScore ?? 0}
              </div>
              <div
                className={cn(
                  'mt-2 text-sm font-semibold px-3 py-1 rounded',
                  priority === 'HIGH' && 'bg-destructive/10 text-destructive',
                  priority === 'MEDIUM' && 'bg-warning/10 text-warning',
                  priority === 'LOW' && 'bg-muted text-muted-foreground'
                )}
              >
                {priority} PRIORITY
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {getCompetitorName(scoreCompetitor)}
              </p>
            </div>

            {/* Sub-scores */}
            <div className="col-span-2 space-y-4">
              <ScoreBar
                label="Saturation Index"
                code="S"
                score={currentBreakdown?.saturation ?? 0}
                description={getScoreDescription('saturation', currentBreakdown?.saturation ?? 0)}
              />
              <ScoreBar
                label="Novelty Score"
                code="N"
                score={currentBreakdown?.novelty ?? 0}
                description={getScoreDescription('novelty', currentBreakdown?.novelty ?? 0)}
              />
              <ScoreBar
                label="Velocity Score"
                code="V"
                score={currentBreakdown?.velocity ?? 0}
                description={getScoreDescription('velocity', currentBreakdown?.velocity ?? 0)}
              />
              <ScoreBar
                label="Reliability Score"
                code="R"
                score={currentBreakdown?.reliability ?? 0}
                description={getScoreDescription('reliability', currentBreakdown?.reliability ?? 0)}
                isWarning={(currentBreakdown?.reliability ?? 0) < 50}
              />
            </div>
          </div>

          {/* Formula */}
          <div className="mt-6 p-4 bg-muted rounded font-mono text-sm text-foreground">
            <code>
              SNVR = (0.20 × N) + (0.20 × V) + (0.20 × (100 - S)) + (0.25 × R) + (0.15 × StrategyShift)
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Score History */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Score History (12 Weeks)</CardTitle>
            <div className="flex items-center gap-2">
              {[
                { key: 'score', label: 'SNVR', color: getCompetitorColor(scoreCompetitor) },
                { key: 'saturation', label: 'S', color: '#C0392B' },
                { key: 'novelty', label: 'N', color: '#0F7DC2' },
                { key: 'velocity', label: 'V', color: '#1A7A4A' },
                { key: 'reliability', label: 'R', color: '#C47A1A' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => toggleLine(item.key as keyof typeof visibleLines)}
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded transition-colors',
                    visibleLines[item.key as keyof typeof visibleLines]
                      ? 'text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                  style={visibleLines[item.key as keyof typeof visibleLines] ? { backgroundColor: item.color } : {}}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                />
                {visibleLines.score && (
                  <Area
                    type="monotone"
                    dataKey="score"
                    name="SNVR Score"
                    stroke={getCompetitorColor(scoreCompetitor)}
                    fill={getCompetitorColor(scoreCompetitor)}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                )}
                {visibleLines.saturation && (
                  <Area
                    type="monotone"
                    dataKey="saturation"
                    name="Saturation"
                    stroke="#C0392B"
                    fill="#C0392B"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                )}
                {visibleLines.novelty && (
                  <Area
                    type="monotone"
                    dataKey="novelty"
                    name="Novelty"
                    stroke="#0F7DC2"
                    fill="#0F7DC2"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                )}
                {visibleLines.velocity && (
                  <Area
                    type="monotone"
                    dataKey="velocity"
                    name="Velocity"
                    stroke="#1A7A4A"
                    fill="#1A7A4A"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                )}
                {visibleLines.reliability && (
                  <Area
                    type="monotone"
                    dataKey="reliability"
                    name="Reliability"
                    stroke="#C47A1A"
                    fill="#C47A1A"
                    fillOpacity={0.1}
                    strokeWidth={2}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Score Comparison Table */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Score Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Competitor</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">S</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">N</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">V</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">R</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Strategy Shift</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">SNVR Score</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Priority</th>
                </tr>
              </thead>
              <tbody>
                {data.breakdowns
                  .filter(b => selectedCompetitor === 'all' || b.competitor === selectedCompetitor)
                  .map((breakdown) => {
                    const p = calculatePriority(breakdown.totalScore);
                    return (
                      <tr key={breakdown.competitor} className="border-b border-border last:border-0">
                        <td className="py-3 px-3">
                          <span
                            className="font-medium"
                            style={{ color: getCompetitorColor(breakdown.competitor) }}
                          >
                            {getCompetitorName(breakdown.competitor)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-muted-foreground">{breakdown.saturation}</td>
                        <td className="py-3 px-3 text-center text-muted-foreground">{breakdown.novelty}</td>
                        <td className="py-3 px-3 text-center text-muted-foreground">{breakdown.velocity}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={breakdown.reliability < 50 ? 'text-warning' : 'text-muted-foreground'}>
                            {breakdown.reliability}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-muted-foreground">{breakdown.strategyShift}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-semibold text-foreground">{breakdown.totalScore}</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={cn(
                              'text-xs font-semibold px-2 py-0.5 rounded',
                              p === 'HIGH' && 'bg-destructive/10 text-destructive',
                              p === 'MEDIUM' && 'bg-warning/10 text-warning',
                              p === 'LOW' && 'bg-muted text-muted-foreground'
                            )}
                          >
                            {p}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Explainer Box */}
      <div className="p-5 bg-card-tint rounded border border-border">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Understanding SNVR Scores</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The SNVR Score measures competitor threat level by analyzing four key dimensions: 
              <strong className="text-foreground"> Saturation</strong> (how overused their claims are), 
              <strong className="text-foreground"> Novelty</strong> (how unique their positioning is), 
              <strong className="text-foreground"> Velocity</strong> (how fast they&apos;re changing strategy), and 
              <strong className="text-foreground"> Reliability</strong> (how trustworthy the signals are across sources).
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              A <span className="text-destructive font-medium">HIGH</span> score (70+) means this competitor is making significant strategic moves that warrant immediate attention. 
              A <span className="text-warning font-medium">MEDIUM</span> score (40-69) suggests notable activity worth monitoring. 
              A <span className="font-medium">LOW</span> score (&lt;40) indicates stable positioning with minimal threat impact.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Action:</strong> Focus your competitive response efforts on HIGH priority competitors first. 
              Use the Experiment Cards to turn these insights into actionable tests for your team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
