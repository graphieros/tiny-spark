import { TINY_SPARK } from "../types";
import { getCharts, observe, createLineChart, hasDataset, createUid } from "./lib";

export function render() {
    const charts = getCharts();
    if (!charts.length) return;

    Array.from(charts).forEach((chart) => {

        const uid = createUid()

        chart.setAttribute('data-id', uid)
        const spark = chart as TINY_SPARK;
        CHECK(spark);
        spark.__renderCount = 0;
        RENDER(spark);
        observe(spark, () => RENDER(spark));

        const resizeObserver = new ResizeObserver((entries) => {
            entries.forEach(() => RENDER(spark));
        });
        if (spark.parentElement) {
            resizeObserver.observe(spark.parentElement);
        }

        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.type === 'attributes' &&
                    mutation.attributeName &&
                    mutation.attributeName.startsWith('data-')
                ) {
                    RENDER(spark);
                }
            });
        });
        mutationObserver.observe(spark, { attributes: true });
    });
}

function RENDER(chart: TINY_SPARK) {
    if (hasDataset(chart, 'set')) {
        
        createLineChart(chart, chart.__renderCount < 2);
    }
    chart.__renderCount += 1;
}

function CHECK(chart: TINY_SPARK) {
    if (!chart.dataset.set) {
        console.error(
            `Tiny-spark exception:\n\n[data-set] data attribute is missing.\n` +
            `Provide an array of numbers, for example:\n\n data-set="[1, 2, 3]"`
        );
    }
}

export function tinyFormat(arr: number[] | string[]) {
    return JSON.stringify(arr);
}