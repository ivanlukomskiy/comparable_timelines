import {atom} from 'nanostores';
import {Rect} from "../types.ts";


const INITIAL_TIMELINE_RECT = {
    x: 100,
    y: 900,
    width: 100,
    height: 420,
};

export const $timelineRect = atom<Rect>(INITIAL_TIMELINE_RECT);
