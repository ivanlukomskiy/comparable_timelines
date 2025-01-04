import {DateTime, Duration, DurationLike} from "luxon";
import {atom} from "nanostores";
import {requestAnimation} from "./animation.ts";
import {$mouseX} from "./mouse.ts";
import {$timelineRect} from "./store.ts";

const zoomPanTimeoutMillis = 100;
const INITIAL_VIEWPORT: ViewPort = {
    min: DateTime.fromObject({ year: 1477 }),
    max: DateTime.fromObject({year: 1577}),
}

export const $viewport = atom<ViewPort>(INITIAL_VIEWPORT);

const $viewportState = atom<ViewPortState>({
    startViewPort: INITIAL_VIEWPORT,
    startTime: 0,
    endTime: 0,
    targetViewPort: INITIAL_VIEWPORT,
    dragStartX: null,
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
    dragStartX: number | null;
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
export function dragStarted() {
    $viewportState.set({
        ...$viewportState.get(),
        dragStartX: $mouseX.get(),
    });
}
export function dragEnded() {
    const state = $viewportState.get();
    const mouse = $mouseX.get();
    let drag: DurationLike = 0;
    if (state.dragStartX && mouse) {
        drag = xDeltaToDuration(state.dragStartX - mouse, $viewport.get())
    }
    $viewportState.set({
        ...$viewportState.get(),
        dragStartX: null,
        startViewPort: {
            max: state.startViewPort.max.plus(drag),
            min: state.startViewPort.min.plus(drag),
        },
        targetViewPort: {
            max: state.targetViewPort.max.plus(drag),
            min: state.targetViewPort.min.plus(drag),
        },
    });
}
export function updateViewport(time: number) {
    const state = $viewportState.get();
    const mouseX = $mouseX.get();
    let drag: DurationLike = 0;
    if (state.dragStartX && mouseX) {
        drag = xDeltaToDuration(state.dragStartX - mouseX, $viewport.get())
    }
    let res = state.startViewPort;
    if (state.targetViewPort) {
        let phase = 1.;
        if (state.endTime > state.startTime) {
            phase = (Math.min(time, state.endTime) - state.startTime) / (state.endTime - state.startTime)
        }
        res = {
            min: transition(state.startViewPort.min, state.targetViewPort.min, phase).plus(drag),
            max: transition(state.startViewPort.max, state.targetViewPort.max, phase).plus(drag),
        }
        $viewport.set(res)
    } else if (state.dragStartX) {
        res = {
            min: state.startViewPort.min.plus(drag),
            max: state.startViewPort.max.plus(drag),
        }
        $viewport.set(res)
    }
    const viewportRequest = $viewportRequest.get();
    if (viewportRequest) {
        $viewportState.set({
            ...$viewportState.get(),
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
export function xDeltaToDuration(delta: number, v: ViewPort): DurationLike {
    const duration = viewPortDuration(v);
    return duration.mapUnits(x => x * delta / $timelineRect.get().width);
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
    if ($viewportState.get().dragStartX !== null) {
        return ;
    }
    const target = applyZoom($viewportState.get().targetViewPort, pivot, zoom);
    $viewportRequest.set({durationMillis: zoomPanTimeoutMillis, target})
    requestAnimation('zoom', zoomPanTimeoutMillis)
}