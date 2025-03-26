import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div style="width:100%">
<div 
  class="chart" 
  data-line
  data-line-color="#4A4A4A"
  data-area-color="#6376DD90"
  data-line-thickness="4"
  data-responsive
  data-plot-color="#2A2A2A"
  data-plot-radius="3"
  data-number-locale="en-US"
  data-number-rounding="2"
  data-number-show-on="hover"
  data-set="[-1, 3, null, 5, 4, 12]"
  data-dates='["jan", "feb", "mar", "apr", "may", "jun"]'
>
</div>
</div>
`
import './index'