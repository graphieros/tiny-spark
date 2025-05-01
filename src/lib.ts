import { CHART_TYPE, TINY_SPARK, POINT, XMLNS, DATA_ATTRIBUTE, ANIMATION_DURATION } from "../types"
import { animateAreaProgressively, animatePath, createSmoothPath, createStraightPath, SVG } from "./svg";

export function getCharts() {
  const charts = document.querySelectorAll('.tiny-spark')
  return charts
}

export function hasDataset(element: TINY_SPARK, name: string) {
  const attrs = Object.keys(element.dataset)
  return attrs.includes(name)
}

export function getDatasetValue(element: TINY_SPARK, name: string, fallback: number | string) {
  if (!hasDataset(element, name)) return fallback;
  return element.dataset[name]
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
  const isBar = chart.dataset.type && chart.dataset.type === CHART_TYPE.BAR

  const x = domPlot(svg, point.x, point.y).x;
  let y = 0;

  if (isBar && !point.isPositive) {
    y = domPlot(svg, point.x, point.bar.y).y;
  } else {
    y = domPlot(svg, point.x, point.y).y;
  }

  const tool = document.createElement('div');
  tool.style.opacity = '0';
  tool.classList.add('tiny-spark-tooltip');
  tool.setAttribute('id', `tooltip_${id}`);
  tool.setAttribute('role', 'tooltip');
  tool.setAttribute('aria-live', 'polite');
  tool.setAttribute('aria-hidden', String(!show))

  tool.style.pointerEvents = 'none';
  tool.style.position = 'fixed';

  if (isBar) {
    tool.style.top = y + 'px'
  } else {
    tool.style.top = y + 'px';
  }

  tool.style.left = x + 'px';
  tool.style.width = 'fit-content';

  tool.innerHTML = `
    <div class="tiny-spark-tooltip-content">${!point.d ? '' : `${point.d}: `}${[null, undefined].includes(point.v as any) ? '-' : localeNum(chart, Number(point.v))}</div>
  `;
  document.body.appendChild(tool);
  nextTick().then(() => {
    const { width, height } = tool.getBoundingClientRect()
    tool.style.left = `${x - width / 2}px`;
    tool.style.top = `${y - height - Number(String(Number(getDatasetValue(chart, DATA_ATTRIBUTE.PLOT_RADIUS, 3)) * 1.5))}px`;
  }).then(() => {
    tool.style.opacity = '1';
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

export function createChart(chart: TINY_SPARK, firstTime: boolean) {
  const isBar = chart.dataset.type && chart.dataset.type === 'bar';

  let animate = firstTime;
  clear(chart);
  const { svg, svgId, width, height, viewBox } = SVG(chart);
  const { color, backgroundColor } = getElementColors(chart)

  const padding = { T: 12, R: 12, B: 12, L: 12 };
  const lastValueId = createUid();
  const showLastValue = String(getDatasetValue(chart, DATA_ATTRIBUTE.SHOW_LAST_VALUE, 'false')) === 'true';

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
  let slot = area.width / (dataset.length - 1) === Infinity ? area.width : area.width / (dataset.length - 1);

  if (isBar) {
    const [v_0, v_1, v_2, v_3] = viewBox.split(' ');
    // Add padding to leave space for bars
    svg.setAttribute('viewBox', `${Number(v_0) - slot / 2} ${v_1} ${Number(v_2) + slot} ${v_3}`)
  }

  const allNeg = !dataset.some(d => d >= 0);
  const dates = getDates(chart);

  // DATAPOINTS
  const allPoints = positiveDataset.map((d, i) => {
    const uniqueCase = {
      w: positiveDataset.length === 1 ? slot / 2 : 0,
      h: positiveDataset.length === 1 ? area.height / 2 : 0
    }

    const x = area.left + ((slot * i)) + uniqueCase.w;
    const y = ((1 - ((d || 0) / max)) * area.height) + uniqueCase.h + padding.T;
    const y_0 = ((1 - ((MIN < 0 ? Math.abs(MIN) : 0) / max)) * area.height) + padding.T + uniqueCase.h;

    const isPositive = dataset[i] >= 0

    return {
      y: allNeg && dataset.length === 1 ? area.top + area.height / 2 : y,
      x,
      v: dataset[i],
      d: dates[i] || null,
      isPositive,
      bar: {
        x: x - slot / 2,
        y: dataset.length === 1 ? area.top : isPositive ? y : allNeg ? area.top : y_0,
        h: dataset.length === 1 ? area.height : isPositive ? y_0 - y : allNeg && dataset.length === 0 ? area.height : isNaN(y - y_0) ? 0 : y - y_0,
        w: slot
      }
    }
  })

  const points = [...allPoints].filter(({ v }) => ![null, undefined].includes(v));
  const animation = chart.getAttribute('data-animation');
  const path = document.createElementNS(XMLNS, 'path');
  path.classList.add('tiny-spark-line-path');
  const pathArea = document.createElementNS(XMLNS, 'path');
  pathArea.classList.add('tiny-spark-line-area');

  // PATH & AREA
  if (!isBar) {
  
    if (!chart.dataset.curve || chart.dataset.curve === 'true') {
      path.setAttribute('d', `M ${createSmoothPath(points)}`);
    } else {
      path.setAttribute('d', `M ${createStraightPath(points)}`);
    }
  
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', String(getDatasetValue(chart, DATA_ATTRIBUTE.LINE_COLOR, color)));
    path.setAttribute('stroke-width', String(getDatasetValue(chart, DATA_ATTRIBUTE.LINE_THICKNESS, 2)));
    path.setAttribute('stroke-linecap', 'round');
    
    if (animation === 'true' && animate) {
      path.style.opacity = '0'
      pathArea.style.opacity = '0'
    }
  
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
  }

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
  let bars: SVGRectElement[] = [];

  // PLOTS
  const hasPlotRadius = Number(String(getDatasetValue(chart, DATA_ATTRIBUTE.PLOT_RADIUS, 0))) > 0;
  const isInPlotViewRange = !String(getDatasetValue(chart, DATA_ATTRIBUTE.HIDE_PLOTS_ABOVE, '')) || allPoints.length <= (Number(String(getDatasetValue(chart, DATA_ATTRIBUTE.HIDE_PLOTS_ABOVE, 0))));
  const canShowPlots = hasPlotRadius && isInPlotViewRange;

  // BARS
  if (isBar) {
    allPoints.forEach(({ bar, v }, i) => {
      if (![null, undefined].includes(v)) {
        const rect = document.createElementNS(XMLNS, 'rect');
        rect.classList.add('tiny-spark-datapoint-bar');
        rect.setAttribute('x', String(bar.x));
        rect.setAttribute('y', String(bar.y));
        rect.setAttribute('width', String(bar.w));
        rect.setAttribute('height', String(bar.h));
        rect.setAttribute('fill', String(getDatasetValue(chart, DATA_ATTRIBUTE.PLOT_COLOR, String(getDatasetValue(chart, 'lineColor', color)))))
        rect.style.opacity = allPoints.length === 1 ? '1' : '0';
        rect.style.transition = `opacity ${i * ((ANIMATION_DURATION * 2) / allPoints.length)}ms ease-in`;
        bars.push(rect);
        svg.appendChild(rect)
      }
    })
  }

  if (hasPlotRadius && !isBar) {
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
          circle.style.opacity = allPoints.length === 1 ? '1' : '0';
          circle.style.transition = `opacity ${i * ((ANIMATION_DURATION * 2) / allPoints.length)}ms ease-in`;
          circle.style.pointerEvents = 'none';
          plots.push(circle);
          if (canShowPlots) {
            svg.appendChild(circle);
          }
        }
      });
  }

  // LAST VALUE
  let lastValueText: SVGTextElement | null = null

  if (showLastValue && allPoints.length && allPoints.at(-1)) {
    const fontSize = Number(getDatasetValue(chart, DATA_ATTRIBUTE.LAST_VALUE_FONT_SIZE, 12))

    lastValueText = document.createElementNS(XMLNS, 'text');
    lastValueText.classList.add('tiny-spark-last-value');
    lastValueText.setAttribute('id', lastValueId);

    if (isBar) {
      lastValueText.setAttribute('x', String(allPoints.at(-1)!.x + Number(getDatasetValue(chart, DATA_ATTRIBUTE.LINE_THICKNESS, 2))));
      lastValueText.setAttribute('y', allPoints.at(-1)?.isPositive ? String(allPoints.at(-1)!.y - fontSize / 3) : String(allPoints.at(-1)!.bar.y + allPoints.at(-1)!.bar.h + fontSize));
      lastValueText.setAttribute('text-anchor', 'middle');
    } else {
      lastValueText.setAttribute('x', String(allPoints.at(-1)!.x + 6 + Number(getDatasetValue(chart, DATA_ATTRIBUTE.LINE_THICKNESS, 2))));
      lastValueText.setAttribute('y', String(allPoints.at(-1)!.y + fontSize / 3));
      lastValueText.setAttribute('text-anchor', 'start');
    }

    lastValueText.setAttribute('font-size', String(fontSize) + 'px');
    lastValueText.setAttribute('fill', String(getDatasetValue(chart, DATA_ATTRIBUTE.LAST_VALUE_COLOR, String(getDatasetValue(chart, DATA_ATTRIBUTE.INDICATOR_COLOR, '#1A1A1A')))));
    lastValueText.innerHTML = localeNum(chart, Number(allPoints.at(-1)!.v));
    lastValueText.style.opacity = allPoints.length === 1 ? '1' : '0';
    svg.appendChild(lastValueText);
  }

  // TOOLTIP TRAPS
  allPoints.forEach((point, i) => {
    const thatPlot = plots[i];
    const trap = document.createElementNS(XMLNS, 'rect');
    trap.classList.add('tiny-spark-tooltip-trap');
    trap.setAttribute('x', `${allPoints.length === 1 ? 0 : area.left + i * slot - slot / 2}`);
    trap.setAttribute('y', `${area.top}`);
    trap.setAttribute('height', `${area.height}`);
    trap.setAttribute('width', `${slot}`);
    trap.setAttribute('fill', 'transparent');
    trap.setAttribute('aria-describedby', `tooltip_${svgId}`)
    trap.addEventListener('mouseenter', () => {
      tooltip(svg, chart, point, svgId, true);
      if (canShowPlots) {
        const circle = document.getElementById(`circle_${svgId}_${i}`);
        circle?.setAttribute('r', String(Number(getDatasetValue(chart, DATA_ATTRIBUTE.PLOT_RADIUS, 3)) * 1.5))
      } else {
        svg.appendChild(thatPlot);
      }
      indicators[i].style.opacity = '1';
      if (showLastValue && lastValueText) {
        if(i === allPoints.length - 1) {
          lastValueText.style.opacity = '0';
        } else {
          lastValueText.style.opacity = '1';
        }
      }
    });
    trap.addEventListener('mouseout', () => {
      tooltip(svg, chart, point, svgId, false);
      if (canShowPlots) {
        const circle = document.getElementById(`circle_${svgId}_${i}`);
        circle?.setAttribute('r', String(Number(getDatasetValue(chart, DATA_ATTRIBUTE.PLOT_RADIUS, 3))))
      } else {
        thatPlot.remove();
      }
      indicators.forEach(indicator => indicator.style.opacity = '0');
      if (showLastValue && lastValueText) {
        lastValueText.style.opacity = '1';
      }
    });
    svg.appendChild(trap);
  });


  if (animation === 'true' && animate) {
    nextTick().then(() => {
      plots.forEach(circle => {
        circle.style.opacity = '1'
      })
      bars.forEach(bar => {
        bar.style.opacity = '1'
      })
      animatePath(path, ANIMATION_DURATION, () => {
        if (lastValueText) {
          lastValueText.style.opacity = '1';
        }
      });
      animateAreaProgressively(svg as unknown as TINY_SPARK, pathArea);
    })
  } else {
    plots.forEach(circle => {
      circle.style.opacity = '1'
    });
    bars.forEach(bar => {
      bar.style.opacity = '1'
    });
    if (lastValueText) {
      lastValueText.style.opacity = '1';
    }
  }

  chart.appendChild(svg);
}