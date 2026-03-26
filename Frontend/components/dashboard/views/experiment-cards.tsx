'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getCompetitorName,
  getCompetitorColor,
  calculatePriority,
  type CompetitorId,
} from '@/lib/demo-data';
import { useExperiments } from '@/hooks/use-dashboard-data';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { Check, Share2, Archive, Zap, Target } from 'lucide-react';

interface ExperimentCardsProps {
  selectedCompetitor: CompetitorId | 'all';
}

type CategoryFilter = 'All' | 'Messaging' | 'Pricing' | 'Product' | 'SEO' | 'Social';
type SortOption = 'priority' | 'newest' | 'competitor';

const categories: CategoryFilter[] = ['All', 'Messaging', 'Pricing', 'Product', 'SEO', 'Social'];

export function ExperimentCards({ selectedCompetitor }: ExperimentCardsProps) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [experimentStatus, setExperimentStatus] = useState<Record<string, string>>({});
  const { data, isLoading, error } = useExperiments(selectedCompetitor === 'all' ? undefined : selectedCompetitor);

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
        <p className="text-muted-foreground">Failed to load experiments data</p>
      </div>
    );
  }

  const getStatus = (id: string, defaultStatus: Experiment['status']) => {
    return experimentStatus[id] ?? defaultStatus;
  };

  const toggleRunning = (id: string) => {
    setExperimentStatus(prev => ({
      ...prev,
      [id]: prev[id] === 'running' ? 'pending' : 'running',
    }));
  };

  const filteredExperiments = data.experiments
    .filter(exp => selectedCompetitor === 'all' || exp.competitor === selectedCompetitor)
    .filter(exp => categoryFilter === 'All' || exp.category === categoryFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return b.snvrScore - a.snvrScore;
        case 'newest':
          return parseInt(b.id) - parseInt(a.id);
        case 'competitor':
          return a.competitor.localeCompare(b.competitor);
        default:
          return 0;
      }
    });

  const getEffortColor = (effort: 'Low' | 'Medium' | 'High') => {
    switch (effort) {
      case 'Low':
        return 'bg-success/10 text-success';
      case 'Medium':
        return 'bg-warning/10 text-warning';
      case 'High':
        return 'bg-destructive/10 text-destructive';
    }
  };

  const getImpactColor = (impact: 'Low' | 'Medium' | 'High') => {
    switch (impact) {
      case 'Low':
        return 'bg-muted text-muted-foreground';
      case 'Medium':
        return 'bg-accent/10 text-accent';
      case 'High':
        return 'bg-accent/20 text-accent';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-muted-foreground">
          Turn intelligence into action. Every insight below maps to a specific experiment your team can run.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted p-1 rounded">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded transition-colors',
                categoryFilter === category
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {category}
            </button>
          ))}
        </div>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">Sort by: Priority</SelectItem>
            <SelectItem value="newest">Sort by: Newest</SelectItem>
            <SelectItem value="competitor">Sort by: Competitor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards Grid */}
      {filteredExperiments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No experiments match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {filteredExperiments.map((exp) => {
            const status = getStatus(exp.id, exp.status);
            const priority = calculatePriority(exp.snvrScore);

            return (
              <Card key={exp.id} className="border-border">
                <CardContent className="pt-5">
                  {/* Header Tags */}
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded',
                        priority === 'HIGH' && 'bg-destructive/10 text-destructive',
                        priority === 'MEDIUM' && 'bg-warning/10 text-warning',
                        priority === 'LOW' && 'bg-muted text-muted-foreground'
                      )}
                    >
                      SNVR {exp.snvrScore}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded font-medium"
                      style={{
                        backgroundColor: `${getCompetitorColor(exp.competitor)}15`,
                        color: getCompetitorColor(exp.competitor),
                      }}
                    >
                      {getCompetitorName(exp.competitor)}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                      {exp.category}
                    </span>
                  </div>

                  {/* Hypothesis */}
                  <h3 className="font-semibold text-foreground leading-snug mb-4">
                    {exp.hypothesis}
                  </h3>

                  {/* Trigger */}
                  <div className="mb-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Trigger
                    </span>
                    <p className="text-sm text-foreground mt-0.5">{exp.trigger}</p>
                  </div>

                  {/* Recommended Action */}
                  <div className="mb-4">
                    <span className="text-xs font-medium text-accent uppercase tracking-wide">
                      Recommended Action
                    </span>
                    <p className="text-sm text-foreground mt-0.5">{exp.recommendedAction}</p>
                  </div>

                  {/* Effort & Impact */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Effort:</span>
                      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', getEffortColor(exp.effort))}>
                        {exp.effort}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Impact:</span>
                      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', getImpactColor(exp.impact))}>
                        {exp.impact}
                      </span>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <Button
                      size="sm"
                      onClick={() => toggleRunning(exp.id)}
                      className={cn(
                        'h-8',
                        status === 'running'
                          ? 'bg-success hover:bg-success/90 text-success-foreground'
                          : 'bg-accent hover:bg-accent/90 text-accent-foreground'
                      )}
                    >
                      {status === 'running' ? (
                        <>
                          <Check className="w-3.5 h-3.5 mr-1.5" />
                          Running
                        </>
                      ) : (
                        'Mark as Running'
                      )}
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="h-8 text-muted-foreground">
                        <Archive className="w-3.5 h-3.5 mr-1" />
                        Archive
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 text-muted-foreground">
                        <Share2 className="w-3.5 h-3.5 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
