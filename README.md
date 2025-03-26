# tiny-spark

[![npm](https://img.shields.io/npm/v/tiny-spark)](https://github.com/graphieros/tiny-spark)
[![GitHub issues](https://img.shields.io/github/issues/graphieros/tiny-spark)](https://github.com/graphieros/tiny-spark/issues)
[![License](https://img.shields.io/badge/license-MIT-green)](https://github.com/graphieros/tiny-spark?tab=MIT-1-ov-file#readme)
[![npm](https://img.shields.io/npm/dt/tiny-spark)](https://github.com/graphieros/tiny-spark)

An elegant, reactive and responsive sparkline chart solution without dependency.

## Installation

```
npm i tiny-spark
```

## Usage

Just set up a div with a "tiny-spark" class, with a few data attributes to configure the chart.

```html
<div style="width: 100%">
  <div
    class="tiny-spark"
    data-curve="true"
    data-set="[1, 2, 3, 5, 8, 13]"
    data-dates='["01-2026", "02-2026", "03-2026", "04-2026", "05-2026", "06-2026"]'
    data-responsive
    data-animation="true"
    data-line-color="#4A4A4A"
    data-area-color="#1A1A1A10"
    data-line-thickness="4"
    data-plot-color="#2A2A2A"
    data-plot-radius="2"
    data-number-locale="en-US"
    data-number-rounding="2"
    data-indicator-color="#1A1A1A"
    data-indicator-width="1"
  ></div>
</div>
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
