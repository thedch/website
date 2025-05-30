import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1; // Disable multithreading for WebGPU
env.backends.onnx.preferredBackend = 'webgpu';

console.log('Worker initialized');

class VLMPipeline {
    static task = 'image-to-text' as const;
    // static model = 'https://assets.dch.xyz/models/Xenova/vit-gpt2-image-captioning';
    static model = 'Xenova/vit-gpt2-image-captioning';
    static instance: any = null;

    static async getInstance(progress_callback?: (progress: any) => void) {
        if (this.instance === null) {
            this.instance = pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    console.log('Worker received message:', event.data);
    const { image } = event.data;

    try {
        console.log('Getting pipeline instance...');
        let generator = await VLMPipeline.getInstance(x => {
            console.log('Pipeline progress:', x);
            self.postMessage(x);
        });

        console.log('Processing image...');

        const start = performance.now();
        const imageURL = URL.createObjectURL(image);
        const output = await generator(imageURL);
        console.log('Processing complete:', output);

        self.postMessage({
            status: 'complete',
            duration_ms: performance.now() - start,
            output: output[0].generated_text
        });
    } catch (error: any) {
        console.error('Worker error:', error);
        self.postMessage({
            status: 'error',
            error: error.message
        });
    }
});