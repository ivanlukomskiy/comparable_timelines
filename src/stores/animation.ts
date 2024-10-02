import {atom} from "nanostores";

export const $animationDeadline = atom<number>(0);
export const $animationRequests = atom<number[]>([]);
export function requestAnimation(duration: number) {
    $animationRequests.set([...$animationRequests.get(), duration]);
}
export function processRequests(time: number) {
    $animationDeadline.set(Math.max($animationDeadline.get(),
        ...$animationRequests.get().map(duration => time + duration)))
    $animationRequests.set([]);
}
