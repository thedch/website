import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { AutoModel, AutoTokenizer } from '@huggingface/transformers';
import { UMAP } from 'umap-js';

interface Point3D {
  x: number;
  y: number;
  z: number;
  text: string;
  embedding: number[];
}

const EmbeddingVisualization: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const pointsRef = useRef<THREE.Points>();
  const frameIdRef = useRef<number>();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [texts, setTexts] = useState<string[]>([
    'The quick brown fox jumps over the lazy dog',
    'Machine learning is transforming technology',
    'Data visualization helps understand complex patterns',
    'Neural networks can process natural language',
    'Embeddings capture semantic meaning in text',
    'Three.js enables 3D graphics in web browsers',
    'Python is popular for data science applications',
    'Artificial intelligence is advancing rapidly',
    'Algorithms solve computational problems efficiently',
    'Programming languages enable software development'
  ]);
  const [newText, setNewText] = useState('');
  const [points, setPoints] = useState<Point3D[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<Point3D | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedPoint, setSelectedPoint] = useState<Point3D | null>(null);
  const isMouseDownRef = useRef(false);
  const [colorMode, setColorMode] = useState<'rainbow' | 'similarity'>('rainbow');

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);
    sceneRef.current = scene;

    // Camera positioned to better show negative Z region
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const distance = 120;
    const angle = Math.PI / 4; // 45 degrees
    camera.position.set(
      distance * Math.cos(angle), // X
      distance * Math.sin(angle), // Y (45 degrees above horizon)
      distance * Math.cos(angle) * 0.5  // Z - positioned to better see negative Z
    );
    camera.lookAt(0, 0, -10); // Look slightly towards negative Z
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Add XYZ axis helpers with enhanced visibility
    const axisHelper = new THREE.AxesHelper(25);
    scene.add(axisHelper);

    // Add multiple grid helpers for better spatial understanding
    // XY plane at Z=0
    const gridHelperXY = new THREE.GridHelper(50, 25, 0x444444, 0x222222);
    gridHelperXY.position.set(0, 0, 0);
    scene.add(gridHelperXY);

    // XZ plane at Y=0 (shows negative Z more clearly)
    const gridHelperXZ = new THREE.GridHelper(50, 25, 0x444444, 0x222222);
    gridHelperXZ.rotation.x = Math.PI / 2;
    gridHelperXZ.position.set(0, 0, 0);
    scene.add(gridHelperXZ);

    // YZ plane at X=0 (shows negative Z from side view)
    const gridHelperYZ = new THREE.GridHelper(50, 25, 0x444444, 0x222222);
    gridHelperYZ.rotation.z = Math.PI / 2;
    gridHelperYZ.position.set(0, 0, 0);
    scene.add(gridHelperYZ);

    // Add Z=0 plane indicator (semi-transparent plane)
    const planeGeometry = new THREE.PlaneGeometry(50, 50);
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide
    });
    const zZeroPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    zZeroPlane.rotation.x = Math.PI / 2; // Rotate to be horizontal
    scene.add(zZeroPlane);

    // Add negative Z region indicator
    const negativeZPlane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide
    }));
    negativeZPlane.rotation.x = Math.PI / 2;
    negativeZPlane.position.z = -10; // Position in negative Z
    scene.add(negativeZPlane);

    // Add axis labels for better orientation
    const createTextSprite = (text: string, position: THREE.Vector3, color: string = '#ffffff') => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 128;
      canvas.height = 64;

      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.fillStyle = color;
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(material);
      sprite.position.copy(position);
      sprite.scale.set(8, 4, 1);
      return sprite;
    };

    // Add axis labels
    scene.add(createTextSprite('+X', new THREE.Vector3(30, 0, 0), '#ff0000'));
    scene.add(createTextSprite('-X', new THREE.Vector3(-30, 0, 0), '#ff0000'));
    scene.add(createTextSprite('+Y', new THREE.Vector3(0, 30, 0), '#00ff00'));
    scene.add(createTextSprite('-Y', new THREE.Vector3(0, -30, 0), '#00ff00'));
    scene.add(createTextSprite('+Z', new THREE.Vector3(0, 0, 30), '#0000ff'));
    scene.add(createTextSprite('-Z', new THREE.Vector3(0, 0, -30), '#0000ff'));

    // Mouse controls
    let mouseX = 0, mouseY = 0;

    const handleMouseDown = (event: MouseEvent) => {
      isMouseDownRef.current = true;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isMouseDownRef.current) {
        // Update mouse position for tooltip
        const rect = renderer.domElement.getBoundingClientRect();
        setMousePosition({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        });
        return;
      }

      const deltaX = event.clientX - mouseX;
      const deltaY = event.clientY - mouseY;

      const spherical = new THREE.Spherical();
      spherical.setFromVector3(camera.position);
      spherical.theta -= deltaX * 0.01;
      spherical.phi += deltaY * 0.01;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));

      camera.position.setFromSpherical(spherical);
      camera.lookAt(0, 0, 0);

      mouseX = event.clientX;
      mouseY = event.clientY;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault(); // Prevent page scroll
      const distance = camera.position.length();
      const newDistance = Math.max(10, Math.min(200, distance + event.deltaY * 0.1));
      camera.position.normalize().multiplyScalar(newDistance);
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('wheel', handleWheel);

    // Animation loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Generate embeddings and update visualization
  const generateEmbeddings = useCallback(async () => {
    if (texts.length === 0) return;

    setIsLoading(true);
    setLoadingProgress('Loading model...');

    try {
      // Try the Xenova model with explicit remote files
      const model_id = "onnx-community/embeddinggemma-300m-ONNX";

      setLoadingProgress('Loading tokenizer...');
      const tokenizer = await AutoTokenizer.from_pretrained(model_id, {
        progress_callback: (data: any) => {
          if (data.status === 'downloading') {
            setLoadingProgress(`Downloading tokenizer: ${Math.round(data.progress)}%`);
          }
        }
      });

      setLoadingProgress('Loading embedding model...');
      const model = await AutoModel.from_pretrained(model_id, {
        dtype: 'fp32',
        progress_callback: (data: any) => {
          if (data.status === 'downloading') {
            setLoadingProgress(`Downloading model: ${Math.round(data.progress)}%`);
          }
        }
      });

      // Run inference with prefixed queries (as per Google's EmbeddingGemma format)
      const prefixes = {
        document: "title: none | text: ",
      };
      const prefixedTexts = texts.map(text => prefixes.document + text);

      setLoadingProgress('Generating embeddings...');
      const inputs = await tokenizer(prefixedTexts, { padding: true, truncation: true });
      const { sentence_embedding } = await model(inputs);

      // Extract embeddings
      const embeddings: number[][] = [];
      const embeddingData = sentence_embedding.data;
      const embeddingSize = sentence_embedding.dims[1]; // Get the embedding dimension

      console.log('Sentence embedding dims:', sentence_embedding.dims);
      console.log('Embedding size:', embeddingSize);
      console.log('Number of texts:', texts.length);

      for (let i = 0; i < texts.length; i++) {
        const start = i * embeddingSize;
        const end = start + embeddingSize;
        const embedding = Array.from(embeddingData.slice(start, end)) as number[];
        embeddings.push(embedding);
      }

      // Don't normalize embeddings - let UMAP use the full embedding space
      // L2 normalization collapses all points to unit sphere, removing spatial diversity
      const processedEmbeddings = embeddings;

      console.log('Generated embeddings count:', processedEmbeddings.length);
      console.log('First embedding sample:', processedEmbeddings[0]?.slice(0, 5));
      console.log('First embedding magnitude:', Math.sqrt(processedEmbeddings[0]?.reduce((sum: number, val: number) => sum + val * val, 0)));

      // Check embedding ranges for debugging
      const allValues = processedEmbeddings.flat();
      const minVal = Math.min(...allValues);
      const maxVal = Math.max(...allValues);
      const meanVal = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
      console.log('Embedding value ranges:', { min: minVal, max: maxVal, mean: meanVal });

      setLoadingProgress('Reducing dimensions with UMAP...');

      // Use UMAP to reduce to 3D with better parameters for spread
      const umap = new UMAP({
        nComponents: 3,
        nNeighbors: Math.min(15, Math.max(5, Math.floor(texts.length / 3))), // More neighbors for better structure
        minDist: 0.3, // Higher minDist for better spread
        spread: 2.0,  // Higher spread for more separation
        nEpochs: 500, // More epochs for better convergence
        learningRate: 1.0
      });

      console.log('UMAP config:', {
        nComponents: 3,
        nNeighbors: Math.min(15, Math.max(5, Math.floor(texts.length / 3))),
        minDist: 0.3,
        spread: 2.0,
        nEpochs: 500,
        learningRate: 1.0
      });

      const reducedEmbeddings = await umap.fitAsync(processedEmbeddings);
      console.log('Reduced embeddings:', reducedEmbeddings);
      console.log('Reduced embeddings shape:', reducedEmbeddings.length, 'x', reducedEmbeddings[0]?.length);

      // Check the range of reduced embeddings for better scaling
      const allReducedValues = reducedEmbeddings.flat();
      const minReduced = Math.min(...allReducedValues);
      const maxReduced = Math.max(...allReducedValues);
      const rangeReduced = maxReduced - minReduced;
      console.log('Reduced embedding ranges:', { min: minReduced, max: maxReduced, range: rangeReduced });

      // Calculate optimal scaling factor to utilize the 3D space better
      const targetRange = 40; // Target range for good 3D visualization
      const scaleFactor = rangeReduced > 0 ? targetRange / rangeReduced : 10; // Fallback if no range
      console.log('Calculated scale factor:', scaleFactor);

      // If points are still too clustered, apply additional scaling
      const finalScaleFactor = scaleFactor < 5 ? scaleFactor * 2 : scaleFactor;
      console.log('Final scale factor:', finalScaleFactor);

      // Create 3D points with adaptive scaling
      const newPoints: Point3D[] = texts.map((text, i) => ({
        x: reducedEmbeddings[i][0] * finalScaleFactor,
        y: reducedEmbeddings[i][1] * finalScaleFactor,
        z: reducedEmbeddings[i][2] * finalScaleFactor,
        text,
        embedding: processedEmbeddings[i]
      }));

      console.log('Created 3D points:', newPoints.map(p => ({ x: p.x, y: p.y, z: p.z, text: p.text.slice(0, 30) + '...' })));

      setPoints(newPoints);
      updateVisualization(newPoints);

      // Reset color mode when new embeddings are generated
      setSelectedPoint(null);
      setColorMode('rainbow');

    } catch (error) {
      console.error('Error generating embeddings:', error);
      setLoadingProgress('Error loading model');
    } finally {
      setIsLoading(false);
    }
  }, [texts]);

  // Update visualization when color mode or selection changes
  useEffect(() => {
    if (points.length > 0) {
      updateVisualization(points);
    }
  }, [colorMode, selectedPoint, points]);

  // Calculate cosine similarity between two embeddings
  const calculateSimilarity = useCallback((embedding1: number[], embedding2: number[]): number => {
    const dotProduct = embedding1.reduce((sum: number, val: number, i: number) => sum + val * embedding2[i], 0);
    // Since embeddings are normalized, dot product = cosine similarity
    return Math.max(0, dotProduct); // Clamp to 0-1 range
  }, []);

  // Update Three.js visualization
  const updateVisualization = useCallback((points: Point3D[]) => {
    if (!sceneRef.current || !rendererRef.current) return;

    console.log('updateVisualization called with points:', points.length);

    // Remove existing points
    if (pointsRef.current) {
      sceneRef.current.remove(pointsRef.current);
      console.log('Removed existing points from scene');
    }

    // Create new geometry and material
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);

    console.log('Creating geometry with positions array size:', positions.length);

    points.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;

      let color: THREE.Color;

      if (colorMode === 'similarity' && selectedPoint) {
        // Color by similarity to selected point
        const similarity = calculateSimilarity(point.embedding, selectedPoint.embedding);
        const hue = similarity * 120; // Green (120) for high similarity, Red (0) for low
        color = new THREE.Color().setHSL(hue / 360, 0.8, 0.6);
      } else {
        // Rainbow color based on position
        const hue = (i / points.length) * 360;
        color = new THREE.Color().setHSL(hue / 360, 0.7, 0.6);
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });

    console.log('Position sample:', positions.slice(0, 9)); // First 3 points
    console.log('Color sample:', colors.slice(0, 9));

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.0, // Much larger points
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      sizeAttenuation: true // Points get smaller with distance
    });

    const pointsMesh = new THREE.Points(geometry, material);
    sceneRef.current.add(pointsMesh);
    pointsRef.current = pointsMesh;

    console.log('Added points mesh to scene with', points.length, 'points');
    console.log('Point material size:', material.size);
    console.log('Scene children count:', sceneRef.current.children.length);

    // Add raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points!.threshold = 0.3;

    const handleMouseMove = (event: MouseEvent) => {
      if (!cameraRef.current || !pointsRef.current) return;

      const rect = rendererRef.current!.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObject(pointsRef.current);

      if (intersects.length > 0) {
        const index = intersects[0].index!;
        setHoveredPoint(points[index]);
      } else {
        setHoveredPoint(null);
      }
    };

    const handleClick = (event: MouseEvent) => {
      if (!cameraRef.current || !pointsRef.current) return;

      const rect = rendererRef.current!.domElement.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObject(pointsRef.current);

      if (intersects.length > 0) {
        const index = intersects[0].index!;
        const clickedPoint = points[index];
        setSelectedPoint(clickedPoint);
        setColorMode('similarity');

        // Fly camera to point
        const targetPosition = new THREE.Vector3(
          clickedPoint.x + 20,
          clickedPoint.y + 10,
          clickedPoint.z + 20
        );
        animateCamera(cameraRef.current.position, targetPosition);
      }
    };

    const animateCamera = (from: THREE.Vector3, to: THREE.Vector3) => {
      const startTime = Date.now();
      const duration = 1000; // 1 second

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);

        // Smooth easing
        const eased = 1 - Math.pow(1 - t, 3);

        cameraRef.current!.position.lerpVectors(from, to, eased);
        cameraRef.current!.lookAt(0, 0, 0);

        if (t < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    };

    rendererRef.current.domElement.addEventListener('mousemove', handleMouseMove);
    rendererRef.current.domElement.addEventListener('click', handleClick);

    return () => {
      rendererRef.current?.domElement.removeEventListener('mousemove', handleMouseMove);
      rendererRef.current?.domElement.removeEventListener('click', handleClick);
    };
  }, [colorMode, selectedPoint, calculateSimilarity]);

  const addText = () => {
    if (newText.trim()) {
      setTexts([...texts, newText.trim()]);
      setNewText('');
    }
  };

  const removeText = (index: number) => {
    const newTexts = texts.filter((_, i) => i !== index);
    setTexts(newTexts);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Intro Text */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          3D Embedding Visualizer
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Transform text into 3D visualizations using AI embeddings and UMAP dimensionality reduction.
          See how similar texts cluster together in 3D space, including the negative Z axis!
        </p>
      </div>

      {/* Text Input Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Add Texts to Visualize
        </h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Enter text to add to the visualization..."
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addText()}
            />
            <button
              onClick={addText}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors font-medium"
            >
              Add Text
            </button>
          </div>

          <button
            onClick={generateEmbeddings}
            disabled={isLoading || texts.length === 0}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Generating Embeddings...' : `Generate 3D Visualization (${texts.length} texts)`}
          </button>

          {isLoading && (
            <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
              {loadingProgress}
            </div>
          )}
        </div>

        {/* Text List */}
        {texts.length > 0 && (
          <div className="mt-6">
            <h3 className="font-medium mb-3 text-gray-900 dark:text-white">
              Texts to Visualize ({texts.length}):
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {texts.map((text, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                  <span className="flex-1">{text}</span>
                  <button
                    onClick={() => removeText(index)}
                    className="text-red-500 hover:text-red-700 text-lg font-bold px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* How It Works */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          How It Works
        </h2>
        <div className="space-y-6 text-sm text-gray-600 dark:text-gray-300">
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">1. AI Embeddings</h3>
            <p>Each text is converted into a high-dimensional vector using Google's EmbeddingGemma model, capturing semantic meaning.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">2. UMAP Reduction</h3>
            <p>UMAP reduces the high-dimensional embeddings to 3D coordinates while preserving the relationships between texts.</p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-white">3. 3D Visualization</h3>
            <p>Points are positioned in 3D space where similar texts cluster together. Click points to see similarity-based coloring!</p>
            <p>The visualization loads entirely in your browser using WebGL and WebAssembly - no server required. All the AI model inference happens locally, keeping your text private.</p>
          </div>
        </div>
      </div>

      {/* 3D Visualization */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              3D Visualization
            </h2>

            {points.length > 0 && (
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (cameraRef.current) {
                      const distance = 120;
                      const angle = Math.PI / 4;
                      cameraRef.current.position.set(
                        distance * Math.cos(angle),
                        distance * Math.sin(angle),
                        distance * Math.cos(angle) * 0.5
                      );
                      cameraRef.current.lookAt(0, 0, -10);
                    }
                  }}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm hover:bg-purple-600 transition-colors"
                >
                  📐 Reset View
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Color:</label>
                  <select
                    value={colorMode}
                    onChange={(e) => {
                      const mode = e.target.value as 'rainbow' | 'similarity';
                      setColorMode(mode);
                      if (mode === 'rainbow') setSelectedPoint(null);
                    }}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                  >
                    <option value="rainbow">🌈 Rainbow</option>
                    <option value="similarity">🎯 Similarity</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {selectedPoint && (
            <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
              <div className="font-medium mb-1 text-blue-900 dark:text-blue-100">📌 Selected:</div>
              <div className="text-blue-700 dark:text-blue-200 italic mb-2">
                "{selectedPoint.text}"
              </div>
              <button
                onClick={() => {
                  setSelectedPoint(null);
                  setColorMode('rainbow');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 underline"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>

        <div className="relative" style={{ height: '600px' }}>
          <div ref={mountRef} className="w-full h-full" />

          {/* Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded text-sm max-w-xs pointer-events-none z-10 shadow-lg"
              style={{
                left: mousePosition.x + 10,
                top: mousePosition.y - 10,
              }}
            >
              {hoveredPoint.text}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          <p>💡 <strong>Tips:</strong> Click points to see similarity colors • Scroll to zoom, drag to rotate • Green plane = Z=0, Red plane = negative Z</p>
        </div>
      </div>
    </div>
  );
};

export default EmbeddingVisualization;