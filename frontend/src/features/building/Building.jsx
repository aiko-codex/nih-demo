import { useMemo } from "react";
import { AdditiveBlending } from "three";
import { FLOOR_HEIGHT, FLOORS, FRONT_WIDTH, WING_ANGLE, WING_LENGTH } from "@/features/building/buildingLayout";
import WindowGrid from "@/features/building/WindowGrid";

const wingRotation = { left: -WING_ANGLE, right: WING_ANGLE };

function GroundGlow({ theme }) {
  const opacity = theme === "dark" ? "0.055" : "0.025";
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.12, 0]} renderOrder={1}>
      <circleGeometry args={[8, 64]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
        uniforms={{ opacity: { value: Number(opacity) } }}
        vertexShader="varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
        fragmentShader="uniform float opacity; varying vec2 vUv; void main() { float radius = length(vUv - vec2(0.5)) * 2.0; float fade = 1.0 - smoothstep(0.05, 1.0, radius); float glow = fade * fade; gl_FragColor = vec4(0.035, 0.013, 0.002, glow * opacity); }"
      />
    </mesh>
  );
}

function Wing({ face, children }) {
  const side = face === "left" ? -1 : 1;
  const centerX = side * (FRONT_WIDTH / 2 + Math.cos(WING_ANGLE) * WING_LENGTH / 2);
  const centerZ = -Math.sin(WING_ANGLE) * WING_LENGTH / 2;
  return (
    <group position={[centerX, 0, centerZ]} rotation={[0, wingRotation[face], 0]}>
      {children}
    </group>
  );
}

function Facade({ faces }) {
  const floors = useMemo(() => Array.from({ length: FLOORS }, (_, index) => index + 1), []);
  return (
    <>
      {floors.map((floor) => {
        const y = (floor - 0.5) * FLOOR_HEIGHT;
        return (
          <group key={`facade-${floor}`} position={[0, y, 0]}>
            <mesh position={[0, 0, -0.19]}>
              <boxGeometry args={[FRONT_WIDTH, FLOOR_HEIGHT, 0.38]} />
              <meshStandardMaterial color="#152432" metalness={0.3} roughness={0.32} />
            </mesh>
            <Wing face="left">
              <mesh position={[0, 0, -0.19]}>
                <boxGeometry args={[faces.left, FLOOR_HEIGHT, 0.38]} />
                <meshStandardMaterial color="#182634" metalness={0.3} roughness={0.32} />
              </mesh>
            </Wing>
            <Wing face="right">
              <mesh position={[0, 0, -0.19]}>
                <boxGeometry args={[faces.right, FLOOR_HEIGHT, 0.38]} />
                <meshStandardMaterial color="#182634" metalness={0.3} roughness={0.32} />
              </mesh>
            </Wing>
          </group>
        );
      })}
    </>
  );
}

function SlabBands({ faces, onSelectFloor, selectedFloor }) {
  const boundaries = useMemo(() => Array.from({ length: FLOORS + 1 }, (_, index) => index), []);
  const handleClick = (floor) => (event) => {
    event.stopPropagation();
    onSelectFloor(Math.max(1, Math.min(FLOORS, floor)));
  };

  return (
    <>
      {boundaries.map((boundary) => {
        const isFocused = selectedFloor && Number(selectedFloor) === Math.min(boundary, FLOORS);
        const color = isFocused ? "#4d3a26" : "#26313d";
        return (
          <group key={`slab-${boundary}`} position={[0, boundary * FLOOR_HEIGHT, 0]}>
            <mesh onClick={handleClick(boundary)}>
              <boxGeometry args={[FRONT_WIDTH + 0.42, 0.24, 0.82]} />
              <meshStandardMaterial color={color} metalness={0.12} roughness={0.62} />
            </mesh>
            <Wing face="left">
              <mesh onClick={handleClick(boundary)}>
                <boxGeometry args={[faces.left + 0.3, 0.24, 0.82]} />
                <meshStandardMaterial color={color} metalness={0.12} roughness={0.62} />
              </mesh>
            </Wing>
            <Wing face="right">
              <mesh onClick={handleClick(boundary)}>
                <boxGeometry args={[faces.right + 0.3, 0.24, 0.82]} />
                <meshStandardMaterial color={color} metalness={0.12} roughness={0.62} />
              </mesh>
            </Wing>
          </group>
        );
      })}
    </>
  );
}

export default function Building({
  blocks,
  faces,
  selectedFloor,
  selectedBlockCode,
  theme,
  onSelectFloor,
  onSelectBlock,
}) {
  return (
    <group>
      <mesh position={[0, -0.58, 0]}>
        <boxGeometry args={[17, 1.1, 8]} />
        <meshStandardMaterial color="#202630" roughness={0.82} />
      </mesh>
      <Facade faces={faces} />
      <SlabBands faces={faces} onSelectFloor={onSelectFloor} selectedFloor={selectedFloor} />
      <mesh position={[0, FLOORS * FLOOR_HEIGHT + 0.47, 0]}>
        <boxGeometry args={[FRONT_WIDTH + 0.55, 0.7, 0.82]} />
        <meshStandardMaterial color="#303541" roughness={0.68} />
      </mesh>
      <Wing face="left">
        <mesh position={[0, FLOORS * FLOOR_HEIGHT + 0.47, 0]}>
          <boxGeometry args={[faces.left + 0.35, 0.7, 0.82]} />
          <meshStandardMaterial color="#303541" roughness={0.68} />
        </mesh>
      </Wing>
      <Wing face="right">
        <mesh position={[0, FLOORS * FLOOR_HEIGHT + 0.47, 0]}>
          <boxGeometry args={[faces.right + 0.35, 0.7, 0.82]} />
          <meshStandardMaterial color="#303541" roughness={0.68} />
        </mesh>
      </Wing>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={theme === "dark" ? "#080b12" : "#cfc8bb"} roughness={1} />
      </mesh>
      <GroundGlow theme={theme} />
      <WindowGrid
        blocks={blocks}
        faces={faces}
        selectedFloor={selectedFloor}
        selectedBlockCode={selectedBlockCode}
        theme={theme}
        onSelectBlock={onSelectBlock}
      />
    </group>
  );
}
