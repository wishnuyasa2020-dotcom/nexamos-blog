# NexaMOS Agent Operational Rules & Doctrine

Dokumen ini adalah **aturan memori utama** yang wajib dipatuhi oleh seluruh AI Agent (Antigravity IDE Assistant, subagents, dan generator naskah) setiap kali menerima perintah atau bekerja di dalam repositori NexaMOS ini.

---

## 1. Sumber Kebenaran Kanonik (Source of Truth)

Saat menjalankan tugas, agent WAJIB merujuk dan mematuhi dokumen-dokumen berikut:

1. **Doktrin Inti Editorial & Arsitektur Pengetahuan**:  
   [agent/memory/NexaMOS_Blog_IDE_Agent_Doctrine_v1.0.md](agent/memory/NexaMOS_Blog_IDE_Agent_Doctrine_v1.0.md)  
   *Prinsip:* Owned Knowledge Moat > SEO content farm. Dilarang mengarang fakta, dilarang eskalasi klaim tanpa bukti empiris.

2. **Pedoman Gaya Penulisan & Format Editorial**:  
   [knowledge/editorial/NexaMOS_Editorial_Style_Guide_v1.0.md](knowledge/editorial/NexaMOS_Editorial_Style_Guide_v1.0.md)  
   *Prinsip:* Grounding > Style. Analitis, presisi, berorientasi bukti, dan adaptif terhadap 11 Article Types.

3. **Standar Visual Hero Image Artikel**:  
   [agent/memory/hero-visual-style-guide.md](agent/memory/hero-visual-style-guide.md) & [knowledge/editorial/NexaMOS_Editorial_Style_Guide_v1.0.md](knowledge/editorial/NexaMOS_Editorial_Style_Guide_v1.0.md#10-standar-visual-hero-image-artikel)  
   *Formula baku visual prompt:*  
   `[SUBJECT] + [VISUAL METAPHOR] + [CORE_STYLE]`

4. **Konteks Proyek & Terminologi**:  
   - [agent/memory/project-context.md](agent/memory/project-context.md)  
   - [agent/memory/terminology.md](agent/memory/terminology.md)

5. **Integritas Skema Data**:  
   Semua output terstruktur (brief, klaim, draft, SEO, publication package) wajib mematuhi JSON schema di folder [agent/schemas/](agent/schemas/).

---

## 2. Tiga Knowledge Territory NexaMOS

Setiap artikel dan aset visual harus diklasifikasikan ke dalam salah satu territory:
- **`INTELLIGENCE`**: Pertanyaan: *"Apa yang sebenarnya sedang terjadi di pasar?"* (fokus pada sinyal pasar, data, pattern, diagnosis, AI computation).
- **`STRATEGY`**: Pertanyaan: *"Pilihan apa yang harus dibuat untuk menang?"* (fokus pada positioning, business model, trade-offs, roadmap).
- **`TACTICAL`**: Pertanyaan: *"Bagaimana pilihan strategi dieksekusi dan diukur?"* (fokus pada CRM, automasi, lifecycle, conversion mechanics).

---

## 3. Formula Baku Visual Hero Image (LOCKED)

Setiap pembuatan atau peninjauan visual prompt untuk gambar artikel wajib menggunakan struktur:

```text
[SUBJECT] + [VISUAL METAPHOR] + [CORE_STYLE]
```

- **`[SUBJECT]`**: Judul atau topik inti artikel dalam Bahasa Inggris.
- **`[VISUAL METAPHOR]`**: Objek metafora yang diekstrak dari subjek berdasarkan Knowledge Territory (`INTELLIGENCE` ➔ sensor/scanner/prism; `STRATEGY` ➔ decision pillar/pathway blocks; `TACTICAL` ➔ sorting conduit/workflow loop).
- **`[CORE_STYLE]`**:  
  `3D isometric illustration, soft clay rendering, rounded geometric objects, soft studio lighting, minimal marketing illustration, clean composition, premium modern aesthetic. Clear visual hierarchy, single dominant focal object, generous negative space, no text, no logos.`
- **Rasio Aspek**: `--ar 16:9`
- **Larangan (Anti-patterns)**: Tanpa teks/logo, tanpa robot/manusia, tanpa screenshot/mockup laptop/ponsel, tanpa visual clutter.

---

## 4. Mode Operasional Telegram Editorial Bot

Bot editorial seluler di [agent/telegram-editorial-bot.ts](agent/telegram-editorial-bot.ts) bertugas mengorkestrasi akuisisi bukti, AI research, editorial drafting, visual prompt generation, dan penerbitan Git push.
Setiap perubahan pada logika bot WAJIB menjaga sinkronisasi dengan aturan doktrin dan formula visual di atas.
