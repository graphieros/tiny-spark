import './style.css'
// @ts-ignore
import { render } from "../dist/tiny-spark.es";

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
    arr.push(Math.random());
  }
  return arr.toString();
}



document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div style="width:100%">
<div 
  class="tiny-spark"
  data-id="test"
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
  data-set="[${makeDs(200)}]"
  data-dates='["jan", "feb", "mar", "apr", "may", "jun"]'
  data-show-last-value="true"
  data-last-value-font-size="12"
  data-last-value-color="red"
>
</div>
</div>
<div style="width:100%">
<div 
  class="tiny-spark"
  data-curve="true"
  data-animation="true"
  data-line-color="#4A4A4A"
  data-area-color="#1A1A1A10"
  data-line-thickness="3"
  data-responsive
  data-plot-color="#2A2A2A"
  data-plot-radius="3"
  data-number-locale="en-US"
  data-number-rounding="2"
  data-indicator-color="#1A1A1A"
  data-indicator-width="1"
  data-set="[${makeDs(200)}]"
  data-dates='["jan", "feb", "mar", "apr", "may", "jun"]'
>
</div>
</div>
`
import './index'