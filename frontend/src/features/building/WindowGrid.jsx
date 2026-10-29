import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getWindowTransform } from "@/features/building/buildingLayout";

const DARK_GLASS = new THREE.Color("#17232e");
const DARK_LIT = new THREE.Color("#ffb347");
const LIGHT_LIT = new THREE.Color("#f5a524");

function getPaneDefinitions(blocks, faces) {
  const blockByCell = new Map();
  for (const block of blocks) {
    const start = Math.max(0, Number(block.windowStart) || 0);
    const span = Math.max(0, Number(block.windowSpan) || 0);
    for (let column = start; column < start + span; column += 1) {
      blockByCell.set(`${block.floor}:${block.face}:${column}`, block);
    }
  }

  const panes = [];
  for (const face of ["left", "front", "right"]) {
    const columns = Number(faces[face]) || 0;
    for (let floor = 1; floor <= 10; floor += 1) {
      for (let column = 0; column < columns; column += 1) {
        const transform = getWindowTransform(face, floor, column, faces);
        const block = blockByCell.get(`${floor}:${face}:${column}`);
        const angle = transform.rotationY;
        const normal = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle));
        const position = new THREE.Vector3(...transform.position).addScaledVector(normal, 0.28);
        panes.push({ ...transform, position: position.toArray(), block, floor });
      }
    }
  }
  return panes;
}

export default function WindowGrid({
  blocks,
  faces,
  selectedFloor,
  selectedBlockCode,
  theme,
  onSelectBlock,
}) {
  const meshRef = useRef(null);
  const panes = useMemo(() => getPaneDefinitions(blocks, faces), [blocks, faces]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const blockCodes = useMemo(() => panes.map((pane) => pane.block?.code || null), [panes]);
  const clickHandler = useCallback((event) => {
    event.stopPropagation();
    const blockCode = blockCodes[event.instanceId];
    if (blockCode) onSelectBlock(blockCode);
  }, [blockCodes, onSelectBlock]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    panes.forEach((pane, index) => {
      dummy.position.set(...pane.position);
      dummy.rotation.set(0, pane.rotationY, 0);
      dummy.scale.set(pane.width, pane.height, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [dummy, panes]);

  const updateColors = useCallback((time = 0) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const lightColor = theme === "dark" ? DARK_LIT : LIGHT_LIT;
    const pulse = selectedBlockCode ? 1.08 + (Math.sin(time * 1.2) + 1) * 0.16 : 1;
    panes.forEach((pane, index) => {
      const isSelected = pane.block?.code === selectedBlockCode;
      const isLit = Boolean(pane.block?.isLit);
      const variation = 0.91 + ((index * 13) % 9) * 0.012;
      const color = isLit ? lightColor.clone() : DARK_GLASS.clone().multiplyScalar(variation);
      if (selectedFloor && pane.floor !== Number(selectedFloor)) color.multiplyScalar(0.35);
      if (isSelected) color.multiplyScalar(pulse);
      mesh.setColorAt(index, color);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [panes, selectedBlockCode, selectedFloor, theme]);

  useEffect(() => updateColors(), [updateColors]);

  useFrame((state) => {
    if (!selectedBlockCode) return;
    updateColors(state.clock.elapsedTime);
    state.invalidate();
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, panes.length]}
      onPointerDown={clickHandler}
      frustumCulled={false}
      castShadow={false}
      receiveShadow={false}
    >
      <boxGeometry args={[1, 1, 0.12]} />
      <meshStandardMaterial
        color="white"
        emissive="white"
        emissiveIntensity={theme === "dark" ? 2.8 : 1.8}
        metalness={0.08}
        roughness={0.3}
        toneMapped={false}
        side={THREE.DoubleSide}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            "#include <emissivemap_fragment>",
            "#include <emissivemap_fragment>\n totalEmissiveRadiance *= vColor.rgb * 0.3;",
          );
        }}
      />
    </instancedMesh>
  );
}
