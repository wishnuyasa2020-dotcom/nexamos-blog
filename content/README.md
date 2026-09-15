# NexaMOS Editorial Content

Artikel utama dikelompokkan berdasarkan tiga knowledge territory:

- Intelligence
- Strategy
- Tactical

## Folder Boundary & Convention

### `/content/drafts`
Hanya untuk:
> Draft artikel yang struktur utamanya sudah berbentuk article asset / MDX dan sedang menuju final publication.

**PENTING**: Bukan tempat untuk research note atau catatan kerja tim editorial. Catatan produksi dan brief berada di `/editorial-ops/production`.

Gunakan MDX untuk artikel final apabila project mendukung MDX.

Recommended frontmatter:

```yaml
---
title:
slug:
territory:
articleType:
status:
author:
publishedAt:
updatedAt:
primaryTopic:

distribution:
  search: true
  discover: true
  ai: true
  social: true

scores:
  editorial: 0
  seo: 0
  discover: 0
  aiVisibility: 0

evidenceLevel:

tags: []
---
```
