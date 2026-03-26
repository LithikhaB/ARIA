'use client';

import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ViewType } from './sidebar';
import type { CompetitorId } from '@/lib/demo-data';

interface HeaderProps {
  currentView: ViewType;
  selectedCompetitor: CompetitorId | 'all';
  onCompetitorChange: (competitor: CompetitorId | 'all') => void;
  onSync: () => void;
  isSyncing?: boolean;
}

const viewTitles: Record<ViewType, string> = {
  dashboard: 'Dashboard Overview',
  narrative: 'Narrative Intelligence',
  'signal-guard': 'Signal Guard',
  experiments: 'Experiment Cards',
  snvr: 'SNVR Scoring',
};

const competitorTabs: { id: CompetitorId | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'novasuite', label: 'NovaSuite' },
  { id: 'flowdesk', label: 'FlowDesk' },
  { id: 'taskbridge', label: 'TaskBridge' },
];

export function Header({ currentView, selectedCompetitor, onCompetitorChange, onSync, isSyncing = false }: HeaderProps) {
  return (
    <header className="fixed top-0 left-60 right-0 h-15 bg-card border-b border-border flex items-center justify-between px-6 z-10">
      {/* View Title */}
      <h1 className="text-lg font-semibold text-foreground">{viewTitles[currentView]}</h1>

      {/* Competitor Selector */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded">
        {competitorTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onCompetitorChange(tab.id)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded transition-colors',
              selectedCompetitor === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">Last synced: 2 mins ago</span>
        <Button onClick={onSync} size="sm" disabled={isSyncing} className="bg-accent hover:bg-accent/90 text-accent-foreground">
          <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", isSyncing && "animate-spin")} />
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <span className="text-xs font-medium text-primary-foreground">AR</span>
        </div>
      </div>
    </header>
  );
}
