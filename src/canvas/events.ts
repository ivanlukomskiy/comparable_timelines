import {EventRaw, Precision, TimelineEvent, timeToX} from "../types.ts";
import explorationDataRaw from './../exploration.json'
import {DateTime} from "luxon";
import {$viewport} from "../stores/viewport.ts";
import {$timelineRect} from "../stores/store.ts";

const period = 'European Age of Discovery';
let events: TimelineEvent[] = [];

function getEvents() {
    if (events.length === 0) {
        events = explorationDataRaw[period].map(e => parse(e))
        console.log("explorationDataRaw[period]", explorationDataRaw[period])
    }
    return events;
}

function parse(event: EventRaw): TimelineEvent {
    const res: TimelineEvent = {
        timeStart: DateTime.fromISO(event.timeStart),
        title: event.title,
        precision: event.precision as Precision,
    }
    if (event.timeEnd) {
        res.timeEnd = DateTime.fromISO(event.timeEnd);
    }
    return res;
}

function renderEvent(ctx: CanvasRenderingContext2D, event: TimelineEvent) {
    const viewPort = $viewport.get();
    console.log("event", event)
    if (event.timeStart > viewPort.max || event.timeEnd && event.timeEnd < viewPort.min) {
        console.log('out of bounds')
        return;
    }
    if (!event.timeEnd) {
        console.log('no time end')
        return;
    }
    const rect = $timelineRect.get();
    const x0 = timeToX(event.timeStart < viewPort.min ? viewPort.min : event.timeStart,  rect, viewPort);
    const x1 = timeToX(event.timeEnd > viewPort.max ? viewPort.max : event.timeEnd, rect, viewPort);
    if (!x0 || !x1) {
        console.log('no x0/x1')
        return;
    }
    ctx.strokeStyle = '#00691d';  // Black color
    ctx.lineWidth = 2;  // Set line thickness
    ctx.rect(x0, 10, x1-x0, 30);
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillText(event.title, x0, 10);
}

export function renderEvents(ctx: CanvasRenderingContext2D) {
    getEvents().forEach(e => renderEvent(ctx, e))
}
