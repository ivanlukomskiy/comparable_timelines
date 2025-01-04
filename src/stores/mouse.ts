import {atom} from "nanostores";
import {DateTime} from "luxon";

export const $mouseDate = atom<DateTime | null>(null);
export const $prevMouseDrag = atom<DateTime | null>(null);
