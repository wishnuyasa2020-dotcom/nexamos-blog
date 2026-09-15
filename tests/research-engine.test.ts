/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Phase 2A Unit Test Suite: Research Engine & Evidence Grounding
 *
 * Uses Node.js native test runner (node:test & node:assert/strict)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { InMemoryResearchProjectRepository } from '../engines/research/repository/in-memory-research-project-repository.ts';
import { InMemoryResearchSourceRepository } from '../engines/research/repository/in-memory-research-source-repository.ts';
import { InMemoryResearchClaimRepository } from '../engines/research/repository/in-memory-research-claim-repository.ts';
import { InMemoryResearchEvidenceRepository } from '../engines/research/repository/in-memory-research-evidence-repository.ts';
import { InMemoryClaimEvidenceRelationRepository } from '../engines/research/repository/in-memory-claim-evidence-relation-repository.ts';
import { InMemoryResearchFindingRepository } from '../engines/research/repository/in-memory-research-finding-repository.ts';
import { InMemoryResearchEventRepository } from '../engines/research/repository/in-memory-research-event-repository.ts';

import { ResearchManagementService } from '../engines/research/research-management-service.ts';
import { evaluateClaimGrounding } from '../engines/research/claim-grounding-evaluator.ts';
import { evaluateEvidenceSufficiency } from '../engines/research/evidence-sufficiency.ts';
import { synthesizeResearch } from '../engines/research/research-synthesizer.ts';
import { validateResearchTransition } from '../engines/research/domain/research-status.ts';

import type { ResearchProject } from '../engines/research/domain/research-project.ts';
import type { ResearchSource } from '../engines/research/domain/research-source.ts';
import type { ResearchClaim } from '../engines/research/domain/research-claim.ts';
import type { ResearchEvidence } from '../engines/research/domain/research-evidence.ts';
import type { ClaimEvidenceRelation } from '../engines/research/domain/evidence-relation.ts';

describe('Phase 2A Unit Tests: Research Engine & Evidence Grounding', () => {
  let projectRepo: InMemoryResearchProjectRepository;
  let sourceRepo: InMemoryResearchSourceRepository;
  let claimRepo: InMemoryResearchClaimRepository;
  let evidenceRepo: InMemoryResearchEvidenceRepository;
  let relationRepo: InMemoryClaimEvidenceRelationRepository;
  let findingRepo: InMemoryResearchFindingRepository;
  let eventRepo: InMemoryResearchEventRepository;
  let service: ResearchManagementService;

  beforeEach(() => {
    projectRepo = new InMemoryResearchProjectRepository();
    sourceRepo = new InMemoryResearchSourceRepository();
    claimRepo = new InMemoryResearchClaimRepository();
    evidenceRepo = new InMemoryResearchEvidenceRepository();
    relationRepo = new InMemoryClaimEvidenceRelationRepository();
    findingRepo = new InMemoryResearchFindingRepository();
    eventRepo = new InMemoryResearchEventRepository();

    service = new ResearchManagementService({
      projectRepo,
      sourceRepo,
      claimRepo,
      evidenceRepo,
      relationRepo,
      findingRepo,
      eventRepo
    });
  });

  // ==========================================================================
  // 1. REPOSITORY CONTRACTS & IMMUTABILITY TESTS
  // ==========================================================================
  describe('1. Repository Contracts & In-Memory Implementations', () => {
    test('1.1 Create, getById, and duplicate prevention works cleanly', async () => {
      const projRes = await service.createResearchProject({
        id: 'proj-001',
        topicId: 'top-test-001',
        title: 'Investigasi Zero-Click',
        objective: 'Mengukur dampak AI Overviews terhadap CTR',
        requiredEvidenceLevel: 'E3',
        researchQuestions: []
      });

      assert.equal(projRes.ok, true);
      if (!projRes.ok) return;

      const fetched = await projectRepo.getById('proj-001');
      assert.ok(fetched);
      assert.equal(fetched.id, 'proj-001');

      // Duplicate rejection
      const dupRes = await service.createResearchProject({
        id: 'proj-001',
        topicId: 'top-test-002',
        title: 'Duplicate Project',
        objective: 'Test duplicate',
        requiredEvidenceLevel: 'E2',
        researchQuestions: []
      });
      assert.equal(dupRes.ok, false);
      if (!dupRes.ok) {
        assert.equal(dupRes.error.code, 'DUPLICATE_PROJECT_ID');
      }
    });

    test('1.2 Repository guarantees safe cloning and immutability', async () => {
      const projRes = await service.createResearchProject({
        id: 'proj-immutable',
        topicId: 'top-test-001',
        title: 'Original Title',
        objective: 'Original Objective',
        requiredEvidenceLevel: 'E3',
        researchQuestions: []
      });
      assert.equal(projRes.ok, true);
      if (!projRes.ok) return;

      const retrieved1 = await projectRepo.getById('proj-immutable');
      assert.ok(retrieved1);

      // Mutate local reference directly
      (retrieved1 as { title: string }).title = 'HACKED MUTATION';

      const retrieved2 = await projectRepo.getById('proj-immutable');
      assert.ok(retrieved2);
      assert.equal(retrieved2.title, 'Original Title');
    });
  });

  // ==========================================================================
  // 2. CLAIM GROUNDING EVALUATOR TESTS
  // ==========================================================================
  describe('2. Claim Grounding Evaluator Tests', () => {
    const mockSourceAuthoritative: ResearchSource = {
      id: 'src-auth-1',
      researchProjectId: 'proj-grounding',
      type: 'OFFICIAL_DOCUMENTATION',
      title: 'Google Official Guidance',
      evidenceLevel: 'E3',
      qualityAssessment: {
        authority: 95,
        relevance: 95,
        recency: 90,
        methodologicalTransparency: 90,
        independence: 85,
        verifiability: 95,
        qualitySummary: 'Otoritatif platform primer.'
      },
      isPrimarySource: true,
      isInternal: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockEvidenceSupporting: ResearchEvidence = {
      id: 'evi-sup-1',
      sourceId: 'src-auth-1',
      researchProjectId: 'proj-grounding',
      content: 'Penurunan CTR organik mencapai 58%.',
      evidenceLevel: 'E3',
      capturedAt: new Date().toISOString(),
      publicationAllowed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const mockEvidenceContradicting: ResearchEvidence = {
      id: 'evi-con-1',
      sourceId: 'src-auth-1',
      researchProjectId: 'proj-grounding',
      content: 'CTR organik tidak mengalami penurunan sama sekali.',
      evidenceLevel: 'E3',
      capturedAt: new Date().toISOString(),
      publicationAllowed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    test('2.1 Claim with credible evidence -> SUPPORTED', () => {
      const claim: ResearchClaim = {
        id: 'clm-test-1',
        researchProjectId: 'proj-grounding',
        statement: 'CTR organik turun drastis akibat AI Overview.',
        claimType: 'CAUSAL',
        status: 'UNVERIFIED',
        importance: 'CRITICAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const relations: ClaimEvidenceRelation[] = [
        {
          claimId: 'clm-test-1',
          evidenceId: 'evi-sup-1',
          relation: 'SUPPORTS',
          strength: 'STRONG',
          createdAt: new Date().toISOString()
        }
      ];

      const res = evaluateClaimGrounding({
        claim,
        relations,
        evidence: [mockEvidenceSupporting],
        sources: [mockSourceAuthoritative]
      });

      assert.equal(res.claimStatus, 'SUPPORTED');
      assert.equal(res.supportingEvidenceCount, 1);
      assert.equal(res.contradictingEvidenceCount, 0);
      assert.equal(res.highestEvidenceLevel, 'E3');
    });

    test('2.2 Claim with strong contradiction and no support -> CONTRADICTED', () => {
      const claim: ResearchClaim = {
        id: 'clm-test-2',
        researchProjectId: 'proj-grounding',
        statement: 'Aktivitas search tidak terdampak oleh ringkasan AI.',
        claimType: 'FACTUAL',
        status: 'UNVERIFIED',
        importance: 'CRITICAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const relations: ClaimEvidenceRelation[] = [
        {
          claimId: 'clm-test-2',
          evidenceId: 'evi-sup-1', // Konten bahwa CTR turun menyangkal klaim ini
          relation: 'CONTRADICTS',
          strength: 'STRONG',
          createdAt: new Date().toISOString()
        }
      ];

      const res = evaluateClaimGrounding({
        claim,
        relations,
        evidence: [mockEvidenceSupporting],
        sources: [mockSourceAuthoritative]
      });

      assert.equal(res.claimStatus, 'CONTRADICTED');
      assert.equal(res.contradictingEvidenceCount, 1);
    });

    test('2.3 Claim with strong support and strong contradiction -> DISPUTED', () => {
      const claim: ResearchClaim = {
        id: 'clm-test-3',
        researchProjectId: 'proj-grounding',
        statement: 'Trafik blog dipastikan stabil.',
        claimType: 'FACTUAL',
        status: 'UNVERIFIED',
        importance: 'CRITICAL',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const relations: ClaimEvidenceRelation[] = [
        {
          claimId: 'clm-test-3',
          evidenceId: 'evi-sup-1',
          relation: 'SUPPORTS',
          strength: 'STRONG',
          createdAt: new Date().toISOString()
        },
        {
          claimId: 'clm-test-3',
          evidenceId: 'evi-con-1',
          relation: 'CONTRADICTS',
          strength: 'STRONG',
          createdAt: new Date().toISOString()
        }
      ];

      const res = evaluateClaimGrounding({
        claim,
        relations,
        evidence: [mockEvidenceSupporting, mockEvidenceContradicting],
        sources: [mockSourceAuthoritative]
      });

      assert.equal(res.claimStatus, 'DISPUTED');
      assert.equal(res.isDisputed, true);
      assert.equal(res.hasContradiction, true);
    });

    test('2.4 Claim with no relations -> INSUFFICIENT_EVIDENCE', () => {
      const claim: ResearchClaim = {
        id: 'clm-test-4',
        researchProjectId: 'proj-grounding',
        statement: 'Klaim tanpa bukti sama sekali.',
        claimType: 'FACTUAL',
        status: 'UNVERIFIED',
        importance: 'SUPPORTING',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const res = evaluateClaimGrounding({
        claim,
        relations: [],
        evidence: [],
        sources: []
      });

      assert.equal(res.claimStatus, 'INSUFFICIENT_EVIDENCE');
      assert.equal(res.supportingEvidenceCount, 0);
    });
  });

  // ==========================================================================
  // 3. EVIDENCE & RELATION INTEGRITY (1:N and N:N)
  // ==========================================================================
  describe('3. Evidence & Relation Integrity Tests', () => {
    test('3.1 One source can yield multiple evidence items', async () => {
      await service.createResearchProject({
        id: 'proj-rel-test',
        topicId: 'top-1',
        title: 'Rel Test',
        objective: 'Testing relations',
        requiredEvidenceLevel: 'E3',
        researchQuestions: []
      });

      await service.addSource('proj-rel-test', {
        id: 'src-1',
        researchProjectId: 'proj-rel-test',
        type: 'PRIMARY_RESEARCH',
        title: 'Master Study',
        evidenceLevel: 'E3',
        qualityAssessment: {
          authority: 90,
          relevance: 90,
          recency: 90,
          methodologicalTransparency: 90,
          independence: 90,
          verifiability: 90,
          qualitySummary: 'Solid'
        },
        isPrimarySource: true,
        isInternal: false
      });

      const e1 = await service.addEvidence('proj-rel-test', {
        id: 'evi-1',
        sourceId: 'src-1',
        content: 'Data point A',
        evidenceLevel: 'E3',
        capturedAt: new Date().toISOString(),
        publicationAllowed: true
      });

      const e2 = await service.addEvidence('proj-rel-test', {
        id: 'evi-2',
        sourceId: 'src-1',
        content: 'Data point B',
        evidenceLevel: 'E3',
        capturedAt: new Date().toISOString(),
        publicationAllowed: true
      });

      assert.equal(e1.ok, true);
      assert.equal(e2.ok, true);

      const fromSource = await evidenceRepo.listBySourceId('src-1');
      assert.equal(fromSource.length, 2);
    });

    test('3.2 One evidence item can be linked to multiple claims (N:N)', async () => {
      await service.createResearchProject({
        id: 'proj-nn',
        topicId: 'top-1',
        title: 'NN Test',
        objective: 'Testing NN',
        requiredEvidenceLevel: 'E3',
        researchQuestions: []
      });

      await service.addSource('proj-nn', {
        id: 'src-nn',
        researchProjectId: 'proj-nn',
        type: 'INDUSTRY_RESEARCH',
        title: 'Overlap Study',
        evidenceLevel: 'E3',
        qualityAssessment: {
          authority: 90,
          relevance: 90,
          recency: 90,
          methodologicalTransparency: 90,
          independence: 90,
          verifiability: 90,
          qualitySummary: 'Valid'
        },
        isPrimarySource: true,
        isInternal: false
      });

      await service.addEvidence('proj-nn', {
        id: 'evi-overlap',
        sourceId: 'src-nn',
        content: '95% pengguna AI tetap menggunakan Google',
        evidenceLevel: 'E3',
        capturedAt: new Date().toISOString(),
        publicationAllowed: true
      });

      await service.addClaim('proj-nn', {
        id: 'clm-A',
        statement: 'Search tetap relevan bersama AI',
        claimType: 'FACTUAL',
        importance: 'CRITICAL'
      });

      await service.addClaim('proj-nn', {
        id: 'clm-B',
        statement: 'Blog tidak mati total',
        claimType: 'FACTUAL',
        importance: 'CRITICAL'
      });

      // Link single evidence to claim A and claim B
      const linkA = await service.linkClaimEvidence('proj-nn', 'clm-A', 'evi-overlap', 'SUPPORTS');
      const linkB = await service.linkClaimEvidence('proj-nn', 'clm-B', 'evi-overlap', 'SUPPORTS');

      assert.equal(linkA.ok, true);
      assert.equal(linkB.ok, true);

      const evRelations = await relationRepo.listByEvidenceId('evi-overlap');
      assert.equal(evRelations.length, 2);
      assert.equal(evRelations[0].claimId, 'clm-A');
      assert.equal(evRelations[1].claimId, 'clm-B');
    });
  });

  // ==========================================================================
  // 4. EVIDENCE SUFFICIENCY POLICY TESTS
  // ==========================================================================
  describe('4. Evidence Sufficiency Policy Tests', () => {
    test('4.1 Project lacking required evidence level -> INSUFFICIENT', () => {
      const claims: ResearchClaim[] = [
        {
          id: 'clm-1',
          researchProjectId: 'proj-suff',
          statement: 'Klaim enterprise',
          claimType: 'FACTUAL',
          status: 'SUPPORTED',
          importance: 'CRITICAL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const sources: ResearchSource[] = [
        {
          id: 'src-e1',
          researchProjectId: 'proj-suff',
          type: 'COMMUNITY_DISCUSSION',
          title: 'Forum Thread',
          evidenceLevel: 'E1', // Hanya E1
          qualityAssessment: {
            authority: 40,
            relevance: 50,
            recency: 50,
            methodologicalTransparency: 30,
            independence: 50,
            verifiability: 30,
            qualitySummary: 'Forum'
          },
          isPrimarySource: false,
          isInternal: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const res = evaluateEvidenceSufficiency({
        requiredEvidenceLevel: 'E3', // Butuh E3
        claims,
        claimGroundingResults: [
          {
            claimId: 'clm-1',
            claimStatus: 'SUPPORTED',
            supportingEvidenceCount: 1,
            contradictingEvidenceCount: 0,
            qualifyingEvidenceCount: 0,
            highestEvidenceLevel: 'E1',
            groundingSummary: 'OK',
            hasContradiction: false,
            isDisputed: false
          }
        ],
        sources
      });

      assert.equal(res.status, 'INSUFFICIENT');
      assert.equal(res.requiredLevelMet, false);
      assert.ok(res.missingEvidence.length > 0);
    });

    test('4.2 Project with unresolved critical contradiction -> REVIEW_REQUIRED', () => {
      const claims: ResearchClaim[] = [
        {
          id: 'clm-crit',
          researchProjectId: 'proj-suff',
          statement: 'Klaim krusial yang bersengketa',
          claimType: 'FACTUAL',
          status: 'DISPUTED',
          importance: 'CRITICAL',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const sources: ResearchSource[] = [
        {
          id: 'src-e3',
          researchProjectId: 'proj-suff',
          type: 'PRIMARY_RESEARCH',
          title: 'Study',
          evidenceLevel: 'E3',
          qualityAssessment: {
            authority: 90,
            relevance: 90,
            recency: 90,
            methodologicalTransparency: 90,
            independence: 90,
            verifiability: 90,
            qualitySummary: 'Good'
          },
          isPrimarySource: true,
          isInternal: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const res = evaluateEvidenceSufficiency({
        requiredEvidenceLevel: 'E3',
        claims,
        claimGroundingResults: [
          {
            claimId: 'clm-crit',
            claimStatus: 'DISPUTED',
            supportingEvidenceCount: 1,
            contradictingEvidenceCount: 1,
            qualifyingEvidenceCount: 0,
            highestEvidenceLevel: 'E3',
            groundingSummary: 'Disputed',
            hasContradiction: true,
            isDisputed: true
          }
        ],
        sources
      });

      assert.equal(res.status, 'REVIEW_REQUIRED');
      assert.ok(res.gaps.some((g) => g.type === 'UNRESOLVED_CONTRADICTION'));
    });
  });

  // ==========================================================================
  // 5. RESEARCH LIFECYCLE & FSM TRANSITIONS
  // ==========================================================================
  describe('5. Research Lifecycle & FSM Transitions', () => {
    test('5.1 Valid FSM transitions from PLANNED through COMPLETED', () => {
      assert.equal(validateResearchTransition('PLANNED', 'COLLECTING').allowed, true);
      assert.equal(validateResearchTransition('COLLECTING', 'EVALUATING').allowed, true);
      assert.equal(validateResearchTransition('EVALUATING', 'SYNTHESIZING').allowed, true);
      assert.equal(validateResearchTransition('SYNTHESIZING', 'READY').allowed, true);
      assert.equal(validateResearchTransition('READY', 'COMPLETED').allowed, true);
    });

    test('5.2 Invalid FSM transitions are rejected', () => {
      // PLANNED directly to COMPLETED is prohibited
      const res = validateResearchTransition('PLANNED', 'COMPLETED');
      assert.equal(res.allowed, false);
      assert.ok(res.reason);

      // ARCHIVED cannot transition to anything
      const archRes = validateResearchTransition('ARCHIVED', 'COLLECTING');
      assert.equal(archRes.allowed, false);
    });
  });

  // ==========================================================================
  // 6. TOPIC INTEGRATION & REQUALIFICATION RECOMMENDATION
  // ==========================================================================
  describe('6. Topic Integration & Requalification Recommendation Tests', () => {
    test('6.1 Synthesizer produces READY_FOR_REQUALIFICATION when research is sufficient', async () => {
      const projRes = await service.createResearchProject({
        id: 'proj-integration',
        topicId: 'top-integration-001',
        title: 'Project for Requalification',
        objective: 'Verify feasibility',
        requiredEvidenceLevel: 'E3',
        researchQuestions: [
          {
            id: 'rq-1',
            question: 'Apakah AI Search mengurangi klik?',
            priority: 'HIGH',
            status: 'ANSWERED'
          }
        ]
      });
      assert.equal(projRes.ok, true);

      await service.addSource('proj-integration', {
        id: 'src-official',
        researchProjectId: 'proj-integration',
        type: 'OFFICIAL_DOCUMENTATION',
        title: 'Official Google Central',
        evidenceLevel: 'E3',
        qualityAssessment: {
          authority: 95,
          relevance: 95,
          recency: 95,
          methodologicalTransparency: 90,
          independence: 85,
          verifiability: 95,
          qualitySummary: 'Authoritative'
        },
        isPrimarySource: true,
        isInternal: false
      });

      await service.addEvidence('proj-integration', {
        id: 'evi-primary',
        sourceId: 'src-official',
        content: 'Data confirmed',
        evidenceLevel: 'E3',
        capturedAt: new Date().toISOString(),
        publicationAllowed: true
      });

      await service.addClaim('proj-integration', {
        id: 'clm-verified',
        statement: 'Verified claim',
        claimType: 'FACTUAL',
        importance: 'CRITICAL'
      });

      await service.linkClaimEvidence(
        'proj-integration',
        'clm-verified',
        'evi-primary',
        'SUPPORTS',
        'STRONG'
      );

      await service.createFinding('proj-integration', {
        statement: 'Temuan validasi berhasil dikonfirmasi secara empiris.',
        supportingClaimIds: ['clm-verified'],
        confidence: 'HIGH',
        limitations: ['Berlaku untuk region utama']
      });

      const recRes = await service.getTopicRequalificationRecommendation('proj-integration');
      assert.equal(recRes.ok, true);
      if (!recRes.ok) return;

      assert.equal(recRes.value.topicId, 'top-integration-001');
      assert.equal(recRes.value.recommendedAction, 'READY_FOR_REQUALIFICATION');

      const project = await service.getProject('proj-integration');
      assert.ok(project);
      assert.equal(project.status, 'READY');
    });
  });

  // ==========================================================================
  // 7. FIXTURE VALIDATION
  // ==========================================================================
  describe('7. Example Data Fixtures Validation', () => {
    test('7.1 Fixtures load cleanly and match expected canonical counts', () => {
      const fixtureDir = path.resolve('data/research/examples/blog-ai-relevance');

      const project = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'project.json'), 'utf-8'));
      const sources = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'sources.json'), 'utf-8'));
      const claims = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'claims.json'), 'utf-8'));
      const evidence = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'evidence.json'), 'utf-8'));
      const relations = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'relations.json'), 'utf-8'));
      const findings = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'findings.json'), 'utf-8'));

      assert.equal(project.id, 'res-proj-blog-ai-relevance');
      assert.equal(sources.length, 5);
      assert.equal(claims.length, 5);
      assert.equal(evidence.length, 5);
      assert.equal(relations.length, 8);
      assert.equal(findings.length, 3);
    });
  });
});
