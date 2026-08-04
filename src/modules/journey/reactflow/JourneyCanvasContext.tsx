import { createContext, useContext } from 'react';
import type { JourneyNodeType } from '../types';

export type AddStepsMenuAnchor = {
  nodeId: string;
};

type JourneyCanvasContextValue = {
  addNodeAfter: (sourceNodeId: string, type: JourneyNodeType) => void;
  updateNodeData: (nodeId: string, patch: Record<string, unknown>) => void;
  hasTrigger: boolean;
  addMenuAnchor: AddStepsMenuAnchor | null;
  openAddMenu: (anchor: AddStepsMenuAnchor) => void;
  closeAddMenu: () => void;
  selectedNodeId: string | null;
};

export const JourneyCanvasContext = createContext<JourneyCanvasContextValue | null>(null);

export function useJourneyCanvasActions() {
  return useContext(JourneyCanvasContext);
}
