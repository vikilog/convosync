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
import { getStepVisual, getTriggerEventIcon } from '../../components/stepIcons';
import { NODE_LABELS, IG_TRIGGER_EVENTS, type IgJourneyNodeType } from '../../types';
import {
  nextAvailableTriggerEvent,
  normalizeIgTriggerEvents,
} from '../../lib/triggerEvents';
import { summarizeConditionGroup } from '../../../flow-builder/condition/conditionTypes';
import { useIgCanvasActions } from '../IgCanvasContext';

const theme = FLOW_CHANNEL_THEMES.instagram;

type IgNodeData = {
  label?: string;
  event?: string;
  keyword?: string;
  text?: string;
  sendAs?: string;
  blocks?: unknown[];
  quickReplies?: { title: string; payload?: string }[];
  buttons?: { id: string; title: string }[];
  paths?: { id: string; label?: string; weight?: number }[];
  tags?: string[];
  action?: string;
  amount?: number;
  unit?: string;
  field?: string;
  operator?: string;
  value?: string;
  customFieldKey?: string;
  closingNote?: string;
  assigneeType?: string;
  assigneeId?: string;
  funnelId?: string;
  stageId?: string;
  url?: string;
  method?: string;
  name?: string;
  journeyId?: string;
  targetNodeId?: string;
};

function withAddStep(
  nodeId: string,
  nodeType: IgJourneyNodeType,
  card: ReactNode,
  note?: StepNoteData
) {
  return (
    <div className="group/step relative pb-5">
      {card}
      {nodeType !== 'END' ? (
        <AddStep nodeId={nodeId} />
      ) : null}
      <StepNoteSlot nodeId={nodeId} note={note} />
    </div>
  );
}

function AddStep({ nodeId }: { nodeId: string }) {
  const actions = useIgCanvasActions();
  if (!actions) return null;
  return (
    <FlowAddStepButton
      theme={theme}
      onClick={() => actions.openAddMenu({ nodeId })}
    />
  );
}

function StepNoteSlot({ nodeId, note }: { nodeId: string; note?: StepNoteData }) {
  const actions = useIgCanvasActions();
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
  return IG_TRIGGER_EVENTS.find((e) => e.value === event)?.label ?? 'When';
}

function triggerTypeLabel(event: string | undefined) {
  if (event === 'comment.received') return 'Comment trigger';
  return 'DM trigger';
}

export function TriggerNode(props: NodeProps) {
  const d = props.data as IgNodeData & { events?: string[] };
  const actions = useIgCanvasActions();
  const events = normalizeIgTriggerEvents(d);
  const nextEvent = nextAvailableTriggerEvent(events);

  const setEvents = (next: typeof events) => {
    if (next.length === 0) return;
    actions?.updateNodeData(props.id, { events: next, event: next[0] });
  };

  return withAddStep(
    props.id,
    'TRIGGER',
    <FlowTriggerCard
      theme={theme}
      selected={props.selected}
      triggers={events.map((event) => ({
        name: triggerLabel(event),
        typeLabel: triggerTypeLabel(event),
        Icon: getTriggerEventIcon(event),
        onRemove:
          events.length > 1
            ? () => setEvents(events.filter((e) => e !== event))
            : undefined,
      }))}
      keyword={d.keyword?.trim()}
      canAddTrigger={Boolean(nextEvent)}
      onNewTrigger={
        nextEvent
          ? () => setEvents([...events, nextEvent])
          : undefined
      }
    />,
    readStepNote(props.data)
  );
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
  const type = props.type as IgJourneyNodeType;
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

export function SendMessageNode(props: NodeProps) {
  const d = props.data as IgNodeData;
  const extraBlocks = Array.isArray(d.blocks) ? Math.max(d.blocks.length - 1, 0) : 0;
  return (
    <ActionNode
      props={props}
      stepName={d.sendAs === 'private_reply' ? 'Send Message · Private Reply' : 'Send Message'}
      body={
        <div className="space-y-1">
          <MessageBody text={d.text} emptyHint="Add content" />
          {extraBlocks > 0 ? (
            <p className="text-[10px] font-semibold text-slate-400">
              +{extraBlocks} more block{extraBlocks === 1 ? '' : 's'}
            </p>
          ) : null}
        </div>
      }
      bodyPlaceholder={null}
    />
  );
}

export function AskQuestionNode(props: NodeProps) {
  const d = props.data as IgNodeData;
  const replies = Array.isArray(d.quickReplies)
    ? d.quickReplies.map((r) => r.title.trim()).filter(Boolean)
    : [];
  return (
    <ActionNode
      props={props}
      stepName="Ask Question"
      body={
        <div className="space-y-1.5">
          <MessageBody text={d.text} emptyHint="Add a text" />
          {replies.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {replies.slice(0, 3).map((title) => (
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
    />
  );
}

export function ButtonsNode(props: NodeProps) {
  const d = props.data as IgNodeData;
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
  const d = props.data as IgNodeData;
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

export function WaitNode(props: NodeProps) {
  const d = props.data as IgNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Wait"
      bodyPlaceholder={`${d.amount ?? 1} ${d.unit ?? 'hours'}`}
    />
  );
}

export function GotoStepNode(props: NodeProps) {
  const d = props.data as IgNodeData;
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
  const d = props.data as IgNodeData;
  return (
    <ActionNode
      props={props}
      stepName={NODE_LABELS.CONDITION}
      bodyPlaceholder={summarizeConditionGroup(d as Record<string, unknown>) || 'Set condition'}
      outputs="branch"
    />
  );
}

export function UpdateTagNode(props: NodeProps) {
  const d = props.data as IgNodeData;
  const tags = Array.isArray(d.tags) ? d.tags.join(', ') : '';
  return (
    <ActionNode
      props={props}
      stepName="Update Tag"
      bodyPlaceholder={tags || 'Add tags'}
    />
  );
}

export function UpdateFieldNode(props: NodeProps) {
  const d = props.data as IgNodeData;
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

export function AddToFunnelNode(props: NodeProps) {
  const d = props.data as IgNodeData;
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
  const d = props.data as IgNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Close Conversation"
      bodyPlaceholder={d.closingNote?.trim() ? 'With note' : 'Resolve conversation'}
    />
  );
}

export function AssignToNode(props: NodeProps) {
  const d = props.data as IgNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Assign To"
      bodyPlaceholder={d.assigneeType ?? 'unassigned'}
    />
  );
}

export function WebhookNode(props: NodeProps) {
  const d = props.data as IgNodeData;
  const method = d.method ?? 'POST';
  let placeholder = 'Configure request';
  if (d.url?.trim()) {
    const url = d.url.trim();
    placeholder = `${method} · ${url.length > 28 ? `${url.slice(0, 28)}…` : url}`;
  } else if (d.name?.trim()) {
    placeholder = method;
  }
  return (
    <ActionNode
      props={props}
      stepName={d.name?.trim() || 'Webhook'}
      bodyPlaceholder={placeholder}
    />
  );
}

export function TriggerJourneyNode(props: NodeProps) {
  const d = props.data as IgNodeData;
  return (
    <ActionNode
      props={props}
      stepName="Trigger Journey"
      bodyPlaceholder={
        d.journeyId ? `Automation ${d.journeyId.slice(0, 8)}…` : 'Select automation'
      }
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

export const igNodeTypes = {
  TRIGGER: TriggerNode,
  SEND_MESSAGE: SendMessageNode,
  ASK_QUESTION: AskQuestionNode,
  BUTTONS: ButtonsNode,
  WAIT: WaitNode,
  GOTO_STEP: GotoStepNode,
  CONDITION: ConditionNode,
  RANDOMIZER: RandomizerNode,
  UPDATE_TAG: UpdateTagNode,
  UPDATE_FIELD: UpdateFieldNode,
  ADD_TO_FUNNEL: AddToFunnelNode,
  OPEN_CONVERSATION: OpenConversationNode,
  CLOSE_CONVERSATION: CloseConversationNode,
  ASSIGN_TO: AssignToNode,
  WEBHOOK: WebhookNode,
  TRIGGER_JOURNEY: TriggerJourneyNode,
  END: EndNode,
};
