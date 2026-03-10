"use client";

import { useEffect, useMemo, useState } from "react";
import { showToast } from "@/lib/toast";

type Point = {
  date: string;
  price: number;
};

type Series = {
  storeId: number;
  storeName: string;
  points: Point[];
};

type HistoryPayload = {
  ok: boolean;
  product: { id: number; name: string };
  days: number;
  series: Series[];
};

type Props = {
  productId: number;
  productName: string;
};

type ChartSeries = {
  storeId: number;
  storeName: string;
  color: string;
  path: string;
  last?: { x: number; y: number; price: number; date: string };
  points: Array<{ x: number; y: number; price: number; date: string }>;
  priceByDate: Map<string, number>;
  trend: number;
};

const COLORS = ["#3f66ff", "#f45f93", "#21a67a", "#f0932b", "#6f52ed", "#11a5bf"];

function buildPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

function formatDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function PriceHistoryModal({ productId, productName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HistoryPayload | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [hiddenStores, setHiddenStores] = useState<Set<number>>(new Set());
  const storageKey = `price-radar:hidden-stores:${productId}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as number[];
      if (Array.isArray(parsed)) {
        setHiddenStores(new Set(parsed.filter((value) => Number.isInteger(value))));
      }
    } catch {
      // Ignore localStorage parse errors and continue with defaults.
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(hiddenStores)));
  }, [hiddenStores, storageKey]);

  async function loadHistory(nextDays: number) {
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/history?days=${nextDays}`);
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({ error: "No se pudo cargar" }))) as {
          error?: string;
        };
        showToast(payload.error || "No se pudo cargar historial", "error");
        return;
      }

      const payload = (await response.json()) as HistoryPayload;
      setData(payload);
      setHoverIndex(null);
      const validStoreIds = new Set(payload.series.map((item) => item.storeId));
      setHiddenStores((prev) => new Set(Array.from(prev).filter((id) => validStoreIds.has(id))));
    } finally {
      setLoading(false);
    }
  }

  async function openAndLoad() {
    setIsOpen(true);
    await loadHistory(days);
  }

  async function changeRange(nextDays: number) {
    setDays(nextDays);
    await loadHistory(nextDays);
  }

  const chart = useMemo(() => {
    if (!data || data.series.length === 0) return null;

    const width = 760;
    const height = 320;
    const pad = 34;

    const allPrices = data.series.flatMap((s) => s.points.map((p) => p.price));
    if (allPrices.length === 0) return null;

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const ySpan = Math.max(maxPrice - minPrice, 0.1);

    const allDates = Array.from(new Set(data.series.flatMap((s) => s.points.map((p) => p.date)))).sort((a, b) =>
      a.localeCompare(b)
    );

    const xSpan = Math.max(allDates.length - 1, 1);
    const xByDate = new Map<string, number>();

    allDates.forEach((date, index) => {
      const x = pad + (index / xSpan) * (width - pad * 2);
      xByDate.set(date, x);
    });

    const seriesWithPath: ChartSeries[] = data.series.map((series, idx) => {
      const points = series.points.map((point) => {
        const x = xByDate.get(point.date) ?? pad;
        const y = height - pad - ((point.price - minPrice) / ySpan) * (height - pad * 2);
        return { x, y, price: point.price, date: point.date };
      });

      const firstPrice = series.points[0]?.price;
      const lastPrice = series.points[series.points.length - 1]?.price;
      const trend = firstPrice != null && lastPrice != null ? lastPrice - firstPrice : 0;

      return {
        storeId: series.storeId,
        storeName: series.storeName,
        color: COLORS[idx % COLORS.length],
        path: buildPath(points),
        last: points[points.length - 1],
        points,
        priceByDate: new Map(series.points.map((p) => [p.date, p.price])),
        trend
      };
    });

    return { width, height, pad, minPrice, maxPrice, seriesWithPath, allDates, xByDate };
  }, [data]);

  const hoveredDate = chart && hoverIndex != null ? chart.allDates[hoverIndex] : null;
  const visibleSeries = chart
    ? chart.seriesWithPath.filter((series) => !hiddenStores.has(series.storeId))
    : [];

  const tooltipRows = useMemo(() => {
    if (!chart || !hoveredDate) return [] as Array<{ storeName: string; color: string; price: number | null }>;

    return chart.seriesWithPath
      .filter((series) => !hiddenStores.has(series.storeId))
      .map((series) => ({
      storeName: series.storeName,
      color: series.color,
      price: series.priceByDate.get(hoveredDate) ?? null
      }));
  }, [chart, hoveredDate, hiddenStores]);

  function toggleStoreVisibility(storeId: number) {
    if (!chart) return;

    const visibleCount = chart.seriesWithPath.filter((series) => !hiddenStores.has(series.storeId)).length;
    const isHidden = hiddenStores.has(storeId);

    if (!isHidden && visibleCount <= 1) {
      showToast("Debe quedar al menos un supermercado visible", "info");
      return;
    }

    const next = new Set(hiddenStores);
    if (next.has(storeId)) next.delete(storeId);
    else next.add(storeId);
    setHiddenStores(next);
  }

  return (
    <>
      <button
        aria-label="Ver historico de precios"
        className="action-icon"
        onClick={openAndLoad}
        title="Ver historico"
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M3 17h2.5l3.3-5.2 3.2 2.8L16.5 8H21v2h-3.4L12.4 18l-3.1-2.7L6.6 19H3v-2z" />
        </svg>
      </button>

      {isOpen ? (
        <div className="modal-backdrop" onClick={() => setIsOpen(false)} role="presentation">
          <section className="history-modal" onClick={(e) => e.stopPropagation()}>
            <div className="edit-modal-head">
              <div>
                <h3>Historico de precios</h3>
                <p className="muted">{productName}</p>
              </div>
              <button className="btn-secondary btn-small" onClick={() => setIsOpen(false)} type="button">
                Cerrar
              </button>
            </div>

            <div className="range-actions">
              {[30, 60, 90].map((value) => (
                <button
                  className={value === days ? "btn-primary btn-small" : "btn-secondary btn-small"}
                  key={value}
                  onClick={() => changeRange(value)}
                  type="button"
                >
                  {value} dias
                </button>
              ))}
            </div>

            {loading ? (
              <p className="muted">Cargando historial...</p>
            ) : chart ? (
              <>
                <div className="chart-wrap">
                  <svg
                    onMouseLeave={() => setHoverIndex(null)}
                    viewBox={`0 0 ${chart.width} ${chart.height}`}
                  >
                    <rect fill="#f9fbff" height={chart.height} rx="12" width={chart.width} x="0" y="0" />

                    {[0, 1, 2, 3, 4].map((t) => {
                      const y = chart.pad + (t / 4) * (chart.height - chart.pad * 2);
                      return (
                        <line
                          key={t}
                          stroke="#e3e9ff"
                          strokeDasharray="2 4"
                          strokeWidth="1"
                          x1={chart.pad}
                          x2={chart.width - chart.pad}
                          y1={y}
                          y2={y}
                        />
                      );
                    })}

                    {hoveredDate ? (
                      <line
                        stroke="#8ea3eb"
                        strokeDasharray="4 4"
                        strokeWidth="1.5"
                        x1={chart.xByDate.get(hoveredDate) ?? chart.pad}
                        x2={chart.xByDate.get(hoveredDate) ?? chart.pad}
                        y1={chart.pad}
                        y2={chart.height - chart.pad}
                      />
                    ) : null}

                    {visibleSeries.map((series) => (
                      <g key={series.storeId}>
                        <path d={series.path} fill="none" stroke={series.color} strokeWidth="2.8" />
                        {series.last ? <circle cx={series.last.x} cy={series.last.y} fill={series.color} r="4" /> : null}
                        {hoveredDate && series.priceByDate.has(hoveredDate) ? (
                          <circle
                            cx={chart.xByDate.get(hoveredDate) ?? chart.pad}
                            cy={
                              chart.height -
                              chart.pad -
                              (((series.priceByDate.get(hoveredDate) ?? chart.minPrice) - chart.minPrice) /
                                Math.max(chart.maxPrice - chart.minPrice, 0.1)) *
                                (chart.height - chart.pad * 2)
                            }
                            fill={series.color}
                            r="4"
                            stroke="#fff"
                            strokeWidth="1.5"
                          />
                        ) : null}
                      </g>
                    ))}

                    <rect
                      fill="transparent"
                      height={chart.height - chart.pad * 2}
                      onMouseMove={(event) => {
                        const svg = event.currentTarget.ownerSVGElement;
                        if (!svg) return;
                        const bbox = svg.getBoundingClientRect();
                        const px = event.clientX - bbox.left;
                        const normalized = (px / bbox.width) * chart.width;
                        const clamped = Math.max(chart.pad, Math.min(chart.width - chart.pad, normalized));
                        const ratio = (clamped - chart.pad) / (chart.width - chart.pad * 2);
                        const idx = Math.round(ratio * Math.max(chart.allDates.length - 1, 1));
                        setHoverIndex(Math.max(0, Math.min(chart.allDates.length - 1, idx)));
                      }}
                      width={chart.width - chart.pad * 2}
                      x={chart.pad}
                      y={chart.pad}
                    />
                  </svg>
                </div>

                {hoveredDate ? (
                  <div className="chart-tooltip-card">
                    <strong>{formatDateLabel(hoveredDate)}</strong>
                    <div className="chart-tooltip-grid">
                      {tooltipRows.map((row) => (
                        <div className="chart-tooltip-row" key={row.storeName}>
                          <span className="legend-color" style={{ backgroundColor: row.color }} />
                          <span>{row.storeName}</span>
                          <strong>{row.price == null ? "-" : row.price.toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="legend">
                  {chart.seriesWithPath.map((series) => (
                    <button
                      className={`legend-item legend-toggle ${hiddenStores.has(series.storeId) ? "off" : ""}`}
                      key={series.storeId}
                      onClick={() => toggleStoreVisibility(series.storeId)}
                      type="button"
                    >
                      <span className="legend-color" style={{ backgroundColor: series.color }} />
                      <span>{series.storeName}</span>
                    </button>
                  ))}
                </div>

                <div className="trend-grid">
                  {visibleSeries.map((series) => {
                    const trendLabel = series.trend > 0.001 ? "Sube" : series.trend < -0.001 ? "Baja" : "Estable";
                    return (
                      <div className="trend-item" key={series.storeId}>
                        <span>{series.storeName}</span>
                        <span className={`trend-badge ${trendLabel.toLowerCase()}`}>
                          {trendLabel}
                          {series.trend !== 0 ? ` ${series.trend > 0 ? "+" : ""}${series.trend.toFixed(2)}` : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="muted">
                  Min: {chart.minPrice.toFixed(2)} | Max: {chart.maxPrice.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="empty-state">No hay suficiente historico para mostrar la grafica.</p>
            )}
          </section>
        </div>
      ) : null}
    </>
  );
}
