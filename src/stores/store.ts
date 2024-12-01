import {atom} from 'nanostores';
import {Rect} from "../types.ts";


const INITIAL_TIMELINE_RECT = {
    x: 100,
    y: 300,
    width: 300,
    height: 40,
};

export const $timelineRect = atom<Rect>(INITIAL_TIMELINE_RECT);
