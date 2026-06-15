/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { CreditCard } from 'lucide-react';
import { SimpleFeatureView } from './SimpleFeatureView';

export const PayView: FC = () => (
  <SimpleFeatureView
    title="WhatsApp Pay"
    description="Accept payments inside WhatsApp conversations. Track payment requests, settlements, and invoice status from one place."
    icon={CreditCard}
    highlights={[
      'Send payment links and order summaries in chat',
      'Settlement status and refund tracking',
      'Export payment reports for finance teams',
    ]}
  />
);
