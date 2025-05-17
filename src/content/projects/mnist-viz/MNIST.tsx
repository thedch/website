import { CreateMLCEngine, MLCEngine } from "@mlc-ai/web-llm";
import { useCallback, useState, useEffect } from 'react';

interface ProgressUpdate {
    progress: number;
    timeElapsed: number;
    text: string;
}

const MODEL_ID = "Qwen2.5-0.5B-Instruct-q4f16_1-MLC";

const MNISTViz: React.FC = () => {

    const [isInferencing, setIsInferencing] = useState(false);
    const [engine, setEngine] = useState<MLCEngine | null>(null);
    const [modelResponse, setModelResponse] = useState<string>('');
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [initProgress, setInitProgress] = useState<ProgressUpdate | null>(null);

    const [userInput, setUserInput] = useState<string>("What color is the sun?");

    useEffect(() => {
        if (engine) return;

        setIsModelLoading(true);
        const initEngine = async () => {
            try {
                const engine = await CreateMLCEngine(
                    MODEL_ID,
                    { initProgressCallback: (progress: ProgressUpdate) => {setInitProgress(progress); } },
                );
                setEngine(engine);
            } catch (error) {
                console.error('Failed to initialize MLCEngine:', error);
            } finally {
                setIsModelLoading(false);
            }
        };

        initEngine();
    }, []);

    const runInference = useCallback(async () => {
        if (!engine || isInferencing) return;

        setIsInferencing(true);
        try {
            const messages = [
                { role: "system" as const, content: "You are a helpful AI assistant." },
                { role: "user" as const, content: userInput },
            ];

            const startTime = performance.now();
            const reply = await engine.chat.completions.create({ messages });
            const endTime = performance.now();
            const timeElapsed = endTime - startTime;
            const generatedTokens = reply.usage?.completion_tokens || 0;
            const promptTokens = reply.usage?.prompt_tokens || 0;
            const msg = `Time: ${timeElapsed.toFixed(1)}ms, Output Tokens: ${generatedTokens}, Prompt Tokens: ${promptTokens}`;

            setModelResponse(reply.choices[0].message.content + '\n\n' + msg);
        } catch (error) {
            console.error('Model chat failed:', error);
            setModelResponse('Failed to get response from model');
        } finally {
            setIsInferencing(false);
        }
    }, [engine, userInput]);

    return (
        <div className="flex flex-col items-center gap-4">
            <h2 className="text-2xl font-bold mb-4">Model: {MODEL_ID}</h2>
            <div className="mt-4 p-4 bg-gray-100 rounded-lg w-full max-w-2xl">
                <div className="mb-4">
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="w-full p-2 border rounded"
                        rows={4}
                        placeholder="Enter your message here..."
                        disabled={isModelLoading || isInferencing}
                    />
                    <button
                        onClick={runInference}
                        disabled={isModelLoading || isInferencing || !engine}
                        className={`mt-2 px-4 py-2 bg-blue-500 text-white rounded transition-colors ${
                            isModelLoading || isInferencing || !engine
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:bg-blue-600'
                        }`}
                    >
                        {isInferencing ? 'Generating...' : 'Generate Response'}
                    </button>
                </div>

                {isModelLoading && (
                    <div className="text-gray-600">
                        <div>Loading model...</div>
                        {initProgress && (
                            <div className="mt-2">
                                <div>Progress: {initProgress.progress.toFixed(2)}%</div>
                                <div>Time Elapsed: {initProgress.timeElapsed.toFixed(1)}s</div>
                                <div>Status: {initProgress.text}</div>
                            </div>
                        )}
                    </div>
                )}

                {!isModelLoading && (
                    <>
                        {modelResponse && <h3 className="font-bold mb-2">Model Response:</h3>}
                        {isInferencing ? (
                            <div className="text-gray-600">Generating response...</div>
                        ) : (
                            <div className="whitespace-pre-wrap">{modelResponse}</div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MNISTViz;