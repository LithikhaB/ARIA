// API service for ARIA Dashboard
// Communicates with backend at localhost:8080/api/dashboard

const API_BASE_URL = 'http://localhost:8080/api/dashboard';

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Dashboard endpoints
export const api = {
  // Overview data
  getOverview: () => fetchApi<DashboardOverviewData>('/overview'),
  
  // Signals
  getSignals: (competitorId?: string) => 
    fetchApi<SignalsData>(competitorId ? `/signals?competitor=${competitorId}` : '/signals'),
  
  // Narratives
  getNarratives: (competitorId?: string) => 
    fetchApi<NarrativesData>(competitorId ? `/narratives?competitor=${competitorId}` : '/narratives'),
  
  // Signal Guard (manipulation detection)
  getSignalGuard: (competitorId?: string) => 
    fetchApi<SignalGuardData>(competitorId ? `/signal-guard?competitor=${competitorId}` : '/signal-guard'),
  
  // Experiments
  getExperiments: (competitorId?: string) => 
    fetchApi<ExperimentsData>(competitorId ? `/experiments?competitor=${competitorId}` : '/experiments'),
  
  // SNVR Scoring
  getSNVR: (competitorId?: string) => 
    fetchApi<SNVRData>(competitorId ? `/snvr?competitor=${competitorId}` : '/snvr'),
  
  // Sync / refresh data
  sync: () => fetchApi<{ success: boolean; timestamp: string }>('/sync'),
  
  // Update experiment status
  updateExperimentStatus: (experimentId: string, status: string) =>
    fetch(`${API_BASE_URL}/experiments/${experimentId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then(res => res.json()),
};

// Type definitions for API responses
export interface DashboardOverviewData {
  competitors: Array<{ id: string; name: string; color: string }>;
  kpis: {
    signalsMonitored: number;
    highPriorityAlerts: number;
    narrativeShifts: number;
    avgSnvrScore: number;
    trendsSignals: number;
    trendsAlerts: number;
    trendsNarratives: number;
    trendsSnvr: number;
  };
  recentSignals: Array<{
    id: string;
    competitor: string;
    summary: string;
    source: string;
    timestamp: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    snvrScore: number;
    details?: string;
  }>;
  narrativeShifts: Array<{
    id: string;
    competitor: string;
    oldNarrative: string;
    newNarrative: string;
    snvrScore: number;
  }>;
  snvrTimeline: Array<{
    week: string;
    [competitorId: string]: number | string;
  }>;
  heatmap: Array<{
    competitor: string;
    days: number[];
  }>;
}

export interface SignalsData {
  signals: Array<{
    id: string;
    competitor: string;
    summary: string;
    source: string;
    timestamp: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    snvrScore: number;
    details?: string;
  }>;
}

export interface NarrativesData {
  competitorNarratives: Array<{
    competitor: string;
    coreNarrative: string;
    toneTags: string[];
    narrativeDrift: number;
    noveltyScore: number;
  }>;
  radarData: Record<string, Array<{
    metric: string;
    aria: number;
    competitor: number;
  }>>;
  keyClaims: Record<string, Array<{
    claim: string;
    firstDetected: string;
    frequency: number;
    saturationScore: number;
    trend: 'up' | 'down' | 'stable';
  }>>;
}

export interface SignalGuardData {
  alertCount: number;
  manipulationFlags: Array<{
    id: string;
    competitor: string;
    signalType: string;
    source: string;
    detectedOn: string;
    suspicionScore: number;
    evidenceSummary: string;
  }>;
  reviewVelocity: Array<{
    day: number;
    [competitorId: string]: number | boolean;
    anomaly?: boolean;
  }>;
  sourceTrustMatrix: Array<{
    source: string;
    [competitorId: string]: string;
  }>;
}

export interface ExperimentsData {
  experiments: Array<{
    id: string;
    competitor: string;
    category: string;
    snvrScore: number;
    hypothesis: string;
    trigger: string;
    recommendedAction: string;
    effort: 'Low' | 'Medium' | 'High';
    impact: 'Low' | 'Medium' | 'High';
    status: 'pending' | 'running' | 'archived';
  }>;
}

export interface SNVRData {
  competitors: Array<{ id: string; name: string; color: string }>;
  breakdowns: Array<{
    competitor: string;
    saturation: number;
    novelty: number;
    velocity: number;
    reliability: number;
    strategyShift: number;
    totalScore: number;
  }>;
  history: Record<string, Array<{
    week: string;
    score: number;
    saturation: number;
    novelty: number;
    velocity: number;
    reliability: number;
  }>>;
}
