import React, {useEffect} from "react";
import {mouseToTime} from "../types.ts";
import {$timelineRect} from "../stores/store.ts";
import {$viewport} from "../stores/viewport.ts";
import {$mouseDate} from "../stores/mouse.ts";

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
            const pivot = mouseToTime(e.offsetX * devicePixelRatio, $timelineRect.get(), $viewport.get());
            if (!pivot) {
                $mouseDate.set(null);
                return;
            }
            if (e.type === 'mousemove') {
                $mouseDate.set(pivot);
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