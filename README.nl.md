# Meer navigatie card

*[English version](README.md)*

Een Home Assistant dashboard-kaart met knoppen naar alle pagina's (views en subviews) van een
dashboard, in dezelfde volgorde als in dat dashboard. De kaart toont alleen knoppen voor pagina's
die de ingelogde gebruiker mag zien.

<img src="https://raw.githubusercontent.com/timoverwoest/meer-navigatie-card/main/images/voorbeeld.png" alt="Voorbeeld: twee kolommen knoppen naar dashboardpagina's" width="360">

* Volgt de **Zichtbaarheid** van elke pagina. Geef je iemand rechten op een pagina, of haal je ze
  weg, dan verschijnt of verdwijnt de knop vanzelf. Je hoeft de kaart niet aan te passen.
* Nieuwe pagina's krijgen automatisch een knop, op hun plek in de volgorde.
* De knoppen zien eruit als gewone tegels (tile card) en passen in een sections-view.
* Geen afhankelijkheden; alleen de standaard `sun`-integratie (zie [Beperkingen](#beperkingen)).

## Installatie

### Via HACS

1. Open HACS en zoek op **Meer navigatie card**.
2. Download hem en ververs de browser.

Vind je de kaart niet bij het zoeken, voeg hem dan toe als aangepaste repository: HACS → ⋮ →
**Aangepaste repositories** → `https://github.com/timoverwoest/meer-navigatie-card`, type
**Dashboard**.

### Handmatig

1. Download `meer-navigatie-card.js` en zet het in `/config/www/`.
2. Instellingen → Dashboards → ⋮ → **Bronnen** → toevoegen:
   `/local/meer-navigatie-card.js?v=1.0.2`, type **JavaScript-module**.
3. Ververs de browser. Verhoog `?v=` bij elke nieuwe versie.

## Configuratie

```yaml
type: custom:meer-navigatie-card
```

| Optie       | Standaard | Betekenis |
|-------------|-----------|-----------|
| `dashboard` | `null`    | URL-pad van het dashboard waarvan de pagina's getoond worden. `null` is het standaarddashboard (`/lovelace`). |
| `exclude`   | `[]`      | Paden van pagina's die geen knop krijgen, bijvoorbeeld de pagina waar de kaart zelf op staat. |
| `names`     | `{}`      | Andere knopnaam per paginatitel, bijvoorbeeld `{Licht_Secties: Licht}`. |
| `extra`     | `[]`      | Eigen knoppen: `{after, name, icon, path}`. De knop komt direct na de pagina met pad `after`. |
| `columns`   | `2`       | Aantal knoppen naast elkaar. |

### Voorbeeld: uitklapbaar "Meer"-blok

Met een `input_boolean`-helper (hier `input_boolean.dashboard_meer_open`) en standaard
zichtbaarheidsvoorwaarden. Tik op de kop om open en dicht te klappen.

```yaml
type: grid
cards:
  - type: heading
    heading: Meer
    icon: mdi:dots-horizontal
    tap_action:
      action: perform-action
      perform_action: input_boolean.toggle
      target:
        entity_id: input_boolean.dashboard_meer_open
  - type: custom:meer-navigatie-card
    exclude:
      - home
    names:
      Licht_Secties: Licht
    extra:
      - after: home
        name: Home (extra)
        icon: mdi:map-marker-path
        path: /lovelace/home-extra
    visibility:
      - condition: state
        entity: input_boolean.dashboard_meer_open
        state: "on"
```

Let op: een helper is voor iedereen gelijk. Klapt de één het blok open, dan staat het ook bij de
ander open.

Wil je dat het blok na een tijdje vanzelf weer dichtklapt, voeg dan een automatisering toe. Stel de
tijd in onder `for` (hier 2 minuten):

```yaml
alias: Meer-blok dichtklappen
triggers:
  - trigger: state
    entity_id: input_boolean.dashboard_meer_open
    to: "on"
    for:
      minutes: 2
actions:
  - action: input_boolean.turn_off
    target:
      entity_id: input_boolean.dashboard_meer_open
mode: single
```

De tijd begint opnieuw elke keer dat het blok wordt opengeklapt. Herstart Home Assistant terwijl
het blok open staat, dan vervalt de tijd en blijft het open tot iemand het dichtklapt.

## Hoe het werkt

Bij het openen van de pagina leest de kaart de configuratie van het dashboard
(`lovelace/config`, dat mag elke ingelogde gebruiker). Per pagina kijkt hij naar `visible`:

* geen `visible`: iedereen ziet de knop;
* een lijst met gebruikers: alleen die gebruikers zien de knop;
* `visible: false`: niemand ziet de knop.

Na het opslaan van het dashboard (`lovelace_updated`) laadt de kaart opnieuw.

## Beperkingen

* De knoppen zijn tile cards met `sun.sun` als entiteit, omdat een tegel een entiteit nodig heeft.
  De status is verborgen; alleen de kleur van het icoon volgt de zon (overdag actief, 's avonds
  gedimd).
* De kaart verbergt alleen knoppen. Wie het adres van een pagina kent, kan die nog steeds openen.
  Zichtbaarheid is in Home Assistant geen beveiliging.

## Licentie

MIT, zie [LICENSE](LICENSE).
