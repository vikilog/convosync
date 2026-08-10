import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { FLOW_EDGE_STYLE } from './channelTheme';

/** Smooth cubic bezier connector (ManyChat-style curves, not straight/step). */
export function CurvedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  label,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ ...FLOW_EDGE_STYLE, ...style }}
      />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none absolute rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const flowEdgeTypes = {
  curved: CurvedEdge,
};
