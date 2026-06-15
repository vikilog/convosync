/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { PhoneCall } from 'lucide-react';
import { SimpleFeatureView } from './SimpleFeatureView';

export const CallingView: FC = () => (
  <SimpleFeatureView
    title="WhatsApp Calling"
    description="Connect voice channels to your workspace inbox. Place and receive WhatsApp calls with call logs tied to each contact conversation."
    icon={PhoneCall}
    highlights={[
      'SIP trunk and cloud telephony provider setup',
      'One-click dial from the team inbox',
      'Call recordings and disposition tags per contact',
    ]}
  />
);
