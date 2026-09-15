/**
 * NexaMOS Research Budget Policy & Guardrails
 *
 * Sourced from NexaMOS Blog Phase 2C specifications
 * Mencegah perulangan riset tanpa batas (uncontrolled research loops).
 */

export interface ResearchBudgetPolicy {
  maxQueries: number;
  maxCandidatesPerQuery: number;
  maxAcceptedSources: number;
  maxAcquisitions: number;
}

export const DEFAULT_RESEARCH_BUDGET: ResearchBudgetPolicy = {
  maxQueries: 5,
  maxCandidatesPerQuery: 10,
  maxAcceptedSources: 10,
  maxAcquisitions: 10
};

export class BudgetTracker {
  private policy: ResearchBudgetPolicy;
  private queriesCount = 0;
  private candidatesCount = 0;
  private acceptedSourcesCount = 0;
  private acquisitionsCount = 0;

  constructor(policy: Partial<ResearchBudgetPolicy> = {}) {
    this.policy = {
      ...DEFAULT_RESEARCH_BUDGET,
      ...policy
    };
  }

  canCreateQuery(): boolean {
    return this.queriesCount < this.policy.maxQueries;
  }

  canAcceptSource(): boolean {
    return this.acceptedSourcesCount < this.policy.maxAcceptedSources;
  }

  canAcquire(): boolean {
    return this.acquisitionsCount < this.policy.maxAcquisitions;
  }

  recordQuery(): boolean {
    if (!this.canCreateQuery()) return false;
    this.queriesCount++;
    return true;
  }

  recordCandidates(count: number): void {
    this.candidatesCount += count;
  }

  recordAcceptedSource(): boolean {
    if (!this.canAcceptSource()) return false;
    this.acceptedSourcesCount++;
    return true;
  }

  recordAcquisition(): boolean {
    if (!this.canAcquire()) return false;
    this.acquisitionsCount++;
    return true;
  }

  isExhausted(): boolean {
    return (
      this.queriesCount >= this.policy.maxQueries ||
      this.acceptedSourcesCount >= this.policy.maxAcceptedSources ||
      this.acquisitionsCount >= this.policy.maxAcquisitions
    );
  }

  getMetrics() {
    return {
      queriesCount: this.queriesCount,
      candidatesCount: this.candidatesCount,
      acceptedSourcesCount: this.acceptedSourcesCount,
      acquisitionsCount: this.acquisitionsCount,
      policy: { ...this.policy }
    };
  }
}
