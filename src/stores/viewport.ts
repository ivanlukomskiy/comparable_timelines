import {DateTime, Duration} from "luxon";
import {atom} from "nanostores";
import {requestAnimation} from "./animation.ts";

const zoomPanTimeoutMillis = 100;
const INITIAL_VIEWPORT: ViewPort = {
    min: DateTime.fromObject({ year: 1000 }),
    max: DateTime.fromObject({year: 1002}),
}

export const $viewport = atom<ViewPort>(INITIAL_VIEWPORT);

const $viewportState = atom<ViewPortState>({
    startViewPort: INITIAL_VIEWPORT,
    startTime: 0,
    endTime: 0,
    targetViewPort: INITIAL_VIEWPORT,
});
interface ViewportRequest {
    target: ViewPort;
    durationMillis: number;
}
const $viewportRequest = atom<ViewportRequest | null>(null);
export interface ViewPort {
    readonly min: DateTime;
    readonly max: DateTime;
}
interface ViewPortState {
    startViewPort: ViewPort;
    startTime: number;
    targetViewPort: ViewPort;
    endTime: number;
}
function transition(start: DateTime, end: DateTime, phase: number): DateTime {
    if (phase >= 1) {
        return end;
    }
    if (phase <= 0) {
        return start;
    }
    const diff = end.diff(start).mapUnits(x => x * phase);
    return start.plus(diff)
}
export function updateViewport(time: number) {
    const state = $viewportState.get();
    let res = state.startViewPort;
    if (state.targetViewPort) {
        let phase = 1.;
        if (state.endTime > state.startTime) {
            phase = (Math.min(time, state.endTime) - state.startTime) / (state.endTime - state.startTime)
        }
        res = {
            min: transition(state.startViewPort.min, state.targetViewPort.min, phase),
            max: transition(state.startViewPort.max, state.targetViewPort.max, phase),
        }
        $viewport.set(res)
    }
    const viewportRequest = $viewportRequest.get();
    if (viewportRequest) {
        $viewportState.set({
            startViewPort: res,
            startTime: time,
            targetViewPort: viewportRequest.target,
            endTime: time + viewportRequest.durationMillis,
        });
        $viewportRequest.set(null);
    }
}

export function viewPortDuration(v: ViewPort) {
    return v.max.diff(v.min)
}
function applyPan(v: ViewPort, pan: number): ViewPort {
    const timeDeltaX = viewPortDuration(v).as('milliseconds') * pan;
    return {
        min: v.min.plus(timeDeltaX),
        max: v.max.plus(timeDeltaX),
    }
}
function applyZoom(v: ViewPort, pivot: DateTime, zoom: number): ViewPort {
    const currentWindow = viewPortDuration(v);
    const fraction = pivot.diff(v.min).as('milliseconds') / currentWindow.as('milliseconds');
    const newWindow = currentWindow.mapUnits(unit => unit * zoom);
    return {
        min: pivot.minus(Duration.fromMillis(newWindow.as("milliseconds") * fraction)),
        max: pivot.plus(Duration.fromMillis(newWindow.as("milliseconds") * (1 - fraction))),
    }
}
export function startZoom(pivot: DateTime, zoom: number) {
    const target = applyZoom($viewportState.get().targetViewPort, pivot, zoom);
    $viewportRequest.set({durationMillis: zoomPanTimeoutMillis, target})
    requestAnimation('zoom', zoomPanTimeoutMillis)
}
export function startPan(pan: number) {
    const target = applyPan($viewportState.get().targetViewPort, pan)
    $viewportRequest.set({durationMillis: zoomPanTimeoutMillis, target})
    requestAnimation('zoom', zoomPanTimeoutMillis)
}
