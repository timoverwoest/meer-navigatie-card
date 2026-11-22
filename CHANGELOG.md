# Changelog

## Unreleased

* Quality pass following the Home Assistant style guide for custom cards:
  * reacts to visibility changes again when Home Assistant sets `hass` after the card is placed;
  * reloads only when this dashboard is saved, not when any dashboard is saved;
  * rebuilds the buttons only when they change;
  * shows an error on the card instead of in the browser console; no console output;
  * invalid configuration shows a clear error (`setConfig`);
  * card picker: preview and a link to the documentation.

## 1.0.3 – 2026-11-04

* README: installation through the Marketplace (Home Assistant 2026.11 and later); HACS for 2026.10
  and older.

## 1.0.2 – 2026-10-24

* In the HACS default list: README leads with searching in HACS; custom repository as fallback.
* README: example automation that collapses the "More" section after a set time.

## 1.0.1 – 2026-10-24

* README in English (`README.md`); Dutch version in `README.nl.md`.
* Card description in the card picker in English.

## 1.0.0 – 2026-10-24

* Eerste versie: knoppen naar alle pagina's van een dashboard die de ingelogde gebruiker mag zien,
  in dashboardvolgorde, met `exclude`, `names`, `extra` en `columns`.
