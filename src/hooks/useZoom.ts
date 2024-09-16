import {applyPan, applyZoom, mouseToTime} from "../types.ts";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {DateTime} from "luxon";
import {$animationTimestasmp, $timelineRect, $viewport, $zooming} from "../store.ts";


const WHEEL_TIMEOUT_MS = 500;
const ZOOM_SPEED = 0.5;
const PAN_SPEED = 0.15;

interface UseViewPortProps {
    canvasRef:  React.MutableRefObject<HTMLCanvasElement | null>;
}

export function useViewPort({canvasRef}: UseViewPortProps): () => void {
    const [zoomSpeed, setZoomSpeed] = useState<null | number>(null);
    const [panSpeed, setPanSpeed] = useState<null | number>(null);
    const [zoomPivot, setZoomPivot] = useState<null | DateTime>(null)
    const wheelTimeout = useRef<null | number>(null);
    const [changeStartedTime, setChangeStartedTime] = useState<null | number>(null)
    const [lastTimestampHandled, setLastTimestampHandled] = useState<null | number>(null)

    const resetWheelTimeout = useCallback(() => {
        if (wheelTimeout.current) {
            clearInterval(wheelTimeout.current)
        }
        $zooming.set(true)
        wheelTimeout.current = setInterval(() => {
            setZoomSpeed(null)
            setPanSpeed(null)
            setZoomPivot(null)
            setChangeStartedTime(null);
            setLastTimestampHandled(null);
            $zooming.set(false)
        }, WHEEL_TIMEOUT_MS)
    }, [wheelTimeout])

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const handleWheel = (e: WheelEvent) => {
            console.log('wheeling')
            e.preventDefault();
            const time = mouseToTime(e.offsetX, $timelineRect.get(), $viewport.get());
            if (!time) {
                return;
            }
            const vertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
            // todo adjust for the actual speed
            if (panSpeed === null && (zoomSpeed !== null || vertical)) {
                const base = e.deltaY > 0 ? 1 / (1 + ZOOM_SPEED) : (1 + ZOOM_SPEED);
                console.log("e.deltaY", e.deltaY, base * e.deltaY)
                setZoomSpeed(base * e.deltaY)
                setZoomPivot(time);
                setChangeStartedTime(new Date().getTime());
            } else if (zoomSpeed === null && (panSpeed !== null || !vertical)) {
                setPanSpeed(e.deltaX > 0 ? -PAN_SPEED : PAN_SPEED);
                setChangeStartedTime(new Date().getTime());
            }
            resetWheelTimeout()
        }
        canvas.addEventListener('wheel', handleWheel);
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [canvasRef, panSpeed, resetWheelTimeout, zoomSpeed]);

    return useCallback(() => {
        if (changeStartedTime === null) {
            return;
        }
        if (lastTimestampHandled === null) {
            setLastTimestampHandled($animationTimestasmp.get());
            return;
        }
        setLastTimestampHandled($animationTimestasmp.get());
        const deltaSeconds = ($animationTimestasmp.get() - lastTimestampHandled) / 1000;
        console.log("delta", deltaSeconds)
        if (zoomPivot !== null && zoomSpeed !== null) {
            $viewport.set(applyZoom($viewport.get(), zoomPivot, Math.pow(zoomSpeed, deltaSeconds)));
        }
        if (panSpeed !== null) {
            $viewport.set(applyPan($viewport.get(), panSpeed * deltaSeconds));
        }
    }, [changeStartedTime, lastTimestampHandled, panSpeed, zoomPivot, zoomSpeed]);
}