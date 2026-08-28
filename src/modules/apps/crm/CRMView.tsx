/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useLocation } from 'react-router-dom';
import { crmRouteFromPath } from '../../../routes';
import { AccountsListView } from './AccountsListView';
import { AccountFormView } from './AccountFormView';
import { AccountDetailView } from './AccountDetailView';
import { ContactFormView } from './ContactFormView';
import { ContactDetailView } from './ContactDetailView';
import { TaskFormView } from './TaskFormView';
import { TasksListView } from './TasksListView';
import { FieldBuilderView } from './FieldBuilderView';

export function CRMView() {
  const location = useLocation();
  const route = crmRouteFromPath(location.pathname);

  switch (route.screen) {
    case 'account-new':
      return <AccountFormView />;
    case 'account-detail':
      return <AccountDetailView accountId={route.accountId} />;
    case 'contact-new':
      return <ContactFormView accountId={route.accountId} />;
    case 'contact-detail':
      return <ContactDetailView accountId={route.accountId} contactId={route.contactId} />;
    case 'tasks':
      return <TasksListView />;
    case 'task-new':
      return <TaskFormView />;
    case 'task-edit':
      return <TaskFormView taskId={route.taskId} />;
    case 'field-builder':
      return (
        <FieldBuilderView
          entity={route.entity}
          onBack={() => window.history.back()}
        />
      );
    case 'accounts':
    default:
      return <AccountsListView />;
  }
}
