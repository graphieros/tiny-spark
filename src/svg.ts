import { TINY_SPARK, POINT, XMLNS, ANIMATION_DURATION } from "../types";
import { getDatasetValue, localeNum } from "./lib";
import { version } from "../package.json";

export function SVG(chart: TINY_SPARK, lastValue: number | undefined) {
    const fallback = { width: 300, height: 100 };
    const { width, height } = chart.parentElement?.getBoundingClientRect() ?? fallback;
    
    const showLastValue = String(getDatasetValue(chart, 'showLastValue', 'false')) === 'true';
    let offsetX = 0;

    const isBar = chart.dataset.type && chart.dataset.type === 'bar';

    if (!isBar && showLastValue && lastValue != null) {
        const rounding = Number(String(getDatasetValue(chart, 'numberRounding', 0)));
        const label = chart.dataset.numberStyle ? localeNum(chart, lastValue) : lastValue.toFixed(rounding);
        offsetX = 6 + label.length * (Number(getDatasetValue(chart, 'lastValueFontSize', 12)) / 2);
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
    desc.innerHTML = `Composed with tiny-spark v${version}`;
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
        return fallback;
    } else {
        return val;
    }
}

export function createStraightPath(points: POINT[]) {
    let arr = [];
    for (let i = 0; i < points.length; i += 1) {
        arr.push(`${checkNaN(points[i].x)},${checkNaN(points[i].y)} `);
    }
    return arr.join(' ').trim();
}

function smoothCurve(points: POINT[], command: string, coordinate: (value: number) => number) {
    const last = points.length - 1;
    const slopes = [];
    const tangents = [];

    for (let i = 0; i < last; i += 1) {
        slopes[i] = (points[i + 1].y - points[i].y) / (points[i + 1].x - points[i].x);
    }

    tangents[0] = slopes[0];
    tangents[last] = slopes[last - 1];

    for (let i = 1; i < last; i += 1) {
        const previous = slopes[i - 1];
        const next = slopes[i];
        tangents[i] = previous * next <= 0 ? 0 : (2 * previous * next) / (previous + next);
    }

    let path = '';
    for (let i = 0; i < last; i += 1) {
        const { x: x1, y: y1 } = points[i];
        const { x: x2, y: y2 } = points[i + 1];
        const dx = x2 - x1;
        const controlX1 = x1 + dx / 3;
        const controlY1 = y1 + tangents[i] * dx / 3;
        const controlX2 = x2 - dx / 3;
        const controlY2 = y2 - tangents[i + 1] * dx / 3;

        path += ` ${command}${coordinate(controlX1)},${coordinate(controlY1)} ${coordinate(controlX2)},${coordinate(controlY2)} ${coordinate(x2)},${coordinate(y2)}`;
    }

    return path;
}

export function createSmoothPath(points: POINT[]) {
    if (points.length < 2) return '0,0';

    const { x, y } = points[0];
    return `${checkNaN(x)},${checkNaN(y)}${smoothCurve(points, 'C ', checkNaN)}`;
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

    return segments.map(seg => {
        const { x, y } = seg[0];
        return `${checkNaN(x)},${checkNaN(y)}${smoothCurve(seg, 'C', checkNaN)}`;
    }).join(' M');
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
        const { x, y } = seg[0];
        return `M${x},${zero} L${x},${y}${smoothCurve(seg, 'C', value => value)} L${seg.at(-1)!.x},${zero} ${close ? 'Z' : ''}`;
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
