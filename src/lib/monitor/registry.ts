/**
 * Widget registry for the Market Monitor page. Single source of truth for
 * which widgets exist, what they're called, and their default grid span.
 */

export type WidgetKey =
  | "indices"
  | "mostActive"
  | "gainersLosers"
  | "economicCalendar"
  | "sectorMini"
  | "yieldCurve"
  | "commodities"
  | "watchlistBoard";

export type WidgetMeta = {
  i18nKey: string;        // search namespace key for label (e.g. "monitor.widget_indices")
  // Grid behavior on lg screens. The page is a 12-col grid.
  colSpan: 12 | 6 | 4;
};

export const WIDGET_REGISTRY: Record<WidgetKey, WidgetMeta> = {
  indices:          { i18nKey: "widget_indices",          colSpan: 12 },
  mostActive:       { i18nKey: "widget_mostActive",       colSpan: 6 },
  gainersLosers:    { i18nKey: "widget_gainersLosers",    colSpan: 6 },
  sectorMini:       { i18nKey: "widget_sectorMini",       colSpan: 6 },
  yieldCurve:       { i18nKey: "widget_yieldCurve",       colSpan: 6 },
  economicCalendar: { i18nKey: "widget_economicCalendar", colSpan: 6 },
  commodities:      { i18nKey: "widget_commodities",      colSpan: 6 },
  watchlistBoard:   { i18nKey: "widget_watchlistBoard",   colSpan: 12 },
};

export const ALL_WIDGETS: WidgetKey[] = [
  "indices",
  "mostActive",
  "gainersLosers",
  "sectorMini",
  "yieldCurve",
  "economicCalendar",
  "commodities",
  "watchlistBoard",
];

// First-run defaults — show everything so the advisor sees the full surface.
export const DEFAULT_WIDGETS: WidgetKey[] = [...ALL_WIDGETS];
