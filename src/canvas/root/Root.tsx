import React, {useCallback, useEffect, useRef} from 'react';
import {renderTimeAxis} from "../time-axis/TimeAxis.tsx";
import {useViewPort} from "../../hooks/useZoom.ts";
import {$animationTimestasmp, $timelineRect, $zooming} from "../../store.ts";


const Canvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const animationFrameId = useRef<number | null>(null);
    const updateViewport = useViewPort({canvasRef})
    const updateViewportRef = useRef<(() => void)>(updateViewport);
    useEffect(() => {
        updateViewportRef.current = updateViewport;
    }, [updateViewport]);

    const drawCanvas = useCallback((animationTimestamp: number) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        $animationTimestasmp.set(animationTimestamp);
        updateViewportRef.current();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderTimeAxis(ctx);
        if ($zooming.get()) {
            animationFrameId.current = requestAnimationFrame(drawCanvas);
        }
    }, []);

    useEffect(() => {
        const unsubscribe = $zooming.subscribe((zooming) => {
            if (zooming) {
                animationFrameId.current = requestAnimationFrame(drawCanvas);
            }
        })
        return () => {
            unsubscribe();
        }
    }, [drawCanvas]);

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
                y: 0,
                width: innerWidth * ratio - 300,
                height: innerHeight * ratio / 10,
            })
            animationFrameId.current = requestAnimationFrame(drawCanvas);
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, [drawCanvas]);

    useEffect(() => {
        console.log('init')
        animationFrameId.current = requestAnimationFrame(drawCanvas);
    }, []);

    // useEffect(() => {
    //     const canvas = canvasRef.current;
    //     if (!canvas) return;
    //
    //     const resizeCanvas = () => {
    //         const {innerWidth, innerHeight} = window;
    //         const {devicePixelRatio: ratio = 1} = window;
    //         canvas.width = innerWidth * ratio;
    //         canvas.height = innerHeight * ratio;
    //         canvas.style.width = `${innerWidth}px`;
    //         canvas.style.height = `${innerHeight}px`;
    //     };
    //
    //     window.addEventListener('resize', resizeCanvas);
    //     resizeCanvas();
    //
    //     console.log('request animation frame')
    //     animationFrameId.current = requestAnimationFrame(drawCanvas);
    //
    //     return () => {
    //         console.log('removeing')
    //         window.removeEventListener('resize', resizeCanvas);
    //         if (animationFrameId.current) {
    //             cancelAnimationFrame(animationFrameId.current);
    //         }
    //     };
    // }, [drawCanvas]);


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