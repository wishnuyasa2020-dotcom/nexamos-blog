/**
 * NexaMOS Bilingual Article Migration Script
 *
 * Menerjemahkan seluruh artikel produksi yang sudah ada di content/published/
 * ke Bahasa Inggris profesional menggunakan LLM yang dikonfigurasi (Qwen/Gemini),
 * lalu melengkapi payload dwibahasa:
 * - translations.id (Bahasa Indonesia)
 * - translations.en (English - Default)
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { loadAIProviderConfig, isAIConfigured } from '../infrastructure/ai/ai-provider-config.ts';
import { AIHttpClient } from '../infrastructure/ai/ai-http-client.ts';
import { StructuredOutputValidator } from '../infrastructure/ai/structured-output-validator.ts';
import type { PublicationPackage } from '../engines/publishing/publication.ts';

async function migrateArticles() {
  const workspaceRoot = process.cwd();
  const publishedDir = path.join(workspaceRoot, 'content', 'published');

  const aiConfig = loadAIProviderConfig();
  if (!isAIConfigured(aiConfig)) {
    throw new Error('AI Provider belum terkonfigurasi di environment / .env.local.');
  }

  const client = new AIHttpClient(aiConfig);

  console.log('====================================================');
  console.log('NexaMOS Bilingual Article Migration');
  console.log(`Provider: ${aiConfig.provider} (${aiConfig.model})`);
  console.log(`Directory: ${publishedDir}`);
  console.log('====================================================\n');

  const files = await fs.readdir(publishedDir);
  const jsonFiles = files.filter((f) => f.endsWith('.json'));

  console.log(`Ditemukan ${jsonFiles.length} file artikel untuk diperiksa.\n`);

  for (const file of jsonFiles) {
    const filePath = path.join(publishedDir, file);
    const raw = await fs.readFile(filePath, 'utf-8');
    const pkg: PublicationPackage = JSON.parse(raw);

    // Cek jika sudah memiliki terjemahan EN yang lengkap
    if (pkg.translations?.en && pkg.translations?.id) {
      console.log(`[SKIP] ${file} sudah memiliki data dwibahasa lengkap.`);
      continue;
    }

    console.log(`[TRANSLATING] Memproses translasi ke English: "${pkg.title}" (${file})...`);

    const sourcePayload = {
      title: pkg.translations?.id?.title || pkg.articleContent?.headline || pkg.title,
      dek: pkg.translations?.id?.dek ?? pkg.articleContent?.dek ?? pkg.description ?? '',
      sections: (pkg.translations?.id?.sections || pkg.articleContent?.sections || []).map((s) => ({
        id: s.id,
        heading: s.heading,
        content: s.content,
        order: s.order,
        purpose: s.purpose
      }))
    };

    const systemPrompt = `You are the Principal Content Architect & Senior Editorial Director for NexaMOS (Marketing Operating System).
Translate this authoritative Indonesian marketing & technology analysis article into sophisticated, high-impact, fluent English for enterprise executives and search generative engines.

CRITICAL INSTRUCTIONS:
1. Maintain the exact same section IDs, ordering, and purposes.
2. Translate all headings and body paragraphs accurately, preserving any specific technical terminology, metrics, and claim tags (e.g. claim-1, claim-2, KPI names).
3. Do NOT add new claims or invent facts.
4. Output MUST be valid JSON only.`;

    const userPrompt = `TRANSLATE THE FOLLOWING ARTICLE TO PROFESSIONAL ENGLISH:
${JSON.stringify(sourcePayload, null, 2)}

REQUIRED JSON OUTPUT FORMAT:
{
  "title": "Compelling, precise English title",
  "dek": "Strategic, insightful English dek / subtitle",
  "sections": [
    {
      "id": "sec-1",
      "heading": "English heading",
      "content": "English paragraphs...",
      "order": 1,
      "purpose": "HOOK | CONTEXT | ..."
    }
  ]
}`;

    const response = await client.complete({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      responseFormat: 'json_object',
      temperature: 0.2
    });

    const parsed = StructuredOutputValidator.parseJson(response.content);
    if (!parsed || !parsed.title || !Array.isArray(parsed.sections)) {
      console.error(`[ERROR] Gagal mem-parse respon translasi untuk ${file}.`);
      continue;
    }

    // Siapkan data dwibahasa
    const idTranslation = {
      title: sourcePayload.title,
      description: sourcePayload.dek || sourcePayload.title,
      headline: sourcePayload.title,
      dek: sourcePayload.dek,
      sections: sourcePayload.sections
    };

    const enTranslation = {
      title: parsed.title,
      description: parsed.dek || parsed.title,
      headline: parsed.title,
      dek: parsed.dek || '',
      sections: parsed.sections.map((s: any, idx: number) => ({
        id: s.id || `sec-${idx + 1}`,
        heading: s.heading || '',
        content: s.content || '',
        order: s.order || idx + 1,
        purpose: s.purpose || 'ANALYSIS'
      }))
    };

    // Tetapkan default language ke 'en'
    pkg.defaultLanguage = 'en';
    pkg.translations = {
      id: idTranslation,
      en: enTranslation
    };

    // Set konten default ke English
    pkg.title = enTranslation.title;
    pkg.description = enTranslation.description;
    if (pkg.articleContent) {
      pkg.articleContent.headline = enTranslation.title;
      pkg.articleContent.dek = enTranslation.dek;
      pkg.articleContent.sections = enTranslation.sections;
      pkg.articleContent.plainTextSummary = enTranslation.sections.map((s: any) => s.content).join(' ');
    }

    // Update SEO meta title & description untuk default English
    if (pkg.seoMetadata) {
      pkg.seoMetadata.metaTitle = `${enTranslation.title} | NexaMOS`;
      pkg.seoMetadata.metaDescription = enTranslation.description;
      if (pkg.seoMetadata.openGraph) {
        pkg.seoMetadata.openGraph['og:title'] = enTranslation.title;
        pkg.seoMetadata.openGraph['og:description'] = enTranslation.description;
      }
      if (pkg.seoMetadata.twitterCard) {
        pkg.seoMetadata.twitterCard['twitter:title'] = enTranslation.title;
        pkg.seoMetadata.twitterCard['twitter:description'] = enTranslation.description;
      }
    }

    // Tulis kembali ke content/published/<slug>.json
    await fs.writeFile(filePath, JSON.stringify(pkg, null, 2), 'utf-8');
    console.log(`[SUCCESS] Selesai memigrasikan ${file} ke dwibahasa (EN default + ID).\n`);
  }

  console.log('Semua artikel berhasil dimigrasikan!');
}

migrateArticles().catch((err) => {
  console.error('[FATAL] Migrasi gagal:', err.message);
  process.exit(1);
});
