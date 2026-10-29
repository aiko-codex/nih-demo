import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSlotMap } from "@/features/building/useSlotMap";
import ZoomControls from "@/features/building/ZoomControls";
import BuildingSlot from "@/features/building/BuildingSlot";
import {
  clampView,
  coverSize,
  maximumScale,
  minimumScale,
  pointerDistance,
  restingView,
} from "@/features/building/stageView";
import "@/features/building/building-stage.css";

const BuildingStage = forwardRef(function BuildingStage({ blocks, onSelectBlock }, ref) {
  const { slotMap, loadError } = useSlotMap();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [focusedSlotKey, setFocusedSlotKey] = useState(null);
  const frameRef = useRef(null);
  const viewRef = useRef(view);
  const pointersRef = useRef(new Map());
  const gestureRef = useRef(null);
  const movedRef = useRef(false);

  const content = useMemo(() => {
    if (!slotMap || !viewport.width) return { width: 0, height: 0 };
    return coverSize(viewport, slotMap.width / slotMap.height);
  }, [slotMap, viewport]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return undefined;
    const observer = new ResizeObserver(([entry]) => {
      setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [slotMap]);

  const applyView = useCallback((nextView) => {
    const next = clampView(nextView, viewport, content);
    viewRef.current = next;
    setView(next);
  }, [viewport, content]);

  const resetZoom = useCallback(() => {
    setFocusedSlotKey(null);
    const resting = restingView(viewport, content);
    viewRef.current = resting;
    setView(resting);
  }, [viewport, content]);

  useEffect(() => {
    if (content.width) resetZoom();
  }, [content, resetZoom]);

  const zoomAround = useCallback((scale, anchorX, anchorY) => {
    const current = viewRef.current;
    const nextScale = Math.min(maximumScale, Math.max(minimumScale, scale));
    const contentX = (anchorX - current.x) / current.scale;
    const contentY = (anchorY - current.y) / current.scale;
    applyView({ scale: nextScale, x: anchorX - contentX * nextScale, y: anchorY - contentY * nextScale });
  }, [applyView]);

  const zoomToSlot = useCallback((slotKey) => {
    const slot = slotMap?.slots.find((item) => item.key === slotKey);
    if (!slot || !content.width) return Promise.resolve();
    const scale = Math.max(1.6, viewRef.current.scale);
    const slotCenterX = (slot.x + slot.w / 2) * content.width;
    const slotCenterY = (slot.y + slot.h / 2) * content.height;
    applyView({
      scale,
      x: viewport.width / 2 - slotCenterX * scale,
      y: viewport.height / 2 - slotCenterY * scale,
    });
    setFocusedSlotKey(slotKey);
    return new Promise((resolve) => window.setTimeout(resolve, 520));
  }, [slotMap, content, viewport, applyView]);

  useImperativeHandle(ref, () => ({ zoomToSlot, resetZoom }), [zoomToSlot, resetZoom]);

  const blockBySlotKey = useMemo(
    () => new Map(blocks.filter((block) => block.slotKey).map((block) => [block.slotKey, block])),
    [blocks],
  );

  const localPoint = (event) => {
    const bounds = frameRef.current.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  };

  const handleWheel = (event) => {
    const anchor = localPoint(event);
    zoomAround(viewRef.current.scale * Math.exp(-event.deltaY * 0.0012), anchor.x, anchor.y);
  };

  const startPinch = () => {
    const [first, second] = [...pointersRef.current.values()];
    const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
    const current = viewRef.current;
    gestureRef.current = {
      type: "pinch",
      distance: pointerDistance(first, second),
      scale: current.scale,
      contentX: (midpoint.x - current.x) / current.scale,
      contentY: (midpoint.y - current.y) / current.scale,
    };
  };

  const handlePointerDown = (event) => {
    movedRef.current = false;
    pointersRef.current.set(event.pointerId, localPoint(event));
    if (pointersRef.current.size > 1) {
      startPinch();
      setIsDragging(true);
      return;
    }
    gestureRef.current = {
      type: "pan",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startView: viewRef.current,
    };
  };

  const handlePointerMove = (event) => {
    if (!pointersRef.current.has(event.pointerId)) return;
    pointersRef.current.set(event.pointerId, localPoint(event));
    const gesture = gestureRef.current;
    if (!gesture) return;

    if (gesture.type === "pinch" && pointersRef.current.size > 1) {
      const [first, second] = [...pointersRef.current.values()];
      const midpoint = { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
      const ratio = pointerDistance(first, second) / Math.max(gesture.distance, 1);
      const scale = Math.min(maximumScale, Math.max(minimumScale, gesture.scale * ratio));
      applyView({ scale, x: midpoint.x - gesture.contentX * scale, y: midpoint.y - gesture.contentY * scale });
      return;
    }

    if (gesture.type !== "pan" || gesture.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;
    if (!movedRef.current && Math.hypot(deltaX, deltaY) < 6) return;
    if (!movedRef.current) {
      movedRef.current = true;
      frameRef.current.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }
    applyView({ ...gesture.startView, x: gesture.startView.x + deltaX, y: gesture.startView.y + deltaY });
  };

  const handlePointerUp = (event) => {
    pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) {
      gestureRef.current = null;
      setIsDragging(false);
    }
    if (frameRef.current?.hasPointerCapture(event.pointerId)) {
      frameRef.current.releasePointerCapture(event.pointerId);
    }
  };

  const handleSlotClick = async (slotKey, block) => {
    if (movedRef.current) return;
    await zoomToSlot(slotKey);
    onSelectBlock(block);
  };

  const zoomFromCenter = (factor) => {
    zoomAround(viewRef.current.scale * factor, viewport.width / 2, viewport.height / 2);
  };

  if (loadError) {
    return (
      <div className="grid size-full place-items-center text-sm text-white/60">
        The building could not load. Please refresh.
      </div>
    );
  }

  return (
    <div
      ref={frameRef}
      className="building-stage-frame absolute inset-0 overflow-hidden"      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {slotMap && content.width > 0 && (
        <div
          className={`building-stage absolute left-0 top-0 ${isDragging ? "building-stage-dragging" : ""}`}
          style={{
            width: content.width,
            height: content.height,
            transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          }}
        >
          <img
            className="absolute inset-0 size-full select-none"
            src={`${import.meta.env.BASE_URL}building/${slotMap.image}`}
            alt="National India Hub at night"
            draggable="false"
          />
          {slotMap.slots.map((slot) => {
            const block = blockBySlotKey.get(slot.key);
            if (!block) return null;
            return (
              <BuildingSlot
                key={slot.key}
                slot={slot}
                block={block}
                focused={focusedSlotKey === slot.key}
                onSelect={() => handleSlotClick(slot.key, block)}
              />
            );
          })}
        </div>
      )}
      <ZoomControls
        scale={view.scale}
        onZoomIn={() => zoomFromCenter(1.3)}
        onZoomOut={() => zoomFromCenter(1 / 1.3)}
        onReset={resetZoom}
      />
    </div>
  );
});

export default BuildingStage;
