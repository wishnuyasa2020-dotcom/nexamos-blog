# NexaMOS Hero Image Visual Style Guide & Prompt Architecture

**Status:** CANONICAL AGENT VISUAL STANDARD  
**Version:** 1.0  
**Scope:** Telegram Editorial Bot, Visual Prompt Generator, and Art Direction Agents  
**Reference:** `knowledge/editorial/NexaMOS_Editorial_Style_Guide_v1.0.md`

---

## 1. Arsitektur Formula Prompt Hero Image

Setiap prompt visual untuk gambar utama (*Hero Image*) artikel NexaMOS wajib disusun dengan formula persis 3 bagian:

```text
[SUBJECT] + [VISUAL METAPHOR] + [CORE_STYLE]
```

### Bagian 1: `[SUBJECT]`
- Diambil langsung dari topik atau judul artikel yang diterjemahkan/diformulasikan secara ringkas dan lugas dalam Bahasa Inggris.
- Contoh:
  - *"Customer Churn Signal Detection"*
  - *"B2B Enterprise Positioning Strategy"*
  - *"WhatsApp Lead Nurturing Automation"*

### Bagian 2: `[VISUAL METAPHOR]`
- Merupakan **ekstraksi metafora visual** dari subjek yang disesuaikan dengan **Knowledge Territory** artikel:
  - **`INTELLIGENCE`**:
    - Fokus: Deteksi sinyal, data, diagnosis, observasi pasar, kalkulasi AI.
    - Metafora visual: *A 3D isometric scanner analyzing floating data nodes, geometric crystal prisms refracting market signals, curved diagnostic glass lenses.*
  - **`STRATEGY`**:
    - Fokus: Arsitektur keputusan, pilihan strategi, model bisnis, positioning, trade-offs.
    - Metafora visual: *A 3D isometric architectural decision pillar, branching geometric modular foundation blocks, interlocking stone steps, strategic balance pedestal.*
  - **`TACTICAL`**:
    - Fokus: Otomasi, workflow, pipeline konversi, corong marketing, eksekusi terukur.
    - Metafora visual: *A 3D isometric precision sorting conduit, automated circular workflow loop with interconnected geometric channels and funnels.*

### Bagian 3: `[CORE_STYLE]` (LOCKED)
Deskriptor gaya estetika baku yang **TIDAK BOLEH DIUBAH ATAU DIHILANGKAN**:
```text
3D isometric illustration, soft clay rendering, rounded geometric objects, soft studio lighting, minimal marketing illustration, clean composition, premium modern aesthetic. Clear visual hierarchy, single dominant focal object, generous negative space, no text, no logos.
```

---

## 2. Parameter Akhir Gambar
- **Aspect Ratio:** `--ar 16:9` (wajib ditambahkan di akhir prompt untuk format banner hero horizontal blog).

---

## 3. Aturan Larangan Keras (Visual Anti-Patterns)
1. **NO TEXT / NO LOGOS:** Dilarang keras menampilkan tulisan, angka, huruf mengapung, watermark, atau logo.
2. **NO HUMANOID / ROBOTS:** Dilarang menampilkan robot, kepala bot AI, otak menyala, atau figur manusia/tangan klise.
3. **NO SCREENS / DASHBOARD MOCKUPS:** Dilarang menggambar layar laptop, screenshot monitor, grafik garis saham 2D, atau mockup smartphone.
4. **NO CLUTTER:** Dilarang membuat komposisi penuh sesak atau banyak objek bersaing. Wajib memiliki **satu objek fokal utama yang dominan** (*single dominant focal object*) dengan ruang negatif yang luas (*generous negative space*).
