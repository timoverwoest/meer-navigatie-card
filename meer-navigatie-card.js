// meer-navigatie-card — knoppen naar alle pagina's van een dashboard die de ingelogde gebruiker mag zien.
//
// Leest bij openen de configuratie van het dashboard (lovelace/config) en volgt de "Zichtbaarheid"
// van elke pagina: verandert die, dan verschijnt of verdwijnt de knop vanzelf. Ook nieuwe pagina's
// komen er automatisch bij, in dezelfde volgorde als in het dashboard.
//
// Voorbeeld:
//   type: custom:meer-navigatie-card
//   dashboard: null              # null = standaard dashboard (/lovelace)
//   exclude: [home]              # paden zonder knop
//   names: {Licht_Secties: Licht}
//   extra:                       # eigen knoppen, direct na de pagina met pad "after"
//     - {after: home, name: Home (extra), icon: mdi:map-marker-path, path: /lovelace/home-extra}
//
// Bron en documentatie: https://github.com/timoverwoest/meer-navigatie-card

const VERSIE = "1.0.0";

class MeerNavigatieCard extends HTMLElement {
  setConfig(config) {
    this._config = { dashboard: null, exclude: [], extra: [], names: {}, columns: 2, ...config };
    this._views = null;
    if (this._hass) this._laad();
  }

  set hass(hass) {
    const nieuweGebruiker = this._hass?.user?.id !== hass.user?.id;
    this._hass = hass;
    if (nieuweGebruiker) this._laad();
    (this._kaarten || []).forEach((k) => (k.hass = hass));
  }

  connectedCallback() {
    if (this._hass) {
      this._laad();
      this._abonneer();
    }
  }

  disconnectedCallback() {
    if (this._afmelden) this._afmelden.then((stop) => stop()).catch(() => {});
    this._afmelden = null;
  }

  // Dashboard opgeslagen (bijv. zichtbaarheid aangepast): opnieuw laden.
  _abonneer() {
    if (this._afmelden) return;
    this._afmelden = this._hass.connection
      .subscribeEvents(() => this._laad(), "lovelace_updated")
      .catch(() => () => {});
  }

  async _laad() {
    if (!this._config || !this._hass) return;
    try {
      const cfg = await this._hass.callWS({ type: "lovelace/config", url_path: this._config.dashboard });
      this._views = cfg.views || [];
    } catch (e) {
      console.warn("meer-navigatie-card:", e);
      this._views = [];
    }
    this._render();
  }

  // Zelfde regel als de frontend: geen "visible" = iedereen, lijst = alleen die gebruikers.
  _magZien(view) {
    const v = view.visible;
    if (v === undefined || v === true) return true;
    if (v === false) return false;
    if (Array.isArray(v)) return v.some((x) => x.user === this._hass.user?.id);
    return true;
  }

  _knoppen() {
    const c = this._config;
    const basis = "/" + (c.dashboard || "lovelace") + "/";
    const knoppen = [];
    this._views.forEach((view, i) => {
      const pad = view.path ?? String(i);
      if (!c.exclude.includes(pad) && this._magZien(view)) {
        knoppen.push({
          name: c.names[view.title] || view.title || pad,
          icon: view.icon || "mdi:view-dashboard",
          path: basis + pad,
        });
      }
      c.extra.filter((e) => e.after === pad).forEach((e) => knoppen.push(e));
    });
    return knoppen;
  }

  async _render() {
    const beurt = (this._beurt = (this._beurt || 0) + 1);
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const helpers = await window.loadCardHelpers();
    if (beurt !== this._beurt) return; // er is al een nieuwere render bezig

    const raster = document.createElement("div");
    raster.style.cssText =
      `display:grid;grid-template-columns:repeat(${this._config.columns},minmax(0,1fr));` +
      "gap:var(--ha-section-grid-row-gap,8px) var(--ha-section-grid-column-gap,8px);";
    this._kaarten = this._knoppen().map((k) => {
      const nav = { action: "navigate", navigation_path: k.path };
      const kaart = helpers.createCardElement({
        type: "tile",
        entity: "sun.sun",
        name: k.name,
        icon: k.icon,
        hide_state: true,
        vertical: false,
        tap_action: nav,
        icon_tap_action: nav,
      });
      kaart.hass = this._hass;
      raster.appendChild(kaart);
      return kaart;
    });
    this.shadowRoot.replaceChildren(raster);
  }

  getCardSize() {
    return Math.ceil((this._kaarten?.length || 2) / (this._config?.columns || 2));
  }

  getGridOptions() {
    return { columns: "full", rows: "auto" };
  }
}

if (!customElements.get("meer-navigatie-card")) {
  customElements.define("meer-navigatie-card", MeerNavigatieCard);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "meer-navigatie-card",
    name: "Meer navigatie",
    description: "Knoppen naar alle pagina's van een dashboard die de gebruiker mag zien.",
  });
  console.info(`meer-navigatie-card ${VERSIE}`);
}
