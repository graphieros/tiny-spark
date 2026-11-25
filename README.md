# tiny-spark

[![npm](https://img.shields.io/npm/v/tiny-spark)](https://github.com/graphieros/tiny-spark)
[![GitHub issues](https://img.shields.io/github/issues/graphieros/tiny-spark)](https://github.com/graphieros/tiny-spark/issues)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/graphieros/tiny-spark?tab=MIT-1-ov-file#readme)
[![npm](https://img.shields.io/npm/dt/tiny-spark)](https://github.com/graphieros/tiny-spark)

An elegant, reactive and responsive sparkline chart solution without dependency.

<img width="500" alt="image" src="https://github.com/user-attachments/assets/d312a234-8e09-44a2-89fd-5ae85a6cdbec" />

[DEMO](https://tiny-spark.graphieros.com/)

## Installation

```
npm i tiny-spark
```

## Usage

Import the file in your project:

```js
import { render } from "tiny-spark";

// If you need to fetch data, call render afterwards
getData().then(render);

// If you hardcode your dataset, you can call render immediately
```

Calling render again will re-trigger the animation (if data-animation is set to "true").

Just set up a div with a "tiny-spark" class, with a few data attributes to configure the chart.
Note that providing data-id is optional, a unique id will be generated if you don't.

Render a line chart:

```html
<div style="width: 100%">
  <div
    class="tiny-spark"
    data-id="myId"
    data-type="line"
    data-curve="true"
    data-cut-null="false"
    data-set="[1, 2, 3, 5, 8, 13]"
    data-dates='["01-2026", "02-2026", "03-2026", "04-2026", "05-2026", "06-2026"]'
    data-responsive
    data-animation="true"
    data-line-color="#4A4A4A"
    data-area-color="#1A1A1A10"
    data-gradient-from="#FF0000"
    data-gradient-to="#FFAA00"
    data-temperature-colors="['#00FF00', '#FF0000']"
    data-gradient-from-opacity="1"
    data-gradient-to-opacity="1"
    data-line-thickness="4"
    data-plot-color="#2A2A2A"
    data-plot-radius="2"
    data-hide-plots-above="100"
    data-number-locale="en-US"
    data-number-rounding="2"
    data-indicator-color="#1A1A1A"
    data-indicator-width="1"
    data-show-last-value="true"
    data-last-value-font-size="12"
    data-last-value-color="#1A1A1A"
    data-tooltip-smoothing="1"
  ></div>
</div>
```

Render a bar chart:

```html
<div style="width: 100%">
  <div
    class="tiny-spark"
    data-id="myId"
    data-type="bar"
    data-set="[1, 2, 3, 5, 8, 13]"
    data-dates='["01-2026", "02-2026", "03-2026", "04-2026", "05-2026", "06-2026"]'
    data-responsive
    data-animation="true"
    data-line-thickness="4"
    data-gradient-from="#FF0000"
    data-gradient-to="#FFAA00"
    data-gradient-from-opacity="1"
    data-gradient-to-opacity="1"
    data-plot-color="#2A2A2A"
    data-number-locale="en-US"
    data-number-rounding="2"
    data-indicator-width="0"
    data-show-last-value="true"
    data-last-value-font-size="12"
    data-last-value-color="#1A1A1A"
    data-tooltip-smoothing="1"
  ></div>
</div>
```

### Keyboard and touch

Each chart with data adds one tab stop unless you provide a `tabindex`. Use the left and right arrow keys to inspect points, Home and End to jump to the first and last points, and Escape to hide the tooltip. On touch screens, tap a point to show its tooltip. Tap it again or tap outside the chart to dismiss it. Use `role="group"` and a descriptive `aria-label` to distinguish each chart from nearby charts.

### Synchronizing charts

Set `data-sync-index` to a zero-based point index to show its indicator and tooltip. Remove the attribute or set it to `"null"` or `"undefined"` to clear the synchronized selection. Out-of-range and non-integer values also clear it. Local interaction takes priority while a chart is being inspected.

`onSyncIndex(chart, callback)` reports local hover, keyboard, and touch selections. It reports `null` on dismissal and returns an unsubscribe function. Attribute updates do not emit callbacks, so you can wire charts in both directions.

`syncTo(chart)` creates a callback that updates the target chart's `data-sync-index`. Pass it to `onSyncIndex` or call it directly with an index. Pass `null` or `undefined` to clear the selection. The callback does nothing if the target is missing or isn't a chart.

```js
import { onSyncIndex, render, syncTo } from "tiny-spark";

render();
const first = document.querySelector("#first-chart");
const second = document.querySelector("#second-chart");

const stopFirst = onSyncIndex(first, syncTo(second));
const stopSecond = onSyncIndex(second, syncTo(first));
```

### Comparing charts

Set the same `data-y-min` and `data-y-max` on charts you want to compare. For example, `data-y-min="0" data-y-max="200"` uses a fixed vertical scale from 0 to 200 for both line and bar charts. You can supply just one bound. The other then includes zero and the data, as appropriate. Values outside the range are drawn at the nearest bound and keep their original values in tooltips. An invalid range falls back to automatic scaling.

### Formatting values

The tooltip and last-value label both use `data-number-locale` and `data-number-rounding`. Add a style to display currency, percentages, or units.

| Display    | Attributes                                                                         | Example                            |
| ---------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| Currency   | `data-number-style="currency" data-number-currency="USD" data-number-rounding="2"` | `12.5` becomes `$12.50` in `en-US` |
| Percentage | `data-number-style="percent"`                                                      | `0.25` becomes `25%`               |
| Unit       | `data-number-style="unit" data-number-unit="kilometer"`                            | `12` becomes `12 km` in `en-US`    |

### Rendering within a container

Pass a chart or its container to initialize just that part of the page. Call `destroy` before unmounting a component to disconnect its observers, remove generated SVG and tooltip elements, and release interaction handlers. Calling either function with no argument targets the current document.

```js
import { destroy, render } from "tiny-spark";

const dashboard = document.querySelector("#dashboard");
if (dashboard) {
  render(dashboard);
  // In the component's unmount hook
  // destroy(dashboard);
}
```

## Styling

tiny-spark is headless.

Target the following css classes to customize elements:

```css
/** the chart container (div element) */
.tiny-spark {
}

/** the tooltip (div element) */
.tiny-spark-tooltip {
  /** just display:none if you don't need it */
}

/** the indicator (svg line element) */
.tiny-spark-indicator {
  /** for example: customize stroke-dasharray */
}

/** the plots (svg circle element) */
.tiny-spark-datapoint-circle {
}

/** the chart line (svg path element) */
.tiny-spark-line-path {
}

/** the chart area (svg path element) */
.tiny-spark-line-area {
}
```
