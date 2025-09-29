import { TINY_SPARK, POINT, XMLNS, ANIMATION_DURATION, DATA_ATTRIBUTE } from "../types";
import { getDatasetValue, parseDataset } from "./lib";
import pack from "../package.json";

export function SVG(chart: TINY_SPARK) {
    const { width, height } = chart.parentElement!.getBoundingClientRect();
    const fallback = { width: 300, height: 100 };
    
    const showLastValue = String(getDatasetValue(chart, DATA_ATTRIBUTE.SHOW_LAST_VALUE, 'false')) === 'true';
    const dataset = parseDataset(chart);
    const lastValue = dataset && dataset.length ? dataset.at(-1) : null;
    let offsetX = 0;

    const isBar = chart.dataset.type && chart.dataset.type === 'bar'

    if (!isBar && showLastValue && ![null, undefined].includes(lastValue)) {
        const rounding = Number(String(getDatasetValue(chart, DATA_ATTRIBUTE.NUMBER_ROUNDING, 0)));
        offsetX = 6 + lastValue.toFixed(rounding).length * (Number(getDatasetValue(chart, DATA_ATTRIBUTE.LAST_VALUE_FONT_SIZE, 12)) / 2);
    }

    const usedWidth = (width || fallback.width) + offsetX;
    const viewBox = `0 0 ${usedWidth} ${height || fallback.height}`;

    const svg = document.createElementNS(XMLNS, 'svg');
    const id = chart.dataset.id as string
    svg.id = id;
    svg.setAttribute('viewBox', viewBox);
    svg.style.width = '100%';
    svg.style.height = '100%';

    const desc = document.createElementNS(XMLNS, 'desc');
    desc.setAttribute('aria-hidden', 'true');
    desc.innerHTML = `Composed with tiny-spark v${pack.version}`;
    svg.appendChild(desc);

    return {
        svg,
        svgId: id,
        width: width || fallback.width,
        height: height || fallback.height,
        viewBox
    }
}

export function checkNaN(val: number, fallback = 0) {
    if (isNaN(val)) {
        return fallback
    } else {
        return val
    }
}

export function createStraightPath(points: POINT[]) {
    let arr = [];
    for (let i = 0; i < points.length; i += 1) {
        arr.push(`${checkNaN(points[i].x)},${checkNaN(points[i].y)} `)
    }
    return arr.join(' ').trim()
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

export function getValidSegments(points: POINT[]) {
    const segments = [];
    let current = [];
    for (const p of points) {
        if (p.v == null || Number.isNaN(p.x) || Number.isNaN(p.y)) {
            if (current.length > 1) segments.push(current);
            current = [];
        } else {
            current.push(p);
        }
    }
    if (current.length > 1) segments.push(current);
    return segments;
}

export function createSmoothPathWithCuts(points: POINT[]) {
    const segments = getValidSegments(points);

    if (!segments.length) return '';

    let fullPath = '';
    for (const [idx, seg] of segments.entries()) {
        if (seg.length < 2) continue;
        const n = seg.length - 1;
        const dx = [], dy = [], slopes = [], tangents = [];
        for (let i = 0; i < n; i += 1) {
            dx[i] = seg[i + 1].x - seg[i].x;
            dy[i] = seg[i + 1].y - seg[i].y;
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

        fullPath += `${idx === 0 ? '' : 'M'}${checkNaN(seg[0].x)},${checkNaN(seg[0].y)} `;
        for (let i = 0; i < n; i += 1) {
            const x1 = seg[i].x;
            const y1 = seg[i].y;
            const x2 = seg[i + 1].x;
            const y2 = seg[i + 1].y;
            const m1 = tangents[i];
            const m2 = tangents[i + 1];
            const controlX1 = x1 + (x2 - x1) / 3;
            const controlY1 = y1 + m1 * (x2 - x1) / 3;
            const controlX2 = x2 - (x2 - x1) / 3;
            const controlY2 = y2 - m2 * (x2 - x1) / 3;
            fullPath += `C${checkNaN(controlX1)},${checkNaN(controlY1)} ${checkNaN(controlX2)},${checkNaN(controlY2)} ${checkNaN(x2)},${checkNaN(y2)} `;
        }
    }
    return fullPath.trim();
}

export function createStraightPathWithCuts(points: POINT[]) {
    let d = '';
    let sawFirst = false;

    const isValid = (p: POINT) =>
        p.v != null &&
        Number.isFinite(p.x) &&
        Number.isFinite(p.y);

    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (!isValid(p)) {
            continue;
        }

        const coord = `${checkNaN(p.x)},${checkNaN(p.y)}`;

        if (!sawFirst) {
            d += coord;
            sawFirst = true;
        } else {
            const prev = points[i - 1];
            const cmd = isValid(prev) ? 'L' : 'M';
            d += `${cmd}${coord}`;
        }
        d += ' ';
    }
    return d.trim();
}

export function createIndividualArea(plots: POINT[], zero: number) {
    const validPlots = plots.filter(p => !!p);
    if (!validPlots[0]) return [-10, -10, '', -10, -10].toString();
    const start = { x: validPlots[0].x, y: zero };
    const end = { x: validPlots.at(-1)?.x, y: zero };
    const path: string[] = [];
    validPlots.forEach(plot => {
        path.push(`${plot.x},${plot.y} `);
    });
    return [start.x, start.y, ...path, end.x, end.y].toString();
}

export function getAreaSegments(points: POINT[]) {
    const segments = [];
    let current = [];
    for (const p of points) {
        if (!p || p.v == null || Number.isNaN(p.x) || Number.isNaN(p.y)) {
            if (current.length) segments.push(current);
            current = [];
        } else {
            current.push(p);
        }
    }
    if (current.length) segments.push(current);
    return segments;
}

export function createIndividualAreaWithCuts(plots: POINT[], zero: number) {
    if (!plots[0]) return [-10, -10, '', -10, -10].toString();

    const segments = getAreaSegments(plots);
    if (!segments.length) return '';
    return segments.map(seg => {
        const start = { x: seg[0].x, y: zero };
        const end = { x: seg.at(-1)?.x, y: zero };
        const path: string[] = [];
        seg.forEach(plot => {
            path.push(`${plot.x},${plot.y} `);
        });
        return [start.x, start.y, ...path, end.x, end.y].toString();
    }).join(';');
}

export function createSmoothAreaSegments(points: POINT[], zero: number, cut = false, close = true) {
    function getSegments(points: POINT[]) {
        const segs = [];
        let curr = [];
        for (const p of points) {
            if (!p || p.v == null || Number.isNaN(p.x) || Number.isNaN(p.y)) {
                if (curr.length > 1) segs.push(curr);
                curr = [];
            } else {
                curr.push(p);
            }
        }
        if (curr.length > 1) segs.push(curr);
        return segs;
    }
    const segments = cut ? getSegments(points) : [points];
    return segments.map(seg => {
        if (seg.length < 2) return '';
        const n = seg.length - 1;
        const dx = [], dy = [], slopes = [], tangents = [];
        for (let i = 0; i < n; i += 1) {
            dx[i] = seg[i + 1].x - seg[i].x;
            dy[i] = seg[i + 1].y - seg[i].y;
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
        let d = `M${seg[0].x},${zero}`;
        d += ` L${seg[0].x},${seg[0].y}`;
        for (let i = 0; i < n; i += 1) {
            const x1 = seg[i].x;
            const y1 = seg[i].y;
            const x2 = seg[i + 1].x;
            const y2 = seg[i + 1].y;
            const m1 = tangents[i];
            const m2 = tangents[i + 1];
            const controlX1 = x1 + (x2 - x1) / 3;
            const controlY1 = y1 + m1 * (x2 - x1) / 3;
            const controlX2 = x2 - (x2 - x1) / 3;
            const controlY2 = y2 - m2 * (x2 - x1) / 3;
            d += ` C${controlX1},${controlY1} ${controlX2},${controlY2} ${x2},${y2}`;
        }
        d += ` L${seg[n].x},${zero} ${close ? 'Z' : ''}`;
        return d;
    }).filter(Boolean);
}

export function animatePath(path: SVGPathElement, duration = ANIMATION_DURATION, callback?: () => void) {
    path.style.opacity = '1';
    const totalLength = path.getTotalLength();
    path.style.strokeDasharray = String(totalLength);
    path.style.strokeDashoffset = String(totalLength);
    path.getBoundingClientRect();
    path.style.transition = `stroke-dashoffset ${duration}ms ease-in-out`;
    path.style.strokeDashoffset = '0';
    path.addEventListener('transitionend', function handler() {
        path.style.transition = '';
        path.removeEventListener('transitionend', handler);
        callback && callback();
    });
}

export function animateAreaProgressively(svg: TINY_SPARK, areaElement: SVGPathElement, duration = ANIMATION_DURATION) {
    areaElement.style.opacity = '1';
    const bbox = areaElement.getBBox();
    const fullWidth = bbox.width;
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    const clipId = "clip-" + Math.random().toString(36).substr(2, 9);
    clipPath.setAttribute("id", clipId);

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", bbox.x.toString());
    rect.setAttribute("y", bbox.y.toString());
    rect.setAttribute("width", "0");
    rect.setAttribute("height", bbox.height.toString());
    clipPath.appendChild(rect);

    let defs = svg.querySelector("defs");
    if (!defs) {
        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        svg.insertBefore(defs, svg.firstChild);
    }
    defs.appendChild(clipPath);
    areaElement.setAttribute("clip-path", `url(#${clipId})`);
    rect.style.transition = `width ${duration}ms ease-out`;
    rect.getBoundingClientRect();
    rect.setAttribute("width", fullWidth.toString());

    rect.addEventListener("transitionend", function handler() {
        areaElement.removeAttribute("clip-path");
        clipPath.parentNode && clipPath.parentNode.removeChild(clipPath);
        rect.removeEventListener("transitionend", handler);
    });
}