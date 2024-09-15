import React, {useRef, useEffect, useState, useCallback} from 'react';
import {renderTimeAxis} from "../time-axis/TimeAxis.tsx";
import {DateTime, Duration} from "luxon";

const TIMELINE_PADDING_LEFT = 150;
const TIMELINE_PADDING_RIGHT = 50;
const DELTA_Y_THRESHOLD = .5;
const DELTA_X_THRESHOLD = .5;
const ZOOM_SPEED = 0.05;
const PAN_SPEED = 0.015;
const WHEEL_TIMEOUT_MS = 500;

const Canvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [minTime, setMinTime] = useState<DateTime>(DateTime.fromObject({ year: 1000 }));
    const [maxTime, setMaxTime] = useState<DateTime>(DateTime.fromObject({ year: 1002 }));
    const wheelTimeout = useRef<number | null>(null);
    const isZoom = useRef<boolean>(false);
    const animationFrameId = useRef<number | null>(null);
    const prevTimestamp = useRef<number | null>(null);
    const panSpeed = useRef(0);
    const zoomSpeed = useRef(1);
    const zoomPivot = useRef<DateTime | null>(null)

    const applyZoomPan = useCallback((timeDelta: number) => {
        const currentWindow = maxTime.diff(minTime);
        if (!zoomPivot.current) {
            return;
        }
        const fraction = zoomPivot.current.diff(minTime).as('milliseconds') / currentWindow.as('milliseconds');
        const newWindow = currentWindow.mapUnits(unit => unit * zoomSpeed.current * timeDelta);
        const timeDeltaX = currentWindow.as("milliseconds") * panSpeed.current * timeDelta;
        setMinTime(zoomPivot.current.minus(Duration.fromMillis(newWindow.as("milliseconds") * fraction)).plus(timeDeltaX));
        setMaxTime(zoomPivot.current.plus(Duration.fromMillis(newWindow.as("milliseconds") * (1 - fraction))).plus(timeDeltaX));
    }, [minTime, maxTime]);

    const drawCanvas = useCallback((timestamp: number) => {
        const newZooming = prevTimestamp.current == null;
        console.log("prevTimestamp.current", prevTimestamp.current)
        prevTimestamp.current = timestamp;
        if (newZooming) {
            return;
        }
        applyZoomPan(timestamp - prevTimestamp.current)

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { innerWidth } = window;
        const { devicePixelRatio: ratio = 1 } = window;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        renderTimeAxis(
            ctx,
            minTime,
            maxTime,
            {
                height: 100 * ratio,
                width: innerWidth * ratio - TIMELINE_PADDING_LEFT - TIMELINE_PADDING_RIGHT,
                x: TIMELINE_PADDING_LEFT,
                y: 0,
            }
        );
        if (wheelTimeout.current) {
            animationFrameId.current = requestAnimationFrame(drawCanvas);
        }

    }, [applyZoomPan, minTime, maxTime]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            const { innerWidth, innerHeight } = window;
            const { devicePixelRatio: ratio = 1 } = window;
            canvas.width = innerWidth * ratio;
            canvas.height = innerHeight * ratio;
            canvas.style.width = `${innerWidth}px`;
            canvas.style.height = `${innerHeight}px`;
            drawTestElements(ctx);
        };

        const drawTestElements = (context: CanvasRenderingContext2D) => {
            const { innerWidth } = window;
            const { devicePixelRatio: ratio = 1 } = window;
            renderTimeAxis(
                context,
                minTime,
                maxTime,
                {
                    height: 100 * ratio,
                    width: innerWidth * ratio - TIMELINE_PADDING_LEFT - TIMELINE_PADDING_RIGHT,
                    x: TIMELINE_PADDING_LEFT,
                    y: 0,
                }
            );
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [minTime, maxTime]);

    const mouseToTime = useCallback((x: number): DateTime | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const transformedX = (x - rect.left) * scaleX;
        if (transformedX < TIMELINE_PADDING_LEFT
            || transformedX > canvas.width - TIMELINE_PADDING_RIGHT) return null;
        const fraction = (transformedX - TIMELINE_PADDING_LEFT) / (canvas.width - TIMELINE_PADDING_RIGHT - TIMELINE_PADDING_LEFT);
        const diff: Duration = maxTime.diff(minTime);
        const interpolatedDuration: Duration = diff.mapUnits(unit => unit * fraction);
        return minTime.plus(interpolatedDuration);
    }, [minTime, maxTime]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const { innerWidth, innerHeight } = window;
            const { devicePixelRatio: ratio = 1 } = window;
            canvas.width = innerWidth * ratio;
            canvas.height = innerHeight * ratio;
            canvas.style.width = `${innerWidth}px`;
            canvas.style.height = `${innerHeight}px`;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        console.log('request animation frame')
        animationFrameId.current = requestAnimationFrame(drawCanvas);

        return () => {
            console.log('removeing')
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [drawCanvas]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (e: WheelEvent) => {
            console.log('wheeling')
            e.preventDefault();
            const time = mouseToTime(e.offsetX);
            if (!time) return;
            zoomPivot.current = time;

            if (!wheelTimeout.current) {
                isZoom.current = Math.abs(e.deltaY) > Math.abs(e.deltaX);
            } else {
                clearTimeout(wheelTimeout.current);
            }
            wheelTimeout.current = window.setTimeout(() => {
                wheelTimeout.current = null;
            }, WHEEL_TIMEOUT_MS);

            if (Math.abs(e.deltaY) > DELTA_Y_THRESHOLD && isZoom.current) {
                zoomSpeed.current = e.deltaY > 0 ? 1 / (1 + ZOOM_SPEED) : (1 + ZOOM_SPEED);
                panSpeed.current = 0;
            }
            if (Math.abs(e.deltaX) > DELTA_X_THRESHOLD && !isZoom.current) {
                panSpeed.current = e.deltaX > 0 ? -PAN_SPEED : PAN_SPEED;
                zoomSpeed.current = 1;
            }
        }

        canvas.addEventListener('wheel', handleWheel);
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [mouseToTime]);

    return (
        <>
        <canvas
            ref={canvasRef}
            style={{
                display: 'block',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
            }}
        />
            <div style={{position: 'absolute', top: '0', left: '0', color: 'black', padding: '10px'}}>

            </div>
        </>
    );
};

export default Canvas;