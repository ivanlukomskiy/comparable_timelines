import {atom} from "nanostores";

export const $animationDeadline = atom<number>(0);
export const $animationRequests = atom<Record<string, number>>({});
export function requestAnimation(key: string, duration: number) {
    const current = $animationRequests.get();
    current[key] = duration;
    $animationRequests.set(current);
}
export function processRequests(time: number) {
    const requests = $animationRequests.get();
    if (requests.length === 0) {
        return;
    }
    let deadline = $animationDeadline.get();
    for (const key in requests) {
        deadline = Math.max(deadline, requests[key] + time);
    }
    $animationDeadline.set(deadline)
    $animationRequests.set({});
}
