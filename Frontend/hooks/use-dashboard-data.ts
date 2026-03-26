import useSWR from 'swr';
import { api } from '@/lib/api';
import type {
  DashboardOverviewData,
  SignalsData,
  NarrativesData,
  SignalGuardData,
  ExperimentsData,
  SNVRData,
} from '@/lib/api';

// Fallback to demo data if API is unavailable
import * as demoData from '@/lib/demo-data';

const USE_DEMO_FALLBACK = true; // Set to false to disable fallback

function withFallback<T>(fetcher: () => Promise<T>, fallback: T) {
  return async () => {
    try {
      return await fetcher();
    } catch (error) {
      if (USE_DEMO_FALLBACK) {
        console.log('[v0] API unavailable, using demo data fallback');
        return fallback;
      }
      throw error;
    }
  };
}

// Transform demo data to API format
function getDemoOverview(): DashboardOverviewData {
  return {
    competitors: demoData.competitors.map(c => ({ ...c })),
    kpis: {
      signalsMonitored: 1247,
      highPriorityAlerts: 3,
      narrativeShifts: 2,
      avgSnvrScore: 68,
      trendsSignals: 12,
      trendsAlerts: -1,
      trendsNarratives: 1,
      trendsSnvr: 5,
    },
    recentSignals: demoData.recentSignals.map(s => ({
      ...s,
      details: `Full analysis and context for: ${s.summary}`,
    })),
    narrativeShifts: demoData.narrativeShifts.map(n => ({ ...n })),
    snvrTimeline: demoData.snvrTimelineData.map(d => ({ ...d })),
    heatmap: demoData.heatmapData.map(h => ({ ...h })),
  };
}

function getDemoNarratives(): NarrativesData {
  return {
    competitorNarratives: demoData.competitorNarratives.map(n => ({ ...n })),
    radarData: Object.fromEntries(
      Object.entries(demoData.radarData).map(([k, v]) => [k, v.map(d => ({ ...d }))])
    ),
    keyClaims: Object.fromEntries(
      Object.entries(demoData.keyClaims).map(([k, v]) => [k, v.map(c => ({ ...c }))])
    ),
  };
}

function getDemoSignalGuard(): SignalGuardData {
  return {
    alertCount: demoData.manipulationFlags.length,
    manipulationFlags: demoData.manipulationFlags.map(f => ({ ...f })),
    reviewVelocity: demoData.reviewVelocityData.map(r => ({ ...r })),
    sourceTrustMatrix: demoData.sourceTrustMatrix.map(s => ({ ...s })),
  };
}

function getDemoExperiments(): ExperimentsData {
  return {
    experiments: demoData.experiments.map(e => ({ ...e })),
  };
}

function getDemoSNVR(): SNVRData {
  return {
    competitors: demoData.competitors.map(c => ({ ...c })),
    breakdowns: demoData.snvrBreakdowns.map(b => ({ ...b })),
    history: Object.fromEntries(
      Object.entries(demoData.snvrHistory).map(([k, v]) => [k, v.map(h => ({ ...h }))])
    ),
  };
}

// SWR Hooks
export function useDashboardOverview(competitorId?: string) {
  const key = competitorId ? `/overview?competitor=${competitorId}` : '/overview';
  
  return useSWR<DashboardOverviewData>(key, 
    withFallback(() => api.getOverview(), getDemoOverview()),
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );
}

export function useSignals(competitorId?: string) {
  const key = competitorId ? `/signals?competitor=${competitorId}` : '/signals';
  
  return useSWR<SignalsData>(key,
    withFallback(() => api.getSignals(competitorId), { signals: demoData.recentSignals }),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );
}

export function useNarratives(competitorId?: string) {
  const key = competitorId ? `/narratives?competitor=${competitorId}` : '/narratives';
  
  return useSWR<NarrativesData>(key,
    withFallback(() => api.getNarratives(competitorId), getDemoNarratives()),
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );
}

export function useSignalGuard(competitorId?: string) {
  const key = competitorId ? `/signal-guard?competitor=${competitorId}` : '/signal-guard';
  
  return useSWR<SignalGuardData>(key,
    withFallback(() => api.getSignalGuard(competitorId), getDemoSignalGuard()),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );
}

export function useExperiments(competitorId?: string) {
  const key = competitorId ? `/experiments?competitor=${competitorId}` : '/experiments';
  
  return useSWR<ExperimentsData>(key,
    withFallback(() => api.getExperiments(competitorId), getDemoExperiments()),
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );
}

export function useSNVR(competitorId?: string) {
  const key = competitorId ? `/snvr?competitor=${competitorId}` : '/snvr';
  
  return useSWR<SNVRData>(key,
    withFallback(() => api.getSNVR(competitorId), getDemoSNVR()),
    {
      refreshInterval: 60000,
      revalidateOnFocus: true,
    }
  );
}

// Sync mutation
export function useSync() {
  const { mutate } = useSWR('/sync', null, { revalidateOnMount: false });
  
  const sync = async () => {
    try {
      const result = await api.sync();
      // Revalidate all dashboard data after sync
      mutate('/overview');
      mutate('/signals');
      mutate('/narratives');
      mutate('/signal-guard');
      mutate('/experiments');
      mutate('/snvr');
      return result;
    } catch (error) {
      console.log('[v0] Sync failed, data may be stale');
      throw error;
    }
  };
  
  return { sync };
}

// Update experiment status
export function useUpdateExperiment() {
  const updateStatus = async (experimentId: string, status: string) => {
    try {
      await api.updateExperimentStatus(experimentId, status);
    } catch (error) {
      console.log('[v0] Failed to update experiment status');
      throw error;
    }
  };
  
  return { updateStatus };
}
