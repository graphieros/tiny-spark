import './style.css'
// @ts-ignore
import { render } from "../dist/tiny-spark.es";

setTimeout(render, 0)

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
  data-set="[${makeDs(6)}]"
  data-dates='["jan", "feb", "mar", "apr", "may", "jun"]'
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
  data-set="[${makeDs(6)}]"
  data-dates='["jan", "feb", "mar", "apr", "may", "jun"]'
>
</div>
</div>
`
import './index'