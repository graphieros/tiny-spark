import { LINATION, POINT, XMLNS } from "../types";
import { createUid } from "./lib";

export function SVG(chart: LINATION) {
    const { width, height } = chart.parentElement!.getBoundingClientRect();
    const fallback = { width: 300, height: 100 };
    const viewBox = `0 0 ${width || fallback.width} ${height || fallback.height}`;

    const svg = document.createElementNS(XMLNS, 'svg');
    const id = createUid();
    svg.id = id;
    svg.setAttribute('viewBox', viewBox);
    svg.style.width = '100%';
    svg.style.height = '100%';

    return {
        svg,
        svgId: id,
        width: width || fallback.width,
        height: height || fallback.height
    }
}

export function checkNaN(val: number, fallback = 0) {
    if (isNaN(val)) {
        return fallback
    } else {
        return val
    }
}

export function createSmoothPath(points: POINT[]) {
    if (points.length < 2) return '0,0';

    const n = points.length - 1;
    const path = [`${checkNaN(points[0].x)},${checkNaN(points[0].y)}`];
    const dx = [], dy = [], slopes = [], tangents = [];

    for (let i = 0; i < n; i += 1) {
        dx[i] = points[i + 1].x - points[i].x;
        dy[i] = points[i + 1].y - points[i].y;
        slopes[i] = dy[i] / dx[i];
    }

    tangents[0] = slopes[0];
    tangents[n] = slopes[n - 1];

    for (let i = 1; i < n; i += 1) {
        if (slopes[i - 1] * slopes[i] <= 0) {
            tangents[i] = 0;
        } else {
            const harmonicMean = (2 * slopes[i - 1] * slopes[i]) / (slopes[i - 1] + slopes[i]);
            tangents[i] = harmonicMean;
        }
    }

    for (let i = 0; i < n; i += 1) {
        const x1 = points[i].x;
        const y1 = points[i].y;
        const x2 = points[i + 1].x;
        const y2 = points[i + 1].y;
        const m1 = tangents[i];
        const m2 = tangents[i + 1];
        const controlX1 = x1 + (x2 - x1) / 3;
        const controlY1 = y1 + m1 * (x2 - x1) / 3;
        const controlX2 = x2 - (x2 - x1) / 3;
        const controlY2 = y2 - m2 * (x2 - x1) / 3;

        path.push(`C ${checkNaN(controlX1)},${checkNaN(controlY1)} ${checkNaN(controlX2)},${checkNaN(controlY2)} ${checkNaN(x2)},${checkNaN(y2)}`);
    }

    return path.join(' ');
}