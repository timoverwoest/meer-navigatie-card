# Meer navigatie card

*[Nederlandse versie](README.nl.md)*

A Home Assistant dashboard card with buttons to every page (views and subviews) of a dashboard, in
the same order as in that dashboard. The card only shows buttons for pages the logged-in user is
allowed to see.

<img src="https://raw.githubusercontent.com/timoverwoest/meer-navigatie-card/main/images/voorbeeld.png" alt="Example: two columns of buttons to dashboard pages" width="360">

* Follows each page's **Visibility** setting. Give someone access to a page, or take it away, and
  the button appears or disappears by itself. No need to edit the card.
* New pages get a button automatically, in their place in the order.
* The buttons look like regular tile cards and fit in a sections view.
* No dependencies; only the built-in `sun` integration (see [Limitations](#limitations)).

("Meer" is Dutch for "more": the card was built for a "More" section at the bottom of a home page.)

## Installation

### HACS (custom repository)

1. HACS → ⋮ → **Custom repositories**.
2. Repository `https://github.com/timoverwoest/meer-navigatie-card`, type **Dashboard**.
3. Install **Meer navigatie card** and refresh your browser.

### Manual

1. Download `meer-navigatie-card.js` and put it in `/config/www/`.
2. Settings → Dashboards → ⋮ → **Resources** → add
   `/local/meer-navigatie-card.js?v=1.0.1`, type **JavaScript module**.
3. Refresh your browser. Raise `?v=` with every new version.

## Configuration

```yaml
type: custom:meer-navigatie-card
```

| Option      | Default | Description |
|-------------|---------|-------------|
| `dashboard` | `null`  | URL path of the dashboard whose pages are listed. `null` is the default dashboard (`/lovelace`). |
| `exclude`   | `[]`    | Paths of pages that get no button, for example the page the card itself is on. |
| `names`     | `{}`    | Different button name per page title, for example `{Lights_Sections: Lights}`. |
| `extra`     | `[]`    | Your own buttons: `{after, name, icon, path}`. The button is placed right after the page with path `after`. |
| `columns`   | `2`     | Number of buttons per row. |

### Example: collapsible "More" section

Uses an `input_boolean` helper (here `input_boolean.dashboard_more_open`) and standard visibility
conditions. Tap the heading to expand or collapse.

```yaml
type: grid
cards:
  - type: heading
    heading: More
    icon: mdi:dots-horizontal
    tap_action:
      action: perform-action
      perform_action: input_boolean.toggle
      target:
        entity_id: input_boolean.dashboard_more_open
  - type: custom:meer-navigatie-card
    exclude:
      - home
    names:
      Lights_Sections: Lights
    extra:
      - after: home
        name: Home (extra)
        icon: mdi:map-marker-path
        path: /lovelace/home-extra
    visibility:
      - condition: state
        entity: input_boolean.dashboard_more_open
        state: "on"
```

Note: a helper has one state for everyone. If one person expands the section, it is expanded for
everybody else too.

## How it works

When the page opens, the card reads the dashboard configuration (`lovelace/config`, which every
logged-in user may read). For each page it looks at `visible`:

* no `visible`: everyone sees the button;
* a list of users: only those users see the button;
* `visible: false`: nobody sees the button.

After the dashboard is saved (`lovelace_updated`) the card reloads.

## Limitations

* The buttons are tile cards with `sun.sun` as their entity, because a tile needs an entity. The
  state is hidden; only the icon colour follows the sun (active by day, dimmed at night).
* The card only hides buttons. Anyone who knows a page's address can still open it. Visibility in
  Home Assistant is not a security feature.

## License

MIT, see [LICENSE](LICENSE).
