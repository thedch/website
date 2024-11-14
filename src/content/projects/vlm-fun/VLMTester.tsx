import React, { useState, useRef, useEffect } from 'react';

interface OutputType {
  duration_ms: number;
  output: string;
}

const VideoVLMComponent = () => {
  const [outputs, setOutputs] = useState<OutputType[]>([]);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL('./vlm.worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.addEventListener('message', (e) => {
        console.log('Received message from worker:', e.data);
        if (e.data.status === 'complete') {
          setOutputs(prev => [...prev, {
            duration_ms: e.data.duration_ms,
            output: e.data.output
          }]);
        } else if (e.data.status === 'error') {
          console.error('VLM Error:', e.data.error);
        }
      });
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && workerRef.current) {
      const blob = new Blob([file], { type: file.type });
      workerRef.current.postMessage({ image: blob });
    }
  };

  return (
    <div>
      <h1>Vision-Language Model Image Processing</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <h2>Outputs:</h2>
      <pre>{JSON.stringify(outputs, null, 2)}</pre>
    </div>
  );
};

export default VideoVLMComponent;