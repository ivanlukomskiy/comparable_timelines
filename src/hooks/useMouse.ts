import React, {useEffect} from "react";
import {mouseToTime} from "../types.ts";
import {$timelineRect} from "../stores/store.ts";
import {$viewport, dragEnded, dragStarted} from "../stores/viewport.ts";
import {$mouseDate, $mouseX} from "../stores/mouse.ts";

interface UseMouseProps {
    canvasRef:  React.MutableRefObject<HTMLCanvasElement | null>;
}

export function useMouse({canvasRef}: UseMouseProps) {
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const handleMouse = (e: MouseEvent) => {
            e.preventDefault();
            const mouseX = e.offsetX * devicePixelRatio;
            $mouseX.set(mouseX)
            const pivot = mouseToTime(mouseX, $timelineRect.get(), $viewport.get());
            if (!pivot) {
                $mouseDate.set(null);
                return;
            }
            if (e.type === 'mousemove') {
                $mouseDate.set(pivot);
                // const prevDraggingTime = $prevMouseDrag.get();
                // if (prevDraggingTime) {
                //     $viewport.
                // }
            }
            if (e.type === 'mousedown') {
                dragStarted(mouseX);
                // $prevMouseDrag.set(pivot);
            }
            if (e.type === 'mouseup') {
                dragEnded(mouseX);
                // $prevMouseDrag.set(null);
            }
        }
        canvas.addEventListener('mousemove', handleMouse);
        canvas.addEventListener('mousedown', handleMouse);
        canvas.addEventListener('mouseup', handleMouse);
        canvas.addEventListener('mouseleave', handleMouse);
        return () => {
            canvas.removeEventListener('mousemove', handleMouse);
            canvas.removeEventListener('mousedown', handleMouse);
            canvas.removeEventListener('mouseup', handleMouse);
            canvas.removeEventListener('mouseleave', handleMouse);
        };
    }, [canvasRef]);
}