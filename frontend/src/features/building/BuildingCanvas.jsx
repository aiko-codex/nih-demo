import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { Vector2 } from "three";
import { EffectComposer as ThreeEffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { useTheme } from "@/components/ThemeProvider";
import Building from "@/features/building/Building";
import CameraRig from "@/features/building/CameraRig";

function ScenePostProcessing({ bloomEnabled, intensity }) {
  const { gl, scene, camera, size, invalidate } = useThree();
  const composer = useRef(null);
  const bloomPass = useRef(null);

  useEffect(() => {
    const nextComposer = new ThreeEffectComposer(gl);
    nextComposer.addPass(new RenderPass(scene, camera));
    const nextBloomPass = new UnrealBloomPass(new Vector2(size.width, size.height), intensity, 0.6, 0.6);
    nextComposer.addPass(nextBloomPass);
    nextComposer.addPass(new OutputPass());
    composer.current = nextComposer;
    bloomPass.current = nextBloomPass;
    invalidate();
    return () => {
      nextComposer.dispose();
      composer.current = null;
      bloomPass.current = null;
    };
  }, [camera, gl, invalidate, scene]);

  useEffect(() => {
    composer.current?.setSize(size.width, size.height);
    invalidate();
  }, [invalidate, size.height, size.width]);

  useEffect(() => {
    if (bloomPass.current) bloomPass.current.strength = intensity;
    if (bloomPass.current) bloomPass.current.enabled = bloomEnabled;
    invalidate();
  }, [bloomEnabled, intensity, invalidate]);

  useFrame((_, delta) => composer.current?.render(delta), 1);
  return null;
}

function SkyGradient({ isDark }) {
  const fragmentShader = isDark
    ? `varying vec3 vWorldPosition;
       void main() {
         float height = normalize(vWorldPosition - cameraPosition).y;
         float blend = smoothstep(-0.12, 0.72, height);
         vec3 horizon = vec3(0.0056, 0.0091, 0.0212);
         vec3 zenith = vec3(0.0021, 0.0033, 0.0060);
         gl_FragColor = vec4(mix(horizon, zenith, blend), 1.0);
       }`
    : `varying vec3 vWorldPosition;
       void main() {
         float height = normalize(vWorldPosition - cameraPosition).y;
         float blend = smoothstep(-0.12, 0.72, height);
         vec3 horizon = vec3(0.84, 0.79, 0.70);
         vec3 zenith = vec3(0.59, 0.67, 0.77);
         gl_FragColor = vec4(mix(horizon, zenith, blend), 1.0);
       }`;

  return (
    <mesh scale={180} renderOrder={-1000} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 24]} />
      <shaderMaterial
        vertexShader="varying vec3 vWorldPosition; void main() { vec4 worldPosition = modelMatrix * vec4(position, 1.0); vWorldPosition = worldPosition.xyz; gl_Position = projectionMatrix * viewMatrix * worldPosition; }"
        fragmentShader={fragmentShader}
        side={2}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function BuildingCanvas({
  blocks,
  faces,
  selectedFloor,
  selectedBlockCode,
  onSelectFloor,
  onSelectBlock,
  onUnsupported,
}) {
  const { theme } = useTheme();
  const cameraRef = useRef(null);
  const unsupportedCallback = useRef(onUnsupported);
  unsupportedCallback.current = onUnsupported;
  const [webglSupported, setWebglSupported] = useState(null);
  const [dpr, setDpr] = useState([1, 1.75]);
  const [bloomEnabled, setBloomEnabled] = useState(true);
  const isDark = theme === "dark";

  useEffect(() => {
    const testCanvas = document.createElement("canvas");
    let context = null;
    try {
      context = testCanvas.getContext("webgl2") || testCanvas.getContext("webgl");
    } catch {
      context = null;
    }
    const supported = Boolean(context);
    const loseContext = context?.getExtension("WEBGL_lose_context");
    loseContext?.loseContext();
    setWebglSupported(supported);
    if (!supported) unsupportedCallback.current?.();
  }, []);

  if (webglSupported !== true) return null;

  return (
    <div
      className="h-full w-full"
      onDoubleClick={() => cameraRef.current?.reset()}
      role="presentation"
    >
      <Canvas
        dpr={dpr}
        frameloop="demand"
        camera={{ position: [0, 25, 58], fov: 44, near: 0.1, far: 220 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={[isDark ? "#080b14" : "#d9d4ca"]} />
        <fog attach="fog" args={[isDark ? "#080b14" : "#d9d4ca", 70, 140]} />
        <SkyGradient isDark={isDark} />
        <ambientLight intensity={isDark ? 1.2 : 1.65} />
        <directionalLight position={[-12, 25, 24]} intensity={isDark ? 1.25 : 1.7} />
        <CameraRig
          ref={cameraRef}
          blocks={blocks}
          faces={faces}
          selectedFloor={selectedFloor}
          selectedBlockCode={selectedBlockCode}
        />
        <Building
          blocks={blocks}
          faces={faces}
          selectedFloor={selectedFloor}
          selectedBlockCode={selectedBlockCode}
          theme={theme}
          onSelectFloor={onSelectFloor}
          onSelectBlock={onSelectBlock}
        />
        <PerformanceMonitor
          onDecline={() => {
            setDpr([1, 1]);
            setBloomEnabled(false);
          }}
        />
        <ScenePostProcessing bloomEnabled={bloomEnabled} intensity={isDark ? 0.9 : 0.35} />
      </Canvas>
    </div>
  );
}
