/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FC } from 'react';
import { ShoppingBag } from 'lucide-react';
import { SimpleFeatureView } from './SimpleFeatureView';

export const ShopView: FC = () => (
  <SimpleFeatureView
    title="WhatsApp Shop"
    description="Manage your product catalog and share interactive shopping experiences directly in WhatsApp chats."
    icon={ShoppingBag}
    highlights={[
      'Sync products from Meta Commerce catalog',
      'Send catalog messages and collection carousels',
      'Track product views and add-to-cart events',
    ]}
  />
);
