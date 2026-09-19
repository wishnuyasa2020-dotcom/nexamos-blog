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
- Merupakan **ekstraksi metafora visual objek fisik/mekanisme** dari subjek yang disesuaikan dengan **Knowledge Territory** artikel.
- ⚠️ **ATURAN MUTLAK ANTI-REDUNDANSI (DILARANG DOBEL 3D):**  
  **DILARANG** menyertakan kata *"3D"*, *"isometric"*, *"illustration"*, atau *"rendering"* di dalam `[VISUAL METAPHOR]`.  
  Format render 3D isometric telah dikunci secara baku di `[CORE_STYLE]`. `[VISUAL METAPHOR]` murni mendeskripsikan objek fisik metaforis, bentuknya, dan interaksi sinyalnya.
- **Inspirasi Objek Berdasarkan Knowledge Territory:**
  - **`INTELLIGENCE`**:
    - Fokus: Deteksi sinyal, data, diagnosis, observasi pasar, kalkulasi AI.
    - Metafora fisik: *Floating geometric crystal prism refracting dynamic market pulses; spherical radar sensor scanning illuminated data points; curved diagnostic optical lens isolating signals; layered acoustic frequency ring; harmonic tuning fork.*
  - **`STRATEGY`**:
    - Fokus: Arsitektur keputusan, pilihan strategi, model bisnis, positioning, trade-offs.
    - Metafora fisik: *Monolithic balanced decision pillar resting on stepped foundation blocks; interlocking stone pathway branching into two strategic routes; minimalist architectural archway framing direction; weighted balance pedestal; geometric compass marker.*
  - **`TACTICAL`**:
    - Fokus: Otomasi, workflow, pipeline konversi, corong marketing, eksekusi terukur.
    - Metafora fisik: *Circular sorting conduit with pressurized intake channels; precision mechanical loop funneling multi-stage lead valves; modular pipeline junction routing automated tasks; continuous conveyor spiral; calibrated valve manifold.*

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
1. **NO DOUBLE 3D / NO REDUNDANCY:** Dilarang menyebutkan kata "3D" atau "isometric" lebih dari satu kali di seluruh prompt.
2. **NO TEXT / NO LOGOS:** Dilarang keras menampilkan tulisan, angka, huruf mengapung, watermark, atau logo brand apapun.
3. **NO HUMANOID / ROBOTS:** Dilarang menampilkan robot, kepala bot AI, otak menyala, atau figur manusia/tangan klise.
4. **NO SCREENS / DASHBOARD MOCKUPS:** Dilarang menggambar layar laptop, screenshot monitor, grafik garis saham 2D, atau mockup smartphone.
5. **NO CLUTTER / MONO-FOCAL ONLY:** Dilarang membuat komposisi penuh sesak atau banyak objek bersaing. Wajib memiliki **satu objek fokal utama yang dominan** (*single dominant focal object*) dengan ruang negatif yang luas (*generous negative space*).

