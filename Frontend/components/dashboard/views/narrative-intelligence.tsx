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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import {
  competitors,
  getCompetitorColor,
  getCompetitorName,
  type CompetitorId,
} from '@/lib/demo-data';
import { useNarratives } from '@/hooks/use-dashboard-data';
import { Spinner } from '@/components/ui/spinner';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface NarrativeIntelligenceProps {
  selectedCompetitor: CompetitorId | 'all';
}

export function NarrativeIntelligence({ selectedCompetitor }: NarrativeIntelligenceProps) {
  const [deepDiveCompetitor, setDeepDiveCompetitor] = useState<CompetitorId>('novasuite');
  const { data, isLoading, error } = useNarratives(selectedCompetitor === 'all' ? undefined : selectedCompetitor);

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
        <p className="text-muted-foreground">Failed to load narrative data</p>
      </div>
    );
  }

  const filteredNarratives = selectedCompetitor === 'all'
    ? data.competitorNarratives
    : data.competitorNarratives.filter(n => n.competitor === selectedCompetitor);

  const currentRadarData = data.radarData[deepDiveCompetitor] || [];
  const currentClaims = data.keyClaims[deepDiveCompetitor] || [];

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="grid grid-cols-5 gap-6 h-[calc(100vh-8rem)]">
      {/* Left Panel - Narrative Map */}
      <div className="col-span-2 overflow-auto">
        <Card className="border-border h-full">
          <CardHeader className="pb-3 sticky top-0 bg-card z-10">
            <CardTitle className="text-base font-semibold">
              What story is each competitor telling the market?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredNarratives.map((narrative) => (
              <div
                key={narrative.competitor}
                className="p-4 bg-card-tint rounded border-l-3"
                style={{ borderLeftColor: getCompetitorColor(narrative.competitor), borderLeftWidth: '3px' }}
              >
                <h3 className="font-semibold text-foreground">
                  {getCompetitorName(narrative.competitor)}
                </h3>
                
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Core Narrative
                  </p>
                  <p className="text-sm text-foreground italic">
                    &ldquo;{narrative.coreNarrative}&rdquo;
                  </p>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                    Tone Tags
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {narrative.toneTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">
                    Narrative Drift Indicator
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: `${narrative.narrativeDrift}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">{narrative.narrativeDrift}%</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                    <span>Stable</span>
                    <span>Shifting</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">SNVR Novelty Sub-score</span>
                    <span
                      className="text-sm font-semibold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: narrative.noveltyScore >= 70 ? 'rgba(192, 57, 43, 0.1)' : narrative.noveltyScore >= 40 ? 'rgba(196, 122, 26, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: narrative.noveltyScore >= 70 ? '#C0392B' : narrative.noveltyScore >= 40 ? '#C47A1A' : '#6B7280',
                      }}
                    >
                      {narrative.noveltyScore}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Deep Dive */}
      <div className="col-span-3 overflow-auto">
        <Card className="border-border h-full">
          <CardHeader className="pb-3 sticky top-0 bg-card z-10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Deep Dive Analysis</CardTitle>
              <Select
                value={deepDiveCompetitor}
                onValueChange={(value) => setDeepDiveCompetitor(value as CompetitorId)}
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
          <CardContent className="space-y-6">
            {/* Narrative Breakdown Radar */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Narrative Breakdown</h4>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={currentRadarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis 
                      dataKey="metric" 
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} 
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 10]} 
                      tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    />
                    <Radar
                      name="ARIA"
                      dataKey="aria"
                      stroke="#1B3A5E"
                      fill="#1B3A5E"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name={getCompetitorName(deepDiveCompetitor)}
                      dataKey="competitor"
                      stroke={getCompetitorColor(deepDiveCompetitor)}
                      fill={getCompetitorColor(deepDiveCompetitor)}
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Key Claim Tracker */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-3">Key Claim Tracker</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Claim</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">First Detected</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Frequency</th>
                      <th className="text-right py-2 px-3 text-muted-foreground font-medium">Saturation</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentClaims.map((claim, index) => (
                      <tr key={index} className="border-b border-border last:border-0">
                        <td className="py-2.5 px-3 text-foreground">{claim.claim}</td>
                        <td className="py-2.5 px-3 text-muted-foreground">{claim.firstDetected}</td>
                        <td className="py-2.5 px-3 text-right text-foreground">{claim.frequency}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span
                            className="inline-block w-12 text-center py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: claim.saturationScore >= 70 ? 'rgba(192, 57, 43, 0.1)' : claim.saturationScore >= 40 ? 'rgba(196, 122, 26, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                              color: claim.saturationScore >= 70 ? '#C0392B' : claim.saturationScore >= 40 ? '#C47A1A' : '#6B7280',
                            }}
                          >
                            {claim.saturationScore}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex justify-center">
                            {getTrendIcon(claim.trend)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
