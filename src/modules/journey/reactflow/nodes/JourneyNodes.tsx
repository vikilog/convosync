import { type ReactNode } from 'react';
import { type NodeProps } from '@xyflow/react';
import {
  FlowActionCard,
  FlowAddStepButton,
  FlowTriggerCard,
} from '../../../flow-builder/FlowNodeCards';
import { FLOW_CHANNEL_THEMES } from '../../../flow-builder/channelTheme';
import {
  AddNoteButton,
  readStepNote,
  StepNote,
  type StepNoteData,
} from '../../../flow-builder/StepNote';
import { getStepVisual } from '../../components/stepIcons';
import { NODE_LABELS, TRIGGER_EVENTS, type JourneyNodeType } from '../../types';
import { summarizeConditionGroup } from '../../../flow-builder/condition/conditionTypes';
import { useJourneyCanvasActions } from '../JourneyCanvasContext';

const theme = FLOW_CHANNEL_THEMES.whatsapp;

type JourneyNodeData = {
  label?: string;
  event?: string;
  messageMode?: 'text' | 'template' | 'cta_url';
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
  funnelId?: string;
  stageId?: string;
  buttons?: { id: string; title: string }[];
  paths?: { id: string; label?: string; weight?: number }[];
  targetNodeId?: string;
  responseMappings?: { jsonPath: string; attributeKey: string }[];
  operator?: string;
};

function withAddStep(
  nodeId: string,
  nodeType: JourneyNodeType,
  card: ReactNode,
  note?: StepNoteData
) {
  return (
    <div className="group/step relative pb-5">
      {card}
      {nodeType !== 'END' ? <AddStep nodeId={nodeId} /> : null}
      <StepNoteSlot nodeId={nodeId} note={note} />
    </div>
  );
}

function AddStep({ nodeId }: { nodeId: string }) {
  const actions = useJourneyCanvasActions();
  if (!actions) return null;
  return (
    <FlowAddStepButton
      theme={theme}
      onClick={() => actions.openAddMenu({ nodeId })}
    />
  );
}

function StepNoteSlot({ nodeId, note }: { nodeId: string; note?: StepNoteData }) {
  const actions = useJourneyCanvasActions();
  if (!actions) return null;
  if (!note) {
    return <AddNoteButton onClick={() => actions.updateNodeData(nodeId, { note: { text: '' } })} />;
  }
  return (
    <StepNote
      note={note}
      onChange={(text) => actions.updateNodeData(nodeId, { note: { ...note, text } })}
      onDelete={() => actions.updateNodeData(nodeId, { note: undefined })}
      onMove={(offsetX, offsetY) => actions.updateNodeData(nodeId, { note: { ...note, offsetX, offsetY } })}
    />
  );
}

function MessageBody({ text, emptyHint }: { text?: string; emptyHint: string }) {
  const body = text?.trim();
  if (!body) {
    return (
      <div className="rounded-lg border border-dashed border-border-strong bg-white/60 px-2.5 py-2 text-[11px] text-slate-400">
        {emptyHint}
      </div>
    );
  }
  return (
    <div className="line-clamp-3 rounded-lg border-[0.5px] border-border-subtle bg-white px-2.5 py-2 text-[11px] leading-snug text-slate-600">
      {body}
    </div>
  );
}

function triggerLabel(event: string | undefined) {
  return TRIGGER_EVENTS.find((e) => e.value === event)?.label ?? 'When';
}

function triggerTypeLabel(event: string | undefined) {
  if (event === 'contact.created') return 'Contact trigger';
  if (event === 'contact.tag_added') return 'Tag trigger';
  if (event === 'conversation.opened') return 'Conversation trigger';
  if (event === 'manual') return 'Manual trigger';
  return 'Message trigger';
}

function ActionNode({
  props,
  stepName,
  body,
  bodyPlaceholder,
  outputs,
  multiOutputs,
  footer,
}: {
  props: NodeProps;
  stepName: string;
  body?: ReactNode;
  bodyPlaceholder?: string | null;
  outputs?: 'single' | 'branch' | 'none';
  multiOutputs?: { id: string; label: string }[];
  footer?: ReactNode;
}) {
  const type = props.type as JourneyNodeType;
  const visual = getStepVisual(type);
  return withAddStep(
    props.id,
    type,
    <FlowActionCard
      theme={theme}
      selected={props.selected}
      stepName={stepName}
      StepIcon={visual.icon}
      body={body}
      bodyPlaceholder={bodyPlaceholder}
      outputs={outputs}
      multiOutputs={multiOutputs}
      footer={footer}
      showNextStep={type !== 'END'}
    />,
    readStepNote(props.data)
  );
}

export function TriggerNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  const event = d.event ?? 'message.received';
  const visual = getStepVisual('TRIGGER');
  return withAddStep(
    props.id,
    'TRIGGER',
    <FlowTriggerCard
      theme={theme}
      selected={props.selected}
      triggerName={triggerLabel(event)}
      triggerTypeLabel={triggerTypeLabel(event)}
      TriggerIcon={visual.icon}
      canAddTrigger={false}
    />,
    readStepNote(props.data)
  );
}

export function SendMessageNode(props: NodeProps) {
  const d = props.data as JourneyNodeData & { ctaUrl?: string; ctaLabel?: string };
  const mode = d.messageMode ?? (d.templateName || d.templateId ? 'template' : 'text');
  const body =
    mode === 'template' ? (
      <MessageBody
        text={d.templateName ? `Template: ${d.templateName}` : undefined}
        emptyHint="Choose template"
      />
    ) : mode === 'cta_url' ? (
      <MessageBody
        text={d.ctaUrl ? `🔗 ${d.ctaLabel || 'Open link'} → ${d.ctaUrl}` : undefined}
        emptyHint="Add a link"
      />
    ) : (
      <MessageBody text={d.text} emptyHint="Add a text" />
    );
  return (
    <ActionNode
      props={props}
      stepName={mode === 'cta_url' ? 'Send Message · Link' : 'Send Message'}
      body={body}
      bodyPlaceholder={null}
    />
  );
}

export function AskQuestionNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Ask Question"
      body={<MessageBody text={d.text} emptyHint="Add a text" />}
      bodyPlaceholder={null}
    />
  );
}

export function ButtonsNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  const buttons = Array.isArray(d.buttons) ? d.buttons : [];
  const titles = buttons.map((b) => b.title?.trim()).filter(Boolean) as string[];
  return (
    <ActionNode
      props={props}
      stepName="Buttons"
      body={
        <div className="space-y-1.5">
          <MessageBody text={d.text} emptyHint="Add a text" />
          {titles.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {titles.slice(0, 3).map((title) => (
                <span
                  key={title}
                  className="rounded-full border-[0.5px] border-border-subtle bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-500"
                >
                  {title}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      }
      bodyPlaceholder={null}
      multiOutputs={buttons
        .filter((b) => b.id)
        .map((b) => ({ id: b.id, label: b.title?.trim() || b.id }))}
    />
  );
}

export function RandomizerNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  const paths = Array.isArray(d.paths) ? d.paths : [];
  const summary = paths
    .map((p) => `${p.label?.trim() || p.id} ${p.weight ?? 0}%`)
    .join(' · ');
  return (
    <ActionNode
      props={props}
      stepName="Randomizer"
      bodyPlaceholder={summary || 'Add paths'}
      multiOutputs={paths
        .filter((p) => p.id)
        .map((p) => ({ id: p.id, label: p.label?.trim() || p.id }))}
    />
  );
}

export function AssignToNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Assign To"
      bodyPlaceholder={d.assigneeType ?? 'user'}
    />
  );
}

export function WaitNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Wait"
      bodyPlaceholder={`${d.amount ?? 1} ${d.unit ?? 'hours'}`}
    />
  );
}

export function GotoStepNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  const target = d.targetNodeId?.trim();
  return (
    <ActionNode
      props={props}
      stepName="Go to Step"
      bodyPlaceholder={
        target ? target.slice(0, 12) + (target.length > 12 ? '…' : '') : 'Select step'
      }
    />
  );
}

export function ConditionNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <ActionNode
      props={props}
      stepName={NODE_LABELS.CONDITION}
      bodyPlaceholder={summarizeConditionGroup(d as Record<string, unknown>) || 'Set condition'}
      outputs="branch"
    />
  );
}

export function UpdateFieldNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Update Field"
      bodyPlaceholder={
        d.field === 'custom' ? d.customFieldKey || 'custom' : d.field || 'name'
      }
    />
  );
}

export function WebhookNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  const method = d.method ?? 'POST';
  const mappingCount = Array.isArray(d.responseMappings)
    ? d.responseMappings.filter((m) => m.jsonPath?.trim() && m.attributeKey?.trim()).length
    : 0;
  let placeholder = 'Configure request';
  if (d.url?.trim()) {
    const url = d.url.trim();
    placeholder = `${method} · ${url.length > 28 ? `${url.slice(0, 28)}…` : url}`;
  } else if (d.name?.trim()) {
    placeholder = method;
  }
  if (mappingCount > 0) {
    placeholder = `${placeholder} · ${mappingCount} saved field${mappingCount === 1 ? '' : 's'}`;
  }
  return (
    <ActionNode
      props={props}
      stepName={d.name?.trim() || 'HTTP Request'}
      bodyPlaceholder={placeholder}
    />
  );
}

export function UpdateTagNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  const tags = Array.isArray(d.tags) ? d.tags.join(', ') : '';
  return (
    <ActionNode
      props={props}
      stepName="Update Tag"
      bodyPlaceholder={tags || 'Add tags'}
    />
  );
}

export function AddToFunnelNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Add to Funnel"
      bodyPlaceholder={d.funnelId ? 'Lead funnel selected' : 'Select funnel'}
    />
  );
}

export function OpenConversationNode(props: NodeProps) {
  return (
    <ActionNode
      props={props}
      stepName="Open Conversation"
      bodyPlaceholder="Reopen in inbox"
    />
  );
}

export function CloseConversationNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Close Conversation"
      bodyPlaceholder={d.closingNote?.trim() ? 'With note' : 'Resolve conversation'}
    />
  );
}

export function TriggerJourneyNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Trigger Journey"
      bodyPlaceholder={
        d.journeyId ? `Journey ${d.journeyId.slice(0, 8)}…` : 'Select journey'
      }
    />
  );
}

export function UpdateLifecycleNode(props: NodeProps) {
  const d = props.data as JourneyNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Update Lifecycle"
      bodyPlaceholder={d.stage || 'Set stage'}
    />
  );
}

export function IntegrationStubNode(props: NodeProps) {
  const type = props.type as JourneyNodeType;
  return (
    <ActionNode
      props={props}
      stepName={NODE_LABELS[type]}
      bodyPlaceholder="Coming soon"
    />
  );
}

export function EndNode(props: NodeProps) {
  return (
    <ActionNode
      props={props}
      stepName="End"
      bodyPlaceholder="Workflow complete"
      outputs="none"
    />
  );
}

export const journeyNodeTypes = {
  TRIGGER: TriggerNode,
  SEND_MESSAGE: SendMessageNode,
  ASK_QUESTION: AskQuestionNode,
  BUTTONS: ButtonsNode,
  ASSIGN_TO: AssignToNode,
  WAIT: WaitNode,
  GOTO_STEP: GotoStepNode,
  CONDITION: ConditionNode,
  RANDOMIZER: RandomizerNode,
  UPDATE_FIELD: UpdateFieldNode,
  WEBHOOK: WebhookNode,
  UPDATE_TAG: UpdateTagNode,
  ADD_TO_FUNNEL: AddToFunnelNode,
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
