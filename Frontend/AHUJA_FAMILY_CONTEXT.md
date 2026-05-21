# 🕉️ AHUJA FAMILY — Claude Code Memory File
# READ THIS FIRST before any change

---

## 👨 SANJU AHUJA
- DOB: 09/10/1983 | 4:45 AM | Gondia
- Lagna: Singh | Rashi: Tula | Nakshatra: Chitra | Dasha: Budh
- Business: Printing & Marketing 20yr | SANJU SK Digital
- Office: 10:30 AM – 7:30 PM | Team after 7 PM
- Friends Block: 7:00–8:30 PM
- File: src/Routine.jsx | Theme: Orange #d46a10
- Rule: "Finish करो — Start करना बंद करो"

## 👩 KIRTI AHUJA
- DOB: 12/01/1982 | 12:15 PM | Raipur
- Lagna: Mesh | Rashi: Makar | Nakshatra: Pushya | Dasha: Shani
- Work: Advocate + AOL Teacher (Bangalore pursuing)
- Passions: Gardening (MOST IMPORTANT), Spiritual, Cool & Calm
- AOL: 20+ years | JCI: 20+ years
- Wake: 4:30 AM | Sudarshan Kriya: NEVER MISS
- File: src/KirtiRoutine.jsx | Theme: Teal #00695c
- Rule: "Bangalore जाइए — यह आपका Dharma है"

## 👧 MAHI AHUJA
- DOB: 19/01/2009 | 10:10 PM | Gondia | Age: 17
- Lagna: Tula | Rashi: Makar | Nakshatra: Ardra | Dasha: Rahu
- Goal: Fashion Communication (NIFT/Pearl) + Own Fashion Brand
- NOT stitching — Fashion Entrepreneur + Brand Builder
- Family: Mama=Groom shop | Mausi=Boutique | Cousin=Fashion Designer
- File: src/MahiRoutine.jsx | Theme: Pink #c2185b
- Rule: "Gondia की माही — India की अगली Fashion Entrepreneur"

---

## 🏗️ APP STRUCTURE
```
src/App.jsx           → Family selector (3 cards)
src/Routine.jsx       → Sanju (tabs: आज/Weekly/Mantras)
src/MahiRoutine.jsx   → Mahi (tabs: आज/Weekly/Brand/Mantras)
src/KirtiRoutine.jsx  → Kirti (tabs: आज/Weekly/AOL/Garden)
src/main.jsx          → Entry point
index.html            → Noto Sans Devanagari font + mobile meta
package.json          → React 18 + Vite only
vercel.json           → SPA routing
```

## 🔑 STORAGE KEYS — NEVER CHANGE
- Sanju: `sanju_routine_v2`
- Mahi:  `mahi_routine_v1`
- Kirti: `kirti_routine_v1`

---

## 🎨 DESIGN RULES
- Hindi only (Devanagari)
- Mobile first: maxWidth 480px
- Inline styles only — no CSS files, no Tailwind
- Sanju=Orange, Kirti=Teal/Green, Mahi=Pink/Rose
- Keep: progress ring, celebration modal, drag reorder, localStorage

---

## 🕉️ MANTRAS
- Sanju: ॐ घृणि सूर्याय नमः (7x) | ॐ गं गणपतये नमः (21x) | ॐ बुं बुधाय नमः (Wed 108x)
- Kirti: Sudarshan Kriya daily | ॐ गुरवे नमः (21x) | ॐ शं शनैश्चराय नमः (Sat 108x)
- Mahi: ॐ ऐं सरस्वत्यै नमः (21x) | ॐ शुं शुक्राय नमः (21x, Fri 108x)

---

## ⚠️ RULES
1. Read this file FIRST always
2. Never change storage keys
3. Never remove celebration modal
4. Test build before push: `npm run build`
5. Push main branch only
6. Astrology timings are intentional — don't change randomly

## 🚀 DEPLOY
```
npm install
npm run build
git add -A
git commit -m "message"
git push origin main
```
Repo: https://github.com/mesanjusk/frontend | Branch: main

## 📝 CHANGE EXAMPLES
- "माही Brand tab में milestone जोड़ो" → MahiRoutine.jsx → milestones array
- "किर्ती morning में task जोड़ो" → KirtiRoutine.jsx → KIRTI_TASKS array
- "संजू Friends block update करो" → Routine.jsx → INITIAL_TASKS
- "Home screen बदलो" → App.jsx

जय गुरुदेव 🕉️
