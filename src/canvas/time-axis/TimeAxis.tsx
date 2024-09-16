import {DateTime, DurationUnit, Interval} from 'luxon';
import {ViewPort, viewPortDuration} from "../../types.ts";
import {$timelineRect, $viewport} from "../../store.ts";

type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year' | 'century';

function determineTimeUnits(viewPort: ViewPort): TimeUnit[] {
    const diff = viewPortDuration(viewPort);
    const diffInYears = diff.as('years');

    if (diffInYears > 500) return ['century'];
    if (diffInYears >= 100) return ['century', 'year'];
    if (diffInYears > 20) return ['year'];
    if (diffInYears >= 1) return ['year', 'month'];
    if (diff.as('days') > 90) return ['year', 'month'];
    if (diff.as('days') > 7) return ['month', 'day'];
    if (diff.as('hours') > 24) return ['day'];
    if (diff.as('minutes') > 60) return ['hour'];
    return ['second'];
}

const NOTCH_HEIGHT_SECONDARY = 10;
const NOTCH_HEIGHT_PRIMARY = 20;
const TEXT_HEIGHT_OFFSET = 40;
let renders = 0;

export function drawNotch(ctx: CanvasRenderingContext2D, x: number, y: number, primary: boolean, text?: string) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + (primary ? NOTCH_HEIGHT_PRIMARY : NOTCH_HEIGHT_SECONDARY));
    ctx.stroke();
    if (text !== undefined) {
        ctx.fillText(text, x, y + TEXT_HEIGHT_OFFSET);
    }
}

function formatTime(current: DateTime, unit: string) {
    switch (unit) {
        case 'century':
            return `${Math.floor(current.year / 100)}th Century`;
        case 'year':
            return current.year < 0 ? `${-current.year} BC` : `${current.year}`;
        case 'month':
            return current.toFormat('MMM');
        case 'day':
            return current.toFormat('d');
        case 'hour':
            return current.toFormat('HH:mm');
        case 'minute':
            return current.toFormat('mm:ss');
        case 'second':
            return current.toFormat('ss');
        default:
            throw "can't format time unit " + unit;
    }
}

export function renderTimeAxis(ctx: CanvasRenderingContext2D) {
    const rect = $timelineRect.get();
    const viewport = $viewport.get();
    const units = determineTimeUnits(viewport);
    const interval = Interval.fromDateTimes(viewport.min, viewport.max);
    // Draw the main horizontal line

    ctx.strokeStyle = '#000000';  // Black color
    ctx.lineWidth = 2;  // Set line thickness
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y+rect.height/2);
    ctx.lineTo(rect.x+rect.width, rect.y+rect.height/2);
    ctx.stroke();
    let iters = 0
    units.forEach((unit, index) => {
        const isMainUnit = index === 0;
        const fontSize = isMainUnit ? 14 : 10;
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';

        let current = viewport.min.startOf(unit as DurationUnit);
        while (current <= viewport.max) {
            if (current >= viewport.min) {
                const x = (current.diff(viewport.min).as('milliseconds') / interval.length('milliseconds')) * rect.width + rect.x;
                drawNotch(ctx, x, rect.y+rect.height/2, isMainUnit, isMainUnit ? formatTime(current, unit) : undefined);
            }
            current = current.plus({ [unit]: 1 });
            iters++
        }
    });
    renders++
    console.log("renders", renders, iters)
}