import {DateTime, Duration} from "luxon";

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

export interface ViewPort {
    readonly min: DateTime;
    readonly max: DateTime;
}

export function viewPortDuration(v: ViewPort) {
    return v.max.diff(v.min)
}

export function applyPan(v: ViewPort, pan: number): ViewPort {
    const timeDeltaX = viewPortDuration(v).as('milliseconds') * pan;
    return {
        min: v.min.plus(timeDeltaX),
        max: v.max.plus(timeDeltaX),
    }
}

export function applyZoom(v: ViewPort, pivot: DateTime, zoom: number): ViewPort {
    const currentWindow = viewPortDuration(v);
    const fraction = pivot.diff(v.min).as('milliseconds') / currentWindow.as('milliseconds');
    const newWindow = currentWindow.mapUnits(unit => unit * zoom);
    return {
        min: pivot.minus(Duration.fromMillis(newWindow.as("milliseconds") * fraction)),
        max: pivot.plus(Duration.fromMillis(newWindow.as("milliseconds") * (1 - fraction))),
    }
}

export function mouseToTime(x: number, timelineRect: Rect, viewPort: ViewPort): DateTime | null {
    // const rect = canvas.getBoundingClientRect();
    if (x < timelineRect.x || x > timelineRect.x + timelineRect.width) {
        return null;
    }
    const fraction = (x - timelineRect.x) / timelineRect.width;
    const diff = viewPortDuration(viewPort);

    const offset = diff.mapUnits(unit => unit * fraction);
    return viewPort.min.plus(offset);
}
