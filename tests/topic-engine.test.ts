/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Phase 1B Unit Test Suite: Topic Qualification, Opportunity Scoring, & State Transitions
 *
 * Uses Node.js native test runner (node:test & node:assert/strict)
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { qualifyTopic } from '../engines/ideation/topic-qualifier.ts';
import { scoreOpportunity, classifyPriority } from '../engines/ideation/opportunity-scorer.ts';
import { validateTopicTransition, isTerminalStatus } from '../engines/ideation/topic-transition.ts';
import type { Topic } from '../engines/ideation/domain/topic.types.ts';

describe('1. Topic Qualification Engine Tests', () => {
  test('1.1 High-value non-commodity topic -> QUALIFIED', () => {
    const highValueTopic: Partial<Topic> = {
      title: 'Signal Bukan Insight: Kesalahan Fundamental Sistem Marketing Intelligence Modern',
      territory: 'INTELLIGENCE',
      editorialRole: 'FLAGSHIP',
      audience: { segment: 'CMOs & Intelligence Architects' },
      problem: 'Kebingungan membedakan lonjakan data sinyal dengan wawasan tindakan nyata.',
      informationGain: {
        expectedContribution: 'Framework 6-tahap Signal to Intelligence closed-loop',
        originalityType: ['ORIGINAL_FRAMEWORK', 'STRONG_POINT_OF_VIEW'],
        commodityRisk: 'LOW'
      },
      evidencePlan: {
        requiredEvidenceLevel: 'E4',
        plannedSources: ['Internal case studies and diagnostic telemetry'],
        originalEvidenceRequired: true
      },
      businessRelevance: {
        objective: 'Category Creation',
        funnelRole: 'Thought Leadership'
      }
    };

    const result = qualifyTopic(highValueTopic);
    assert.equal(result.decision, 'QUALIFIED');
    assert.equal(result.gates.TERRITORY_FIT.status, 'PASS');
    assert.equal(result.gates.AUDIENCE_RELEVANCE.status, 'PASS');
    assert.equal(result.gates.KNOWLEDGE_VALUE.status, 'PASS');
    assert.equal(result.gates.EVIDENCE_FEASIBILITY.status, 'PASS');
    assert.equal(result.gates.NON_COMMODITY_POTENTIAL.status, 'PASS');
    assert.equal(result.gates.BUSINESS_RELEVANCE.status, 'PASS');
  });

  test('1.2 Strong topic without evidence planned -> RESEARCH_REQUIRED', () => {
    const strongTopicNoEvidence: Partial<Topic> = {
      title: 'Dampak Perubahan Algoritma Kuantum terhadap Enkripsi Data Pelanggan',
      territory: 'STRATEGY',
      editorialRole: 'AUTHORITY',
      audience: { segment: 'Enterprise Security Officers' },
      problem: 'Ancaman keamanan komputasi kuantum terhadap basis data CRM modern.',
      informationGain: {
        expectedContribution: 'Analisis mendalam implikasi kuantum pada data pelanggan',
        originalityType: ['TIMELY_ANALYSIS', 'EXPERT_INTERPRETATION'],
        commodityRisk: 'LOW'
      },
      evidencePlan: {
        requiredEvidenceLevel: 'E3',
        plannedSources: [], // KOSONG: Membutuhkan riset pendahuluan!
        originalEvidenceRequired: false
      },
      businessRelevance: {
        objective: 'Enterprise Trust Building',
        funnelRole: 'Consideration'
      }
    };

    const result = qualifyTopic(strongTopicNoEvidence);
    assert.equal(result.decision, 'RESEARCH_REQUIRED');
    assert.equal(result.gates.EVIDENCE_FEASIBILITY.status, 'UNKNOWN');
  });

  test('1.3 Generic topic without differentiation -> REJECTED', () => {
    const genericTopic: Partial<Topic> = {
      title: 'Apa Itu Marketing: Pengertian dan Fungsinya',
      territory: 'STRATEGY',
      editorialRole: 'AUTHORITY',
      audience: { segment: 'Mahasiswa Pemula' },
      problem: 'Mencari definisi kamus apa itu marketing.',
      informationGain: {
        expectedContribution: 'Rangkuman definisi marketing dari internet.',
        originalityType: [], // KOSONG: Komoditas murni tanpa kebaruan
        commodityRisk: 'HIGH'
      },
      evidencePlan: {
        requiredEvidenceLevel: 'E1',
        plannedSources: ['Wikipedia'],
        originalEvidenceRequired: false
      },
      businessRelevance: {
        objective: 'Mengejar traffic keyword',
        funnelRole: 'Top of funnel'
      }
    };

    const result = qualifyTopic(genericTopic);
    assert.equal(result.decision, 'REJECTED');
    assert.equal(result.gates.KNOWLEDGE_VALUE.status, 'FAIL');
    assert.equal(result.gates.NON_COMMODITY_POTENTIAL.status, 'FAIL');
  });

  test('1.4 Generic glossary topic with supporting role -> QUALIFIED (Supporting Content Exception)', () => {
    const glossaryTopic: Partial<Topic> = {
      title: 'Glosarium Teknis: Canonical Tag dan Crawlability',
      territory: 'TACTICAL',
      editorialRole: 'REFERENCE', // EXEMPTION ELIGIBLE!
      audience: { segment: 'Marketer Teknis' },
      problem: 'Kekeliruan teknis indeksasi mesin pencari.',
      informationGain: {
        expectedContribution: 'Definisi standar untuk rujukan internal artikel lain.',
        originalityType: ['PRACTICAL_DECISION_FRAMEWORK'],
        commodityRisk: 'HIGH' // HIGH tapi perannya REFERENCE
      },
      evidencePlan: {
        requiredEvidenceLevel: 'E3',
        plannedSources: ['Google Search Central Documentation'],
        originalEvidenceRequired: false
      },
      businessRelevance: {
        objective: 'Topic Cluster Completeness',
        funnelRole: 'Knowledge Journey Prerequisite'
      }
    };

    const result = qualifyTopic(glossaryTopic);
    assert.equal(result.decision, 'QUALIFIED');
    assert.equal(result.gates.NON_COMMODITY_POTENTIAL.status, 'PASS');
    assert.match(result.gates.NON_COMMODITY_POTENTIAL.explanation, /Supporting Content Exception/);
  });

  test('1.5 Invalid / missing information -> Safe result, no crash', () => {
    const emptyTopic: Partial<Topic> = {};
    const result = qualifyTopic(emptyTopic);
    assert.equal(result.decision, 'REJECTED');
    assert.equal(result.gates.TERRITORY_FIT.status, 'FAIL');
    assert.equal(result.gates.AUDIENCE_RELEVANCE.status, 'FAIL');
    assert.ok(result.summary.includes('tidak memenuhi gerbang'));
  });
});

describe('2. Opportunity Scoring Engine Tests', () => {
  test('2.1 Formula conforms exactly to canonical weights (25%, 25%, 25%, 15%, 10%)', () => {
    const dims = {
      strategicValue: 100,
      audienceValue: 100,
      differentiationPotential: 100,
      timeliness: 100,
      evidenceReadiness: 100
    };

    const res = scoreOpportunity(dims, { allowSimulation: true });
    assert.equal(res.success, true);
    assert.ok(res.scoring);
    if (!res.scoring) return;
    assert.equal(res.scoring.overall, 100);
    assert.equal(res.scoring.weightedValues.strategicValue, 25);
    assert.equal(res.scoring.weightedValues.audienceValue, 25);
    assert.equal(res.scoring.weightedValues.differentiationPotential, 25);
    assert.equal(res.scoring.weightedValues.timeliness, 15);
    assert.equal(res.scoring.weightedValues.evidenceReadiness, 10);
  });

  test('2.2 Score bounds enforcement (rejects values < 0 or > 100)', () => {
    const outOfBounds = {
      strategicValue: 120, // Invalid!
      audienceValue: 80,
      differentiationPotential: 80,
      timeliness: 80,
      evidenceReadiness: 80
    };

    const res = scoreOpportunity(outOfBounds, { allowSimulation: true });
    assert.equal(res.success, false);
    assert.match(res.error || '', /di luar batas/);
  });

  test('2.3 Priority classification thresholds', () => {
    assert.equal(classifyPriority(95), 'CRITICAL');
    assert.equal(classifyPriority(85), 'CRITICAL');
    assert.equal(classifyPriority(84), 'HIGH');
    assert.equal(classifyPriority(70), 'HIGH');
    assert.equal(classifyPriority(69), 'MEDIUM');
    assert.equal(classifyPriority(50), 'MEDIUM');
    assert.equal(classifyPriority(49), 'LOW');
    assert.equal(classifyPriority(30), 'LOW');
    assert.equal(classifyPriority(29), 'BACKLOG');
    assert.equal(classifyPriority(0), 'BACKLOG');
  });

  test('2.4 Low evidence readiness does not dominate overall score', () => {
    // Topic with top strategic and differentiation value, but early/low evidence readiness
    const dims = {
      strategicValue: 95,
      audienceValue: 90,
      differentiationPotential: 95,
      timeliness: 90,
      evidenceReadiness: 20 // Low evidence!
    };

    const res = scoreOpportunity(dims, { allowSimulation: true });
    assert.equal(res.success, true);
    assert.ok(res.scoring);
    if (!res.scoring) return;
    // Calculation: 95*0.25 (23.75) + 90*0.25 (22.5) + 95*0.25 (23.75) + 90*0.15 (13.5) + 20*0.10 (2.0) = 85.5 -> 86
    assert.equal(res.scoring.overall, 86);
    assert.equal(res.scoring.priorityClass, 'CRITICAL');
    assert.match(res.scoring.summary, /riset terfokus diperlukan/);
  });

  test('2.5 Policy version is stored', () => {
    const dims = {
      strategicValue: 80,
      audienceValue: 80,
      differentiationPotential: 80,
      timeliness: 80,
      evidenceReadiness: 80
    };

    const res = scoreOpportunity(dims, { allowSimulation: true });
    assert.equal(res.success, true);
    assert.equal(res.scoring?.scoringPolicyVersion, 'TOPIC_PRIORITY_V1');
  });
});

describe('3. State Transitions Engine Tests', () => {
  test('3.1 Valid transitions are accepted', () => {
    assert.equal(validateTopicTransition('CAPTURED', 'SCREENING').allowed, true);
    assert.equal(validateTopicTransition('SCREENING', 'QUALIFIED').allowed, true);
    assert.equal(validateTopicTransition('SCREENING', 'RESEARCH_REQUIRED').allowed, true);
    assert.equal(validateTopicTransition('SCREENING', 'REJECTED').allowed, true);
    assert.equal(validateTopicTransition('RESEARCH_REQUIRED', 'QUALIFIED').allowed, true);
    assert.equal(validateTopicTransition('QUALIFIED', 'PRIORITIZED').allowed, true);
    assert.equal(validateTopicTransition('PRIORITIZED', 'APPROVED').allowed, true);
    assert.equal(validateTopicTransition('APPROVED', 'IN_PRODUCTION').allowed, true);
    assert.equal(validateTopicTransition('IN_PRODUCTION', 'PUBLISHED').allowed, true);
  });

  test('3.2 Invalid transitions are rejected with type-safe reason', () => {
    // Cannot skip directly from CAPTURED to PUBLISHED
    const res1 = validateTopicTransition('CAPTURED', 'PUBLISHED');
    assert.equal(res1.allowed, false);
    assert.equal(res1.error, 'INVALID_TRANSITION');
    assert.match(res1.reason || '', /tidak dapat langsung berubah/);

    // Cannot jump from SCREENING to PUBLISHED
    const res2 = validateTopicTransition('SCREENING', 'PUBLISHED');
    assert.equal(res2.allowed, false);

    // Cannot jump from REJECTED to IN_PRODUCTION
    const res3 = validateTopicTransition('REJECTED', 'IN_PRODUCTION');
    assert.equal(res3.allowed, false);
  });

  test('3.3 Terminal and historical behavior', () => {
    assert.equal(isTerminalStatus('ARCHIVED'), true);
    assert.equal(isTerminalStatus('PUBLISHED'), false);

    // ARCHIVED has no forward transitions
    const res = validateTopicTransition('ARCHIVED', 'CAPTURED');
    assert.equal(res.allowed, false);
  });
});
