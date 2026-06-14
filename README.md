# Mo's Barbershop — nettside

Moderne, «fancy» nettside for **Mo's Barbershop** på Linderud Senter i Oslo.
Bygget som en rask, statisk side med ekte 3D-effekter (Three.js) — ingen byggesteg.

🔗 **Adresse:** Linderud Senter (plan 2), Erich Mogensøns vei 38, 0594 Oslo
📞 **Telefon:** 966 53 771 · 📸 Instagram: [@mos_barber_](https://www.instagram.com/mos_barber_/)

## Funksjoner

- **3D barberstang** i hero — roterende, interaktiv (følger musen), med svevende gull-partikler
- **3D-tilt** på tjeneste- og infokort, custom cursor, scroll-reveal, tellere
- Seksjoner: hero, tjenester & priser, «hvorfor oss», galleri, om oss, åpningstider, anmeldelser, kart & kontakt
- Helt responsiv, `prefers-reduced-motion`-vennlig, SEO + lokal bedrift (schema.org)
- Norsk språk

## Struktur

```
index.html        # all markup
css/styles.css    # design / layout / animasjon
js/scene.js       # Three.js 3D-hero
js/main.js        # cursor, reveal, tilt, meny, tellere
assets/           # legg egne salongbilder her
```

## Kjør lokalt

Åpne `index.html` direkte, eller server statisk:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

## Bytt til egne bilder

Galleribildene er midlertidige (Unsplash). Legg egne bilder fra salongen i
`assets/` og bytt `src` i `index.html` (søk etter `images.unsplash.com`).
Tips: hent de beste bildene fra Instagram [@mos_barber_](https://www.instagram.com/mos_barber_/).

## Justér før lansering

- **Priser** i tjeneste-seksjonen er veiledende — sett inn salongens faktiske priser.
- **Åpningstider** følger senterets tider — bekreft og oppdater i `index.html`.
- **Bookinglenke** peker til Fresha — bytt om dere bruker et annet system.
