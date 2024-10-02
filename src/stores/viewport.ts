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
    zoomPanEndTime: 0,
});
const $zoomPanRequest = atom<ZoomPanRequest | null>(null);
export interface ViewPort {
    readonly min: DateTime;
    readonly max: DateTime;
}
interface ZoomPanRequest {
    zoomSpeed?: number;
    zoomPivot?: DateTime;
    panSpeed?: number;
}
interface ViewPortState {
    startViewPort: ViewPort;
    startTime: number;
    zoomPan?: ZoomPanRequest;
    zoomPanEndTime: number;
}
export function updateViewport(time: number) {
    const state = $viewportState.get();
    let res = state.startViewPort;
    if (state.zoomPan) {
        const zoomPan = state.zoomPan;
        const timeDelta = Math.min(time, state.zoomPanEndTime) - state.startTime;
        if (zoomPan.zoomSpeed && zoomPan.zoomPivot) {
            res = applyZoom(res, zoomPan.zoomPivot, zoomPan.zoomSpeed * timeDelta)
        } else if (zoomPan.panSpeed) {
            res = applyPan(res, zoomPan.panSpeed * timeDelta)
        }
        $viewport.set(res)
    }
    const zoomPanRequest = $zoomPanRequest.get();
    if (zoomPanRequest) {
        $viewportState.set({
            startViewPort: res,
            startTime: time,
            zoomPan: zoomPanRequest,
            zoomPanEndTime: time + zoomPanTimeoutMillis,
        })
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
export function setZoomSpeed(zoomPivot: DateTime, zoomSpeed: number) {
    $zoomPanRequest.set({zoomPivot, zoomSpeed})
    requestAnimation(zoomPanTimeoutMillis)
}
export function setPanSpeed(panSpeed: number) {
    $zoomPanRequest.set({panSpeed})
    requestAnimation(zoomPanTimeoutMillis)
}
