/// <reference path="./ambient.d.ts" />
/**
 * NexaMOS Phase 1C Unit Test Suite: Topic Management, Lifecycle Orchestration & Repositories
 *
 * Sourced from NexaMOS Phase 1C specifications
 * Uses Node.js native test runner (node:test & node:assert/strict)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { InMemoryTopicRepository } from '../engines/ideation/repository/in-memory-topic-repository.ts';
import { InMemoryTopicEventRepository } from '../engines/ideation/repository/in-memory-topic-event-repository.ts';
import { InMemoryTopicArticleRelationRepository } from '../engines/ideation/repository/in-memory-topic-article-relation-repository.ts';
import { TopicManagementService } from '../engines/ideation/topic-management-service.ts';
import type { Topic, CreateTopicInput } from '../engines/ideation/domain/topic.types.ts';

function createSampleTopicInput(overrides: Partial<CreateTopicInput> = {}): CreateTopicInput {
  return {
    title: 'Analisis Disrupsi Search di Era AI',
    slug: 'analisis-disrupsi-search-era-ai',
    territory: 'INTELLIGENCE',
    status: 'CAPTURED',
    editorialRole: 'FLAGSHIP',
    audience: {
      segment: 'Enterprise CMOs and Strategists',
      jobToBeDone: 'Memahami pergeseran ekonomi pencarian AI',
      knowledgeLevel: 'Executive'
    },
    problem: 'Penurunan CTR organik hingga 50% akibat AI Overviews.',
    intent: {
      primary: 'Analisis dampak AI Search terhadap model owned media',
      secondary: ['GEO vs SEO', 'Entity Optimization']
    },
    thesis: 'Keunggulan bersaing bergeser dari kata kunci ke kepemilikan entitas pengetahuan.',
    whyNow: 'Perubahan algoritma pencarian global 2025-2026.',
    informationGain: {
      expectedContribution: 'Framework evaluasi zero-click berbasis data empiris.',
      originalityType: ['ORIGINAL_FRAMEWORK', 'STRONG_POINT_OF_VIEW'],
      commodityRisk: 'LOW'
    },
    evidencePlan: {
      requiredEvidenceLevel: 'E3',
      plannedSources: ['Google Search Central 2026', 'Ahrefs Study 2026'],
      originalEvidenceRequired: false,
      notes: 'Bukti literatur lengkap.'
    },
    businessRelevance: {
      objective: 'Thought Leadership',
      funnelRole: 'Top of Funnel'
    },
    recommendedArticleType: 'ANALYSIS',
    distributionTargets: ['GOOGLE_SEARCH', 'DIRECT', 'EMAIL'],
    ...overrides
  };
}

describe('Phase 1C Unit Tests: Topic Management & Lifecycle Orchestration', () => {
  let topicRepo: InMemoryTopicRepository;
  let eventRepo: InMemoryTopicEventRepository;
  let relationRepo: InMemoryTopicArticleRelationRepository;
  let service: TopicManagementService;

  beforeEach(() => {
    topicRepo = new InMemoryTopicRepository();
    eventRepo = new InMemoryTopicEventRepository();
    relationRepo = new InMemoryTopicArticleRelationRepository();
    service = new TopicManagementService({ topicRepo, eventRepo, relationRepo });
  });

  // ==========================================================================
  // 1. TOPIC REPOSITORY CONTRACT & IN-MEMORY IMPLEMENTATION
  // ==========================================================================
  describe('1. Topic Repository Tests', () => {
    test('1.1 Create and getById works cleanly', async () => {
      const topicInput = createSampleTopicInput();
      const createRes = await service.captureTopic(topicInput, 'tester');

      assert.equal(createRes.ok, true);
      if (!createRes.ok) return;

      const created = createRes.value;
      assert.ok(created.id);
      assert.equal(created.status, 'CAPTURED');

      const fetched = await topicRepo.getById(created.id);
      assert.ok(fetched);
      assert.equal(fetched.id, created.id);
      assert.equal(fetched.title, topicInput.title);
    });

    test('1.2 Duplicate ID is rejected by repository', async () => {
      const topicInput = createSampleTopicInput();
      const topic1: Topic = {
        ...topicInput,
        id: 'dup-id-01',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const res1 = await topicRepo.create(topic1);
      assert.equal(res1.ok, true);

      const topic2: Topic = {
        ...topicInput,
        id: 'dup-id-01',
        slug: 'different-slug',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const res2 = await topicRepo.create(topic2);
      assert.equal(res2.ok, false);
      if (!res2.ok) {
        assert.equal(res2.error.code, 'DUPLICATE_TOPIC_ID');
      }
    });

    test('1.3 Duplicate slug is rejected by repository', async () => {
      const topicInput = createSampleTopicInput();
      const topic1: Topic = {
        ...topicInput,
        id: 'id-001',
        slug: 'same-slug',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const res1 = await topicRepo.create(topic1);
      assert.equal(res1.ok, true);

      const topic2: Topic = {
        ...topicInput,
        id: 'id-002',
        slug: 'same-slug',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const res2 = await topicRepo.create(topic2);
      assert.equal(res2.ok, false);
      if (!res2.ok) {
        assert.equal(res2.error.code, 'DUPLICATE_TOPIC_SLUG');
      }
    });

    test('1.4 Repository guarantees safe cloning and immutability', async () => {
      const topicInput = createSampleTopicInput();
      const createRes = await service.captureTopic(topicInput);
      assert.equal(createRes.ok, true);
      if (!createRes.ok) return;

      const fetched1 = await topicRepo.getById(createRes.value.id);
      assert.ok(fetched1);

      // Mutate local reference directly
      (fetched1 as { title: string }).title = 'HACKED TITLE MUTATION';

      const fetched2 = await topicRepo.getById(createRes.value.id);
      assert.ok(fetched2);
      assert.notEqual(fetched2.title, 'HACKED TITLE MUTATION');
      assert.equal(fetched2.title, topicInput.title);
    });

    test('1.5 List with filtering, sorting, and pagination', async () => {
      // Create 3 topics with different territories and dates
      await service.captureTopic(
        createSampleTopicInput({
          title: 'A Strategic Topic',
          slug: 'a-strategic-topic',
          territory: 'STRATEGY',
          editorialRole: 'AUTHORITY'
        })
      );

      await service.captureTopic(
        createSampleTopicInput({
          title: 'B Intelligence Topic',
          slug: 'b-intelligence-topic',
          territory: 'INTELLIGENCE',
          editorialRole: 'FLAGSHIP'
        })
      );

      await service.captureTopic(
        createSampleTopicInput({
          title: 'C Tactical Topic',
          slug: 'c-tactical-topic',
          territory: 'TACTICAL',
          editorialRole: 'SUPPORTING'
        })
      );

      // Filter by territory
      const stratList = await topicRepo.list({ filter: { territory: 'STRATEGY' } });
      assert.equal(stratList.total, 1);
      assert.equal(stratList.items[0].territory, 'STRATEGY');

      // Sort by title DESC
      const sortedList = await topicRepo.list({
        sort: { field: 'title', direction: 'DESC' },
        pagination: { limit: 2, offset: 0 }
      });
      assert.equal(sortedList.total, 3);
      assert.equal(sortedList.items.length, 2);
      assert.equal(sortedList.items[0].title, 'C Tactical Topic');
      assert.equal(sortedList.items[1].title, 'B Intelligence Topic');
    });
  });

  // ==========================================================================
  // 2. LIFECYCLE ORCHESTRATION & GUARDRAILS
  // ==========================================================================
  describe('2. Lifecycle Transition & Guardrail Tests', () => {
    test('2.1 CAPTURED -> SCREENING is valid', async () => {
      const capRes = await service.captureTopic(createSampleTopicInput());
      assert.equal(capRes.ok, true);
      if (!capRes.ok) return;

      const screenRes = await service.screenTopic(capRes.value.id, 'lead-screener');
      assert.equal(screenRes.ok, true);
      if (!screenRes.ok) return;
      assert.equal(screenRes.value.status, 'SCREENING');
    });

    test('2.2 Invalid transition CAPTURED -> PUBLISHED is rejected', async () => {
      const capRes = await service.captureTopic(createSampleTopicInput());
      assert.equal(capRes.ok, true);
      if (!capRes.ok) return;

      // Try to mark published directly without screening, qualification, approval, or production
      const pubRes = await service.markPublished(capRes.value.id, 'art-999');
      assert.equal(pubRes.ok, false);
      if (!pubRes.ok) {
        assert.ok(
          pubRes.error.code === 'ARTICLE_RELATION_REQUIRED' ||
            pubRes.error.code === 'INVALID_TOPIC_TRANSITION'
        );
      }
    });

    test('2.3 Scoring rejects topic before QUALIFIED unless allowSimulation is true', async () => {
      const capRes = await service.captureTopic(createSampleTopicInput());
      assert.equal(capRes.ok, true);
      if (!capRes.ok) return;

      // Score on CAPTURED topic without simulation flag -> REJECTED
      const scoreRes = await service.scoreTopic(capRes.value.id, {
        customDimensions: {
          strategicValue: 80,
          audienceValue: 85,
          timeliness: 90,
          evidenceReadiness: 75,
          differentiationPotential: 80
        }
      });

      assert.equal(scoreRes.ok, false);
      if (!scoreRes.ok) {
        assert.equal(scoreRes.error.code, 'TOPIC_NOT_QUALIFIED');
      }

      // Simulation mode -> ALLOWED
      const simRes = await service.scoreTopic(capRes.value.id, {
        customDimensions: {
          strategicValue: 80,
          audienceValue: 85,
          timeliness: 90,
          evidenceReadiness: 75,
          differentiationPotential: 80
        },
        allowSimulation: true
      });
      assert.equal(simRes.ok, true);
    });

    test('2.4 Approval strictly requires PRIORITIZED status', async () => {
      const capRes = await service.captureTopic(createSampleTopicInput());
      assert.equal(capRes.ok, true);
      if (!capRes.ok) return;

      // Attempt approve on CAPTURED
      const appRes1 = await service.approveTopic(capRes.value.id, 'Chief-Editor');
      assert.equal(appRes1.ok, false);
      if (!appRes1.ok) {
        assert.equal(appRes1.error.code, 'TOPIC_NOT_PRIORITIZED');
      }

      // Transition to SCREENING then QUALIFIED
      await service.screenTopic(capRes.value.id);
      const qualRes = await service.qualifyTopic(capRes.value.id);
      assert.equal(qualRes.ok, true);
      if (!qualRes.ok) return;
      assert.equal(qualRes.value.status, 'QUALIFIED');

      // Attempt approve on QUALIFIED (must still be rejected because not PRIORITIZED)
      const appRes2 = await service.approveTopic(capRes.value.id, 'Chief-Editor');
      assert.equal(appRes2.ok, false);
      if (!appRes2.ok) {
        assert.equal(appRes2.error.code, 'TOPIC_NOT_PRIORITIZED');
      }

      // Score then prioritize
      await service.scoreTopic(capRes.value.id, {
        customDimensions: {
          strategicValue: 90,
          audienceValue: 85,
          timeliness: 90,
          evidenceReadiness: 90,
          differentiationPotential: 85
        }
      });
      const prioRes = await service.prioritizeTopic(capRes.value.id);
      assert.equal(prioRes.ok, true);

      // Now approve should succeed
      const appRes3 = await service.approveTopic(
        capRes.value.id,
        'Chief-Editor',
        'Top priority intelligence piece'
      );
      assert.equal(appRes3.ok, true);
      if (!appRes3.ok) return;
      assert.equal(appRes3.value.status, 'APPROVED');
      assert.equal(appRes3.value.approvedBy, 'Chief-Editor');
      assert.equal(appRes3.value.approvalNote, 'Top priority intelligence piece');
      assert.ok(appRes3.value.approvedAt);
    });

    test('2.5 startProduction requires APPROVED and completeness check', async () => {
      const capRes = await service.captureTopic(createSampleTopicInput());
      assert.equal(capRes.ok, true);
      if (!capRes.ok) return;

      // Rejects on unapproved
      const prodRes1 = await service.startProduction(capRes.value.id);
      assert.equal(prodRes1.ok, false);
      if (!prodRes1.ok) {
        assert.equal(prodRes1.error.code, 'TOPIC_NOT_APPROVED');
      }

      // Walk through to APPROVED
      await service.screenTopic(capRes.value.id);
      await service.qualifyTopic(capRes.value.id);
      await service.scoreTopic(capRes.value.id, {
        customDimensions: {
          strategicValue: 85,
          audienceValue: 80,
          timeliness: 85,
          evidenceReadiness: 85,
          differentiationPotential: 80
        }
      });
      await service.prioritizeTopic(capRes.value.id);
      await service.approveTopic(capRes.value.id, 'Editor');

      const prodRes2 = await service.startProduction(capRes.value.id);
      assert.equal(prodRes2.ok, true);
      if (!prodRes2.ok) return;
      assert.equal(prodRes2.value.status, 'IN_PRODUCTION');
    });

    test('2.6 markPublished strictly requires linked article relation', async () => {
      // Prepare topic up to IN_PRODUCTION
      const capRes = await service.captureTopic(createSampleTopicInput());
      assert.equal(capRes.ok, true);
      if (!capRes.ok) return;
      const topicId = capRes.value.id;

      await service.screenTopic(topicId);
      await service.qualifyTopic(topicId);
      await service.scoreTopic(topicId, {
        customDimensions: {
          strategicValue: 90,
          audienceValue: 85,
          timeliness: 90,
          evidenceReadiness: 90,
          differentiationPotential: 85
        }
      });
      await service.prioritizeTopic(topicId);
      await service.approveTopic(topicId, 'Editor');
      await service.startProduction(topicId);

      // Attempt to publish without linking article first -> REJECTED
      const pubRes1 = await service.markPublished(topicId, 'art-2026-001');
      assert.equal(pubRes1.ok, false);
      if (!pubRes1.ok) {
        assert.equal(pubRes1.error.code, 'ARTICLE_RELATION_REQUIRED');
      }

      // Link article relation
      const linkRes = await service.linkArticle(topicId, 'art-2026-001', 'PRIMARY');
      assert.equal(linkRes.ok, true);

      // Publish should now succeed
      const pubRes2 = await service.markPublished(topicId, 'art-2026-001');
      assert.equal(pubRes2.ok, true);
      if (!pubRes2.ok) return;
      assert.equal(pubRes2.value.status, 'PUBLISHED');
      assert.ok(pubRes2.value.articleIds?.includes('art-2026-001'));
    });
  });

  // ==========================================================================
  // 3. TOPIC -> ARTICLE RELATIONS (1 TOPIC -> N ARTICLES)
  // ==========================================================================
  describe('3. Topic -> Article Relation Tests', () => {
    test('3.1 One topic can have multiple article relations (PRIMARY, SUPPORTING, DERIVATIVE)', async () => {
      const capRes = await service.captureTopic(createSampleTopicInput());
      assert.equal(capRes.ok, true);
      if (!capRes.ok) return;
      const topicId = capRes.value.id;

      const link1 = await service.linkArticle(topicId, 'art-primary-001', 'PRIMARY');
      const link2 = await service.linkArticle(topicId, 'art-supporting-002', 'SUPPORTING');
      const link3 = await service.linkArticle(topicId, 'art-derivative-003', 'DERIVATIVE');

      assert.equal(link1.ok, true);
      assert.equal(link2.ok, true);
      assert.equal(link3.ok, true);

      const relations = await relationRepo.listByTopicId(topicId);
      assert.equal(relations.length, 3);
      assert.equal(relations[0].relationType, 'PRIMARY');
      assert.equal(relations[1].relationType, 'SUPPORTING');
      assert.equal(relations[2].relationType, 'DERIVATIVE');

      const topic = await service.getTopic(topicId);
      assert.ok(topic);
      assert.equal(topic.articleIds?.length, 3);
    });

    test('3.2 Re-linking the same article safely updates relation type without duplication', async () => {
      const capRes = await service.captureTopic(createSampleTopicInput());
      assert.equal(capRes.ok, true);
      if (!capRes.ok) return;
      const topicId = capRes.value.id;

      await service.linkArticle(topicId, 'art-001', 'SUPPORTING');
      await service.linkArticle(topicId, 'art-001', 'PRIMARY'); // Update relation type

      const relations = await relationRepo.listByTopicId(topicId);
      assert.equal(relations.length, 1);
      assert.equal(relations[0].relationType, 'PRIMARY');

      const topic = await service.getTopic(topicId);
      assert.ok(topic);
      assert.equal(topic.articleIds?.length, 1);
    });
  });

  // ==========================================================================
  // 4. AUDIT TRAIL, HISTORY & MANUAL OVERRIDE
  // ==========================================================================
  describe('4. Audit Trail, History & Manual Override Tests', () => {
    test('4.1 Every lifecycle step appends a chronological audit event', async () => {
      const capRes = await service.captureTopic(createSampleTopicInput());
      assert.equal(capRes.ok, true);
      if (!capRes.ok) return;
      const topicId = capRes.value.id;

      await service.screenTopic(topicId, 'screener-alice');
      await service.qualifyTopic(topicId, { actor: 'qualifier-bob' });
      await service.scoreTopic(topicId, {
        customDimensions: {
          strategicValue: 90,
          audienceValue: 90,
          timeliness: 90,
          evidenceReadiness: 90,
          differentiationPotential: 90
        }
      });
      await service.prioritizeTopic(topicId, 'prioritizer-carol');
      await service.approveTopic(topicId, 'editor-david', 'Approved for immediate Q4 roadmap');

      const history = await service.getTopicHistory(topicId);
      assert.equal(history.length, 5);
      assert.equal(history[0].type, 'TOPIC_CAPTURED');
      assert.equal(history[1].type, 'TOPIC_SCREENING_STARTED');
      assert.equal(history[2].type, 'TOPIC_QUALIFIED');
      assert.equal(history[3].type, 'TOPIC_PRIORITIZED');
      assert.equal(history[4].type, 'TOPIC_APPROVED');

      // Verify chronological order (timestamps are non-decreasing)
      for (let i = 1; i < history.length; i++) {
        const prev = new Date(history[i - 1].timestamp).getTime();
        const curr = new Date(history[i].timestamp).getTime();
        assert.ok(curr >= prev);
      }
    });

    test('4.2 Manual override policy preserves original decision in audit event', async () => {
      // Create topic that would normally fail or require research
      const capRes = await service.captureTopic(
        createSampleTopicInput({
          evidencePlan: {
            requiredEvidenceLevel: 'E4',
            plannedSources: [], // No sources -> should evaluate to RESEARCH_REQUIRED
            originalEvidenceRequired: true
          }
        })
      );
      assert.equal(capRes.ok, true);
      if (!capRes.ok) return;
      const topicId = capRes.value.id;

      await service.screenTopic(topicId);

      // Qualify with manual override to ON_HOLD
      const qualRes = await service.qualifyTopic(topicId, {
        override: {
          newDecision: 'ON_HOLD',
          reason: 'Menunggu hasil wawancara eksklusif bulan depan',
          actor: 'Managing-Editor'
        }
      });

      assert.equal(qualRes.ok, true);
      if (!qualRes.ok) return;
      assert.equal(qualRes.value.status, 'ON_HOLD');

      const history = await service.getTopicHistory(topicId);
      const qualEvent = history.find((e) => e.type === 'TOPIC_ON_HOLD');
      assert.ok(qualEvent);
      assert.ok(qualEvent.metadata?.override);

      const overrideMeta = qualEvent.metadata.override as {
        override: boolean;
        originalDecision: string;
        newDecision: string;
        reason: string;
        actor: string;
      };

      assert.equal(overrideMeta.override, true);
      assert.equal(overrideMeta.originalDecision, 'RESEARCH_REQUIRED');
      assert.equal(overrideMeta.newDecision, 'ON_HOLD');
      assert.equal(overrideMeta.actor, 'Managing-Editor');
      assert.equal(overrideMeta.reason, 'Menunggu hasil wawancara eksklusif bulan depan');
    });

    test('4.3 TopicSnapshot returns complete read-model projection', async () => {
      const capRes = await service.captureTopic(createSampleTopicInput());
      assert.equal(capRes.ok, true);
      if (!capRes.ok) return;
      const topicId = capRes.value.id;

      await service.screenTopic(topicId);
      await service.qualifyTopic(topicId);
      await service.linkArticle(topicId, 'art-101', 'PRIMARY');

      const snapshot = await service.getTopicSnapshot(topicId);
      assert.ok(snapshot);
      assert.equal(snapshot.topic.id, topicId);
      assert.ok(snapshot.qualification);
      assert.equal(snapshot.articleRelations.length, 1);
      assert.equal(snapshot.articleRelations[0].articleId, 'art-101');
      assert.ok(snapshot.lastEvent);
      assert.equal(snapshot.lastEvent.type, 'TOPIC_ARTICLE_LINKED');
    });
  });

  // ==========================================================================
  // 5. SEED DATA FIXTURES VERIFICATION
  // ==========================================================================
  describe('5. Seed Data Fixtures Validation', () => {
    test('5.1 All 6 seed fixtures load, parse and cover required statuses', () => {
      const seedDir = path.resolve('data/topics/seed');
      const files = fs.readdirSync(seedDir).filter((f: string) => f.endsWith('.json'));

      assert.ok(files.length >= 6, `Expected at least 6 seed files, found ${files.length}`);

      const statuses = new Set<string>();
      for (const file of files) {
        const raw = fs.readFileSync(path.join(seedDir, file), 'utf-8');
        const data = JSON.parse(raw);
        assert.ok(data.id, `File ${file} missing id`);
        assert.ok(data.title, `File ${file} missing title`);
        assert.ok(data.slug, `File ${file} missing slug`);
        assert.ok(data.territory, `File ${file} missing territory`);
        assert.ok(data.status, `File ${file} missing status`);
        statuses.add(data.status);
      }

      // Verify all required variations exist
      assert.ok(statuses.has('CAPTURED'), 'Missing CAPTURED seed');
      assert.ok(statuses.has('SCREENING'), 'Missing SCREENING seed');
      assert.ok(statuses.has('RESEARCH_REQUIRED'), 'Missing RESEARCH_REQUIRED seed');
      assert.ok(statuses.has('QUALIFIED'), 'Missing QUALIFIED seed');
      assert.ok(statuses.has('PRIORITIZED'), 'Missing PRIORITIZED seed');
      assert.ok(statuses.has('APPROVED'), 'Missing APPROVED seed');
    });
  });
});
