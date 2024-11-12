import { useCallback, useState, useRef, useEffect } from 'react';

interface GridCell {
    value: number;
}

const GRID_SIZE = 28;
const CELL_SIZE = 12; // Changed from 16 to 12

function calculateIntensity(mouseX: number, mouseY: number, cellX: number, cellY: number): number {
    const centerX = cellX * CELL_SIZE + CELL_SIZE / 2;
    const centerY = cellY * CELL_SIZE + CELL_SIZE / 2;

    const distance = Math.sqrt(
        Math.pow(mouseX - centerX, 2) +
        Math.pow(mouseY - centerY, 2)
    );

    const intensity = Math.max(0, 1 - (distance / (CELL_SIZE / 1.5)));
    return Math.min(1, intensity);
}

function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

interface DrawingGridProps {
  onGridChange?: (grid: GridCell[][]) => void;
  disabled?: boolean;
}

function DrawingGrid({ onGridChange, disabled }: DrawingGridProps) {
    const [grid, setGrid] = useState<GridCell[][]>(() =>
        Array(GRID_SIZE).fill(null).map(() =>
            Array(GRID_SIZE).fill(null).map(() => ({ value: 0 }))
        )
    );
    const [isDrawing, setIsDrawing] = useState(false);
    const gridRef = useRef<HTMLDivElement>(null);

    const handleDraw = useCallback((e: React.MouseEvent) => {
        if (!isDrawing || !gridRef.current || disabled) return;

        const rect = gridRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setGrid(prevGrid => {
            const newGrid = [...prevGrid.map(row => [...row])];

            // Update cells near the mouse position
            for (let y = 0; y < GRID_SIZE; y++) {
                for (let x = 0; x < GRID_SIZE; x++) {
                    const intensity = calculateIntensity(mouseX, mouseY, x, y);
                    if (intensity > 0) {
                        newGrid[y][x].value = Math.max(newGrid[y][x].value, intensity);
                    }
                }
            }

            onGridChange?.(newGrid);
            return newGrid;
        });
    }, [isDrawing, onGridChange, disabled]);

    const resetGrid = useCallback(() => {
        const newGrid = Array(GRID_SIZE).fill(null).map(() =>
            Array(GRID_SIZE).fill(null).map(() => ({ value: 0 }))
        );
        setGrid(newGrid);
        onGridChange?.(newGrid);
    }, [onGridChange]);

    return (
        <div className="flex flex-col items-center">
            <div
                ref={gridRef}
                className={`select-none ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                    gap: '1px',
                    background: '#ccc',
                    padding: '1px',
                    width: 'fit-content'
                }}
                onMouseDown={(e) => !disabled && setIsDrawing(true)}
                onMouseUp={() => setIsDrawing(false)}
                onMouseLeave={() => setIsDrawing(false)}
                onMouseMove={handleDraw}
            >
                {grid.flat().map((cell, i) => (
                    <div
                        key={i}
                        style={{
                            width: CELL_SIZE,
                            height: CELL_SIZE,
                            background: `rgb(${255 - cell.value * 255}, ${255 - cell.value * 255}, ${255 - cell.value * 255})`,
                        }}
                    />
                ))}
            </div>
            <button
                onClick={resetGrid}
                disabled={disabled}
                className={`mt-4 px-4 py-2 bg-blue-500 text-white rounded transition-colors ${
                    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
                }`}
            >
                Reset
            </button>
        </div>
    );
}

const MNISTViz: React.FC = () => {
    const [outputValues, setOutputValues] = useState<number[]>([0, 0, 0]);
    const [session, setSession] = useState<any>(null);
    const [isInferencing, setIsInferencing] = useState(false);

    useEffect(() => {
        const initSession = async () => {
            try {
                const ortModule = await import('onnxruntime-web');

                ortModule.env.wasm.wasmPaths = {
                    wasm: 'https://pub-754e944a99104f389ba0e6fc4993795b.r2.dev/ort-wasm-simd-threaded.wasm'
                };

                const sessionOptions = {
                    executionProviders: ['wasm'],
                    graphOptimizationLevel: 'all' as const
                };

                const response = await fetch('/models/mnist_model.onnx');
                const arrayBuffer = await response.arrayBuffer();
                const modelUint8Array = new Uint8Array(arrayBuffer);

                const session = await ortModule.InferenceSession.create(
                    modelUint8Array,
                    sessionOptions
                );
                setSession(session);
            } catch (e) {
                console.error('Failed to load ONNX model:', e);
            }
        };

        if (typeof window !== 'undefined') {
            initSession();
        }
    }, []);

    const debouncedInference = useCallback(
        debounce(async (grid: number[][]) => {
            if (!session) return;
            setIsInferencing(true);
            try {
                const ortModule = await import('onnxruntime-web');
                const input = new Float32Array(1 * 1 * 28 * 28);
                const mean = 0.1307;
                const std = 0.3081;
                for (let i = 0; i < 28; i++) {
                    for (let j = 0; j < 28; j++) {
                        input[i * 28 + j] = (grid[i][j] - mean) / std;
                    }
                }

                const tensor = new ortModule.Tensor('float32', input, [1, 1, 28, 28]);
                const results = await session.run({ input: tensor });
                const output = results.output.data as Float32Array;

                const softmax = Array.from(output).map(x => Math.exp(x));
                const sum = softmax.reduce((a, b) => a + b, 0);
                const probs = softmax.map(x => x / sum);

                setOutputValues(probs);
            } catch (e) {
                console.error('Inference failed:', e);
            } finally {
                setIsInferencing(false);
            }
        }, 100),
        [session]
    );

    return (
        <div className="flex flex-col items-center gap-4">
            <DrawingGrid
                onGridChange={(grid) => {
                    const input = grid.map(row => row.map(cell => cell.value));
                    debouncedInference(input);
                }}
                disabled={isInferencing}
            />

            <div className="flex gap-2 p-4 bg-gray-100 rounded-lg">
                {isInferencing ? (
                    <div className="text-gray-600">Processing...</div>
                ) : (
                    outputValues.map((value, i) => (
                        <div
                            key={i}
                            className="w-16 h-16 rounded flex items-center justify-center"
                            style={{
                                backgroundColor: `rgba(59, 130, 246, ${value})`
                            }}
                        >
                            {value.toFixed(2)}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MNISTViz;