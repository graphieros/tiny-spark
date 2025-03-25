import { CHART, CHART_TYPE, DATA, LINATION, XMLNS } from "../types"
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

/////////////////////////////////////////////////////

function clear(chart: LINATION) {
  chart.innerHTML = ''
}

export function createLineChart(chart: LINATION) {
  clear(chart);
  const { svg, svgId, width, height } = SVG(chart);
  const { backgroundColor } = getElementColors(chart)

  const padding = { T: 12, R: 12, B: 12, L: 12 };

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
  const slot = area.width / dataset.length;

  const points = positiveDataset.map((d, i) => {
    return {
      y: ((1 - ((d || 0) / max)) * area.height) + padding.T,
      x: area.left + (slot * i),
      v: d
    }
  }).filter(({v}) => ![null, undefined].includes(v));
  
  const path = document.createElementNS(XMLNS, 'path');
  path.setAttribute('d', `M ${createSmoothPath(points)}`);
  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', 'red');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('stroke-linecap', 'round');
  
  svg.appendChild(path)

  if (hasDataset(chart, 'showPlot')) {
    points.forEach(({x, y, v}) => {
      if (![null, undefined].includes(v)) {
        const circle = document.createElementNS(XMLNS, 'circle');
        circle.classList.add('lination-datapoint-circle');
        circle.setAttribute('cx', String(x))
        circle.setAttribute('cy', String(y))
        circle.setAttribute('r', String(getDatasetValue(chart, 'lineThickness', 2)))
        circle.setAttribute('fill', 'red')
        circle.setAttribute('stroke', backgroundColor)
        svg.appendChild(circle)
      }
    })
  }

  console.log(svg, svgId, width, height)

  chart.appendChild(svg)
}