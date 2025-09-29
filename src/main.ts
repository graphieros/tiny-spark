import './style.css'
// @ts-ignore
import { render } from '../src/index';

setTimeout(render);

let plotRadius = 3;

setTimeout(() => {
  plotRadius = 5;
  document.querySelector('[data-id="test"]')?.setAttribute('data-plot-radius', plotRadius + '')
}, 2000)

// setTimeout(render, 4000)

function makeDs(n: number) {
  let arr = [];
  for(let i = 0; i < n; i += 1) {
    if (i > 10 && i < 20) {
      arr.push(null)
    } else {
      arr.push(i % 2 === 0 ? Math.random() * 10 : Math.random() * -10);
    }
  }
  return arr.toString();
}

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div style="width:100%">
<div
  class="tiny-spark"
  data-type="line"
  data-curve="true"
  data-cut-null="true"
  data-animation="true"
  data-line-color="#4A4A4A"
  data-area-color="#1A1A1A10"
  data-line-thickness="1"
  data-hide-plots-above="100"
  data-responsive
  data-plot-color="#2A2A2A"
  data-plot-radius="${plotRadius}"
  data-number-locale="en-US"
  data-number-rounding="2"
  data-indicator-color="#1A1A1A"
  data-indicator-width="1"
  data-set="[${makeDs(100)}]"
  data-dates='["jan", "feb", "mar", "apr", "may", "jun"]'
  data-show-last-value="true"
  data-last-value-font-size="12"
  data-last-value-color="red"
  data-tooltip-smoothing="1"
></div>
</div>
<div style="width:100%">
<div
  class="tiny-spark"
  data-type="bar"
  data-curve="true"
  data-animation="true"
  data-line-color="#4A4A4A"
  data-area-color="#1A1A1A10"
  data-line-thickness="3"
  data-hide-plots-above="100"
  data-responsive
  data-plot-color="#2A2A2A"
  data-plot-radius="${plotRadius}"
  data-number-locale="en-US"
  data-number-rounding="2"
  data-indicator-color="#1A1A1A"
  data-indicator-width="1"
  data-set="[${makeDs(100)}]"
  data-dates='["jan", "feb", "mar", "apr", "may", "jun"]'
  data-show-last-value="true"
  data-last-value-font-size="12"
  data-last-value-color="red"
  data-tooltip-smoothing="0.5"
></div>
</div>
`
import './index'