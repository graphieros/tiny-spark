export type TINY_SPARK = HTMLElement & {
    __renderCount: number,
    dataset: DOMStringMap
}

export const XMLNS = 'http://www.w3.org/2000/svg'
export const ANIMATION_DURATION = 1000;

export type POINT = { x: number; y: number, v: number | null | undefined, d: string | null | undefined, isPositive: boolean, bar: {
    x: number
    y: number
    h: number
    w:number
} }

export type TooltipState = {
    targetX: number
    targetY: number
    displayX: number
    displayY: number
    frameId: number | null
    tool: HTMLDivElement
    content: HTMLDivElement
    width: number
    height: number
    hasSnapped: boolean
}
