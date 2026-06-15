import { type ReactNode } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Plus } from 'lucide-react';
import { getStepVisual } from '../../components/stepIcons';
import { NODE_LABELS, type JourneyNodeType } from '../../types';
import { useJourneyCanvasActions } from '../JourneyCanvasContext';

type JourneyNodeData = {
  label?: string;
  event?: string;
  messageMode?: 'text' | 'template';
  text?: string;
  templateName?: string;
  templateId?: string;
  field?: string;
  amount?: number;
  unit?: string;
  url?: string;
  method?: string;
  name?: string;
  tags?: string[];
  assigneeType?: string;
  assigneeId?: string;
  journeyId?: string;
  stage?: string;
  closingNote?: string;
  customFieldKey?: string;
  value?: string;
};

function NodeAddButton({ nodeId, nodeType }: { nodeId: string; nodeType: JourneyNodeType }) {
  const actions = useJourneyCanvasActions();

  if (!actions || nodeType === 'END') return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        actions.openAddMenu({
          nodeId,
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2,
        });
      }}
      className="absolute -bottom-4 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-primary-hover hover:shadow-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      title="Add next step"
      aria-label="Add next step"
    >
      <Plus className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}

function NodeShell({
  id,
  type,
  title,
  subtitle,
  selected,
  children,
  outputs,
}: {
  id: string;
  type: JourneyNodeType;
  title?: string;
  subtitle?: string;
  selected?: boolean;
  children?: ReactNode;
  outputs?: 'single' | 'branch';
}) {
  const visual = getStepVisual(type);
  const Icon = visual.icon;

  return (
    <div className="group relative pb-5">
      <div
        className={`min-w-[200px] max-w-[240px] overflow-hidden rounded-2xl border bg-white shadow-[0_4px_20px_-4px_rgba(15,23,42,0.12)] transition-all duration-200 ${
          selected
            ? 'border-primary ring-2 ring-primary/25 shadow-[0_8px_30px_-6px_rgba(2,132,199,0.25)]'
            : 'border-slate-200/90 hover:border-slate-300 hover:shadow-[0_8px_24px_-6px_rgba(15,23,42,0.14)]'
        }`}
      >
        <Handle
          type="target"
          position={Position.Left}
          className="!h-2.5 !w-2.5 !border-2 !border-white !bg-slate-400"
        />

        <div className="flex items-center gap-2.5 border-b border-slate-100 px-3 py-2.5">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${visual.accentBg}`}>
            <Icon className={`h-4 w-4 ${visual.accent}`} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {NODE_LABELS[type]}
            </p>
            <p className="truncate text-sm font-bold text-slate-900">{title}</p>
          </div>
        </div>

        {(subtitle || children) && (
          <div className="px-3 py-2.5">
            {subtitle ? (
              <p className="text-xs leading-relaxed text-slate-500 line-clamp-2">{subtitle}</p>
            ) : null}
            {children}
          </div>
        )}

        {outputs === 'branch' ? (
          <>
            <Handle
              id="yes"
              type="source"
              position={Position.Right}
              style={{ top: '42%' }}
              className="!h-2.5 !w-2.5 !border-2 !border-white !bg-emerald-500"
            />
            <Handle
              id="no"
              type="source"
              position={Position.Right}
              style={{ top: '72%' }}
              className="!h-2.5 !w-2.5 !border-2 !border-white !bg-rose-500"
            />
            <div className="flex justify-end gap-4 border-t border-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <span className="text-emerald-600">Yes</span>
              <span className="text-rose-500">No</span>
            </div>
          </>
        ) : type !== 'END' ? (
          <Handle
            type="source"
            position={Position.Right}
            className="!h-2.5 !w-2.5 !border-2 !border-white !bg-primary"
          />
        ) : null}
      </div>

      <NodeAddButton nodeId={id} nodeType={type} />
    </div>
  );
}

function shellProps(props: NodeProps) {
  return {
    id: props.id,
    type: props.type as JourneyNodeType,
    selected: props.selected,
  };
}

export function TriggerNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  const event = String(d.event ?? 'message.received').replace(/\./g, ' · ');
  return (
    <NodeShell
      {...shellProps(props)}
      title="When"
      subtitle={event}
    />
  );
}

export function SendMessageNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  const mode = d.messageMode ?? (d.templateName || d.templateId ? 'template' : 'text');
  const subtitle =
    mode === 'template' && d.templateName
      ? `Template: ${d.templateName}`
      : mode === 'text' && d.text?.trim()
        ? d.text.trim().slice(0, 36) + (d.text.length > 36 ? '…' : '')
        : mode === 'text'
          ? 'Text message'
          : 'Choose template';
  return <NodeShell {...shellProps(props)} title="WhatsApp" subtitle={subtitle} />;
}

export function AskQuestionNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  const subtitle = d.text?.trim()
    ? d.text.trim().slice(0, 40) + (d.text.length > 40 ? '…' : '')
    : 'Configure question';
  return <NodeShell {...shellProps(props)} title="Question" subtitle={subtitle} />;
}

export function AssignToNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <NodeShell
      {...shellProps(props)}
      title="Assign"
      subtitle={d.assigneeType ?? 'user'}
    />
  );
}

export function WaitNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <NodeShell
      {...shellProps(props)}
      title="Wait"
      subtitle={`${d.amount ?? 1} ${d.unit ?? 'hours'}`}
    />
  );
}

export function ConditionNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <NodeShell
      {...shellProps(props)}
      title={d.field ?? 'contact.field'}
      subtitle="Yes / No branch"
      outputs="branch"
    />
  );
}

export function UpdateFieldNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <NodeShell
      {...shellProps(props)}
      title="Field"
      subtitle={d.field === 'custom' ? d.customFieldKey || 'custom' : d.field || 'name'}
    />
  );
}

export function WebhookNode(props: NodeProps) {
  const d = props.data as JourneyNodeData & {
    responseMappings?: { jsonPath: string; attributeKey: string }[];
  };
  const method = d.method ?? 'POST';
  const name = d.name?.trim();
  const mappingCount = Array.isArray(d.responseMappings)
    ? d.responseMappings.filter((m) => m.jsonPath?.trim() && m.attributeKey?.trim()).length
    : 0;
  let subtitle = 'Configure request';
  if (d.url?.trim()) {
    const url = d.url.trim();
    const shortUrl = url.length > 32 ? `${url.slice(0, 32)}…` : url;
    subtitle = `${method} · ${shortUrl}`;
  } else if (name) {
    subtitle = method;
  }
  if (mappingCount > 0) {
    subtitle = `${subtitle} · ${mappingCount} saved field${mappingCount === 1 ? '' : 's'}`;
  }
  return (
    <NodeShell
      {...shellProps(props)}
      title={name || 'HTTP Request'}
      subtitle={subtitle}
    />
  );
}

export function UpdateTagNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  const tags = Array.isArray(d.tags) ? d.tags.join(', ') : '';
  return <NodeShell {...shellProps(props)} title="Tags" subtitle={tags || 'Add tags'} />;
}

export function OpenConversationNode(props: NodeProps) {
  return <NodeShell {...shellProps(props)} title="Open" subtitle="Reopen in inbox" />;
}

export function CloseConversationNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <NodeShell
      {...shellProps(props)}
      title="Close"
      subtitle={d.closingNote?.trim() ? 'With note' : 'Resolve conversation'}
    />
  );
}

export function TriggerJourneyNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <NodeShell
      {...shellProps(props)}
      title="Trigger"
      subtitle={d.journeyId ? `Journey ${d.journeyId.slice(0, 8)}…` : 'Select journey'}
    />
  );
}

export function UpdateLifecycleNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <NodeShell
      {...shellProps(props)}
      title="Lifecycle"
      subtitle={d.stage || 'Set stage'}
    />
  );
}

export function IntegrationStubNode(props: NodeProps) {
  const type = props.type as JourneyNodeType;
  return (
    <NodeShell
      {...shellProps(props)}
      title={NODE_LABELS[type]}
      subtitle="Coming soon"
    />
  );
}

export function EndNode(props: NodeProps) {
  return <NodeShell {...shellProps(props)} title="Journey ends" subtitle="Workflow complete" />;
}

export const journeyNodeTypes = {
  TRIGGER: TriggerNode,
  SEND_MESSAGE: SendMessageNode,
  ASK_QUESTION: AskQuestionNode,
  ASSIGN_TO: AssignToNode,
  WAIT: WaitNode,
  CONDITION: ConditionNode,
  UPDATE_FIELD: UpdateFieldNode,
  WEBHOOK: WebhookNode,
  UPDATE_TAG: UpdateTagNode,
  OPEN_CONVERSATION: OpenConversationNode,
  CLOSE_CONVERSATION: CloseConversationNode,
  TRIGGER_JOURNEY: TriggerJourneyNode,
  UPDATE_LIFECYCLE: UpdateLifecycleNode,
  SEND_CAPI: IntegrationStubNode,
  SEND_TIKTOK: IntegrationStubNode,
  GOOGLE_SHEETS: IntegrationStubNode,
  AI_OBJECTIVE: IntegrationStubNode,
  END: EndNode,
};
