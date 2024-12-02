import {timeToX} from "../../types.ts";
import {$mouseDate} from "../../stores/mouse.ts";
import {$timelineRect} from "../../stores/store.ts";
import {$viewport} from "../../stores/viewport.ts";
import {requestAnimation} from "../../stores/animation.ts";


export function renderMarker(ctx: CanvasRenderingContext2D) {
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
    ctx.lineTo(x, rect.y-rect.height/2);
    ctx.stroke();
    // requestAnimation(10)
}
