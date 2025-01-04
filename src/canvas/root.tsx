import React, {useCallback, useEffect, useRef} from 'react';
import {renderTimeAxis} from "./timeAxis.ts";
import {$timelineRect} from "../stores/store.ts";
import {updateViewport} from "../stores/viewport.ts";
import {processRequests} from "../stores/animation.ts";
import {useZoom} from "../hooks/useZoom.ts";
import {onRendered} from "../stores/debug.ts";
import {useMouse} from "../hooks/useMouse.ts";
import {renderMarker} from "./marker.ts";
import {pack, renderRows} from "./events.ts";

const Canvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    useZoom({canvasRef});
    useMouse({canvasRef});

    const drawCanvas = useCallback((animationTimestamp: number) => {
        processRequests(animationTimestamp);
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        updateViewport(animationTimestamp)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // renderFpsMeter(180, 100, ctx);
        const packed = pack(ctx, 30);
        const eventsSectionHeight = packed.height;
        const timelineRect = $timelineRect.get();
        $timelineRect.set({
            ...timelineRect,
            y: 30 + eventsSectionHeight - 30,
        })
        renderMarker(ctx, eventsSectionHeight);
        renderTimeAxis(ctx);
        renderRows(ctx, packed);

        onRendered();
        requestAnimationFrame(drawCanvas);
    }, []);

    useEffect(() => {
        requestAnimationFrame(drawCanvas)
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        const resizeCanvas = () => {
            const {innerWidth, innerHeight} = window;
            const {devicePixelRatio: ratio = 1} = window;
            canvas.width = innerWidth * ratio;
            canvas.height = innerHeight * ratio;
            canvas.style.width = `${innerWidth}px`;
            canvas.style.height = `${innerHeight}px`;
            $timelineRect.set({
                x: 150,
                y: 100,
                width: innerWidth * ratio - 300,
                height: innerHeight * ratio / 10,
            })
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [drawCanvas]);

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