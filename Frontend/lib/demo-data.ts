// Demo data for ARIA Dashboard

export const competitors = [
  { id: 'novasuite', name: 'NovaSuite', color: '#0F7DC2' },
  { id: 'flowdesk', name: 'FlowDesk', color: '#1A7A4A' },
  { id: 'taskbridge', name: 'TaskBridge', color: '#C47A1A' },
] as const;

export type CompetitorId = typeof competitors[number]['id'];

export interface Signal {
  id: string;
  competitor: CompetitorId;
  summary: string;
  source: string;
  timestamp: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  snvrScore: number;
}

export const recentSignals: Signal[] = [
  {
    id: '1',
    competitor: 'novasuite',
    summary: 'NovaSuite announced "Enterprise Clarity Suite" with AI-powered workflow automation',
    source: 'LinkedIn',
    timestamp: '2 hours ago',
    priority: 'HIGH',
    snvrScore: 78,
  },
  {
    id: '2',
    competitor: 'flowdesk',
    summary: 'FlowDesk reduced enterprise pricing by 20% across all tiers',
    source: 'Pricing Page',
    timestamp: '5 hours ago',
    priority: 'HIGH',
    snvrScore: 82,
  },
  {
    id: '3',
    competitor: 'taskbridge',
    summary: 'TaskBridge launches integration with Salesforce and HubSpot CRM',
    source: 'G2 Reviews',
    timestamp: '1 day ago',
    priority: 'MEDIUM',
    snvrScore: 56,
  },
  {
    id: '4',
    competitor: 'novasuite',
    summary: 'Increased hiring activity for ML engineers, 15 new positions posted',
    source: 'LinkedIn',
    timestamp: '2 days ago',
    priority: 'MEDIUM',
    snvrScore: 48,
  },
  {
    id: '5',
    competitor: 'flowdesk',
    summary: 'New case study featuring Fortune 500 manufacturing client',
    source: 'Blog',
    timestamp: '3 days ago',
    priority: 'LOW',
    snvrScore: 32,
  },
];

export interface NarrativeShift {
  id: string;
  competitor: CompetitorId;
  oldNarrative: string;
  newNarrative: string;
  snvrScore: number;
}

export const narrativeShifts: NarrativeShift[] = [
  {
    id: '1',
    competitor: 'novasuite',
    oldNarrative: 'The all-in-one project management solution',
    newNarrative: 'Enterprise-grade clarity for complex organizations',
    snvrScore: 78,
  },
  {
    id: '2',
    competitor: 'flowdesk',
    oldNarrative: 'Simple project tracking for teams',
    newNarrative: 'The affordable enterprise alternative',
    snvrScore: 65,
  },
  {
    id: '3',
    competitor: 'taskbridge',
    oldNarrative: 'Connect your tools, streamline your work',
    newNarrative: 'The integration-first project platform',
    snvrScore: 52,
  },
];

export interface SNVRScoreData {
  week: string;
  novasuite: number;
  flowdesk: number;
  taskbridge: number;
}

export const snvrTimelineData: SNVRScoreData[] = [
  { week: 'Week 1', novasuite: 45, flowdesk: 52, taskbridge: 38 },
  { week: 'Week 2', novasuite: 48, flowdesk: 55, taskbridge: 42 },
  { week: 'Week 3', novasuite: 52, flowdesk: 58, taskbridge: 45 },
  { week: 'Week 4', novasuite: 58, flowdesk: 54, taskbridge: 48 },
  { week: 'Week 5', novasuite: 62, flowdesk: 60, taskbridge: 46 },
  { week: 'Week 6', novasuite: 68, flowdesk: 65, taskbridge: 50 },
  { week: 'Week 7', novasuite: 72, flowdesk: 68, taskbridge: 52 },
  { week: 'Week 8', novasuite: 78, flowdesk: 72, taskbridge: 55 },
];

export interface HeatmapData {
  competitor: CompetitorId;
  days: number[];
}

export const heatmapData: HeatmapData[] = [
  { competitor: 'novasuite', days: [3, 5, 8, 2, 6, 4, 1] },
  { competitor: 'flowdesk', days: [2, 4, 3, 7, 5, 3, 2] },
  { competitor: 'taskbridge', days: [1, 2, 4, 3, 2, 5, 3] },
];

export interface CompetitorNarrative {
  competitor: CompetitorId;
  coreNarrative: string;
  toneTags: string[];
  narrativeDrift: number;
  noveltyScore: number;
}

export const competitorNarratives: CompetitorNarrative[] = [
  {
    competitor: 'novasuite',
    coreNarrative: 'The enterprise-grade tool that replaces complexity with clarity',
    toneTags: ['Authority', 'Simplicity', 'Enterprise-first'],
    narrativeDrift: 72,
    noveltyScore: 81,
  },
  {
    competitor: 'flowdesk',
    coreNarrative: 'Affordable power for growing teams who refuse to compromise',
    toneTags: ['Value', 'Scalability', 'Mid-market'],
    narrativeDrift: 45,
    noveltyScore: 58,
  },
  {
    competitor: 'taskbridge',
    coreNarrative: 'Connect everything. Automate anything. Ship faster.',
    toneTags: ['Integration', 'Speed', 'Technical'],
    narrativeDrift: 28,
    noveltyScore: 44,
  },
];

export interface RadarDataPoint {
  metric: string;
  aria: number;
  competitor: number;
}

export const radarData: Record<CompetitorId, RadarDataPoint[]> = {
  novasuite: [
    { metric: 'Clarity', aria: 8, competitor: 9 },
    { metric: 'Emotional Resonance', aria: 7, competitor: 6 },
    { metric: 'Differentiation', aria: 6, competitor: 8 },
    { metric: 'Urgency', aria: 5, competitor: 7 },
    { metric: 'Social Proof', aria: 8, competitor: 7 },
  ],
  flowdesk: [
    { metric: 'Clarity', aria: 8, competitor: 7 },
    { metric: 'Emotional Resonance', aria: 7, competitor: 8 },
    { metric: 'Differentiation', aria: 6, competitor: 5 },
    { metric: 'Urgency', aria: 5, competitor: 8 },
    { metric: 'Social Proof', aria: 8, competitor: 6 },
  ],
  taskbridge: [
    { metric: 'Clarity', aria: 8, competitor: 6 },
    { metric: 'Emotional Resonance', aria: 7, competitor: 5 },
    { metric: 'Differentiation', aria: 6, competitor: 7 },
    { metric: 'Urgency', aria: 5, competitor: 4 },
    { metric: 'Social Proof', aria: 8, competitor: 5 },
  ],
};

export interface KeyClaim {
  claim: string;
  firstDetected: string;
  frequency: number;
  saturationScore: number;
  trend: 'up' | 'down' | 'stable';
}

export const keyClaims: Record<CompetitorId, KeyClaim[]> = {
  novasuite: [
    { claim: 'Enterprise-grade security', firstDetected: 'Jan 2024', frequency: 47, saturationScore: 82, trend: 'up' },
    { claim: 'AI-powered automation', firstDetected: 'Mar 2024', frequency: 34, saturationScore: 56, trend: 'up' },
    { claim: 'Replaces 5+ tools', firstDetected: 'Nov 2023', frequency: 28, saturationScore: 71, trend: 'stable' },
    { claim: '99.9% uptime SLA', firstDetected: 'Feb 2024', frequency: 22, saturationScore: 88, trend: 'down' },
    { claim: 'SOC 2 Type II certified', firstDetected: 'Dec 2023', frequency: 19, saturationScore: 65, trend: 'stable' },
  ],
  flowdesk: [
    { claim: '50% cost savings', firstDetected: 'Feb 2024', frequency: 52, saturationScore: 45, trend: 'up' },
    { claim: 'No-code workflows', firstDetected: 'Jan 2024', frequency: 38, saturationScore: 72, trend: 'stable' },
    { claim: '30-day free trial', firstDetected: 'Mar 2024', frequency: 31, saturationScore: 89, trend: 'up' },
    { claim: 'Migrate in minutes', firstDetected: 'Apr 2024', frequency: 24, saturationScore: 34, trend: 'up' },
    { claim: '24/7 live support', firstDetected: 'Nov 2023', frequency: 18, saturationScore: 78, trend: 'down' },
  ],
  taskbridge: [
    { claim: '300+ integrations', firstDetected: 'Dec 2023', frequency: 45, saturationScore: 62, trend: 'stable' },
    { claim: 'Real-time sync', firstDetected: 'Feb 2024', frequency: 33, saturationScore: 58, trend: 'up' },
    { claim: 'Built for developers', firstDetected: 'Jan 2024', frequency: 27, saturationScore: 44, trend: 'up' },
    { claim: 'API-first platform', firstDetected: 'Mar 2024', frequency: 21, saturationScore: 51, trend: 'up' },
    { claim: 'Webhook automation', firstDetected: 'Nov 2023', frequency: 16, saturationScore: 67, trend: 'stable' },
  ],
};

export interface ManipulationFlag {
  id: string;
  competitor: CompetitorId;
  signalType: 'Review Spike' | 'Coordinated Messaging' | 'Bot-like Engagement' | 'Sudden Sentiment Reversal';
  source: string;
  detectedOn: string;
  suspicionScore: number;
  evidenceSummary: string;
}

export const manipulationFlags: ManipulationFlag[] = [
  {
    id: '1',
    competitor: 'novasuite',
    signalType: 'Review Spike',
    source: 'G2',
    detectedOn: 'Mar 22, 2024',
    suspicionScore: 87,
    evidenceSummary: '14 near-identical 5-star reviews posted across 3 platforms in 48 hours',
  },
  {
    id: '2',
    competitor: 'flowdesk',
    signalType: 'Coordinated Messaging',
    source: 'LinkedIn',
    detectedOn: 'Mar 20, 2024',
    suspicionScore: 72,
    evidenceSummary: '8 employee posts using identical hashtags and talking points within 2-hour window',
  },
  {
    id: '3',
    competitor: 'taskbridge',
    signalType: 'Bot-like Engagement',
    source: 'Twitter',
    detectedOn: 'Mar 18, 2024',
    suspicionScore: 65,
    evidenceSummary: 'Engagement spike from accounts created within 30 days, similar naming patterns',
  },
];

export interface ReviewVelocity {
  day: number;
  novasuite: number;
  flowdesk: number;
  taskbridge: number;
  anomaly?: boolean;
}

export const reviewVelocityData: ReviewVelocity[] = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  novasuite: Math.floor(Math.random() * 5) + 1 + (i === 21 || i === 22 ? 12 : 0),
  flowdesk: Math.floor(Math.random() * 4) + 1,
  taskbridge: Math.floor(Math.random() * 3) + 1,
  anomaly: i === 21 || i === 22,
}));

export interface SourceTrust {
  source: string;
  novasuite: 'high' | 'medium' | 'low';
  flowdesk: 'high' | 'medium' | 'low';
  taskbridge: 'high' | 'medium' | 'low';
}

export const sourceTrustMatrix: SourceTrust[] = [
  { source: 'G2', novasuite: 'low', flowdesk: 'high', taskbridge: 'high' },
  { source: 'Capterra', novasuite: 'medium', flowdesk: 'high', taskbridge: 'medium' },
  { source: 'Reddit', novasuite: 'high', flowdesk: 'medium', taskbridge: 'high' },
  { source: 'LinkedIn', novasuite: 'medium', flowdesk: 'low', taskbridge: 'high' },
  { source: 'TrustPilot', novasuite: 'low', flowdesk: 'high', taskbridge: 'medium' },
];

export interface Experiment {
  id: string;
  competitor: CompetitorId;
  category: 'Messaging' | 'Pricing' | 'Product' | 'SEO' | 'Social';
  snvrScore: number;
  hypothesis: string;
  trigger: string;
  recommendedAction: string;
  effort: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High';
  status: 'pending' | 'running' | 'archived';
}

export const experiments: Experiment[] = [
  {
    id: '1',
    competitor: 'novasuite',
    category: 'Messaging',
    snvrScore: 78,
    hypothesis: 'If NovaSuite is shifting to "enterprise simplicity" messaging, ARIA can counter-position as the "flexible mid-market" alternative',
    trigger: 'NovaSuite launched "Enterprise Clarity Suite" campaign with heavy LinkedIn ad spend',
    recommendedAction: 'Create comparison landing page highlighting ARIA flexibility vs enterprise complexity. Target mid-market decision makers.',
    effort: 'Medium',
    impact: 'High',
    status: 'pending',
  },
  {
    id: '2',
    competitor: 'flowdesk',
    category: 'Pricing',
    snvrScore: 82,
    hypothesis: 'FlowDesk price cut signals margin pressure; ARIA can emphasize ROI and total cost of ownership',
    trigger: 'FlowDesk reduced enterprise tier pricing by 20%',
    recommendedAction: 'Develop TCO calculator showing hidden costs of cheap alternatives. Add to pricing page.',
    effort: 'Low',
    impact: 'High',
    status: 'pending',
  },
  {
    id: '3',
    competitor: 'taskbridge',
    category: 'Product',
    snvrScore: 56,
    hypothesis: 'TaskBridge CRM integrations reveal focus on sales teams; ARIA can double down on marketing team features',
    trigger: 'TaskBridge launched Salesforce and HubSpot native integrations',
    recommendedAction: 'Fast-track marketing analytics dashboard feature. Highlight in next product update.',
    effort: 'High',
    impact: 'Medium',
    status: 'pending',
  },
  {
    id: '4',
    competitor: 'novasuite',
    category: 'SEO',
    snvrScore: 65,
    hypothesis: 'NovaSuite AI claims are gaining search visibility; ARIA can create counter-content on AI limitations',
    trigger: 'NovaSuite ranking #1 for "AI project management" keywords',
    recommendedAction: 'Publish thought leadership on "When AI Helps vs Hurts Project Management" blog series.',
    effort: 'Medium',
    impact: 'Medium',
    status: 'pending',
  },
  {
    id: '5',
    competitor: 'flowdesk',
    category: 'Social',
    snvrScore: 45,
    hypothesis: 'FlowDesk employee advocacy push can be countered with authentic customer stories',
    trigger: 'Coordinated LinkedIn employee posts detected',
    recommendedAction: 'Launch customer testimonial video series. Authentic voices beat coordinated messaging.',
    effort: 'Medium',
    impact: 'Medium',
    status: 'pending',
  },
  {
    id: '6',
    competitor: 'taskbridge',
    category: 'Messaging',
    snvrScore: 38,
    hypothesis: 'TaskBridge "developer-first" positioning creates opportunity in non-technical buyer segment',
    trigger: 'TaskBridge messaging increasingly technical across all channels',
    recommendedAction: 'Create "No-code for Everyone" campaign targeting operations and marketing teams.',
    effort: 'Low',
    impact: 'Medium',
    status: 'pending',
  },
];

export interface SNVRBreakdown {
  competitor: CompetitorId;
  saturation: number;
  novelty: number;
  velocity: number;
  reliability: number;
  strategyShift: number;
  totalScore: number;
}

export const snvrBreakdowns: SNVRBreakdown[] = [
  { competitor: 'novasuite', saturation: 73, novelty: 81, velocity: 67, reliability: 44, strategyShift: 85, totalScore: 78 },
  { competitor: 'flowdesk', saturation: 58, novelty: 65, velocity: 72, reliability: 78, strategyShift: 62, totalScore: 72 },
  { competitor: 'taskbridge', saturation: 42, novelty: 44, velocity: 38, reliability: 82, strategyShift: 35, totalScore: 55 },
];

export interface SNVRHistoryPoint {
  week: string;
  score: number;
  saturation: number;
  novelty: number;
  velocity: number;
  reliability: number;
}

export const snvrHistory: Record<CompetitorId, SNVRHistoryPoint[]> = {
  novasuite: [
    { week: 'W1', score: 45, saturation: 55, novelty: 48, velocity: 42, reliability: 65 },
    { week: 'W2', score: 48, saturation: 58, novelty: 52, velocity: 45, reliability: 62 },
    { week: 'W3', score: 52, saturation: 62, novelty: 58, velocity: 48, reliability: 58 },
    { week: 'W4', score: 58, saturation: 65, novelty: 65, velocity: 52, reliability: 55 },
    { week: 'W5', score: 62, saturation: 68, novelty: 70, velocity: 55, reliability: 52 },
    { week: 'W6', score: 68, saturation: 70, novelty: 75, velocity: 58, reliability: 50 },
    { week: 'W7', score: 72, saturation: 72, novelty: 78, velocity: 62, reliability: 48 },
    { week: 'W8', score: 75, saturation: 73, novelty: 80, velocity: 65, reliability: 46 },
    { week: 'W9', score: 76, saturation: 73, novelty: 81, velocity: 66, reliability: 45 },
    { week: 'W10', score: 77, saturation: 73, novelty: 81, velocity: 67, reliability: 44 },
    { week: 'W11', score: 78, saturation: 73, novelty: 81, velocity: 67, reliability: 44 },
    { week: 'W12', score: 78, saturation: 73, novelty: 81, velocity: 67, reliability: 44 },
  ],
  flowdesk: [
    { week: 'W1', score: 52, saturation: 48, novelty: 55, velocity: 62, reliability: 82 },
    { week: 'W2', score: 55, saturation: 50, novelty: 58, velocity: 65, reliability: 82 },
    { week: 'W3', score: 58, saturation: 52, novelty: 60, velocity: 68, reliability: 80 },
    { week: 'W4', score: 60, saturation: 54, novelty: 62, velocity: 70, reliability: 80 },
    { week: 'W5', score: 62, saturation: 55, novelty: 63, velocity: 71, reliability: 79 },
    { week: 'W6', score: 65, saturation: 56, novelty: 64, velocity: 72, reliability: 79 },
    { week: 'W7', score: 68, saturation: 57, novelty: 65, velocity: 72, reliability: 78 },
    { week: 'W8', score: 70, saturation: 58, novelty: 65, velocity: 72, reliability: 78 },
    { week: 'W9', score: 71, saturation: 58, novelty: 65, velocity: 72, reliability: 78 },
    { week: 'W10', score: 72, saturation: 58, novelty: 65, velocity: 72, reliability: 78 },
    { week: 'W11', score: 72, saturation: 58, novelty: 65, velocity: 72, reliability: 78 },
    { week: 'W12', score: 72, saturation: 58, novelty: 65, velocity: 72, reliability: 78 },
  ],
  taskbridge: [
    { week: 'W1', score: 38, saturation: 35, novelty: 38, velocity: 32, reliability: 85 },
    { week: 'W2', score: 42, saturation: 38, novelty: 40, velocity: 34, reliability: 84 },
    { week: 'W3', score: 45, saturation: 40, novelty: 42, velocity: 36, reliability: 84 },
    { week: 'W4', score: 48, saturation: 41, novelty: 43, velocity: 37, reliability: 83 },
    { week: 'W5', score: 50, saturation: 42, novelty: 44, velocity: 38, reliability: 83 },
    { week: 'W6', score: 52, saturation: 42, novelty: 44, velocity: 38, reliability: 82 },
    { week: 'W7', score: 53, saturation: 42, novelty: 44, velocity: 38, reliability: 82 },
    { week: 'W8', score: 54, saturation: 42, novelty: 44, velocity: 38, reliability: 82 },
    { week: 'W9', score: 55, saturation: 42, novelty: 44, velocity: 38, reliability: 82 },
    { week: 'W10', score: 55, saturation: 42, novelty: 44, velocity: 38, reliability: 82 },
    { week: 'W11', score: 55, saturation: 42, novelty: 44, velocity: 38, reliability: 82 },
    { week: 'W12', score: 55, saturation: 42, novelty: 44, velocity: 38, reliability: 82 },
  ],
};

export function getPriorityColor(priority: 'HIGH' | 'MEDIUM' | 'LOW'): string {
  switch (priority) {
    case 'HIGH':
      return '#C0392B';
    case 'MEDIUM':
      return '#C47A1A';
    case 'LOW':
      return '#6B7280';
  }
}

export function getCompetitorColor(competitorId: CompetitorId): string {
  const competitor = competitors.find(c => c.id === competitorId);
  return competitor?.color ?? '#6B7280';
}

export function getCompetitorName(competitorId: CompetitorId): string {
  const competitor = competitors.find(c => c.id === competitorId);
  return competitor?.name ?? competitorId;
}

export function calculatePriority(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}
