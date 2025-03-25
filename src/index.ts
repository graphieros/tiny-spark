import { CHART_TYPE, LINATION } from "../types"
import { getCharts, observe, isChartOfType, createLineChart, hasDataset } from "./lib"

(function MAIN(){

    document.addEventListener('DOMContentLoaded', () => {
        const charts = getCharts()

        if (!charts.length) return

        Array.from(charts).forEach((chart) => {
            RENDER(chart as LINATION)
            observe(chart as LINATION, () => RENDER(chart as LINATION))
        })
    })

}())

function RENDER(chart: LINATION) {
    isChartOfType(chart, CHART_TYPE.LINE) && hasDataset(chart, 'set') && createLineChart(chart);
}