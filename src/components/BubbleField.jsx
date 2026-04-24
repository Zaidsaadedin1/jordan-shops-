import { useEffect, useRef, useState } from "react";

const STAGE_PADDING = 18;
const SEARCH_STEP = 12;
const MOUSE_INFLUENCE_RADIUS = 180;
const MAX_MOUSE_SHIFT = 22;
const BUBBLE_GAP = 4;

export default function BubbleField({
  items,
  activeId,
  onSelect,
  labels,
  emptyLabel,
  variant = "category",
  locale,
}) {
  const stageRef = useRef(null);
  const bubbleRefs = useRef(new Map());
  const frameRef = useRef(null);
  const [layout, setLayout] = useState(() => buildInitialLayout(items, 1080));
  const positions = layout.positions;

  useEffect(() => {
    const width = stageRef.current?.clientWidth || 1080;
    setLayout(buildInitialLayout(items, width));
  }, [items]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      setLayout(buildInitialLayout(items, entry.contentRect.width));
    });

    observer.observe(stage);
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    resetBubbleShifts();
  }, [positions]);

  function handlePointerMove(event) {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    const rect = stage.getBoundingClientRect();
    const pointer = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };

    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
    }

    frameRef.current = requestAnimationFrame(() => {
      applyBubbleShifts(pointer, positions);
    });
  }

  function handlePointerLeave() {
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    resetBubbleShifts();
  }

  if (!items.length) {
    return <div className="bubbleStage emptyStage">{emptyLabel}</div>;
  }

  return (
    <div
      ref={stageRef}
      className={`bubbleStage ${variant === "shop" ? "shopBubbleStage" : ""}`}
      style={{ height: layout.height }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {positions.map((item, index) => {
        const isActive = activeId === item.id;
        const title =
          variant === "category" ? labels.categories[item.label] || item.label : item.label;
        const meta =
          variant === "category"
            ? `${formatCount(item.count, locale)} ${labels.bubbleSuffix}`
            : item.meta;

        return (
          <button
            key={item.id}
            type="button"
            ref={(node) => {
              if (node) {
                bubbleRefs.current.set(item.id, node);
              } else {
                bubbleRefs.current.delete(item.id);
              }
            }}
            className={`bubble freeBubble ${variant === "shop" ? "shopBubble" : ""} ${
              isActive ? "activeBubble" : ""
            }`}
            style={{
              width: item.size,
              height: item.size,
              left: item.x,
              top: item.y,
              "--bubble-padding": `${getBubblePadding(item.size)}px`,
              "--bubble-title-size": `${getBubbleTitleSize(item.size, variant)}px`,
              "--bubble-meta-size": `${getBubbleMetaSize(item.size, variant)}px`,
              "--bubble-text-width": `${getBubbleTextWidth(item.size)}px`,
              "--bubble-hue": `${18 + ((index * 41) % 300)}`,
              "--bubble-depth": `${32 + (index % 4) * 8}%`,
              "--float-delay": `${index * 0.45}s`,
            }}
            onPointerDown={() => onSelect(item.id)}
          >
            <span className="bubbleGlow" aria-hidden="true" />
            <strong>{title}</strong>
            <span>{meta}</span>
          </button>
        );
      })}
    </div>
  );

  function applyBubbleShifts(pointer, currentPositions) {
    for (const item of currentPositions) {
      const node = bubbleRefs.current.get(item.id);
      if (!node) {
        continue;
      }

      const shift = createMouseShift(item, pointer);
      node.style.setProperty("--mouse-shift-x", `${shift.x}px`);
      node.style.setProperty("--mouse-shift-y", `${shift.y}px`);
    }
  }

  function resetBubbleShifts() {
    for (const node of bubbleRefs.current.values()) {
      node.style.setProperty("--mouse-shift-x", "0px");
      node.style.setProperty("--mouse-shift-y", "0px");
    }
  }
}

function buildInitialLayout(items, stageWidth) {
  const width = Math.max(stageWidth, 320);
  const sortedItems = [...items].sort((a, b) => b.size - a.size);
  const positions = [];
  const targetHeight = width < 680 ? 620 : 540;
  let maxBottom = 0;
  const centerX = width / 2;
  const centerY = targetHeight / 2;

  for (const item of sortedItems) {
    const placed = findAvailablePosition(
      positions,
      item.size,
      width,
      Math.max(targetHeight, maxBottom + item.size + STAGE_PADDING * 2),
      centerX - item.size / 2,
      centerY - item.size / 2,
      centerX,
      centerY,
    );

    positions.push({
      ...item,
      x: placed.x,
      y: placed.y,
      size: item.size,
    });
    maxBottom = Math.max(maxBottom, placed.y + item.size);
  }

  return {
    positions: items.map((item) => positions.find((candidate) => candidate.id === item.id) || item),
    height: Math.max(targetHeight, maxBottom + STAGE_PADDING),
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function formatCount(value, locale) {
  return new Intl.NumberFormat(locale).format(value);
}

function getBubblePadding(size) {
  return Math.max(10, Math.min(22, Math.round(size * 0.12)));
}

function getBubbleTitleSize(size, variant) {
  const multiplier = variant === "shop" ? 0.125 : 0.115;
  const min = variant === "shop" ? 11.5 : 13;
  const max = variant === "shop" ? 18.5 : 21;
  return clamp(size * multiplier, min, max);
}

function getBubbleMetaSize(size, variant) {
  const multiplier = variant === "shop" ? 0.072 : 0.078;
  const min = variant === "shop" ? 9 : 10;
  const max = variant === "shop" ? 14 : 15;
  return clamp(size * multiplier, min, max);
}

function getBubbleTextWidth(size) {
  return Math.max(44, Math.round(size * 0.7));
}

function findAvailablePosition(existing, size, width, height, startX, startY, centerX, centerY) {
  const maxX = Math.max(width - size - STAGE_PADDING, STAGE_PADDING);
  const maxY = Math.max(height - size - STAGE_PADDING, STAGE_PADDING);
  const originX = clamp(startX, STAGE_PADDING, maxX);
  const originY = clamp(startY, STAGE_PADDING, maxY);

  if (canPlace(existing, originX, originY, size)) {
    return { x: originX, y: originY };
  }

  const tangentCandidates = [];
  for (const item of existing) {
    const baseDistance = item.size / 2 + size / 2 + BUBBLE_GAP;

    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      const candidateCenterX = item.x + item.size / 2 + Math.cos(angle) * baseDistance;
      const candidateCenterY = item.y + item.size / 2 + Math.sin(angle) * baseDistance;
      const candidateX = clamp(candidateCenterX - size / 2, STAGE_PADDING, maxX);
      const candidateY = clamp(candidateCenterY - size / 2, STAGE_PADDING, maxY);

      if (canPlace(existing, candidateX, candidateY, size)) {
        tangentCandidates.push({ x: candidateX, y: candidateY });
      }
    }
  }

  if (tangentCandidates.length) {
    tangentCandidates.sort(
      (a, b) =>
        distanceToCenter(a.x, a.y, size, centerX, centerY) -
        distanceToCenter(b.x, b.y, size, centerX, centerY),
    );

    return tangentCandidates[0];
  }

  for (let radius = SEARCH_STEP; radius < Math.max(width, height); radius += SEARCH_STEP) {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 10) {
      const candidateX = clamp(originX + Math.cos(angle) * radius, STAGE_PADDING, maxX);
      const candidateY = clamp(originY + Math.sin(angle) * radius, STAGE_PADDING, maxY);

      if (canPlace(existing, candidateX, candidateY, size)) {
        return { x: candidateX, y: candidateY };
      }
    }
  }

  return { x: originX, y: originY };
}

function canPlace(existing, x, y, size) {
  return existing.every((item) => !circlesOverlap(x, y, size, item.x, item.y, item.size));
}

function circlesOverlap(ax, ay, aSize, bx, by, bSize) {
  const aRadius = aSize / 2;
  const bRadius = bSize / 2;
  const aCenterX = ax + aRadius;
  const aCenterY = ay + aRadius;
  const bCenterX = bx + bRadius;
  const bCenterY = by + bRadius;
  const distance = Math.hypot(aCenterX - bCenterX, aCenterY - bCenterY);

  return distance < aRadius + bRadius + BUBBLE_GAP;
}

function createMouseShift(item, pointer) {
  if (!pointer) {
    return { x: 0, y: 0 };
  }

  const centerX = item.x + item.size / 2;
  const centerY = item.y + item.size / 2;
  const dx = centerX - pointer.x;
  const dy = centerY - pointer.y;
  const distance = Math.hypot(dx, dy);

  if (!distance || distance > MOUSE_INFLUENCE_RADIUS) {
    return { x: 0, y: 0 };
  }

  const force = (1 - distance / MOUSE_INFLUENCE_RADIUS) * MAX_MOUSE_SHIFT;

  return {
    x: Number(((dx / distance) * force).toFixed(2)),
    y: Number(((dy / distance) * force).toFixed(2)),
  };
}

function distanceToCenter(x, y, size, centerX, centerY) {
  const bubbleCenterX = x + size / 2;
  const bubbleCenterY = y + size / 2;

  return Math.hypot(bubbleCenterX - centerX, bubbleCenterY - centerY);
}
