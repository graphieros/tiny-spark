import { CHART, CHART_TYPE, DATA, LINATION, POINT, XMLNS } from "../types"
import { createSmoothPath, SVG } from "./svg";

export function getCharts() {
  const charts = document.querySelectorAll(`[${CHART.BAR}], [${CHART.LINE}]`);
  return charts
}

export function isChartOfType(element: LINATION, type: CHART_TYPE) {
  const attrs = Object.keys(element.dataset)
  return attrs.includes(type)
}

export function hasDataset(element: LINATION, name: string) {
  const attrs = Object.keys(element.dataset)
  return attrs.includes(name)
}

export function getDatasetValue(element: LINATION, name: string, fallback: number | string) {
  if (!hasDataset(element, name)) return fallback;
  return element.dataset[name]
}

export function observe(element: LINATION, render: () => void) {
    const observer = new MutationObserver((mutationsList) => {
        for (const mutation of mutationsList) {
          if (
            mutation.type === 'attributes' &&
            mutation.attributeName &&
            Object.values(DATA).includes(mutation.attributeName as DATA)
          ) {
            render();
            break;
          }
        }
      });
    
      observer.observe(element, { attributes: true });
      return observer;
}

export function getElementColors(element: LINATION) {
  if (!element) return {
    color: '#1A1A1A',
    backgroundColor: '#FFFFFF'
  };
  const computedStyle = window.getComputedStyle(element);
  const color = computedStyle.getPropertyValue('color') || '#1A1A1A';
  const backgroundColor = computedStyle.getPropertyValue('background-color');
  const background = computedStyle.getPropertyValue('background');
  const bg = backgroundColor || background || '#FFFFFF';
  return { color, backgroundColor: bg };
}

export function createUid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
      .replace(/[xy]/g, function (c) {
          const r = Math.random() * 16 | 0,
              v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
          });
}

export function parseDataset(chart: LINATION) {
  const dataSetStr = chart.getAttribute('data-set');
  if (!dataSetStr) return [];
  try {
    const parsed = JSON.parse(dataSetStr);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'number' || [null, undefined].includes(item))) {
      return parsed;
    }
    console.warn('data-set is not an array of numbers.');
    return [];
  } catch (error) {
    console.error('Error parsing data-set:', error);
    return [];
  }
}

export function minMax(dataset: number[]) {
  return {
    min: Math.min(...dataset),
    max: Math.max(...dataset)
  }
}

export function localeNum(chart: LINATION, num: number) {
  const locale = String(getDatasetValue(chart, 'numberLocale', navigator.language || 'en-US'));
  const rounding = Number(String(getDatasetValue(chart, 'numberRouding', 0)));
  return num.toLocaleString(locale, {
    useGrouping: true,
    minimumFractionDigits: rounding,
    maximumFractionDigits: rounding
  });
}

export function domPlot(svg: SVGSVGElement, svgX: number, svgY: number) {
  if (!svg.createSVGPoint || !svg.getScreenCTM) {
    throw new Error("Your browser does not support SVG coordinate transformation.");
  }
  
  const screenCTM = svg.getScreenCTM();
  if (!screenCTM) {
    throw new Error("Cannot obtain the screen CTM.");
  }
  
  const point = svg.createSVGPoint();
  point.x = svgX;
  point.y = svgY;
  
  const domPoint = point.matrixTransform(screenCTM);
  
  return { x: domPoint.x, y: domPoint.y };
}

export function tooltip(svg: SVGSVGElement, point: POINT, id: string, show: boolean) {
  if (!show) {
    const t = document.getElementById(`tooltip_${id}`);
    t?.remove();
  } else {
    const { x, y } = domPlot(svg, point.x, point.y);
    const tool = document.createElement('div');
    tool.setAttribute('id', `tooltip_${id}`);
    tool.style.pointerEvents = 'none';
    tool.style.position = 'fixed';
    tool.style.top = y + 'px';
    tool.style.left = x + 'px';
    tool.innerHTML = 'test';
    document.body.appendChild(tool)
  }
}


/////////////////////////////////////////////////////

function clear(chart: LINATION) {
  chart.innerHTML = ''
}

export function createLineChart(chart: LINATION) {
  clear(chart);
  const { svg, svgId, width, height } = SVG(chart);
  const { color, backgroundColor } = getElementColors(chart)

  const padding = { T: 12, R: 12, B: 12, L: 12 };

  // DRAWING AREA
  const area = {
    left: padding.L,
    top: padding.T,
    width: width - padding.L - padding.R,
    height: height - padding.T - padding.B,
    bottom: height - padding.B,
    right: width - padding.R
  };

  const dataset = parseDataset(chart);
  const { min:MIN } = minMax(dataset);
  const positiveDataset = dataset.map(d => {
    return [null, undefined].includes(d) ? d : d + (MIN < 0 ? Math.abs(MIN) : 0)
  });
  const { max } = minMax(positiveDataset);
  const slot = area.width / (dataset.length - 1);

  // DATAPOINTS
  const allPoints = positiveDataset.map((d, i) => {
    return {
      y: ((1 - ((d || 0) / max)) * area.height) + padding.T,
      x: area.left + (slot * i),
      v: d
    }
  })

  const points = [...allPoints].filter(({v}) => ![null, undefined].includes(v));
  
  // PATH & AREA
  const path = document.createElementNS(XMLNS, 'path');
  path.classList.add('lination-line-path');
  path.setAttribute('d', `M ${createSmoothPath(points)}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', String(getDatasetValue(chart, 'lineColor', color)));
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');

  const pathArea = document.createElementNS(XMLNS, 'path');
  pathArea.classList.add('lination-line-area');
  const d = `M ${points[0].x},${area.bottom} ${createSmoothPath(points)} L ${points.at(-1)!.x},${area.bottom} Z`;
  pathArea.setAttribute('d', d);
  pathArea.setAttribute('fill', String(getDatasetValue(chart, 'areaColor', 'transparent')));
  
  if (points.length > 1) {
    svg.appendChild(pathArea);
  }

  svg.appendChild(path);

  // PLOTS
  if (Number(String(getDatasetValue(chart, 'plotRadius', 0))) > 0) {
    points.forEach(({x, y, v}) => {
      if (![null, undefined].includes(v)) {
        const circle = document.createElementNS(XMLNS, 'circle');
        circle.classList.add('lination-datapoint-circle');
        circle.setAttribute('cx', String(x));
        circle.setAttribute('cy', String(y));
        circle.setAttribute('r', String(getDatasetValue(chart, 'plotRadius', 3)));
        circle.setAttribute('fill', String(getDatasetValue(chart, 'plotColor', String(getDatasetValue(chart, 'lineColor', color)))));
        circle.setAttribute('stroke', backgroundColor);
        svg.appendChild(circle);
      }
    });
  }

  // TOOLTIP TRAPS
  allPoints.forEach((point, i) => {
    const trap = document.createElementNS(XMLNS, 'rect');
    trap.classList.add('lination-tooltip-trap');
    trap.setAttribute('x', `${area.left + i * slot - slot / 2}`);
    trap.setAttribute('y', `${area.top}`);
    trap.setAttribute('height', `${area.height}`);
    trap.setAttribute('width', `${slot}`);
    trap.setAttribute('fill', 'transparent');
    trap.addEventListener('mouseenter', () => tooltip(svg, point, svgId, true));
    trap.addEventListener('mouseout', () => tooltip(svg, point, svgId, false));
    svg.appendChild(trap);
  })

  chart.appendChild(svg);
}