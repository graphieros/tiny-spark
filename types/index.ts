export type TINY_SPARK = HTMLDivElement & {
    __renderCount: number
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
