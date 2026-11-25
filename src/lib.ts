import {
  TINY_SPARK,
  POINT,
  XMLNS,
  ANIMATION_DURATION,
  TooltipState,
} from "../types";
import {
  animateAreaProgressively,
  animatePath,
  createIndividualAreaWithCuts,
  createSmoothAreaSegments,
  createSmoothPath,
  createSmoothPathWithCuts,
  createStraightPath,
  createStraightPathWithCuts,
  SVG,
} from "./svg";

export function getCharts(root: ParentNode) {
  const charts = Array.from(root.querySelectorAll<TINY_SPARK>(".tiny-spark"));
  if (root.nodeType === 1 && (root as Element).matches(".tiny-spark")) {
    charts.unshift(root as TINY_SPARK);
  }
  return charts;
}

export function hasDataset(element: TINY_SPARK, name: string) {
  const attrs = Object.keys(element.dataset);
  return attrs.includes(name);
}

export function getDatasetValue(
  element: TINY_SPARK,
  name: string,
  fallback: number | string,
) {
  if (!hasDataset(element, name)) return fallback;
  return element.dataset[name];
}

export function getElementColors(element: TINY_SPARK) {
  if (!element)
    return {
      color: "#1A1A1A",
      backgroundColor: "#FFFFFF",
    };
  const computedStyle = window.getComputedStyle(element);
  const color = computedStyle.getPropertyValue("color") || "#1A1A1A";
  const backgroundColor = computedStyle.getPropertyValue("background-color");
  const background = computedStyle.getPropertyValue("background");
  const bg = backgroundColor || background || "#FFFFFF";
  return { color, backgroundColor: bg };
}

export function createUid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function parseDataset(chart: TINY_SPARK) {
  const dataSetStr = chart.getAttribute("data-set");
  if (!dataSetStr) return [];
  const str = dataSetStr
    .replace(/,(?=,)/g, ",null")
    .replace(/\[,/g, "[null,")
    .replace(/,\]/g, ",null]");
  try {
    const parsed = JSON.parse(str);
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (item) => typeof item === "number" || [null, undefined].includes(item),
      )
    ) {
      return parsed;
    }
    console.warn("data-set is not an array of numbers.");
    return [];
  } catch (error) {
    console.error("Error parsing data-set:", error);
    return [];
  }
}

export function setGradientOffset(i: number, n: number): string {
  if (n <= 1) return "0%";
  return `${(i * 100) / (n - 1)}%`;
}

function getDates(chart: TINY_SPARK) {
  const dates = chart.getAttribute("data-dates");
  if (!dates) return [];
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(dates);
    } catch {
      parsed = JSON.parse(dates.replaceAll(`'`, '"'));
    }
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => item === null || typeof item === "string")
    ) {
      return parsed;
    }
    console.warn("data-dates is not an array of strings or nulls");
    return [];
  } catch (error) {
    console.error("Error parsing data-dates", error);
    return [];
  }
}

function getTemperatureColors(chart: TINY_SPARK) {
  const colors = chart.getAttribute("data-temperature-colors");
  if (!colors) return [];
  try {
    const parsed = JSON.parse(colors.replaceAll(`'`, '"'));
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      return parsed;
    }
    console.warn("data-temperature-colors is not an array of strings");
    return [];
  } catch (error) {
    console.error("Error parsing data-temperature-colors", error);
    return [];
  }
}

export function minMax(dataset: number[]) {
  return {
    min: Math.min(...dataset),
    max: Math.max(...dataset),
  };
}

export function nextTick() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export function localeNum(chart: TINY_SPARK, num: number) {
  const locale = String(
    getDatasetValue(chart, "numberLocale", navigator.language || "en-US"),
  );
  const rounding = Number(String(getDatasetValue(chart, "numberRounding", 0)));
  const options = {
    useGrouping: true,
    minimumFractionDigits: rounding,
    maximumFractionDigits: rounding,
  };
  const { numberStyle, numberCurrency, numberUnit } = chart.dataset;
  if (
    numberStyle === "currency" ||
    numberStyle === "percent" ||
    numberStyle === "unit"
  ) {
    try {
      return num.toLocaleString(locale, {
        ...options,
        style: numberStyle,
        currency: numberCurrency,
        unit: numberUnit,
      });
    } catch {
      // Invalid currencies or units fall back to decimal formatting.
    }
  }
  return num.toLocaleString(locale, options);
}

export function domPlot(svg: SVGSVGElement, svgX: number, svgY: number) {
  if (!svg.createSVGPoint || !svg.getScreenCTM) {
    console.error(
      "Your browser does not support SVG coordinate transformation.",
    );
    return { x: 0, y: 0 };
  }

  const screenCTM = svg.getScreenCTM();
  if (!screenCTM) {
    console.error("Cannot obtain the screen CTM.");
    return { x: 0, y: 0 };
  }

  const point = svg.createSVGPoint();
  point.x = svgX;
  point.y = svgY;

  const domPoint = point.matrixTransform(screenCTM);

  return { x: domPoint.x, y: domPoint.y };
}

const tooltipStates = new WeakMap<TINY_SPARK, TooltipState>();

function hideTooltip(state: TooltipState) {
  if (state.frameId !== null) cancelAnimationFrame(state.frameId);
  state.frameId = null;
  state.tool.style.opacity = "0";
  state.tool.style.visibility = "hidden";
  state.tool.setAttribute("aria-hidden", "true");
}

function tooltipAnchorY(chart: TINY_SPARK, point: POINT) {
  return chart.dataset.type === "bar" && !point.isPositive ? point.bar.y : point.y;
}

function tooltipPosition(svg: SVGSVGElement, chart: TINY_SPARK, point: POINT, state: TooltipState) {
  const { x, y } = domPlot(svg, point.x, tooltipAnchorY(chart, point));
  const radius = Number(getDatasetValue(chart, "plotRadius", 3));
  return { x: x - state.width / 2, y: y - state.height - radius * 1.5 };
}

function positionTooltip(state: TooltipState) {
  state.tool.style.left = `${state.displayX}px`;
  state.tool.style.top = `${state.displayY}px`;
}

function showTooltip(
  svg: SVGSVGElement,
  chart: TINY_SPARK,
  point: POINT,
  id: string,
  announce: boolean,
) {
  let tooltipState = tooltipStates.get(chart);
  const live = announce ? "polite" : "off";

  if (!tooltipState) {
    const tool = document.createElement("div");
    tool.classList.add("tiny-spark-tooltip");
    tool.setAttribute("role", "tooltip");
    tool.setAttribute("aria-live", live);
    tool.style.position = "fixed";
    tool.style.pointerEvents = "none";
    tool.style.opacity = "0";
    tool.style.visibility = "hidden";
    tool.style.willChange = "top, left";
    const content = document.createElement("div");
    content.classList.add("tiny-spark-tooltip-content");
    tool.appendChild(content);
    chart.ownerDocument.body.appendChild(tool);

    const newState: TooltipState = {
      targetX: 0,
      targetY: 0,
      displayX: 0,
      displayY: 0,
      frameId: null,
      tool,
      content,
      width: 0,
      height: 0,
      hasSnapped: false,
    };
    tooltipStates.set(chart, newState);
    tooltipState = newState;
  }

  const state = tooltipState;
  if (state.tool.getAttribute("aria-live") !== live) {
    state.tool.setAttribute("aria-live", live);
  }
  state.tool.id = `tooltip_${id}`;
  state.tool.setAttribute("aria-hidden", String(state.tool.style.visibility === "hidden"));
  const value = point.v == null ? "-" : localeNum(chart, Number(point.v));
  state.content.textContent = point.d ? `${point.d}: ${value}` : value;

  const { width: w, height: h } = state.tool.getBoundingClientRect();
  state.width = w;
  state.height = h;

  const { x, y } = tooltipPosition(svg, chart, point, state);
  state.targetX = x;
  state.targetY = y;

  if (!state.hasSnapped) {
    state.displayX = state.targetX;
    state.displayY = state.targetY;
    positionTooltip(state);
    state.tool.style.opacity = "1";
    state.hasSnapped = true;
    return;
  }

  const smoothing =
    Math.min(
      1,
      Math.max(0, Number(getDatasetValue(chart, "tooltipSmoothing", 1)) / 10),
    ) || 1;

  function animate() {
    state.displayX += (state.targetX - state.displayX) * smoothing;
    state.displayY += (state.targetY - state.displayY) * smoothing;

    const settled =
      Math.abs(state.targetX - state.displayX) <= 0.5 &&
      Math.abs(state.targetY - state.displayY) <= 0.5;
    if (settled) {
      state.displayX = state.targetX;
      state.displayY = state.targetY;
    }

    positionTooltip(state);
    state.tool.style.opacity = "1";

    state.frameId = settled ? null : requestAnimationFrame(animate);
  }
  if (state.frameId == null) animate();
}

function makeGradient({
  id,
  colorStart,
  colorEnd,
  opacityStart,
  opacityEnd,
}: {
  id: string;
  colorStart: string;
  colorEnd: string;
  opacityStart: number;
  opacityEnd: number;
}) {
  const linearGradient = document.createElementNS(XMLNS, "linearGradient");
  linearGradient.setAttribute("id", id);
  linearGradient.setAttribute("x1", "0");
  linearGradient.setAttribute("x2", "0");
  linearGradient.setAttribute("y1", "0");
  linearGradient.setAttribute("y2", "1");
  const stopStart = document.createElementNS(XMLNS, "stop");
  stopStart.setAttribute("offset", "0%");
  stopStart.setAttribute("stop-color", colorStart);
  stopStart.setAttribute("stop-opacity", String(opacityStart));
  const stopEnd = document.createElementNS(XMLNS, "stop");
  stopEnd.setAttribute("offset", "100%");
  stopEnd.setAttribute("stop-color", colorEnd);
  stopEnd.setAttribute("stop-opacity", String(opacityEnd));
  [stopStart, stopEnd].forEach((stop) => {
    linearGradient.appendChild(stop);
  });
  return linearGradient;
}

/////////////////////////////////////////////////////

function hasAllSameValues(array: number[]) {
  if (array.length <= 1) return true;
  const firstValue = array[0];
  for (let index = 1; index < array.length; index += 1) {
    if (array[index] !== firstValue) {
      return false;
    }
  }
  return true;
}

const chartViews = new WeakMap<
  TINY_SPARK,
  {
    svg: SVGSVGElement;
    events: AbortController;
    ownsTabIndex: boolean;
    dismissedSyncIndex?: string;
    selection?: {
      index: number;
      source: "mouse" | "keyboard" | "touch" | "sync";
    };
    syncIndex: () => void;
  }
>();

export const syncIndexEvent = "tiny-spark:sync-index";

function emitSyncIndex(chart: TINY_SPARK, index: number | null) {
  chart.dispatchEvent(new CustomEvent(syncIndexEvent, { detail: index }));
}

export function syncChartIndex(chart: TINY_SPARK, updated = false) {
  const view = chartViews.get(chart);
  if (!view) return;
  if (updated) view.dismissedSyncIndex = undefined;
  view.syncIndex();
}

export function destroyChart(chart: TINY_SPARK) {
  const view = chartViews.get(chart);
  view?.events.abort();
  view?.svg.remove();
  if (view?.ownsTabIndex && chart.getAttribute("tabindex") === "0") {
    chart.removeAttribute("tabindex");
  }
  chartViews.delete(chart);

  const state = tooltipStates.get(chart);
  if (state) {
    hideTooltip(state);
    state.tool.remove();
    tooltipStates.delete(chart);
  }
  if (view?.selection && view.selection.source !== "sync")
    emitSyncIndex(chart, null);
}

function getFixedScale(chart: TINY_SPARK, dataset: number[]) {
  const lower = Number(chart.dataset.yMin?.trim() || NaN);
  const upper = Number(chart.dataset.yMax?.trim() || NaN);
  const hasLower = Number.isFinite(lower);
  const hasUpper = Number.isFinite(upper);
  if (!hasLower && !hasUpper) return;

  let autoMin = 0;
  let autoMax = 0;
  for (const value of dataset) {
    if (!Number.isFinite(value)) continue;
    autoMin = Math.min(autoMin, value);
    autoMax = Math.max(autoMax, value);
  }
  return scaleBetween(hasLower ? lower : autoMin, hasUpper ? upper : autoMax);
}

function scaleBetween(min: number, max: number) {
  const range = max - min;
  if (!(range > 0)) return;

  return (value: number) => {
    const clamped = Math.min(max, Math.max(min, value || 0));
    return Number.isFinite(range)
      ? (max - clamped) / range
      : (max / 2 - clamped / 2) / (max / 2 - min / 2);
  };
}

export function createChart(chart: TINY_SPARK, firstTime: boolean) {
  const isBar = chart.dataset.type && chart.dataset.type === "bar";

  let animate = firstTime;
  const previous = chartViews.get(chart);
  previous?.events.abort();
  const activeTooltip = tooltipStates.get(chart);
  if (activeTooltip) {
    hideTooltip(activeTooltip);
    activeTooltip.hasSnapped = false;
  }
  chart.replaceChildren();
  const dataset = parseDataset(chart);
  const { svg, svgId, width, height, viewBox } = SVG(chart, dataset.at(-1));
  const events = new AbortController();
  const view: NonNullable<typeof previous> = {
    svg,
    events,
    ownsTabIndex: previous?.ownsTabIndex ?? false,
    dismissedSyncIndex: previous?.dismissedSyncIndex,
    syncIndex,
  };
  chartViews.set(chart, view);
  const { color, backgroundColor } = getElementColors(chart);

  const padding = { T: 12, R: 12, B: 12, L: 12 };
  const lastValueId = createUid();
  const showLastValue =
    String(getDatasetValue(chart, "showLastValue", "false")) === "true";

  // DRAWING AREA
  const area = {
    left: padding.L,
    top: padding.T,
    width: width - padding.L - padding.R,
    height: height - padding.T - padding.B,
    bottom: height - padding.B,
    right: width - padding.R,
  };

  const { min: MIN } = minMax(dataset);
  const positiveDataset = dataset.map((d) => {
    return [null, undefined].includes(d)
      ? d
      : d + (MIN < 0 ? Math.abs(MIN) : 0);
  });
  const { max } = minMax(positiveDataset);
  const scale =
    getFixedScale(chart, dataset) ??
    (max === 0 ? scaleBetween(Math.min(MIN, 0), MIN < 0 ? 0 : 1) : undefined);
  let slot =
    area.width / (dataset.length - 1) === Infinity
      ? area.width
      : area.width / (dataset.length - 1);

  if (isBar) {
    const [v_0, v_1, v_2, v_3] = viewBox.split(" ");
    // Add padding to leave space for bars
    svg.setAttribute(
      "viewBox",
      `${Number(v_0) - slot / 2} ${v_1} ${Number(v_2) + slot} ${v_3}`,
    );
  }

  const allNeg = !dataset.some((d) => d >= 0);
  const dates = getDates(chart);

  // DATAPOINTS
  const allPoints = positiveDataset.map((d, i) => {
    const uniqueCase = {
      w: positiveDataset.length === 1 ? slot / 2 : 0,
      h: positiveDataset.length === 1 ? area.height / 2 : 0,
    };

    const x = area.left + slot * i + uniqueCase.w;
    const y = scale
      ? area.top + scale(dataset[i]) * area.height
      : (1 - (d || 0) / max) * area.height + uniqueCase.h + padding.T;
    const y_0 = scale
      ? area.top + scale(0) * area.height
      : (1 - (MIN < 0 ? Math.abs(MIN) : 0) / max) * area.height +
        padding.T +
        uniqueCase.h;

    const isPositive = dataset[i] >= 0;

    return {
      y:
        !scale && allNeg && dataset.length === 1
          ? area.top + area.height / 2
          : y,
      x,
      v: dataset[i],
      d: dates[i] || null,
      isPositive,
      bar: {
        x: x - slot / 2,
        y: scale
          ? Math.min(y, y_0)
          : dataset.length === 1
            ? area.top
            : isPositive
              ? y
              : allNeg
                ? area.top
                : y_0,
        h: scale
          ? Math.abs(y - y_0)
          : dataset.length === 1
            ? area.height
            : isPositive
              ? y_0 - y
              : allNeg && dataset.length === 0
                ? area.height
                : isNaN(y - y_0)
                  ? 0
                  : y - y_0,
        w: slot,
      },
    };
  });

  function makePathArea(): SVGPathElement {
    const _pathArea = document.createElementNS(XMLNS, "path");
    _pathArea.classList.add("tiny-spark-line-area");
    return _pathArea;
  }

  function createAreaGradient(id: string): SVGDefsElement {
    const defs = document.createElementNS(XMLNS, "defs");
    defs.appendChild(
      makeGradient({
        id,
        colorStart: String(getDatasetValue(chart, "gradientFrom", "#FFFFFF")),
        colorEnd: String(getDatasetValue(chart, "gradientTo", "#FFFFFF")),
        opacityStart: Math.max(
          0,
          Math.min(1, Number(getDatasetValue(chart, "gradientFromOpacity", 1))),
        ),
        opacityEnd: Math.max(
          0,
          Math.min(1, Number(getDatasetValue(chart, "gradientToOpacity", 1))),
        ),
      }),
    );
    return defs;
  }

  function createBarGradients(id: string): SVGDefsElement {
    const defs = document.createElementNS(XMLNS, "defs");
    defs.appendChild(
      makeGradient({
        id: `pos_${id}`,
        colorStart: String(getDatasetValue(chart, "gradientFrom", "#FFFFFF")),
        colorEnd: String(getDatasetValue(chart, "gradientTo", "#FFFFFF")),
        opacityStart: Math.max(
          0,
          Math.min(1, Number(getDatasetValue(chart, "gradientFromOpacity", 1))),
        ),
        opacityEnd: Math.max(
          0,
          Math.min(1, Number(getDatasetValue(chart, "gradientToOpacity", 1))),
        ),
      }),
    );
    defs.appendChild(
      makeGradient({
        id: `neg_${id}`,
        colorStart: String(getDatasetValue(chart, "gradientTo", "#FFFFFF")),
        colorEnd: String(getDatasetValue(chart, "gradientFrom", "#FFFFFF")),
        opacityStart: Math.max(
          0,
          Math.min(1, Number(getDatasetValue(chart, "gradientToOpacity", 1))),
        ),
        opacityEnd: Math.max(
          0,
          Math.min(1, Number(getDatasetValue(chart, "gradientFromOpacity", 1))),
        ),
      }),
    );
    return defs;
  }

  const points = [...allPoints].map((p) =>
    [null, undefined, Infinity, -Infinity, NaN, "NaN"].includes(p.v)
      ? { ...p, v: null }
      : p,
  );
  const animation = chart.getAttribute("data-animation");
  const path = document.createElementNS(XMLNS, "path");
  path.classList.add("tiny-spark-line-path");
  const pathArea = makePathArea();
  const pathAreas: SVGPathElement[] = [];

  const hasGradient =
    !!getDatasetValue(chart, "gradientFrom", "") &&
    !!getDatasetValue(chart, "gradientTo", "");
  const gradientId = createUid();

  // PATH & AREA
  if (!isBar) {
    if (!chart.dataset.curve || chart.dataset.curve === "true") {
      if (!chart.dataset.cutNull || chart.dataset.cutNull === "false") {
        path.setAttribute("d", `M ${createSmoothPath(points)}`);
      } else {
        path.setAttribute("d", `M ${createSmoothPathWithCuts(points)}`);
      }
    } else {
      if (!chart.dataset.cutNull || chart.dataset.cutNull === "false") {
        path.setAttribute("d", `M ${createStraightPath(points)}`);
      } else {
        path.setAttribute("d", `M ${createStraightPathWithCuts(points)}`);
      }
    }

    path.setAttribute("fill", "none");

    const temperatureColors = getTemperatureColors(chart);

    if (temperatureColors.length && !hasAllSameValues(points.map((p) => p.y))) {
      const temperatureId = createUid();
      const temperatureDefs = document.createElementNS(XMLNS, "defs");
      const temperatureLinearGradient = document.createElementNS(
        XMLNS,
        "linearGradient",
      );
      temperatureLinearGradient.setAttribute("gradientTransform", "rotate(90)");
      temperatureLinearGradient.setAttribute("id", temperatureId);
      temperatureColors.forEach((c, ci) => {
        const stop = document.createElementNS(XMLNS, "stop");
        stop.setAttribute(
          "offset",
          setGradientOffset(ci, temperatureColors.length),
        );
        stop.setAttribute("stop-color", c);
        temperatureLinearGradient.appendChild(stop);
      });
      temperatureDefs.appendChild(temperatureLinearGradient);
      svg.prepend(temperatureDefs);
      path.setAttribute("stroke", `url(#${temperatureId})`);
    } else {
      path.setAttribute(
        "stroke",
        String(getDatasetValue(chart, "lineColor", color)),
      );
    }

    path.setAttribute(
      "stroke-width",
      String(getDatasetValue(chart, "lineThickness", 2)),
    );
    path.setAttribute("stroke-linecap", "round");

    if (animation === "true" && animate) {
      path.style.opacity = "0";
      pathArea.style.opacity = "0";
    }

    if (hasGradient) {
      svg.appendChild(createAreaGradient(gradientId));
    }

    // AREAS
    if (allPoints.length) {
      if (!chart.dataset.curve || chart.dataset.curve === "true") {
        if (!chart.dataset.cutNull || chart.dataset.cutNull === "false") {
          pathArea.setAttribute(
            "d",
            `M ${points[0].x},${area.bottom} ${createSmoothPath(points)} L ${points.at(-1)!.x},${area.bottom} Z`,
          );
        } else {
          const segments = createSmoothAreaSegments(
            points,
            area.bottom,
            true,
            true,
          );
          segments.forEach((seg) => {
            const pth = makePathArea();
            pth.setAttribute("d", seg);
            if (hasGradient) {
              pth.setAttribute("fill", `url(#${gradientId})`);
            } else {
              pth.setAttribute(
                "fill",
                String(getDatasetValue(chart, "areaColor", "transparent")),
              );
            }
            pathAreas.push(pth);
          });
        }
      } else {
        if (!chart.dataset.cutNull || chart.dataset.cutNull === "false") {
          pathArea.setAttribute(
            "d",
            `M ${points[0].x},${area.bottom} ${createStraightPath(points)} L ${points.at(-1)!.x},${area.bottom} Z`,
          );
        } else {
          const segments = createIndividualAreaWithCuts(
            points,
            area.bottom,
          ).split(";");
          segments.forEach((seg) => {
            const pth = makePathArea();
            pth.setAttribute("d", `M ${seg} Z`);
            if (hasGradient) {
              pth.setAttribute("fill", `url(#${gradientId})`);
            } else {
              pth.setAttribute(
                "fill",
                String(getDatasetValue(chart, "areaColor", "transparent")),
              );
            }
            pathAreas.push(pth);
          });
        }
      }
    }

    if (hasGradient) {
      pathArea.setAttribute("fill", `url(#${gradientId})`);
    } else {
      pathArea.setAttribute(
        "fill",
        String(getDatasetValue(chart, "areaColor", "transparent")),
      );
    }

    if (allPoints.length > 1) {
      if (pathAreas.length) {
        pathAreas.forEach((p) => {
          svg.appendChild(p);
        });
      } else {
        svg.appendChild(pathArea);
      }
      svg.appendChild(path);
    }
  }

  const indicators: SVGLineElement[] = [];

  // VERTICAL INDICATOR
  allPoints.forEach((_, i) => {
    const indicator = document.createElementNS(XMLNS, "line");
    indicator.classList.add("tiny-spark-indicator");
    indicator.setAttribute("id", `indicator_${svgId}_${i}`);
    indicator.setAttribute(
      "x1",
      String(area.left + (allPoints.length === 1 ? area.width / 2 : i * slot)),
    );
    indicator.setAttribute(
      "x2",
      String(area.left + (allPoints.length === 1 ? area.width / 2 : i * slot)),
    );
    indicator.setAttribute("y1", String(area.top));
    indicator.setAttribute("y2", String(area.bottom));
    indicator.setAttribute(
      "stroke",
      String(getDatasetValue(chart, "indicatorColor", "#1A1A1A")),
    );
    indicator.setAttribute(
      "stroke-width",
      String(getDatasetValue(chart, "indicatorWidth", "1")),
    );
    indicator.setAttribute("stroke-linecap", "round");
    indicator.style.pointerEvents = "none";
    indicator.style.opacity = "0";
    indicators.push(indicator);
    svg.appendChild(indicator);
  });

  let plots: SVGCircleElement[] = [];
  let bars: SVGRectElement[] = [];

  // PLOTS
  const hasPlotRadius =
    Number(String(getDatasetValue(chart, "plotRadius", 0))) > 0;
  const isInPlotViewRange =
    !String(getDatasetValue(chart, "hidePlotsAbove", "")) ||
    allPoints.length <=
      Number(String(getDatasetValue(chart, "hidePlotsAbove", 0)));
  const canShowPlots = hasPlotRadius && isInPlotViewRange;

  const plotGroup = document.createElementNS(XMLNS, "g");

  // BARS
  if (isBar) {
    if (hasGradient) {
      svg.appendChild(createBarGradients(gradientId));
    }
    allPoints.forEach(({ bar, v }, i) => {
      if (![null, undefined].includes(v)) {
        const rect = document.createElementNS(XMLNS, "rect");
        rect.classList.add("tiny-spark-datapoint-bar");
        rect.setAttribute("x", String(bar.x));
        rect.setAttribute("y", String(bar.y));
        rect.setAttribute("width", String(bar.w));
        rect.setAttribute("height", String(bar.h));
        if (hasGradient) {
          if (v >= 0) {
            rect.setAttribute("fill", `url(#pos_${gradientId})`);
          } else {
            rect.setAttribute("fill", `url(#neg_${gradientId})`);
          }
        } else {
          rect.setAttribute(
            "fill",
            String(
              getDatasetValue(
                chart,
                "plotColor",
                String(getDatasetValue(chart, "lineColor", color)),
              ),
            ),
          );
        }
        rect.style.opacity = allPoints.length === 1 ? "1" : "0";
        rect.style.transition = `opacity ${i * ((ANIMATION_DURATION * 2) / allPoints.length)}ms ease-in`;
        bars.push(rect);
        plotGroup.appendChild(rect);
      }
    });
    svg.appendChild(plotGroup);
  }

  if (hasPlotRadius && !isBar) {
    allPoints.forEach(({ x, y, v }, i) => {
      if (![null, undefined].includes(v)) {
        const circle = document.createElementNS(XMLNS, "circle");
        circle.classList.add("tiny-spark-datapoint-circle");
        circle.classList.add(`circle-${svgId}`);
        circle.setAttribute("id", `circle_${svgId}_${i}`);
        circle.setAttribute("cx", String(x || 0));
        circle.setAttribute("cy", String(y || 0));
        circle.setAttribute(
          "r",
          String(getDatasetValue(chart, "plotRadius", 3)),
        );
        circle.setAttribute(
          "fill",
          String(
            getDatasetValue(
              chart,
              "plotColor",
              String(getDatasetValue(chart, "lineColor", color)),
            ),
          ),
        );
        circle.setAttribute("stroke", backgroundColor);
        circle.style.opacity = allPoints.length === 1 ? "1" : "0";
        circle.style.transition = `opacity ${i * ((ANIMATION_DURATION * 2) / allPoints.length)}ms ease-in`;
        circle.style.pointerEvents = "none";
        plots[i] = circle;
        if (canShowPlots) {
          plotGroup.appendChild(circle);
        }
      }
    });
    svg.appendChild(plotGroup);
  }

  // LAST VALUE
  let lastValueText: SVGTextElement | null = null;
  const lastPoint = allPoints.at(-1);

  if (showLastValue && lastPoint?.v != null) {
    const fontSize = Number(getDatasetValue(chart, "lastValueFontSize", 12));

    lastValueText = document.createElementNS(XMLNS, "text");
    lastValueText.classList.add("tiny-spark-last-value");
    lastValueText.setAttribute("id", lastValueId);

    if (isBar) {
      lastValueText.setAttribute(
        "x",
        String(
          lastPoint.x + Number(getDatasetValue(chart, "lineThickness", 2)),
        ),
      );
      lastValueText.setAttribute(
        "y",
        lastPoint.isPositive
          ? String(lastPoint.y - fontSize / 3)
          : String(lastPoint.bar.y + lastPoint.bar.h + fontSize),
      );
      lastValueText.setAttribute("text-anchor", "middle");
    } else {
      lastValueText.setAttribute(
        "x",
        String(
          lastPoint.x + 6 + Number(getDatasetValue(chart, "lineThickness", 2)),
        ),
      );
      lastValueText.setAttribute("y", String(lastPoint.y + fontSize / 3));
      lastValueText.setAttribute("text-anchor", "start");
    }

    lastValueText.setAttribute("font-size", String(fontSize) + "px");
    lastValueText.setAttribute(
      "fill",
      String(
        getDatasetValue(
          chart,
          "lastValueColor",
          String(getDatasetValue(chart, "indicatorColor", "#1A1A1A")),
        ),
      ),
    );
    lastValueText.textContent = localeNum(chart, lastPoint.v);
    lastValueText.style.opacity = allPoints.length === 1 ? "1" : "0";
    svg.appendChild(lastValueText);
  }

  const trapGroup = document.createElementNS(XMLNS, "g");

  const eventOptions = { signal: events.signal };
  const plotRadius = Number(getDatasetValue(chart, "plotRadius", 3));
  const chartWindow = chart.ownerDocument.defaultView;
  const scrollTargets: EventTarget[] = [];
  if (chartWindow) scrollTargets.push(chartWindow);
  const root = chart.getRootNode();
  if (root.nodeType === 11) scrollTargets.push(root);

  let tooltipAnchor: SVGRectElement | undefined;
  let anchorObserver: IntersectionObserver | undefined;
  let visibilityObserver: MutationObserver | undefined;
  let anchorIntersects = false;
  const visibilityTargets: Element[] = [];
  const visibilityTransitions = ["transitionstart", "transitionend", "transitioncancel"] as const;

  function updateTooltipVisibility() {
    const state = tooltipStates.get(chart);
    if (!view.selection || !state || !tooltipAnchor) return;
    const visible = anchorIntersects &&
      chartWindow?.getComputedStyle(tooltipAnchor).visibility === "visible";
    const visibility = visible ? "" : "hidden";
    if (state.tool.style.visibility === visibility) return;
    if (visible) repositionTooltip();
    state.tool.style.visibility = visibility;
    state.tool.setAttribute("aria-hidden", String(!visible));
  }

  function onVisibilityTransition(event: Event) {
    if (
      event.target === event.currentTarget &&
      "propertyName" in event &&
      event.propertyName === "visibility"
    ) {
      updateTooltipVisibility();
    }
  }

  function stopObservingTooltipAnchor() {
    anchorObserver?.disconnect();
    visibilityObserver?.disconnect();
    for (const element of visibilityTargets) {
      for (const type of visibilityTransitions) {
        element.removeEventListener(type, onVisibilityTransition);
      }
    }
    visibilityTargets.length = 0;
    anchorObserver = undefined;
    anchorIntersects = false;
  }

  function observeTooltipAnchor(point: POINT) {
    if (!tooltipAnchor) {
      tooltipAnchor = document.createElementNS(XMLNS, "rect");
      tooltipAnchor.setAttribute("width", "1");
      tooltipAnchor.setAttribute("height", "1");
      tooltipAnchor.setAttribute("fill", "transparent");
      tooltipAnchor.setAttribute("pointer-events", "none");
      tooltipAnchor.setAttribute("aria-hidden", "true");
      svg.appendChild(tooltipAnchor);
      visibilityObserver = new MutationObserver(updateTooltipVisibility);
      events.signal.addEventListener("abort", stopObservingTooltipAnchor, { once: true });
    }
    tooltipAnchor.setAttribute("x", String(point.x - 0.5));
    tooltipAnchor.setAttribute("y", String(tooltipAnchorY(chart, point) - 0.5));

    if (!anchorObserver) {
      const observer = new IntersectionObserver(([entry]) => {
        if (anchorObserver !== observer) return;
        anchorIntersects = entry.isIntersecting;
        updateTooltipVisibility();
      });
      anchorObserver = observer;
      observer.observe(tooltipAnchor);
      // CSS visibility can change without changing the anchor's geometry.
      for (let element: Element | null = svg; element;) {
        visibilityObserver?.observe(element, { attributeFilter: ["class", "style", "hidden"] });
        visibilityTargets.push(element);
        for (const type of visibilityTransitions) {
          element.addEventListener(type, onVisibilityTransition);
        }
        const parentNode: ParentNode | null = element.parentNode;
        const host: Element | null =
          parentNode && "host" in parentNode ? (parentNode as ShadowRoot).host : null;
        element = element.assignedSlot ?? element.parentElement ?? host;
      }
    }
  }

  function repositionTooltip() {
    const selection = view.selection;
    const state = tooltipStates.get(chart);
    if (!selection || !state) return;
    const { x, y } = tooltipPosition(svg, chart, allPoints[selection.index], state);
    // Move both positions to preserve any interpolation already in progress.
    state.displayX += x - state.targetX;
    state.displayY += y - state.targetY;
    state.targetX = x;
    state.targetY = y;
    positionTooltip(state);
  }

  function clearSelection() {
    const selection = view.selection;
    if (!selection) return;
    const index = selection.index;
    if (canShowPlots) {
      plots[index]?.setAttribute("r", String(plotRadius));
    } else {
      plots[index]?.remove();
    }
    indicators[index].style.opacity = "0";
    if (lastValueText) lastValueText.style.opacity = "1";
    view.selection = undefined;
    scrollTargets.forEach(target => target.removeEventListener("scroll", repositionTooltip, true));
    chartWindow?.removeEventListener("resize", updateTooltipVisibility);
  }

  function dismissTooltip(resetPosition = true) {
    const selection = view.selection;
    chart.ownerDocument.removeEventListener(
      "pointerdown",
      dismissOutside,
      true,
    );
    clearSelection();
    stopObservingTooltipAnchor();
    const state = tooltipStates.get(chart);
    if (state) {
      hideTooltip(state);
      if (resetPosition) state.hasSnapped = false;
    }
    if (selection && selection.source !== "sync") {
      syncIndex();
      emitSyncIndex(chart, null);
    }
  }

  function dismissOutside(event: PointerEvent) {
    if (!event.composedPath().includes(chart)) dismissTooltip();
  }

  function syncIndex() {
    const selection = view.selection;
    if (selection && selection.source !== "sync") return;

    const attribute = chart.dataset.syncIndex;
    if (view.dismissedSyncIndex !== undefined && view.dismissedSyncIndex === attribute) return;
    view.dismissedSyncIndex = undefined;
    const index = Number(attribute?.trim() || NaN);
    if (!Number.isInteger(index) || index < 0 || index >= allPoints.length) {
      if (selection) dismissTooltip();
    } else if (selection?.index !== index) {
      selectPoint(index, "sync");
    }
  }

  function selectPoint(
    index: number,
    source: NonNullable<typeof view.selection>["source"],
    notify = true,
  ) {
    const previousSelection = view.selection;
    clearSelection();
    view.selection = { index, source };
    if (source !== "sync") view.dismissedSyncIndex = undefined;
    const point = allPoints[index];
    showTooltip(svg, chart, point, svgId, source !== "sync");
    observeTooltipAnchor(point);
    scrollTargets.forEach(target => target.addEventListener("scroll", repositionTooltip, {
      ...eventOptions, capture: true, passive: true,
    }));
    chartWindow?.addEventListener("resize", updateTooltipVisibility, eventOptions);
    const plot = plots[index];
    if (canShowPlots) {
      plot?.setAttribute("r", String(plotRadius * 1.5));
    } else if (plot) {
      svg.appendChild(plot);
    }
    indicators[index].style.opacity = "1";
    if (lastValueText) {
      lastValueText.style.opacity = index === allPoints.length - 1 ? "0" : "1";
    }
    if (source === "touch") {
      chart.ownerDocument.addEventListener("pointerdown", dismissOutside, {
        ...eventOptions,
        capture: true,
      });
    }
    if (
      notify &&
      source !== "sync" &&
      (previousSelection?.source === "sync" ||
        previousSelection?.index !== index)
    ) {
      emitSyncIndex(chart, index);
    }
  }

  allPoints.forEach((_, i) => {
    const trap = document.createElementNS(XMLNS, "rect");
    trap.classList.add("tiny-spark-tooltip-trap");
    trap.setAttribute(
      "x",
      `${allPoints.length === 1 ? 0 : area.left + i * slot - slot / 2}`,
    );
    trap.setAttribute("y", `${area.top}`);
    trap.setAttribute("height", `${area.height}`);
    trap.setAttribute("width", `${slot}`);
    trap.setAttribute("fill", "transparent");
    trap.setAttribute("aria-describedby", `tooltip_${svgId}`);
    trap.addEventListener(
      "pointerenter",
      (event) => {
        if (
          event.pointerType !== "touch" &&
          view.selection?.source !== "touch"
        ) {
          selectPoint(i, "mouse");
        }
      },
      eventOptions,
    );
    trap.addEventListener(
      "pointerleave",
      (event) => {
        if (
          event.relatedTarget instanceof Node &&
          trapGroup.contains(event.relatedTarget)
        )
          return;
        if (view.selection?.source === "mouse" && view.selection.index === i) {
          dismissTooltip(false);
        }
      },
      eventOptions,
    );
    trap.addEventListener(
      "pointerup",
      (event) => {
        if (event.pointerType !== "touch") return;
        if (view.selection?.source === "touch" && view.selection.index === i) {
          dismissTooltip();
        } else {
          selectPoint(i, "touch");
          chart.focus({ preventScroll: true });
        }
      },
      eventOptions,
    );
    trapGroup.appendChild(trap);
  });

  svg.appendChild(trapGroup);

  if (allPoints.length) {
    if (!chart.hasAttribute("tabindex")) {
      chart.tabIndex = 0;
      view.ownsTabIndex = true;
    }
    chart.addEventListener(
      "focus",
      () => {
        if (!view.selection || view.selection.source === "sync") {
          selectPoint(view.selection?.index ?? 0, "keyboard");
        }
      },
      eventOptions,
    );
    chart.addEventListener(
      "blur",
      () => {
        if (view.selection?.source !== "sync") dismissTooltip();
      },
      eventOptions,
    );
    chart.addEventListener(
      "pointerleave",
      () => {
        if (!view.selection || view.selection.source === "mouse")
          dismissTooltip();
      },
      eventOptions,
    );
    chart.addEventListener(
      "keydown",
      (event) => {
        const index = view.selection?.index;
        const last = allPoints.length - 1;
        let next: number;
        switch (event.key) {
          case "ArrowLeft":
            next = Math.max(0, (index ?? last + 1) - 1);
            break;
          case "ArrowRight":
            next = Math.min(last, (index ?? -1) + 1);
            break;
          case "Home":
            next = 0;
            break;
          case "End":
            next = last;
            break;
          case "Escape":
            if (!view.selection) return;
            view.dismissedSyncIndex = chart.dataset.syncIndex;
            dismissTooltip();
            event.preventDefault();
            return;
          default:
            return;
        }
        event.preventDefault();
        selectPoint(next, "keyboard");
      },
      eventOptions,
    );
  } else if (view.ownsTabIndex && chart.getAttribute("tabindex") === "0") {
    chart.removeAttribute("tabindex");
    view.ownsTabIndex = false;
  }

  if (animation === "true" && animate) {
    nextTick().then(() => {
      if (events.signal.aborted) return;
      plots.forEach((circle) => {
        circle.style.opacity = "1";
      });
      bars.forEach((bar) => {
        bar.style.opacity = "1";
      });
      const revealLastValue = () => {
        if (lastValueText && view.selection?.index !== allPoints.length - 1) {
          lastValueText.style.opacity = "1";
        }
      };
      if (path.parentNode === svg && path.getAttribute("d")?.trim() !== "M") {
        animatePath(path, ANIMATION_DURATION, revealLastValue);
      } else {
        revealLastValue();
      }
      if (pathArea.parentNode === svg) {
        animateAreaProgressively(svg as unknown as TINY_SPARK, pathArea);
      }
    });
  } else {
    plots.forEach((circle) => {
      circle.style.opacity = "1";
    });
    bars.forEach((bar) => {
      bar.style.opacity = "1";
    });
    if (lastValueText) {
      lastValueText.style.opacity = "1";
    }
  }

  chart.appendChild(svg);
  const selection = previous?.selection;
  if (selection && selection.source !== "sync") {
    if (selection.index < allPoints.length) {
      selectPoint(selection.index, selection.source, false);
    } else if (selection.source === "keyboard" && allPoints.length) {
      selectPoint(allPoints.length - 1, "keyboard");
    } else {
      emitSyncIndex(chart, null);
    }
  }
  syncIndex();
}
