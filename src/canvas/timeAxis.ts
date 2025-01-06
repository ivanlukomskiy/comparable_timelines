import {DateTime, Interval} from 'luxon';
import {$timelineRect} from "../stores/store.ts";
import {$viewport, ViewPort, viewPortDuration} from "../stores/viewport.ts";
import {DateTimeUnit} from "luxon/src/datetime";

type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year' | 'century';

interface TimeUnitConfig {
    step: number;
    timeUnit: DateTimeUnit;
    getTimeUnit: keyof DateTime;
    minDiff: number;
    maxDiff: number;
}
const hour = 60 * 60;
const day = 24 * hour;
const year = 365 * day;
const configs = [
    {step: 1, timeUnit: 'second', getTimeUnit: 'second', minDiff: 0, maxDiff: hour},
    {step: 1, timeUnit: 'hour', getTimeUnit: 'hour', minDiff: hour, maxDiff: day},
    {step: 1, timeUnit: 'month', getTimeUnit: 'month',minDiff: day, maxDiff: 2 * year},
    {step: 1, timeUnit: 'year', getTimeUnit: 'year',minDiff: 2 * year, maxDiff: 30 * year},
    {step: 5, timeUnit: 'year', getTimeUnit: 'year',minDiff: 30 * year, maxDiff: year * 100},
    {step: 20, timeUnit: 'year', getTimeUnit: 'year',minDiff: year * 100, maxDiff: year * 300},
    {step: 50, timeUnit: 'year', getTimeUnit: 'year',minDiff: year * 300, maxDiff: year * 500},
    {step: 100, timeUnit: 'year', getTimeUnit: 'year',minDiff: year * 500, maxDiff: year * 10000},
]

function determineTimeUnits(viewPort: ViewPort): TimeUnitConfig[] {
    const diff = viewPortDuration(viewPort);
    const diffInMillis = diff.as('seconds');
    const confs = configs.filter(conf =>
        conf.minDiff <= diffInMillis && conf.maxDiff >= diffInMillis);
    // console.log("confs", confs)
    // if (diffInYears > 500) return ['century'];
    // if (diffInYears >= 100) return ['century', 'year'];
    // if (diffInYears > 20) return ['year'];
    // if (diffInYears >= 1) return ['year', 'month'];
    // if (diff.as('days') > 90) return ['year', 'month'];
    // if (diff.as('days') > 7) return ['month', 'day'];
    // if (diff.as('hours') > 24) return ['day'];
    // if (diff.as('minutes') > 60) return ['hour'];
    return confs;
}

const NOTCH_HEIGHT_SECONDARY = 10;
const NOTCH_HEIGHT_PRIMARY = 20;
const TEXT_HEIGHT_OFFSET = 40;

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

    ctx.strokeStyle = '#afafaf';  // Black color
    ctx.lineWidth = 2;  // Set line thickness
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y+rect.height/2);
    ctx.lineTo(rect.x+rect.width, rect.y+rect.height/2);
    ctx.stroke();
    ctx.strokeStyle = '#000000';  // Black color
    units.forEach((conf, index) => {
        const isMainUnit = index === 0;
        const fontSize = isMainUnit ? 20 : 16;
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';

        let current = viewport.min.startOf(conf.timeUnit);
        while (current <= viewport.max && current.get(conf.getTimeUnit) % conf.step !== 0) {
            current = current.plus({ [conf.timeUnit]: 1 });
        }
        // console.log("current", current.get(conf.getTimeUnit))
        while (current <= viewport.max) {
            if (current >= viewport.min) {
                const x = (current.diff(viewport.min).as('milliseconds') / interval.length('milliseconds')) * rect.width + rect.x;
                drawNotch(ctx, x, rect.y+rect.height/2, isMainUnit, isMainUnit ? formatTime(current, conf.timeUnit) : undefined);
            }
            current = current.plus({ [conf.timeUnit]: conf.step });
        }
    });
}