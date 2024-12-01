import {atom} from "nanostores";

export const $rendersList = atom<number[]>([]);
export const $totalRenders = atom<number>(0);
const windowMs = 1000;

export function onRendered() {
    const now = new Date().getTime();
    let renders = $rendersList.get();
    const firstInWindow = renders.findIndex(timestamp => timestamp > now - windowMs);
    if (firstInWindow >= 0) {
        renders = renders.slice(firstInWindow);
    }
    renders.push(now);
    $rendersList.set(renders)
    $totalRenders.set($totalRenders.get() + 1)
}
