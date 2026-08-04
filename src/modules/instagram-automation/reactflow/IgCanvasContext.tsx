import { createContext, useContext } from 'react';
import type { IgJourneyNodeType } from '../types';

export type AddStepsMenuAnchor = {
  nodeId: string;
};

type IgCanvasContextValue = {
  addNodeAfter: (sourceNodeId: string, type: IgJourneyNodeType) => void;
  updateNodeData: (nodeId: string, patch: Record<string, unknown>) => void;
  hasTrigger: boolean;
  addMenuAnchor: AddStepsMenuAnchor | null;
  openAddMenu: (anchor: AddStepsMenuAnchor) => void;
  closeAddMenu: () => void;
  selectedNodeId: string | null;
};

export const IgCanvasContext = createContext<IgCanvasContextValue | null>(null);

export function useIgCanvasActions() {
  return useContext(IgCanvasContext);
}
