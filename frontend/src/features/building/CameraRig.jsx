import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { CameraControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { FLOOR_HEIGHT, FLOORS, FRONT_WIDTH, WING_ANGLE, WING_LENGTH, getBlockWindows, getFloorCenter } from "@/features/building/buildingLayout";

const radians = (degrees) => degrees * Math.PI / 180;
const HOME_ELEVATION = radians(8);

function getFitDistance(width, height, aspect, fov) {
  const verticalHalfFov = radians(fov / 2);
  const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * aspect);
  const margin = 1.18;
  return Math.max(
    (width / 2 / Math.tan(horizontalHalfFov)) * margin,
    (height / 2 / Math.tan(verticalHalfFov)) * margin,
  );
}

function getBuildingWidth(faces) {
  const frontHalf = (Number(faces.front) || FRONT_WIDTH) / 2;
  const leftReach = frontHalf + Math.cos(WING_ANGLE) * (WING_LENGTH + (Number(faces.left) || 6)) / 2;
  const rightReach = frontHalf + Math.cos(WING_ANGLE) * (WING_LENGTH + (Number(faces.right) || 6)) / 2;
  return Math.max(frontHalf, leftReach, rightReach) * 2;
}

const CameraRig = forwardRef(function CameraRig({ blocks, faces, selectedFloor, selectedBlockCode }, ref) {
  const controlsRef = useRef(null);
  const { invalidate, size, camera } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const homeDistance = getFitDistance(
    getBuildingWidth(faces),
    FLOORS * FLOOR_HEIGHT + 1.8,
    aspect,
    camera.fov,
  );
  const homeTargetY = (FLOORS * FLOOR_HEIGHT - 1.1) / 2;

  const resetCamera = () => {
    controlsRef.current?.setLookAt(
      0,
      homeTargetY + Math.sin(HOME_ELEVATION) * homeDistance,
      Math.cos(HOME_ELEVATION) * homeDistance,
      0,
      homeTargetY,
      0,
      true,
    );
  };

  useImperativeHandle(ref, () => ({
    reset: resetCamera,
  }), [homeDistance, homeTargetY]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.minAzimuthAngle = radians(-70);
    controls.maxAzimuthAngle = radians(70);
    controls.minPolarAngle = radians(55);
    controls.maxPolarAngle = radians(95);
    controls.minDistance = 12;
    controls.maxDistance = 220;
    if (selectedBlockCode) {
      const block = blocks.find((item) => item.code === selectedBlockCode);
      const windows = getBlockWindows(block, faces);
      if (windows.length) {
        const target = windows.reduce((center, window) => [
          center[0] + window.position[0] / windows.length,
          center[1] + window.position[1] / windows.length,
          center[2] + window.position[2] / windows.length,
        ], [0, 0, 0]);
        const angle = block.face === "left" ? -Math.PI * 40 / 180 : block.face === "right" ? Math.PI * 40 / 180 : 0;
        const normal = [Math.sin(angle), 0, Math.cos(angle)];
        controls.setLookAt(
          target[0] + normal[0] * 15,
          target[1] + 2.3,
          target[2] + normal[2] * 15,
          target[0], target[1], target[2], true,
        );
      }
    } else if (selectedFloor) {
      const target = getFloorCenter(selectedFloor);
      const floorDistance = getFitDistance(getBuildingWidth(faces), 5.2, aspect, camera.fov);
      const elevation = radians(5);
      controls.setLookAt(
        0,
        target[1] + Math.sin(elevation) * floorDistance,
        Math.cos(elevation) * floorDistance,
        0,
        target[1],
        0,
        true,
      );
    } else {
      resetCamera();
    }
    invalidate();
  }, [aspect, blocks, camera.fov, faces, homeDistance, homeTargetY, invalidate, selectedBlockCode, selectedFloor]);

  return <CameraControls ref={controlsRef} makeDefault />;
});

export default CameraRig;
