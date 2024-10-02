import {atom} from "nanostores";

export const $animationDeadline = atom<number>(0);
export const $animationRequests = atom<number[]>([]);
export function requestAnimation(duration: number) {
    $animationRequests.set([...$animationRequests.get(), duration]);
}
export function processRequests(time: number) {
    const requests = $animationRequests.get();
    if (requests.length === 0) {
        return;
    }
    $animationDeadline.set(Math.max($animationDeadline.get(),
        ...requests.map(duration => time + duration)))
    $animationRequests.set([]);
}
