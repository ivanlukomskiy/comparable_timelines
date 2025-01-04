import {timeToX} from "../types.ts";
import {$mouseDate} from "../stores/mouse.ts";
import {$timelineRect} from "../stores/store.ts";
import {$viewport} from "../stores/viewport.ts";


export function renderMarker(ctx: CanvasRenderingContext2D, markerLength: number) {
    const mouseDate = $mouseDate.get();
    if (mouseDate === null) {
        return;
    }
    const rect = $timelineRect.get();
    const x = timeToX(mouseDate, rect, $viewport.get());
    if (x === null) {
        return;
    }
    ctx.strokeStyle = '#6e2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, rect.y+rect.height/2);
    ctx.lineTo(x, rect.y+rect.height/2-markerLength - rect.height);
    ctx.stroke();
}
