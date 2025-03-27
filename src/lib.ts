import { CHART_TYPE, DATA, TINY_SPARK, POINT, XMLNS, DATA_ATTRIBUTE, ANIMATION_DURATION } from "../types"
import { animateAreaProgressively, animatePath, createSmoothPath, createStraightPath, SVG } from "./svg";

export function getCharts() {
  const charts = document.querySelectorAll('.tiny-spark')
  return charts
}

export function isChartOfType(element: TINY_SPARK, type: CHART_TYPE) {
  const attrs = Object.keys(element.dataset)
  return attrs.includes(type)
}

export function hasDataset(element: TINY_SPARK, name: string) {
  const attrs = Object.keys(element.dataset)
  return attrs.includes(name)
}

export function getDatasetValue(element: TINY_SPARK, name: string, fallback: number | string) {
  if (!hasDataset(element, name)) return fallback;
  return element.dataset[name]
}

export function observe(element: TINY_SPARK, render: () => void) {
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

export function getElementColors(element: TINY_SPARK) {
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

export function parseDataset(chart: TINY_SPARK) {
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

function getDates(chart: TINY_SPARK) {
  const dates = chart.getAttribute('data-dates');
  if (!dates) return []
  try {
    const parsed = JSON.parse(dates);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed;
    }
    console.warn('data-dates is not an array of strings');
    return [];
  } catch (error) {
    console.error('Error parsing data-dates', error);
    return [];
  }
}

export function minMax(dataset: number[]) {
  return {
    min: Math.min(...dataset),
    max: Math.max(...dataset)
  }
}

export function nextTick() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export function localeNum(chart: TINY_SPARK, num: number) {
  const locale = String(getDatasetValue(chart, DATA_ATTRIBUTE.NUMBER_LOCALE, navigator.language || 'en-US'));
  const rounding = Number(String(getDatasetValue(chart, DATA_ATTRIBUTE.NUMBER_ROUNDING, 0)));
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

export function tooltip(svg: SVGSVGElement, chart: TINY_SPARK, point: POINT, id: string, show: boolean) {
  nukeTooltip(id);
  if (!show) return;
  const { x, y } = domPlot(svg, point.x, point.y);
  const tool = document.createElement('div');
  tool.classList.add('tiny-spark-tooltip');
  tool.setAttribute('id', `tooltip_${id}`);
  tool.style.pointerEvents = 'none';
  tool.style.position = 'fixed';
  tool.style.top = y + 'px';
  tool.style.left = x + 'px';
  tool.style.width = 'fit-content';
  tool.innerHTML = `
    <div class="tiny-spark-tooltip-content">${!point.d ? '' : `${point.d}: `}${[null, undefined].includes(point.v as any) ? '-' : localeNum(chart, Number(point.v))}</div>
  `
  document.body.appendChild(tool);
  nextTick().then(() => {
    const { width, height } = tool.getBoundingClientRect()
    tool.style.left = `${x - width / 2}px`;
    tool.style.top = `${y - height - Number(String(Number(getDatasetValue(chart, DATA_ATTRIBUTE.PLOT_RADIUS, 3)) * 1.5))}px`
  })
}

export function nukeTooltip(id: string) {
  const t = document.getElementById(`tooltip_${id}`);
  t?.remove();
}


/////////////////////////////////////////////////////

function clear(chart: TINY_SPARK) {
  chart.innerHTML = ''
}

export function createLineChart(chart: TINY_SPARK, firstTime: boolean) {
  let animate = firstTime;
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
  const { min: MIN } = minMax(dataset);
  const positiveDataset = dataset.map(d => {
    return [null, undefined].includes(d) ? d : d + (MIN < 0 ? Math.abs(MIN) : 0)
  });
  const { max } = minMax(positiveDataset);
  const slot = area.width / (dataset.length - 1) === Infinity ? area.width : area.width / (dataset.length - 1);

  const dates = getDates(chart);

  // DATAPOINTS
  const allPoints = positiveDataset.map((d, i) => {
    const uniqueCase = {
      w: positiveDataset.length === 1 ? slot / 2 : 0,
      h: positiveDataset.length === 1 ? area.height / 2 : 0
    }
    return {
      y: ((1 - ((d || 0) / max)) * area.height) + padding.T + uniqueCase.h,
      x: area.left + ((slot * i)) + uniqueCase.w,
      v: d,
      d: dates[i] || null
    }
  })

  const points = [...allPoints].filter(({ v }) => ![null, undefined].includes(v));

  // PATH & AREA
  const path = document.createElementNS(XMLNS, 'path');
  path.classList.add('tiny-spark-line-path');

  if (!chart.dataset.curve || chart.dataset.curve === 'true') {
    path.setAttribute('d', `M ${createSmoothPath(points)}`);
  } else {
    path.setAttribute('d', `M ${createStraightPath(points)}`);
  }

  path.setAttribute('fill', 'none');
  path.setAttribute('stroke', String(getDatasetValue(chart, DATA_ATTRIBUTE.LINE_COLOR, color)));
  path.setAttribute('stroke-width', String(getDatasetValue(chart, DATA_ATTRIBUTE.LINE_THICKNESS, 2)));
  path.setAttribute('stroke-linecap', 'round');

  const pathArea = document.createElementNS(XMLNS, 'path');
  pathArea.classList.add('tiny-spark-line-area');

  if (allPoints.length) {
    if (!chart.dataset.curve || chart.dataset.curve === 'true') {
      pathArea.setAttribute('d', `M ${points[0].x},${area.bottom} ${createSmoothPath(points)} L ${points.at(-1)!.x},${area.bottom} Z`);
    } else {
      pathArea.setAttribute('d', `M ${points[0].x},${area.bottom} ${createStraightPath(points)} L ${points.at(-1)!.x},${area.bottom} Z`);
    }
  }

  pathArea.setAttribute('fill', String(getDatasetValue(chart, DATA_ATTRIBUTE.AREA_COLOR, 'transparent')));

  if (allPoints.length > 1) {
    svg.appendChild(pathArea);
    svg.appendChild(path);
  }


  const animation = chart.getAttribute('data-animation');

  const indicators: SVGLineElement[] = [];

  // VERTICAL INDICATOR
  allPoints.forEach((_, i) => {
    const indicator = document.createElementNS(XMLNS, 'line');
    indicator.classList.add('tiny-spark-indicator');
    indicator.setAttribute('id', `indicator_${svgId}_${i}`);
    indicator.setAttribute('x1', String(area.left + (allPoints.length === 1 ? area.width / 2 : (i * slot))));
    indicator.setAttribute('x2', String(area.left + (allPoints.length === 1 ? area.width / 2 : (i * slot))));
    indicator.setAttribute('y1', String(area.top));
    indicator.setAttribute('y2', String(area.bottom));
    indicator.setAttribute('stroke', String(getDatasetValue(chart, DATA_ATTRIBUTE.INDICATOR_COLOR, '#1A1A1A')));
    indicator.setAttribute('stroke-width', String(getDatasetValue(chart, DATA_ATTRIBUTE.INDICATOR_WIDTH, '1')));
    indicator.setAttribute('stroke-linecap', 'round');
    indicator.style.pointerEvents = 'none';
    indicator.style.opacity = '0';
    indicators.push(indicator);
    svg.appendChild(indicator);
  })

  let plots: SVGCircleElement[] = [];

  // PLOTS
  if (Number(String(getDatasetValue(chart, DATA_ATTRIBUTE.PLOT_RADIUS, 0))) > 0) {
    allPoints.forEach(({ x, y, v }, i) => {
      if (![null, undefined].includes(v)) {
        const circle = document.createElementNS(XMLNS, 'circle');
        circle.classList.add('tiny-spark-datapoint-circle');
        circle.classList.add(`circle-${svgId}`);
        circle.setAttribute('id', `circle_${svgId}_${i}`);
        circle.setAttribute('cx', String(x || 0));
        circle.setAttribute('cy', String(y || 0));
        circle.setAttribute('r', String(getDatasetValue(chart, DATA_ATTRIBUTE.PLOT_RADIUS, 3)));
        circle.setAttribute('fill', String(getDatasetValue(chart, DATA_ATTRIBUTE.PLOT_COLOR, String(getDatasetValue(chart, 'lineColor', color)))));
        circle.setAttribute('stroke', backgroundColor);
        circle.style.transition = `opacity ${i * ((ANIMATION_DURATION * 2) / allPoints.length)}ms ease-in`;
        circle.style.opacity = '0';
        svg.appendChild(circle);
        plots.push(circle);
      }
    });
  }

  // TOOLTIP TRAPS
  allPoints.forEach((point, i) => {
    const trap = document.createElementNS(XMLNS, 'rect');
    trap.classList.add('tiny-spark-tooltip-trap');
    trap.setAttribute('x', `${allPoints.length === 1 ? 0 : area.left + i * slot - slot / 2}`);
    trap.setAttribute('y', `${area.top}`);
    trap.setAttribute('height', `${area.height}`);
    trap.setAttribute('width', `${slot}`);
    trap.setAttribute('fill', 'transparent');
    trap.addEventListener('mouseenter', () => {
      tooltip(svg, chart, point, svgId, true);
      const circle = document.getElementById(`circle_${svgId}_${i}`);
      circle?.setAttribute('r', String(Number(getDatasetValue(chart, DATA_ATTRIBUTE.PLOT_RADIUS, 3)) * 1.5))
      indicators[i].style.opacity = '1';
    });
    trap.addEventListener('mouseout', () => {
      tooltip(svg, chart, point, svgId, false);
      const circle = document.getElementById(`circle_${svgId}_${i}`);
      circle?.setAttribute('r', String(Number(getDatasetValue(chart, DATA_ATTRIBUTE.PLOT_RADIUS, 3))))
      indicators.forEach(indicator => indicator.style.opacity = '0');
    });
    svg.appendChild(trap);
  });


  if (animation === 'true' && animate) {
    nextTick().then(() => {
      plots.forEach(circle => {
        circle.style.opacity = '1'
      })
      animatePath(path);
      animateAreaProgressively(svg as unknown as TINY_SPARK, pathArea);
    })
  } else {
    plots.forEach(circle => {
      circle.style.opacity = '1'
    })
  }

  chart.appendChild(svg);
}