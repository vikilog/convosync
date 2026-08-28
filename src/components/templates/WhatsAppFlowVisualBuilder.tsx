/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Type,
  AlignLeft,
  ChevronDown,
  CircleDot,
  CheckSquare,
  Calendar,
  CalendarRange,
  X,
  GripVertical,
  Heading1,
  Heading2,
  Pilcrow,
  CaseSensitive,
  AlignJustify,
  Image as ImageIcon,
  Images,
  ShieldCheck,
  Tags,
  Camera,
  FileUp,
  Lock,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  FIELD_CONTROL_LABEL,
  allFields,
  emptyScreen,
  isChoiceType,
  isDisplayType,
  isMediaType,
  newFieldId,
  slugify,
  uniqueName,
  type BuilderField,
  type BuilderFieldType,
  type BuilderScreen,
  type BuilderState,
  type TextInputType,
} from './flowBuilderTypes';

type Props = {
  value: BuilderState;
  onChange: (next: BuilderState) => void;
  /** Published flows can't be edited (Meta locks the JSON) — render the canvas only, no palette or inspector. */
  readOnly?: boolean;
};

const PALETTE: Array<{
  group: string;
  items: Array<{ type: BuilderFieldType; label: string; icon: React.FC<{ className?: string }> }>;
}> = [
  {
    group: 'Display',
    items: [
      { type: 'TextHeading', label: 'Heading', icon: Heading1 },
      { type: 'TextSubheading', label: 'Subheading', icon: Heading2 },
      { type: 'TextBody', label: 'Body text', icon: Pilcrow },
      { type: 'TextCaption', label: 'Caption', icon: CaseSensitive },
      { type: 'RichText', label: 'Formatted text', icon: AlignJustify },
    ],
  },
  {
    group: 'Text input',
    items: [
      { type: 'TextInput', label: 'Text input', icon: Type },
      { type: 'TextArea', label: 'Text area', icon: AlignLeft },
    ],
  },
  {
    group: 'Selection',
    items: [
      { type: 'Dropdown', label: 'Dropdown', icon: ChevronDown },
      { type: 'RadioButtonsGroup', label: 'Radio buttons', icon: CircleDot },
      { type: 'CheckboxGroup', label: 'Checkboxes', icon: CheckSquare },
      { type: 'ChipsSelector', label: 'Chips', icon: Tags },
      { type: 'OptIn', label: 'Consent checkbox', icon: ShieldCheck },
    ],
  },
  {
    group: 'Date',
    items: [
      { type: 'DatePicker', label: 'Date picker', icon: Calendar },
      { type: 'CalendarPicker', label: 'Calendar (range)', icon: CalendarRange },
    ],
  },
  {
    group: 'Media',
    items: [
      { type: 'Image', label: 'Image', icon: ImageIcon },
      { type: 'ImageCarousel', label: 'Image carousel', icon: Images },
      { type: 'PhotoPicker', label: 'Photo upload', icon: Camera },
      { type: 'DocumentPicker', label: 'Document upload', icon: FileUp },
    ],
  },
];

const FIELD_ICON: Record<BuilderFieldType, React.FC<{ className?: string }>> = {
  TextHeading: Heading1,
  TextSubheading: Heading2,
  TextBody: Pilcrow,
  TextCaption: CaseSensitive,
  RichText: AlignJustify,
  Image: ImageIcon,
  ImageCarousel: Images,
  TextInput: Type,
  TextArea: AlignLeft,
  Dropdown: ChevronDown,
  RadioButtonsGroup: CircleDot,
  CheckboxGroup: CheckSquare,
  ChipsSelector: Tags,
  OptIn: ShieldCheck,
  DatePicker: Calendar,
  CalendarPicker: CalendarRange,
  PhotoPicker: Camera,
  DocumentPicker: FileUp,
};

const TEXT_INPUT_TYPES: Array<{ value: TextInputType; label: string }> = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'password', label: 'Password' },
  { value: 'passcode', label: 'Passcode' },
];

const DISPLAY_TEXT_CLASS: Partial<Record<BuilderFieldType, string>> = {
  TextHeading: 'text-lg font-bold text-[#111b21]',
  TextSubheading: 'text-sm font-bold text-[#111b21]',
  TextBody: 'text-sm text-[#111b21]',
  TextCaption: 'text-xs text-[#667781]',
  RichText: 'text-sm text-[#111b21] whitespace-pre-wrap',
};

function FieldCard({
  field,
  selected,
  readOnly,
  isDropTarget,
  isDragging,
  onSelect,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  field: BuilderField;
  selected: boolean;
  readOnly?: boolean;
  isDropTarget?: boolean;
  isDragging?: boolean;
  onSelect?: () => void;
  onRemove?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}) {
  const Icon = FIELD_ICON[field.type];
  const display = isDisplayType(field.type);
  return (
    <div
      draggable={!readOnly}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onSelect}
      className={`rounded-lg border p-2.5 transition-colors ${readOnly ? '' : 'cursor-pointer'} ${
        selected ? 'border-primary ring-1 ring-primary' : 'border-gray-200'
      } ${isDropTarget ? 'border-t-2 border-t-primary' : ''} ${isDragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {!readOnly && <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0" />}
          <Icon className="w-3.5 h-3.5 text-swiss-faint shrink-0" />
          {display ? (
            <span className={`truncate ${DISPLAY_TEXT_CLASS[field.type] || 'text-sm text-swiss-ink'}`}>
              {field.label || 'Untitled text'}
            </span>
          ) : (
            <span className="text-sm font-semibold text-swiss-ink truncate">
              {field.label || 'Untitled field'}
            </span>
          )}
          {!display && field.required && <span className="text-red-500 font-bold">*</span>}
        </div>
        {!readOnly && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remove field"
            className="text-gray-300 hover:text-red-500 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {isMediaType(field.type) && (
        <div className="mt-1.5 rounded bg-slate-50 border border-slate-100 flex items-center justify-center py-4">
          {field.mediaSrc ? (
            <img src={field.mediaSrc} alt={field.label || 'Preview'} className="max-h-16 rounded" />
          ) : (
            <ImageIcon className="w-5 h-5 text-gray-300" />
          )}
        </div>
      )}
      {!display && (
        <p className="mt-1.5 text-xs text-swiss-faint bg-slate-50 border border-slate-100 rounded px-2 py-1">
          {FIELD_CONTROL_LABEL[field.type]}
        </p>
      )}
      {field.options.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {field.options.map((opt, i) => (
            <span
              key={i}
              className="text-[11px] px-2 py-0.5 rounded-full border border-swiss-line bg-slate-50 text-swiss-muted"
            >
              {opt}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const CANVAS_BG_STYLE: React.CSSProperties = {
  backgroundColor: '#efeae2',
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23d9d0c3\' fill-opacity=\'0.35\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
};

export const WhatsAppFlowVisualBuilder: React.FC<Props> = ({ value, onChange, readOnly }) => {
  const [activeScreenId, setActiveScreenId] = useState(value.screens[0]?.id ?? '');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (!value.screens.some((s) => s.id === activeScreenId)) {
      setActiveScreenId(value.screens[0]?.id ?? '');
    }
  }, [value.screens, activeScreenId]);

  const activeScreen = value.screens.find((s) => s.id === activeScreenId) ?? value.screens[0];
  const selectedField = activeScreen?.fields.find((f) => f.id === selectedFieldId) ?? null;

  const updateScreen = (screenId: string, patch: Partial<BuilderScreen>) => {
    onChange({
      ...value,
      screens: value.screens.map((s) => (s.id === screenId ? { ...s, ...patch } : s)),
    });
  };

  const addScreen = () => {
    const screen = emptyScreen(`Screen ${value.screens.length + 1}`);
    onChange({ ...value, screens: [...value.screens, screen] });
    setActiveScreenId(screen.id);
    setSelectedFieldId(null);
  };

  const removeScreen = (screenId: string) => {
    if (value.screens.length <= 1) return;
    const screens = value.screens
      .filter((s) => s.id !== screenId)
      .map((s) => (s.nextScreenId === screenId ? { ...s, nextScreenId: null } : s));
    onChange({ ...value, screens });
  };

  const addField = (type: BuilderFieldType, label: string) => {
    if (!activeScreen) return;
    const display = isDisplayType(type);
    const field: BuilderField = {
      id: newFieldId(),
      type,
      label: display ? `${label} text` : label,
      name: display ? '' : uniqueName(slugify(label), allFields(value)),
      required: false,
      options: isChoiceType(type) ? ['Option 1', 'Option 2'] : [],
      inputType: type === 'TextInput' ? 'text' : undefined,
      calendarMode: type === 'CalendarPicker' ? 'single' : undefined,
    };
    updateScreen(activeScreen.id, { fields: [...activeScreen.fields, field] });
    setSelectedFieldId(field.id);
  };

  const removeField = (id: string) => {
    if (!activeScreen) return;
    updateScreen(activeScreen.id, { fields: activeScreen.fields.filter((f) => f.id !== id) });
    if (selectedFieldId === id) setSelectedFieldId(null);
  };

  const updateField = (id: string, patch: Partial<BuilderField>) => {
    if (!activeScreen) return;
    updateScreen(activeScreen.id, {
      fields: activeScreen.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const reorder = (fromId: string, toId: string) => {
    if (!activeScreen || fromId === toId) return;
    const fields = [...activeScreen.fields];
    const fromIdx = fields.findIndex((f) => f.id === fromId);
    const toIdx = fields.findIndex((f) => f.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = fields.splice(fromIdx, 1);
    fields.splice(toIdx, 0, moved);
    updateScreen(activeScreen.id, { fields });
  };

  if (!activeScreen) return null;

  const otherScreens = value.screens.filter((s) => s.id !== activeScreen.id);

  const screenTabs = (
    <div className="flex items-center gap-1.5 flex-wrap mb-3">
      {value.screens.map((s, i) => (
        <div key={s.id} className="relative group">
          <button
            type="button"
            onClick={() => {
              setActiveScreenId(s.id);
              setSelectedFieldId(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
              s.id === activeScreen.id
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-white text-swiss-muted border-swiss-line hover:bg-slate-50'
            }`}
          >
            {i + 1}. {s.title || 'Untitled'}
          </button>
          {!readOnly && value.screens.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeScreen(s.id);
              }}
              aria-label={`Remove ${s.title || 'screen'}`}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-white border border-slate-300 text-swiss-faint hover:text-red-500 hover:border-red-300 items-center justify-center hidden group-hover:flex"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}
      {!readOnly && (
        <button
          type="button"
          onClick={addScreen}
          className="px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-slate-300 text-swiss-muted hover:border-primary/40 hover:text-primary flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add screen
        </button>
      )}
    </div>
  );

  if (readOnly) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-swiss-faint">
          <Lock className="w-3.5 h-3.5" />
          Published — read only
        </div>
        {value.screens.length > 1 && screenTabs}
        <div className="w-full max-w-[380px] rounded-xl p-6 flex justify-center" style={CANVAS_BG_STYLE}>
          <div className="w-full max-w-[300px] bg-white rounded-lg overflow-hidden">
            <div className="px-3.5 pt-3 pb-2 border-b border-[#e9edef]">
              <p className="font-semibold text-base text-[#111b21]">{activeScreen.title}</p>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {activeScreen.fields.map((f) => (
                <FieldCard key={f.id} field={f} selected={false} readOnly />
              ))}
            </div>
            <div className="px-3 pb-3">
              <div className="w-full text-center bg-primary text-white text-sm font-bold rounded-lg py-2.5">
                {activeScreen.footerLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[560px]">
      {screenTabs}
      <div className="grid grid-cols-[210px_minmax(0,1fr)_260px] gap-4 flex-1 min-h-0">
        <div className="bg-white border border-swiss-line p-3 overflow-y-auto">
          {PALETTE.map((group) => (
            <div key={group.group} className="mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint px-1.5 pb-2">
                {group.group}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => addField(item.type, item.label)}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-semibold text-swiss-ink hover:bg-slate-50 text-left"
                  >
                    <Icon className="w-4 h-4 text-swiss-faint shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="rounded-xl p-6 overflow-y-auto flex flex-col items-center" style={CANVAS_BG_STYLE}>
          <p className="text-xs text-[#54656f] bg-white/90 px-2.5 py-1 rounded-md mb-4">
            Click a field on the left to add it, drag cards to reorder
          </p>
          <div className="w-full max-w-[340px] bg-white rounded-lg overflow-hidden">
            <div className="px-3.5 pt-3 pb-2 border-b border-[#e9edef]">
              <Input
                type="text"
                value={activeScreen.title}
                onChange={(e) => updateScreen(activeScreen.id, { title: e.target.value })}
                placeholder="Screen title"
                className="h-auto w-full font-semibold text-base text-[#111b21] outline-none bg-transparent"
              />
            </div>

            <div className="p-3 flex flex-col gap-2 min-h-[120px]">
              {activeScreen.fields.length === 0 ? (
                <div className="border border-dashed border-gray-300 rounded-lg py-8 px-4 text-center text-xs text-swiss-faint">
                  No fields yet — click a field type on the left
                </div>
              ) : (
                activeScreen.fields.map((f) => (
                  <FieldCard
                    key={f.id}
                    field={f}
                    selected={f.id === selectedFieldId}
                    isDropTarget={dropTargetId === f.id}
                    isDragging={dragId === f.id}
                    onSelect={() => setSelectedFieldId(f.id)}
                    onRemove={() => removeField(f.id)}
                    onDragStart={() => setDragId(f.id)}
                    onDragEnd={() => {
                      setDragId(null);
                      setDropTargetId(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      if (f.id !== dragId) setDropTargetId(f.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId) reorder(dragId, f.id);
                      setDropTargetId(null);
                    }}
                  />
                ))
              )}
            </div>

            <div className="px-3 pb-3 space-y-2">
              <Input
                type="text"
                value={activeScreen.footerLabel}
                onChange={(e) => updateScreen(activeScreen.id, { footerLabel: e.target.value })}
                className="h-auto w-full text-center bg-primary text-white text-sm font-bold rounded-lg py-2.5 outline-none"
              />
              <div className="flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-swiss-faint shrink-0" />
                <select
                  value={activeScreen.nextScreenId || ''}
                  onChange={(e) =>
                    updateScreen(activeScreen.id, { nextScreenId: e.target.value || null })
                  }
                  className="flex-1 bg-slate-50 border border-swiss-line rounded-lg py-1.5 px-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Submit and end the flow</option>
                  {otherScreens.map((s) => (
                    <option key={s.id} value={s.id}>
                      Go to: {s.title || 'Untitled screen'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-swiss-line p-4 overflow-y-auto">
          <p className="text-[11px] font-bold uppercase tracking-wide text-swiss-faint mb-3">
            Field settings
          </p>
          {!selectedField ? (
            <p className="text-xs text-swiss-faint leading-relaxed">
              Select a field on the screen, or add one from the left, to edit it here.
            </p>
          ) : isDisplayType(selectedField.type) ? (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-swiss-muted">
                  {selectedField.type === 'RichText' ? 'Text (one line each)' : 'Text content'}
                </span>
                {selectedField.type === 'RichText' ? (
                  <Textarea
                    value={selectedField.label}
                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                    rows={4}
                    className="min-h-0 mt-1 w-full bg-slate-50 border border-swiss-line rounded-lg py-2 px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : !isMediaType(selectedField.type) ? (
                  <Input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                    className="h-auto mt-1 w-full bg-slate-50 border border-swiss-line rounded-lg py-2 px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                ) : (
                  <Input
                    type="text"
                    value={selectedField.label}
                    onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                    placeholder="Alt text"
                    className="h-auto mt-1 w-full bg-slate-50 border border-swiss-line rounded-lg py-2 px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                )}
              </label>
              {isMediaType(selectedField.type) && (
                <div>
                  <span className="text-xs font-bold text-swiss-muted">Image</span>
                  <label className="mt-1.5 flex items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded-lg py-3 text-xs font-semibold text-swiss-muted hover:border-primary/40 hover:bg-primary/5 cursor-pointer">
                    <ImageIcon className="w-3.5 h-3.5" />
                    {selectedField.mediaSrc ? 'Replace image' : 'Upload image'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          updateField(selectedField.id, { mediaSrc: String(reader.result) });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-swiss-muted">
                  {selectedField.type === 'OptIn' ? 'Consent text' : 'Question label'}
                </span>
                <Input
                  type="text"
                  value={selectedField.label}
                  onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                  className="h-auto mt-1 w-full bg-slate-50 border border-swiss-line rounded-lg py-2 px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                />
              </label>

              <div>
                <span className="text-xs font-bold text-swiss-muted">Answer is saved as</span>
                <p className="mt-1 font-mono text-xs text-swiss-muted bg-slate-50 border border-swiss-line rounded px-2 py-1.5 inline-block">
                  {selectedField.name}
                </p>
                <p className="mt-1 text-[11px] text-swiss-faint">
                  Generated from the label — this is what shows up in the inbox and reports.
                </p>
              </div>

              {selectedField.type === 'TextInput' && (
                <label className="block">
                  <span className="text-xs font-bold text-swiss-muted">Answer type</span>
                  <select
                    value={selectedField.inputType || 'text'}
                    onChange={(e) =>
                      updateField(selectedField.id, { inputType: e.target.value as TextInputType })
                    }
                    className="mt-1 w-full bg-slate-50 border border-swiss-line rounded-lg py-2 px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {TEXT_INPUT_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {selectedField.type === 'CalendarPicker' && (
                <label className="block">
                  <span className="text-xs font-bold text-swiss-muted">Selection</span>
                  <select
                    value={selectedField.calendarMode || 'single'}
                    onChange={(e) =>
                      updateField(selectedField.id, {
                        calendarMode: e.target.value as 'single' | 'range',
                      })
                    }
                    className="mt-1 w-full bg-slate-50 border border-swiss-line rounded-lg py-2 px-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="single">Single date</option>
                    <option value="range">Date range</option>
                  </select>
                </label>
              )}

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-swiss-muted">Required to continue</span>
                <button
                  type="button"
                  onClick={() => updateField(selectedField.id, { required: !selectedField.required })}
                  aria-pressed={selectedField.required}
                  className={`w-9 h-5 rounded-full relative transition-colors ${
                    selectedField.required ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      selectedField.required ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>

              {isChoiceType(selectedField.type) && (
                <div>
                  <span className="text-xs font-bold text-swiss-muted">Choices</span>
                  <div className="mt-1.5 space-y-1.5">
                    {selectedField.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const options = [...selectedField.options];
                            options[i] = e.target.value;
                            updateField(selectedField.id, { options });
                          }}
                          className="h-auto flex-1 bg-slate-50 border border-swiss-line rounded-lg py-1.5 px-2 text-xs outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateField(selectedField.id, {
                              options: selectedField.options.filter((_, idx) => idx !== i),
                            })
                          }
                          aria-label="Remove choice"
                          className="text-gray-300 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        updateField(selectedField.id, {
                          options: [...selectedField.options, `Option ${selectedField.options.length + 1}`],
                        })
                      }
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      + Add choice
                    </button>
                  </div>
                </div>
              )}

              {(selectedField.type === 'PhotoPicker' || selectedField.type === 'DocumentPicker') && (
                <p className="text-[11px] text-swiss-faint">
                  Collects a {selectedField.type === 'PhotoPicker' ? 'photo' : 'document'} upload
                  from the person filling the form.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
