import {EventRaw, Precision, TimelineEvent} from "../types.ts";
import explorationDataRaw from './../exploration.json'
import {DateTime} from "luxon";
import {$viewport} from "../stores/viewport.ts";

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
    if (event.timeStart > $viewport.get().max || event.timeEnd && event.timeEnd < $viewport.get().min) {
        return;
    }
    console.log("event", event)
}

export function renderEvents(ctx: CanvasRenderingContext2D) {
    getEvents().forEach(e => renderEvent(ctx, e))
}
