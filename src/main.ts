import "./style.css";
import { render } from "./index";

let plotRadius = 3;

setTimeout(() => {
  plotRadius = 5;
  document
    .querySelector('[data-id="test"]')
    ?.setAttribute("data-plot-radius", plotRadius + "");
}, 2000);

function makeDs(n: number) {
  let arr = [];
  for (let i = 0; i < n; i += 1) {
    if (i > 10 && i < 20) {
      arr.push(null);
    } else {
      arr.push(i % 2 === 0 ? Math.random() * 10 : Math.random() * -10);
    }
  }
  return arr.toString();
}

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<div style="width:100%">
<div
  class="tiny-spark"
  role="group"
  aria-label="Revenue change in US dollars"
  data-id="test"
  data-type="line"
  data-y-min="-10"
  data-y-max="10"
  data-curve="true"
  data-cut-null="true"
  data-animation="true"
  data-gradient-from="#CCCCCC"
  data-gradient-to="#CCCCCC00"
  data-gradient-from-opacity="1"
  data-gradient-to-opacity="1"
  data-line-color="#4A4A4A"
  data-area-color="#1A1A1A10"
  data-line-thickness="2"
  data-hide-plots-above="100"
  data-responsive
  data-plot-color="#2A2A2A"
  data-plot-radius="${plotRadius}"
  data-number-locale="en-US"
  data-number-rounding="2"
  data-number-style="currency"
  data-number-currency="USD"
  data-indicator-color="#1A1A1A"
  data-indicator-width="1"
  data-set="[${makeDs(100)}]"
  data-dates='["jan", "feb", "mar", "apr", "may", "jun"]'
  data-show-last-value="true"
  data-last-value-font-size="12"
  data-last-value-color="red"
  data-tooltip-smoothing="1"
  data-temperature-colors="['#00FF00', '#FF0000']"
></div>
</div>
<div style="width:100%">
<div
  class="tiny-spark"
  role="group"
  aria-label="Temperature change in degrees Celsius"
  data-gradient-from="#FF0000"
  data-gradient-to="#FFAA00"
  data-gradient-from-opacity="1"
  data-gradient-to-opacity="1"
  data-type="bar"
  data-y-min="-10"
  data-y-max="10"
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
  data-number-style="unit"
  data-number-unit="celsius"
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
`;
render(app);
