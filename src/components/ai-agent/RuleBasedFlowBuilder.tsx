import React, { useCallback, useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GitBranch,
  HelpCircle,
  Maximize2,
  MessageSquare,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  UserCheck,
  Webhook,
  X,
} from 'lucide-react';
import type {
  AgentFlowDefinition,
  AgentFlowNode,
  AgentFlowNodeType,
  FlowTriggerType,
  KeywordMatchRule,
} from '../../types';
import {
  SAMPLE_AGENT_FLOW,
  SAMPLE_EXACT_MATCH_FLOW,
  SAMPLE_FLOW_TEST_HINTS,
} from './sampleAgentFlow';

const TOOLBOX_WIDTH = 240;

const TOOLBOX_ACTIONS: { type: AgentFlowNodeType; label: string; icon: React.ReactNode }[] = [
  { type: 'ask_question', label: 'Ask a question', icon: <HelpCircle className="w-4 h-4 shrink-0" /> },
  { type: 'send_messages', label: 'Send messages', icon: <MessageSquare className="w-4 h-4 shrink-0" /> },
  { type: 'call_api', label: 'Call API', icon: <Webhook className="w-4 h-4 shrink-0" /> },
  { type: 'agent_takeover', label: 'Agent takeover', icon: <UserCheck className="w-4 h-4 shrink-0" /> },
  { type: 'unsubscribe', label: 'Unsubscribe', icon: <X className="w-4 h-4 shrink-0" /> },
  { type: 'add_tags', label: 'Add Tags', icon: <Tag className="w-4 h-4 shrink-0" /> },
  {
    type: 'send_shop_product',
    label: 'Send Shop product',
    icon: <ShoppingBag className="w-4 h-4 shrink-0" />,
  },
];

const NODE_LABELS: Record<AgentFlowNodeType, string> = {
  ask_question: 'Ask a question',
  send_messages: 'Send messages',
  call_api: 'Call API',
  agent_takeover: 'Agent takeover',
  unsubscribe: 'Unsubscribe',
  add_tags: 'Add Tags',
  send_shop_product: 'Send Shop product',
  branch: 'Branch',
};

const TRIGGER_LABELS: Record<FlowTriggerType, string> = {
  keyword: 'Keyword trigger',
  click_button: 'Click button trigger',
};

const TRIGGER_DESCRIPTIONS: Record<FlowTriggerType, string> = {
  keyword:
    "When a customer's message or a clicked quick reply button contains the predefined keyword.",
  click_button:
    'When a customer clicks a quick reply button in a WhatsApp template, it triggers a flow.',
};

const MATCH_RULE_OPTIONS: { value: KeywordMatchRule; label: string }[] = [
  { value: 'containing', label: 'Containing' },
  { value: 'exact_match', label: 'Exact match' },
];

function defaultFlow(): AgentFlowDefinition {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  return {
    name: `${stamp}FLOW`,
    status: 'inactive',
    triggerType: null,
    keywordMatchRule: 'containing',
    keywordList: [],
    nodes: [],
  };
}

function normalizeKeywordList(list: string[] | undefined): string[] {
  if (!list?.length) return [''];
  return list;
}

type TriggerPanelMode = 'select' | 'keyword' | 'click_button';

function FlowConnector({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex items-center shrink-0 px-1">
      <div className="w-10 h-px bg-[#9ca3af]" />
      <button
        type="button"
        onClick={onAdd}
        className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700 shrink-0 -mx-0.5"
        title="Add step"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <div className="w-6 h-px bg-[#9ca3af]" />
    </div>
  );
}

function FlowNodeCard({
  headerClass,
  title,
  body,
  onClick,
}: {
  headerClass: string;
  title: string;
  body: React.ReactNode;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`w-[200px] shrink-0 rounded-lg overflow-hidden border border-slate-200 bg-white shadow-sm text-left ${
        onClick ? 'hover:shadow-md transition-shadow cursor-pointer' : ''
      }`}
    >
      <div className={`${headerClass} px-3 py-2.5`}>
        <span className="text-sm font-bold text-white">{title}</span>
      </div>
      <div className="px-3 py-4 min-h-[64px] text-xs text-gray-500">{body}</div>
    </Tag>
  );
}

type Props = {
  flow: AgentFlowDefinition | null | undefined;
  saving?: boolean;
  onSave: (flow: AgentFlowDefinition) => void;
};

export const RuleBasedFlowBuilder: React.FC<Props> = ({ flow, saving, onSave }) => {
  const [definition, setDefinition] = useState<AgentFlowDefinition>(() => flow ?? defaultFlow());
  const [toolboxOpen, setToolboxOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'build' | 'analysis'>('build');
  const [triggerPanelOpen, setTriggerPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<TriggerPanelMode>('select');
  const [draftMatchRule, setDraftMatchRule] = useState<KeywordMatchRule>(
    definition.keywordMatchRule ?? 'containing'
  );
  const [draftKeywordList, setDraftKeywordList] = useState<string[]>(() =>
    normalizeKeywordList(definition.keywordList)
  );
  const [keywordSectionOpen, setKeywordSectionOpen] = useState(true);
  const [keywordErrors, setKeywordErrors] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [checkMessage, setCheckMessage] = useState<string | null>(null);

  const scale = zoom / 100;

  const triggerSummary = useMemo(() => {
    if (!definition.triggerType) return '';
    if (definition.triggerType === 'keyword') {
      const filled = (definition.keywordList ?? []).map((k) => k.trim()).filter(Boolean);
      if (!filled.length) return 'Configure keywords';
      const rule =
        definition.keywordMatchRule === 'exact_match' ? 'Exact match' : 'Containing';
      return `${rule}: ${filled.join(', ')}`;
    }
    return 'WhatsApp template quick reply';
  }, [definition.triggerType, definition.keywordMatchRule, definition.keywordList]);

  const addNode = useCallback((type: AgentFlowNodeType) => {
    setDefinition((prev) => {
      const node: AgentFlowNode = {
        id: `node_${Date.now()}_${prev.nodes.length}`,
        type,
        title: NODE_LABELS[type],
        x: 0,
        y: 0,
      };
      return { ...prev, nodes: [...prev.nodes, node] };
    });
  }, []);

  const openTriggerPanel = () => {
    if (definition.triggerType === 'keyword') {
      setPanelMode('keyword');
      setDraftMatchRule(definition.keywordMatchRule ?? 'containing');
      setDraftKeywordList(normalizeKeywordList(definition.keywordList));
    } else if (definition.triggerType === 'click_button') {
      setPanelMode('click_button');
    } else {
      setPanelMode('select');
      setDraftMatchRule('containing');
      setDraftKeywordList(['']);
    }
    setKeywordSectionOpen(true);
    setKeywordErrors(false);
    setTriggerPanelOpen(true);
  };

  const startKeywordConfig = () => {
    setPanelMode('keyword');
    setDraftMatchRule(definition.keywordMatchRule ?? 'containing');
    setDraftKeywordList(normalizeKeywordList(definition.keywordList));
    setKeywordSectionOpen(true);
    setKeywordErrors(false);
  };

  const saveKeywordTrigger = () => {
    const trimmed = draftKeywordList.map((k) => k.trim());
    const hasEmpty = trimmed.some((k) => !k);
    if (hasEmpty) {
      setKeywordErrors(true);
      return;
    }
    setDefinition((prev) => ({
      ...prev,
      triggerType: 'keyword',
      keywordMatchRule: draftMatchRule,
      keywordList: trimmed,
    }));
    setKeywordErrors(false);
    setTriggerPanelOpen(false);
  };

  const saveClickButtonTrigger = () => {
    setDefinition((prev) => ({
      ...prev,
      triggerType: 'click_button',
    }));
    setTriggerPanelOpen(false);
  };

  const removeKeywordTrigger = () => {
    setDefinition((prev) => ({
      ...prev,
      triggerType: null,
      keywordList: [],
      keywordMatchRule: 'containing',
    }));
    setPanelMode('select');
    setDraftKeywordList(['']);
    setDraftMatchRule('containing');
    setKeywordErrors(false);
  };

  const updateDraftKeyword = (index: number, value: string) => {
    setDraftKeywordList((prev) => prev.map((k, i) => (i === index ? value : k)));
  };

  const addDraftKeyword = () => {
    setDraftKeywordList((prev) => [...prev, '']);
  };

  const removeDraftKeyword = (index: number) => {
    setDraftKeywordList((prev) => {
      if (prev.length <= 1) return [''];
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSave = () => onSave(definition);

  const handleCheck = () => {
    const issues: string[] = [];
    if (!definition.triggerType) issues.push('Select a trigger type');
    if (definition.triggerType === 'keyword') {
      const filled = (definition.keywordList ?? []).map((k) => k.trim()).filter(Boolean);
      if (!filled.length) issues.push('Add at least one keyword');
    }
    if (definition.nodes.length === 0) issues.push('Add at least one action after the trigger');
    setCheckMessage(
      issues.length === 0
        ? 'Flow looks good — ready to save and activate.'
        : issues.join(' · ')
    );
  };

  const loadSample = (sample: AgentFlowDefinition) => {
    setDefinition({ ...sample, status: 'active' });
    setTriggerPanelOpen(false);
    setCheckMessage(
      `Sample "${sample.name}" loaded (set Active). ${SAMPLE_FLOW_TEST_HINTS[0]} Click Save to keep it.`
    );
  };

  const toggleFlowStatus = () => {
    setDefinition((prev) => ({
      ...prev,
      status: prev.status === 'active' ? 'inactive' : 'active',
    }));
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#eef0f3] overflow-hidden">
      {/* Top bar */}
      <div className="h-14 shrink-0 bg-white border-b border-slate-200 px-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={definition.name}
            onChange={(e) => setDefinition((prev) => ({ ...prev, name: e.target.value }))}
            className="text-sm font-bold text-gray-900 bg-transparent border-none outline-none min-w-0 flex-1"
          />
          <button
            type="button"
            onClick={toggleFlowStatus}
            title="Toggle flow active/inactive for WhatsApp"
            className={`shrink-0 px-2.5 py-0.5 rounded-full text-sm font-bold uppercase transition-colors ${
              definition.status === 'active'
                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            {definition.status === 'active' ? 'Active' : 'Inactive'}
          </button>
        </div>

        <div className="flex items-center gap-1 bg-[#f3f4f6] rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab('build')}
            className={`px-5 py-1.5 text-sm font-bold rounded-md transition-colors ${
              activeTab === 'build' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Build
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            className={`px-5 py-1.5 text-sm font-bold rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'analysis' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analysis
          </button>
        </div>

        <div className="flex items-center justify-end gap-2">
          <div className="hidden sm:flex items-center gap-1 mr-1">
            <button
              type="button"
              onClick={() => loadSample(SAMPLE_AGENT_FLOW)}
              className="px-3 py-2 text-sm font-bold text-sky-600 bg-[#f0f9ff] border border-sky-100 rounded-lg hover:bg-sky-50"
              title={SAMPLE_FLOW_TEST_HINTS.join(' ')}
            >
              Sample: Support
            </button>
            <button
              type="button"
              onClick={() => loadSample(SAMPLE_EXACT_MATCH_FLOW)}
              className="px-3 py-2 text-sm font-bold text-gray-600 bg-white border border-slate-200 rounded-lg hover:bg-gray-50"
            >
              Sample: Exact
            </button>
          </div>
          {saving && <span className="text-xs text-gray-400 font-bold mr-1">Saving…</span>}
          <button
            type="button"
            onClick={handleCheck}
            className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-gray-50"
          >
            Check
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800"
          >
            Save
          </button>
        </div>
      </div>

      {checkMessage && (
        <div className="shrink-0 px-5 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800">
          {checkMessage}
        </div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Toolbox */}
        <div
          className="relative shrink-0 flex transition-[width] duration-200 ease-out border-r border-slate-200 bg-white"
          style={{ width: toolboxOpen ? TOOLBOX_WIDTH : 0 }}
        >
          {toolboxOpen && (
            <aside className="flex flex-col h-full w-[240px] overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 text-left">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                Actions
              </p>
              <div className="space-y-0.5 mb-5">
                {TOOLBOX_ACTIONS.map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addNode(item.type)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-gray-700 rounded-lg hover:bg-[#f0f9ff] hover:text-sky-600 transition-colors text-left"
                  >
                    <span className="text-gray-400">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>

              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                Shopify
              </p>
              <button
                type="button"
                disabled
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-gray-300 rounded-lg cursor-not-allowed text-left mb-5"
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                Send Shopify orders
              </button>

              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">
                Rules
              </p>
              <button
                type="button"
                onClick={() => addNode('branch')}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-medium text-gray-700 rounded-lg hover:bg-[#f0f9ff] hover:text-sky-600 transition-colors text-left"
              >
                <GitBranch className="w-4 h-4 shrink-0 text-gray-400" />
                Branch
              </button>
            </div>
          </aside>
          )}

          {toolboxOpen ? (
            <button
              type="button"
              onClick={() => setToolboxOpen(false)}
              className="absolute top-4 -right-3 z-10 w-6 h-7 bg-white border border-slate-200 rounded-r-md flex items-center justify-center text-gray-500 hover:text-gray-800 shadow-sm"
              aria-label="Collapse toolbox"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setToolboxOpen(true)}
              className="absolute top-4 left-0 z-10 w-6 h-7 bg-white border border-slate-200 rounded-r-md flex items-center justify-center text-gray-500 hover:text-gray-800 shadow-sm"
              aria-label="Expand toolbox"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Canvas + trigger panel */}
        <div className="flex-1 min-w-0 relative overflow-hidden">
          {triggerPanelOpen && (
            <>
              <button
                type="button"
                className="absolute inset-0 z-10 bg-black/20"
                onClick={() => setTriggerPanelOpen(false)}
                aria-label="Close trigger panel"
              />
              <div className="absolute inset-y-0 left-0 z-20 w-[360px] max-w-[90vw] bg-white border-r border-slate-200 shadow-xl flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
                  <h3 className="text-sm font-bold text-gray-900">Trigger</h3>
                  <button
                    type="button"
                    onClick={() => setTriggerPanelOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {panelMode === 'select' && (
                    <div className="p-5 space-y-3">
                      {(['keyword', 'click_button'] as FlowTriggerType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() =>
                            type === 'keyword' ? startKeywordConfig() : setPanelMode('click_button')
                          }
                          className="w-full text-left p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-[#c4b5fd] transition-all"
                        >
                          <p className="text-sm font-bold text-sky-600 mb-1">
                            {TRIGGER_LABELS[type]}
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            {TRIGGER_DESCRIPTIONS[type]}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {panelMode === 'click_button' && (
                    <div className="p-5">
                      <div className="p-4 rounded-xl border-2 border-[#7c3aed] bg-[#faf5ff]">
                        <p className="text-sm font-bold text-sky-600 mb-1">
                          {TRIGGER_LABELS.click_button}
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {TRIGGER_DESCRIPTIONS.click_button}
                        </p>
                      </div>
                    </div>
                  )}

                  {panelMode === 'keyword' && (
                    <div className="p-5">
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                          <button
                            type="button"
                            onClick={() => setKeywordSectionOpen((v) => !v)}
                            className="flex-1 flex items-center justify-between text-left min-w-0"
                          >
                            <span className="text-sm font-bold text-gray-900">Keyword trigger</span>
                            {keywordSectionOpen ? (
                              <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={removeKeywordTrigger}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 shrink-0"
                            title="Remove keyword trigger"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {keywordSectionOpen && (
                          <div className="p-4 space-y-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-1.5">
                                Keywords matching rules
                              </label>
                              <select
                                value={draftMatchRule}
                                onChange={(e) =>
                                  setDraftMatchRule(e.target.value as KeywordMatchRule)
                                }
                                className="w-full border border-slate-200 rounded-lg py-2.5 px-3 text-sm bg-white focus:ring-2 focus:ring-[#0284c7]/20 outline-none"
                              >
                                {MATCH_RULE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-3">
                              {draftKeywordList.map((keyword, index) => {
                                const showError = keywordErrors && !keyword.trim();
                                return (
                                  <div key={`kw-${index}`}>
                                    <div className="flex items-start gap-2">
                                      <input
                                        type="text"
                                        value={keyword}
                                        onChange={(e) => updateDraftKeyword(index, e.target.value)}
                                        placeholder="Please enter"
                                        className={`flex-1 border rounded-lg py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-[#0284c7]/20 ${
                                          showError
                                            ? 'border-red-400 focus:border-red-400'
                                            : 'border-slate-200 focus:border-sky-600'
                                        }`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeDraftKeyword(index)}
                                        className="p-2.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 shrink-0"
                                        title="Remove keyword"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    {showError && (
                                      <p className="text-meta text-red-500 mt-1">Required</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={addDraftKeyword}
                              className="flex items-center gap-1.5 text-sm font-bold text-sky-600 hover:text-[#4a3de0]"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Keyword
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-5 border-t border-slate-200 flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (panelMode === 'keyword') saveKeywordTrigger();
                      else if (panelMode === 'click_button') saveClickButtonTrigger();
                      else setTriggerPanelOpen(false);
                    }}
                    className="flex-1 py-2.5 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setTriggerPanelOpen(false)}
                    className="flex-1 py-2.5 text-sm font-bold text-gray-700 bg-white border border-slate-200 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'analysis' ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 bg-[#eef0f3]">
              Flow analytics will appear here once the flow is active.
            </div>
          ) : (
            <div
              className="absolute inset-0 overflow-auto"
              style={{
                backgroundImage: 'radial-gradient(circle, #b8bcc4 1px, transparent 1px)',
                backgroundSize: `${20 * scale}px ${20 * scale}px`,
                backgroundColor: '#eef0f3',
              }}
            >
              <div
                className="inline-block min-w-full min-h-full p-10"
                style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
              >
                <div className="flex items-start flex-nowrap">
                  <FlowNodeCard
                    headerClass="bg-[#7c3aed]"
                    title="Trigger"
                    onClick={openTriggerPanel}
                    body={
                      definition.triggerType ? (
                        <>
                          <p className="font-bold text-gray-800">
                            {TRIGGER_LABELS[definition.triggerType]}
                          </p>
                          {triggerSummary && (
                            <p className="mt-1.5 text-xs text-gray-500">{triggerSummary}</p>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">Click to configure</span>
                      )
                    }
                  />

                  {definition.nodes.length === 0 ? (
                    <FlowConnector onAdd={() => addNode('send_messages')} />
                  ) : (
                    definition.nodes.map((node, i) => (
                      <React.Fragment key={node.id}>
                        <FlowConnector onAdd={() => addNode(node.type)} />
                        <FlowNodeCard
                          headerClass="bg-sky-600"
                          title={node.title}
                          body={<span className="text-gray-400">Configure in next step</span>}
                        />
                        {i === definition.nodes.length - 1 && (
                          <FlowConnector onAdd={() => addNode('send_messages')} />
                        )}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Zoom controls */}
          <div className="absolute bottom-5 left-5 flex items-center gap-0.5 bg-white border border-slate-200 rounded-lg shadow-md px-1 py-1 z-[5]">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(150, z + 10))}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-bold text-gray-600 w-11 text-center">{zoom}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            <button
              type="button"
              onClick={() => setZoom(100)}
              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
              title="Reset zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { defaultFlow as defaultAgentFlowDefinition };
export { SAMPLE_AGENT_FLOW, SAMPLE_EXACT_MATCH_FLOW, SAMPLE_FLOW_TEST_HINTS } from './sampleAgentFlow';
