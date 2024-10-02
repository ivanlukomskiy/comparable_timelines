import {mouseToTime} from "../types.ts";
import React, {useEffect} from "react";
import {$timelineRect} from "../stores/store.ts";
import {$viewport, setPanSpeed, setZoomSpeed} from "../stores/viewport.ts";


const ZOOM_SPEED = 0.5;
const PAN_SPEED = 0.15;

interface UseViewPortProps {
    canvasRef:  React.MutableRefObject<HTMLCanvasElement | null>;
}

export function useZoom({canvasRef}: UseViewPortProps) {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const handleWheel = (e: WheelEvent) => {
            console.log('wheeling')
            e.preventDefault();
            const vertical = Math.abs(e.deltaY) > Math.abs(e.deltaX);
            if (vertical) {
                const pivot = mouseToTime(e.offsetX, $timelineRect.get(), $viewport.get());
                if (!pivot) {
                    return;
                }
                const zoomSpeed = e.deltaY > 0 ? 1 / (1 + ZOOM_SPEED) : (1 + ZOOM_SPEED);
                setZoomSpeed(pivot, zoomSpeed)
            } else {
                setPanSpeed(e.deltaX > 0 ? -PAN_SPEED : PAN_SPEED)
            }
        }
        canvas.addEventListener('wheel', handleWheel);
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [canvasRef]);
}
