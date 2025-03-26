import { TINY_SPARK } from "../types"
import { getCharts, observe, createLineChart, hasDataset } from "./lib"

(function MAIN() {

    window.addEventListener('load', () => {
        const charts = getCharts();
        if (!charts.length) return;

        Array.from(charts).forEach((chart) => {
            CHECK(chart as TINY_SPARK);
            (chart as TINY_SPARK).__renderCount = 0;
            RENDER(chart as TINY_SPARK);
            observe(chart as TINY_SPARK, () => RENDER(chart as TINY_SPARK));

            const spy = new ResizeObserver((entries) => {
                entries.forEach(_ => {
                    RENDER(chart as TINY_SPARK);
                });
            });

            spy.observe(chart.parentElement!);

            const mutation = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (
                        mutation.type === 'attributes' &&
                        mutation.attributeName &&
                        mutation.attributeName.startsWith('data-')
                    ) {
                        RENDER(chart as TINY_SPARK);
                    }
                });
            });
            mutation.observe(chart, { attributes: true });
        });
    });
}());

function RENDER(chart: TINY_SPARK) {
    chart.__renderCount += 1;
    hasDataset(chart, 'set') && createLineChart(chart, chart.__renderCount < 3);
}

function CHECK(chart: TINY_SPARK) {
    if (!chart.dataset.set) {
        console.error(`Tiny-spark exception:\n\n [data-set] data attribute is missing.\n Provide an array of numbers, for example:\n\n data-set="[1, 2, 3]"`)
    }
}