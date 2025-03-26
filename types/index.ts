export type LINATION = HTMLDivElement

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

export const XMLNS = 'http://www.w3.org/2000/svg'