import {atom} from "nanostores";
import {DateTime} from "luxon";

export const $mouseDate = atom<DateTime | null>(null);
