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

const VERSIE = "1.0.3";
const DOCUMENTATIE = "https://github.com/timoverwoest/meer-navigatie-card";

// Ongeldige configuratie: een Error laat Home Assistant de fout tonen in plaats van de kaart.
function controleer(config) {
  const fout = (tekst) => {
    throw new Error(`meer-navigatie-card: ${tekst}`);
  };
  if (!config || typeof config !== "object") fout("configuration is missing");
  const { dashboard, exclude, names, extra, columns } = config;
  if (dashboard != null && typeof dashboard !== "string") fout("dashboard must be text or null");
  if (exclude != null && !Array.isArray(exclude)) fout("exclude must be a list");
  if (names != null && (typeof names !== "object" || Array.isArray(names))) {
    fout("names must be a mapping (page title: button name)");
  }
  if (extra != null && !Array.isArray(extra)) fout("extra must be a list");
  (extra || []).forEach((e) => {
    if (!e || typeof e.path !== "string") fout("every extra button needs a path");
  });
  if (columns != null && !(Number.isInteger(columns) && columns >= 1)) {
    fout("columns must be a whole number of 1 or more");
  }
}

class MeerNavigatieCard extends HTMLElement {
  // De geladen versie, zonder console-uitvoer: customElements.get("meer-navigatie-card").version
  static get version() {
    return VERSIE;
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    controleer(config);
    this._config = { dashboard: null, exclude: [], extra: [], names: {}, columns: 2, ...config };
    this._views = null;
    this._laad();
  }

  set hass(hass) {
    const nieuweGebruiker = this._hass?.user?.id !== hass.user?.id;
    this._hass = hass;
    if (this.isConnected) this._abonneer();
    if (nieuweGebruiker) this._laad();
    // De tegels tonen de zon (sun.sun); Home Assistant werkt een tegel zelf alleen bij als iets
    // wat hij toont veranderde.
    for (const kaart of this._kaarten || []) kaart.hass = hass;
  }

  connectedCallback() {
    if (!this._hass) return;
    this._abonneer();
    // Terwijl de kaart los was, kan het dashboard zijn gewijzigd: opnieuw laden.
    if (this._losgekoppeld) this._laad();
    this._losgekoppeld = false;
  }

  disconnectedCallback() {
    this._losgekoppeld = true;
    if (this._afmelden) this._afmelden.then((stop) => stop()).catch(() => {});
    this._afmelden = null;
  }

  // Alleen dit dashboard opgeslagen (bijv. zichtbaarheid aangepast): opnieuw laden. Het
  // standaard dashboard heeft url_path null.
  _abonneer() {
    if (this._afmelden || !this._hass) return;
    this._afmelden = this._hass.connection
      .subscribeEvents((event) => {
        if ((event.data?.url_path ?? null) === (this._config?.dashboard ?? null)) this._laad();
      }, "lovelace_updated")
      .catch(() => () => {});
  }

  async _laad() {
    if (!this._config || !this._hass) return;
    const beurt = (this._laadBeurt = (this._laadBeurt || 0) + 1);
    let views;
    let fout = null;
    try {
      const cfg = await this._hass.callWS({ type: "lovelace/config", url_path: this._config.dashboard });
      views = cfg.views || [];
    } catch (e) {
      views = [];
      fout = e;
    }
    if (beurt !== this._laadBeurt) return; // er is al een nieuwere aanvraag
    this._views = views;
    this._render(fout);
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

  async _render(fout) {
    const beurt = (this._beurt = (this._beurt || 0) + 1);
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const knoppen = fout ? [] : this._knoppen();
    // Niets veranderd aan de knoppen of de kolommen: de bestaande tegels blijven staan.
    const vingerafdruk = JSON.stringify([fout ? String(fout.message || fout) : null, this._config.columns, knoppen]);
    if (vingerafdruk === this._vingerafdruk) return;
    MeerNavigatieCard._helpers ||= window.loadCardHelpers();
    const helpers = await MeerNavigatieCard._helpers;
    if (beurt !== this._beurt) return; // er is al een nieuwere render bezig
    this._vingerafdruk = vingerafdruk;

    if (fout) {
      const melding = document.createElement("ha-alert");
      melding.alertType = "warning";
      melding.title = "meer-navigatie-card";
      melding.textContent = `Could not read dashboard "${this._config.dashboard || "lovelace"}": ${fout.message || fout}`;
      this._kaarten = [];
      this.shadowRoot.replaceChildren(melding);
      return;
    }

    const raster = document.createElement("div");
    raster.style.cssText =
      `display:grid;grid-template-columns:repeat(${this._config.columns},minmax(0,1fr));` +
      "gap:var(--ha-section-grid-row-gap,8px) var(--ha-section-grid-column-gap,8px);";
    this._kaarten = knoppen.map((k) => {
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
    description: "Buttons to every page of a dashboard that the current user may see.",
    preview: true,
    documentationURL: DOCUMENTATIE,
  });
}
