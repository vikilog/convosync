/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CheckCheck, Clock, XCircle, PauseCircle, Ban } from 'lucide-react';
import {
  statusSlugToUi,
  STATUS_BADGE_STYLES,
  type TemplateStatusUi,
} from '../../lib/templateLabels';

type Props = {
  status: string;
  showIcon?: boolean;
};

const ICONS: Partial<Record<TemplateStatusUi, React.ReactNode>> = {
  Approved: <CheckCheck className="w-3 h-3" />,
  Pending: <Clock className="w-3 h-3" />,
  Rejected: <XCircle className="w-3 h-3" />,
  Paused: <PauseCircle className="w-3 h-3" />,
  Disabled: <Ban className="w-3 h-3" />,
};

export const TemplateStatusBadge: React.FC<Props> = ({ status, showIcon = true }) => {
  const ui = statusSlugToUi(status);
  const style = STATUS_BADGE_STYLES[ui];
  const icon = showIcon ? ICONS[ui] : null;

  return (
    <span className={style.className}>
      {icon}
      {ui}
    </span>
  );
};
