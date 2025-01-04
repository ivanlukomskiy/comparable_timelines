import {EventRaw, Precision, TimelineEvent, timeToX} from "../types.ts";
import explorationDataRaw from './../exploration.json'
import {DateTime} from "luxon";
import {$viewport} from "../stores/viewport.ts";
import {$timelineRect} from "../stores/store.ts";

const period = 'European Age of Discovery';
let events: TimelineEvent[] = [];
const textPaddingRight = 20;
const textPaddingLeft = 0;

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

function isWithinBounds(event: TimelineEvent): boolean {
    const viewPort = $viewport.get();
    return !(event.timeStart > viewPort.max || event.timeEnd && event.timeEnd < viewPort.min);
}

function renderEvent(ctx: CanvasRenderingContext2D, event: TimelineEvent, y: number) {
    const viewPort = $viewport.get();
    if (event.timeStart > viewPort.max || event.timeEnd && event.timeEnd < viewPort.min) {
        return;
    }
    const rect = $timelineRect.get();
    const x0 = timeToX(event.timeStart < viewPort.min ? viewPort.min : event.timeStart,  rect, viewPort);
    let x1 = x0;
    if (event.timeEnd) {
        x1 = timeToX(event.timeEnd > viewPort.max ? viewPort.max : event.timeEnd, rect, viewPort);
    }
    if (!x0 || !x1) {
        throw "unexpected n/a x0 or x1"
    }
    ctx.strokeStyle = '#00691d';
    ctx.lineWidth = 2;
    ctx.rect(x0, y, x1-x0, 30);
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillText(event.title, x0, y);
}

interface EventWithBounds {
    event: TimelineEvent;
    x0: number;
    x1: number;
    textEndX: number;
}

interface Row {
    y: number;
    events: EventWithBounds[];
}

function getBounds(ctx: CanvasRenderingContext2D, event: TimelineEvent): EventWithBounds {
    const viewPort = $viewport.get();
    const rect = $timelineRect.get();
    const x0 = timeToX(event.timeStart < viewPort.min ? viewPort.min : event.timeStart,  rect, viewPort);
    let x1 = x0;
    if (event.timeEnd) {
        x1 = timeToX(event.timeEnd > viewPort.max ? viewPort.max : event.timeEnd, rect, viewPort);
    }
    if (!x1 || !x0) {
        throw "no x0/x1"
    }
    const textMeasurements = ctx.measureText(event.title);
    return {x0, x1, textEndX: x0 + textMeasurements.width + textPaddingLeft + textPaddingRight, event}
}

function isCollision(e1: EventWithBounds, e2: EventWithBounds): boolean {
    return e1.x0 > e2.x0 && (e2.x1 > e1.x0 || e2.textEndX > e1.x0)
        || e2.x0 > e1.x0 && (e1.x1 > e2.x0 || e1.textEndX > e2.x0);
}

function fits(event: EventWithBounds, row: Row) {
    for (let i = 0; i < row.events.length; i++) {
        if (isCollision(event, row.events[i])) {
            return false;
        }
    }
    return true;
}

export function renderEvents(ctx: CanvasRenderingContext2D) {
    const rows: Row[] = [];
    let y = 30;
    const yDelta = 50;
    const events = getEvents();
    for (let i = 0; i < events.length; i++) {
        if (!isWithinBounds(events[i])) {
            continue;
        }
        const event = getBounds(ctx, events[i]);
        let added = false;
        for (let j = 0; j < rows.length; j++) {
            const row = rows[j];
            if (fits(event, row)) {
                row.events.push(event);
                added = true;
                break;
            }
        }
        if (!added) {
            const newRow = {y, events: [event]};
            rows.push(newRow)
            y += yDelta
        }
    }
    rows.forEach(row => {
        row.events.forEach(event => {
            renderEvent(ctx, event.event, row.y)
        })
    })
}
