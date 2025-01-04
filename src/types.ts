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
    if (x < timelineRect.x || x > timelineRect.x + timelineRect.width) {
        return null;
    }
    const fraction = (x - timelineRect.x) / timelineRect.width;
    const diff = viewPortDuration(viewPort);

    const offset = diff.mapUnits(unit => unit * fraction);
    return viewPort.min.plus(offset);
}

export function timeToX(time: DateTime, timelineRect: Rect, viewPort: ViewPort): number | null {
    const diff = viewPortDuration(viewPort);
    const diffMouse = time.diff(viewPort.min);
    const fraction = diffMouse.valueOf() / diff.valueOf();
    return timelineRect.width * fraction + timelineRect.x;
}

export interface EventRaw {
    title: string;
    timeStart: string;
    timeEnd?: string;
    precision: string
}

export interface TimelineEvent {
    title: string;
    timeStart: DateTime;
    timeEnd?: DateTime;
    precision: Precision;
}

export type Precision = 'day' | 'year' | '10year' | 'month' | 'century';
