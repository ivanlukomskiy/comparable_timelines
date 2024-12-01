import {DateTime} from "luxon";
import {ViewPort, viewPortDuration} from "./stores/viewport.ts";

export interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Point {
    x: number;
    y: number;
}

export function mouseToTime(x: number, timelineRect: Rect, viewPort: ViewPort): DateTime | null {
    // const rect = canvas.getBoundingClientRect();
    console.log("x", x, timelineRect.x, timelineRect.x + timelineRect.width)
    if (x < timelineRect.x || x > timelineRect.x + timelineRect.width) {
        return null;
    }
    const fraction = (x - timelineRect.x) / timelineRect.width;
    const diff = viewPortDuration(viewPort);

    const offset = diff.mapUnits(unit => unit * fraction);
    return viewPort.min.plus(offset);
}
