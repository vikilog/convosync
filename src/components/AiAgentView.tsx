/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import { agentIdFromPath } from '../routes';
import { AIAgentList } from '../pages/AIAgent/AIAgentList';
import { AIAgentDetail } from '../pages/AIAgent/AIAgentDetail';

export const AiAgentView: React.FC = () => {
  const location = useLocation();
  const editingAgentId = agentIdFromPath(location.pathname);

  if (editingAgentId) {
    return <AIAgentDetail agentId={editingAgentId} pathname={location.pathname} />;
  }

  return <AIAgentList />;
};
