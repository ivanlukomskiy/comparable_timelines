import {EventRaw, Precision, TimelineEvent, timeToX} from "../types.ts";
import explorationDataRaw from './../exploration.json'
import {DateTime} from "luxon";
import {$viewport} from "../stores/viewport.ts";
import {$timelineRect} from "../stores/store.ts";

const period = 'European Age of Discovery';
let events: TimelineEvent[] = [];
const textPaddingRight = 20;
const textPaddingLeft = 0;
const rowHeight = 50;
const textPaddingTop = 20;
const timespanPaddingTop = 30;
const timespanHeight = 8;

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

function renderEvent(ctx: CanvasRenderingContext2D, ewb: EventWithBounds, y: number, footnoteLen: number) {
    const event = ewb.event;
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
    ctx.beginPath()
    ctx.fillStyle = '#dadada'
    // ctx.fillRect(ewb.x0, y+textPaddingTop, Math.max(ewb.textEndX, ewb.x1) - x0, rowHeight);
    ctx.fillStyle = '#000000'
    ctx.strokeStyle = 'rgb(174,193,179)';
    if (event.timeStart > viewPort.min) {
        ctx.beginPath();
        ctx.moveTo(x0, y+timespanPaddingTop);
        ctx.lineTo(x0, y+timespanPaddingTop+footnoteLen);
        ctx.stroke();
    }
    if (event.timeEnd && event.timeStart < viewPort.max) {
        ctx.beginPath();
        ctx.moveTo(x1, y+timespanPaddingTop);
        ctx.lineTo(x1, y+timespanPaddingTop+footnoteLen);
        ctx.stroke();
    }
    ctx.beginPath()
    ctx.strokeStyle = '#00691d';
    ctx.lineWidth = 2;
    ctx.rect(x0, y+timespanPaddingTop, x1-x0, timespanHeight);
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillText(event.title, x0+textPaddingLeft, y+textPaddingTop);
}

interface EventWithBounds {
    event: TimelineEvent;
    x0: number;
    x1: number;
    textEndX: number;
    textHeight: number;
}

interface Row {
    y: number;
    events: EventWithBounds[];
}

interface PackedEvents {
    rows: Row[];
    height: number;
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
    const textHeight = textMeasurements.emHeightAscent + textMeasurements.emHeightDescent;
    return {x0, x1, textEndX: x0 + textMeasurements.width + textPaddingLeft + textPaddingRight, event, textHeight}
}

function isCollision(e1: EventWithBounds, e2: EventWithBounds): boolean {
    return e1.x0 >= e2.x0 && (e2.x1 >= e1.x0 || e2.textEndX >= e1.x0)
        || e2.x0 >= e1.x0 && (e1.x1 >= e2.x0 || e1.textEndX >= e2.x0);
}

function fits(event: EventWithBounds, row: Row) {
    for (let i = 0; i < row.events.length; i++) {
        if (isCollision(event, row.events[i])) {
            return false;
        }
    }
    return true;
}

export function pack(ctx: CanvasRenderingContext2D, y: number): PackedEvents {
    ctx.font = `24px Arial`;
    const rows: Row[] = [];
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
            y += rowHeight
        }
    }
    return {rows, height: rows.length * rowHeight};
}

export function renderRows(ctx: CanvasRenderingContext2D, pack: PackedEvents) {
    ctx.font = `24px Arial`;
    pack.rows.forEach((row, rowId) => {
        row.events.forEach(event => {
            renderEvent(ctx, event, row.y, (pack.rows.length - rowId) * rowHeight
                + $timelineRect.get().height/4) // fixme its arbitrary
        })
    })
}
