import { TINY_SPARK } from "../types";
import {
  getCharts,
  createChart,
  destroyChart,
  hasDataset,
  createUid,
  nextTick,
  syncChartIndex,
  syncIndexEvent,
} from "./lib";

const watchedAttributes = [
  "data-animation",
  "data-area-color",
  "data-curve",
  "data-dates",
  "data-id",
  "data-indicator-color",
  "data-indicator-width",
  "data-line-color",
  "data-line-thickness",
  "data-number-locale",
  "data-number-rounding",
  "data-number-style",
  "data-number-currency",
  "data-number-unit",
  "data-number-show-on",
  "data-plot-color",
  "data-plot-radius",
  "data-set",
  "data-hide-plots-above",
  "data-show-last-value",
  "data-last-value-font-size",
  "data-last-value-color",
  "data-type",
  "data-tooltip-smoothing",
  "data-sync-index",
  "data-cut-null",
  "data-gradient-from",
  "data-gradient-to",
  "data-gradient-from-opacity",
  "data-gradient-to-opacity",
  "data-temperature-colors",
  "data-y-min",
  "data-y-max",
];

const chartObservers = new WeakMap<
  TINY_SPARK,
  {
    resize: ResizeObserver;
    mutation: MutationObserver;
    parent: HTMLElement | null;
  }
>();

/**
 * Tiny Spark - render
 * ---
 * Renders `.tiny-spark` charts from their data attributes.
 *
 * Charts update when their supported attributes change or their parent resizes.
 *
 * Call after adding charts to the DOM or loading their data. Calling again
 * restarts animations for charts with `data-animation="true"`.
 *
 * @param root - A chart, containing element, document, or document fragment.
 * Defaults to the current document.
 */
export function render(root: ParentNode | undefined): void;
/** Renders all `.tiny-spark` charts in the current document. */
export function render(): void;
export function render(root?: ParentNode) {
  // Keep callbacks such as fetchData().then(render) working with data results.
  const scope =
    root &&
    typeof root.nodeType === "number" &&
    typeof root.querySelectorAll === "function"
      ? root
      : document;
  getCharts(scope).forEach((chart) => {
    if (!chart.dataset.id) {
      const uid = createUid();
      chart.setAttribute("data-id", uid);
    }

    let existing = chartObservers.get(chart);
    if (!existing) {
      existing = {
        resize: new ResizeObserver(() => RENDER(chart)),
        mutation: new MutationObserver((records) => {
          if (
            records.some(
              ({ attributeName }) => attributeName !== "data-sync-index",
            )
          ) {
            RENDER(chart);
          }
          if (
            records.some(
              ({ attributeName }) => attributeName === "data-sync-index",
            )
          ) {
            syncChartIndex(chart, true);
          }
        }),
        parent: null,
      };
      chartObservers.set(chart, existing);
    }
    const observers = existing;
    CHECK(chart);
    chart.__renderCount = 0;
    RENDER(chart);

    if (observers.parent && observers.parent === chart.parentElement) {
      // A reused resize observer won't send another initial notification.
      chart.__renderCount = 2;
    }
    nextTick().then(() => {
      if (chartObservers.get(chart) !== observers) return;
      observers.mutation.observe(chart, { attributeFilter: watchedAttributes });
      syncChartIndex(chart);
      const parent = chart.parentElement;
      if (observers.parent !== parent) {
        observers.resize.disconnect();
        if (parent) observers.resize.observe(parent);
        observers.parent = parent;
      }
    });
  });
}

/**
 * Tiny Spark - destroy
 * ---
 * Stops observing matching charts and removes their generated SVG and tooltip.
 * Call `render` to initialize them again.
 *
 * @param root - A chart, containing element, document, or document fragment.
 * Defaults to the current document.
 */
export function destroy(root: ParentNode = document) {
  // An initialized chart can lose its class before its container is destroyed.
  [root, ...root.querySelectorAll("*")].forEach((element) => {
    const chart = element as TINY_SPARK;
    const observers = chartObservers.get(chart);
    if (!observers) return;
    observers.resize.disconnect();
    observers.mutation.disconnect();
    chartObservers.delete(chart);
    destroyChart(chart);
    delete (chart as Partial<TINY_SPARK>).__renderCount;
  });
}

function RENDER(chart: TINY_SPARK) {
  if (hasDataset(chart, "set")) {
    createChart(chart, chart.__renderCount < 2);
  }
  chart.__renderCount += 1;
}

function CHECK(chart: TINY_SPARK) {
  if (!chart.dataset.set) {
    console.error(
      `Tiny-spark exception:\n\n[data-set] data attribute is missing.\n` +
        `Provide an array of numbers, for example:\n\n data-set="[1, 2, 3]"`,
    );
  }
}

/**
 * Tiny Spark - onSyncIndex
 * ---
 * Subscribes to a chart's local selection changes. The callback receives a
 * zero-based point index or `null` when the selection is cleared.
 * Changes from `data-sync-index` do not call the callback.
 *
 * @returns A function that removes the subscription.
 */
export function onSyncIndex(
  chart: HTMLElement,
  callback: (index: number | null) => void,
): () => void {
  const listener = (event: Event) =>
    callback((event as CustomEvent<number | null>).detail);
  chart.addEventListener(syncIndexEvent, listener);
  return () => chart.removeEventListener(syncIndexEvent, listener);
}

/**
 * Tiny Spark - syncTo
 * ---
 * Creates a callback that sets the chart's synchronized point by zero-based index.
 * Pass `null` or `undefined` to clear the synchronized selection.
 * The callback does nothing when the target is missing or is not a chart.
 *
 * @example
 * const unsubscribe = onSyncIndex(source, syncTo(target));
 */
export function syncTo(chart?: Element | null): (index?: number | null) => void {
  return (index) => {
    const target = chart as HTMLElement | null | undefined;
    if (
      target?.namespaceURI !== "http://www.w3.org/1999/xhtml" ||
      typeof target.matches !== "function" ||
      !target.matches(".tiny-spark") ||
      !target.dataset
    ) return;

    if (index == null) {
      delete target.dataset.syncIndex;
    } else {
      target.dataset.syncIndex = String(index);
    }
  };
}

/**
 * Tiny Spark - tinyFormat
 * ---
 * Serializes chart values or date labels as a JSON array for a data attribute.
 *
 * @param arr - Chart values or date labels, with `null` for missing entries.
 * @returns The JSON string to pass to `setAttribute` or assign through `dataset`.
 * @example
 * chart.dataset.set = tinyFormat([1, null, 3]);
 * chart.dataset.dates = tinyFormat(["Jan", "Feb", "Mar"]);
 */
export function tinyFormat(arr: Array<number | string | null>) {
  return JSON.stringify(arr);
}
