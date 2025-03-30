export type TINY_SPARK = HTMLElement & {
    __renderCount: number,
    dataset: DOMStringMap
}

export const XMLNS = 'http://www.w3.org/2000/svg'
export const ANIMATION_DURATION = 1000;

export enum CHART_TYPE {
    BAR = 'bar',
    LINE = 'line'
}

export enum CHART {
    BAR = `data-${CHART_TYPE.BAR}`,
    LINE = `data-${CHART_TYPE.LINE}`
}

export enum DATA {
    BAR = CHART.BAR,
    LINE = CHART.LINE,
    SET = 'data-set',
    RESPONSIVE = 'data-responsive'
}

export type POINT = { x: number; y: number, v: number | null | undefined, d: string | null | undefined }

export enum DATA_ATTRIBUTE {
    ANIMATION = 'animation',
    AREA_COLOR = 'areaColor',
    CURVE = 'curve',
    DATES = 'dates',
    ID = 'id',
    INDICATOR_COLOR = 'indicatorColor',
    INDICATOR_WIDTH = 'indicatorWidth',
    LINE_COLOR = 'lineColor',
    LINE_THICKNESS = 'lineThickness',
    NUMBER_LOCALE = 'numberLocale',
    NUMBER_ROUNDING = 'numberRounding',
    NUMBER_SHOW_ON = 'numberShowOn',
    PLOT_COLOR = 'plotColor',
    PLOT_RADIUS = 'plotRadius',
    SET = 'set',
}

export enum ELEMENT_DATASET {
    ANIMATION = 'data-animation',
    AREA_COLOR = 'data-area-color',
    CURVE = 'data-curve',
    DATES = 'data-dates',
    ID = 'data-id',
    INDICATOR_COLOR = 'data-indicator-color',
    INDICATOR_WIDTH = 'data-indicator-width',
    LINE_COLOR = 'data-line-color',
    LINE_THICKNESS = 'data-line-thickness',
    NUMBER_LOCALE = 'data-number-locale',
    NUMBER_ROUNDING = 'data-number-rounding',
    NUMBER_SHOW_ON = 'data-number-show-on',
    PLOT_COLOR = 'data-plot-color',
    PLOT_RADIUS = 'data-plot-radius',
    SET = 'data-set',
}