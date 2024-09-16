import { atom } from 'nanostores';
import {Rect, ViewPort} from "./types.ts";
import {DateTime} from "luxon";

const INITIAL_VIEWPORT: ViewPort = {
    min: DateTime.fromObject({ year: 1000 }),
    max: DateTime.fromObject({year: 1002}),
}

const INITIAL_TIMELINE_RECT = {
    x: 100,
    y: 100,
    width: 300,
    height: 40,
};

export const $viewport = atom<ViewPort>(INITIAL_VIEWPORT);
export const $zooming = atom<boolean>(false);
export const $timelineRect = atom<Rect>(INITIAL_TIMELINE_RECT);
export const $animationTimestasmp = atom<number>(0);

$viewport.subscribe((v) => {
    console.log("v", v.min.toISO(), v.max.toISO())
})