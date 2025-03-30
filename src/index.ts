import { ELEMENT_DATASET, TINY_SPARK } from "../types";
import { getCharts, createLineChart, hasDataset, createUid, nextTick } from "./lib";

export function render() {
    const charts = getCharts();
    if (!charts.length) return;

    (Array.from(charts) as TINY_SPARK[]).forEach(chart => {

        if(!chart.dataset.id) {
            const uid = createUid()
            chart.setAttribute('data-id', uid)
        }

        const spark = chart as TINY_SPARK;
        CHECK(spark);
        spark.__renderCount = 0;
        RENDER(spark);

        nextTick().then(() => {
            const resizeObserver = new ResizeObserver((entries) => {
                entries.forEach(() => RENDER(spark));
            });
    
            if (spark.parentElement) {
                resizeObserver.observe(spark.parentElement);
            }
    
            const mutationObserver = new MutationObserver((mutations) => {
                for(const mutation of mutations) {
                    if (
                        mutation.type === 'attributes' &&
                        mutation.attributeName &&
                        Object.values(ELEMENT_DATASET).includes(mutation.attributeName as ELEMENT_DATASET)
                    ) {
                        RENDER(spark);
                        break;
                    }
                }
            });
            mutationObserver.observe(spark, { attributes: true });
        })

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