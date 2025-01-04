import {$rendersList, $totalRenders} from "../stores/debug.ts";

export function renderFpsMeter(x:number, y:number, ctx: CanvasRenderingContext2D) {
    ctx.font = `32px Arial`;
    // const total = $totalRenders.get();
    const last = $rendersList.get().length;
    ctx.fillText(last + " FPS", x, y);
}
