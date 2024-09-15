import React, { useRef, useEffect } from 'react';
import {renderTimeAxis} from "../time-axis/TimeAxis.tsx";
import {DateTime} from "luxon";

const Canvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

            // ctx.scale(ratio, ratio);

            drawTestElements(ctx);
        };

        const drawTestElements = (context: CanvasRenderingContext2D) => {
            const { innerWidth, innerHeight } = window;
            const { devicePixelRatio: ratio = 1 } = window;
            console.log("ratio", ratio)
            console.log("innerWidth", innerWidth)
            console.log("innerHeight", innerHeight)
            // Clear the canvas
            // context.clearRect(0, 0, 10, innerHeight * ratio-100);

            renderTimeAxis(
                context,
                DateTime.fromObject({ year: 1000 }),
                DateTime.fromObject({ year: 1001 }),
                {height: 100 * ratio, width: innerWidth * ratio - 200, x: 100, y: 0}
            );
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
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
    );
};

export default Canvas;