import './style.css'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
<div>
<div 
  class="chart" 
  data-line 
  data-line-thickness="4"
  data-responsive
  data-show-plot
  data-set="[-1, 3, null, 5, 4]"
>
</div>
</div>
`
import './index'