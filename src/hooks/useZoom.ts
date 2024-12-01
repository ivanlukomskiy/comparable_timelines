import {mouseToTime} from "../types.ts";
import React, {useEffect} from "react";
import {$timelineRect} from "../stores/store.ts";
import {$viewport, startZoom} from "../stores/viewport.ts";


const ZOOM_SPEED = 0.01;

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
            const pivot = mouseToTime(e.offsetX, $timelineRect.get(), $viewport.get());
            if (!pivot) {
                return;
            }
            const advance = 1 + ZOOM_SPEED * Math.abs(e.deltaY);
            const targetZoom = e.deltaY < 0 ? 1 / advance : advance;
            console.log("targetZoom", targetZoom, e.deltaY)
            startZoom(pivot, targetZoom);
        }
        canvas.addEventListener('wheel', handleWheel);
        return () => {
            canvas.removeEventListener('wheel', handleWheel);
        };
    }, [canvasRef]);
}
