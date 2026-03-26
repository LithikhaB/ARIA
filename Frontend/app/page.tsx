'use client';

import { useState } from 'react';
import { Sidebar, type ViewType } from '@/components/dashboard/sidebar';
import { Header } from '@/components/dashboard/header';
import { DashboardOverview } from '@/components/dashboard/views/dashboard-overview';
import { NarrativeIntelligence } from '@/components/dashboard/views/narrative-intelligence';
import { SignalGuard } from '@/components/dashboard/views/signal-guard';
import { ExperimentCards } from '@/components/dashboard/views/experiment-cards';
import { SNVRScoring } from '@/components/dashboard/views/snvr-scoring';
import { useSync } from '@/hooks/use-dashboard-data';
import type { CompetitorId } from '@/lib/demo-data';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorId | 'all'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const { sync } = useSync();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await sync();
    } catch {
      // Fallback handled in hook
    } finally {
      setIsSyncing(false);
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview selectedCompetitor={selectedCompetitor} />;
      case 'narrative':
        return <NarrativeIntelligence selectedCompetitor={selectedCompetitor} />;
      case 'signal-guard':
        return <SignalGuard selectedCompetitor={selectedCompetitor} />;
      case 'experiments':
        return <ExperimentCards selectedCompetitor={selectedCompetitor} />;
      case 'snvr':
        return <SNVRScoring selectedCompetitor={selectedCompetitor} />;
      default:
        return <DashboardOverview selectedCompetitor={selectedCompetitor} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <Header
        currentView={currentView}
        selectedCompetitor={selectedCompetitor}
        onCompetitorChange={setSelectedCompetitor}
        onSync={handleSync}
        isSyncing={isSyncing}
      />
      <main className="ml-60 pt-15 p-6">
        {renderView()}
      </main>
    </div>
  );
}
