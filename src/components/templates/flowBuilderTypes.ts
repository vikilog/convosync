/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BuilderFieldType =
  // Display — no data collected
  | 'TextHeading'
  | 'TextSubheading'
  | 'TextBody'
  | 'TextCaption'
  | 'RichText'
  | 'Image'
  | 'ImageCarousel'
  // Text input
  | 'TextInput'
  | 'TextArea'
  // Selection
  | 'Dropdown'
  | 'RadioButtonsGroup'
  | 'CheckboxGroup'
  | 'ChipsSelector'
  | 'OptIn'
  // Date
  | 'DatePicker'
  | 'CalendarPicker'
  // Media input
  | 'PhotoPicker'
  | 'DocumentPicker';

export type TextInputType = 'text' | 'number' | 'email' | 'password' | 'passcode' | 'phone';
export type CalendarMode = 'single' | 'range';

export type BuilderField = {
  id: string;
  type: BuilderFieldType;
  /** Question label (input types) or the shown text (display types). */
  label: string;
  /** Unused for display types. */
  name: string;
  /** Unused for display types. */
  required: boolean;
  /** Choice types only (Dropdown / RadioButtonsGroup / CheckboxGroup / ChipsSelector). */
  options: string[];
  /** TextInput only. */
  inputType?: TextInputType;
  /** CalendarPicker only. */
  calendarMode?: CalendarMode;
  /** Image / ImageCarousel only — base64 data URI. Empty renders a placeholder. */
  mediaSrc?: string;
};

export type BuilderScreen = {
  /** Stable Meta screen id, e.g. SCREEN_1 — also used as the navigate target. */
  id: string;
  title: string;
  fields: BuilderField[];
  /** Footer button label — "Next" on a mid-flow screen, "Submit" on the terminal one. */
  footerLabel: string;
  /** Screen id to navigate to on Footer press, or null for the terminal screen (submits the flow). */
  nextScreenId: string | null;
};

export type BuilderState = {
  screens: BuilderScreen[];
};

export const FIELD_CONTROL_LABEL: Record<BuilderFieldType, string> = {
  TextHeading: 'Heading text',
  TextSubheading: 'Subheading text',
  TextBody: 'Body text',
  TextCaption: 'Caption text',
  RichText: 'Formatted text',
  Image: 'Image',
  ImageCarousel: 'Image carousel',
  TextInput: 'Single line text',
  TextArea: 'Multi-line text',
  Dropdown: 'Choose one — dropdown',
  RadioButtonsGroup: 'Choose one — radio buttons',
  CheckboxGroup: 'Choose multiple',
  ChipsSelector: 'Choose one/multiple — chips',
  OptIn: 'Consent checkbox',
  DatePicker: 'Date picker',
  CalendarPicker: 'Calendar (single or range)',
  PhotoPicker: 'Photo upload',
  DocumentPicker: 'Document upload',
};

const DISPLAY_TYPES: BuilderFieldType[] = [
  'TextHeading',
  'TextSubheading',
  'TextBody',
  'TextCaption',
  'RichText',
  'Image',
  'ImageCarousel',
];

const CHOICE_TYPES: BuilderFieldType[] = ['Dropdown', 'RadioButtonsGroup', 'CheckboxGroup', 'ChipsSelector'];

const MEDIA_TYPES: BuilderFieldType[] = ['Image', 'ImageCarousel'];

export function isDisplayType(type: BuilderFieldType): boolean {
  return DISPLAY_TYPES.includes(type);
}

export function isChoiceType(type: BuilderFieldType): boolean {
  return CHOICE_TYPES.includes(type);
}

export function isMediaType(type: BuilderFieldType): boolean {
  return MEDIA_TYPES.includes(type);
}

export function slugify(label: string): string {
  return (
    label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'field'
  );
}

/** Field names must be unique across the whole flow, not just one screen — every screen downstream re-declares earlier fields in its data schema, so a collision would silently shadow a value. */
export function uniqueName(base: string, allFields: BuilderField[], skipId?: string): string {
  const taken = new Set(allFields.filter((f) => f.id !== skipId).map((f) => f.name));
  let name = base;
  let n = 1;
  while (taken.has(name)) {
    n += 1;
    name = `${base}_${n}`;
  }
  return name;
}

let idSeq = 0;
export function newFieldId(): string {
  idSeq += 1;
  return `f${Date.now()}_${idSeq}`;
}

// Meta requires screen `id` to be alphabets/underscores only — no digits — so
// the counter is base-26 letter-encoded (A, B, ... Z, AA, AB, ...) rather
// than using a numeric suffix.
let screenSeq = 0;
function letterSuffix(n: number): string {
  let s = '';
  let x = n;
  do {
    s = String.fromCharCode(65 + (x % 26)) + s;
    x = Math.floor(x / 26) - 1;
  } while (x >= 0);
  return s;
}
export function newScreenId(): string {
  const suffix = letterSuffix(screenSeq);
  screenSeq += 1;
  return `SCREEN_${suffix}`;
}

export function allFields(state: BuilderState): BuilderField[] {
  return state.screens.flatMap((s) => s.fields);
}

function dataFields(screen: BuilderScreen): BuilderField[] {
  return screen.fields.filter((f) => !isDisplayType(f.type));
}

function fieldToJson(f: BuilderField): Record<string, unknown> {
  if (isDisplayType(f.type)) {
    if (f.type === 'RichText') {
      return { type: f.type, text: (f.label || '').split('\n').filter(Boolean) };
    }
    if (isMediaType(f.type)) {
      const src = f.mediaSrc || '';
      return f.type === 'ImageCarousel'
        ? { type: f.type, images: src ? [{ src }] : [], 'alt-text': f.label || undefined }
        : { type: f.type, src, 'alt-text': f.label || 'Image' };
    }
    return { type: f.type, text: f.label };
  }

  const base: Record<string, unknown> = {
    type: f.type,
    name: f.name,
    label: f.label,
    required: f.required,
  };
  if (f.type === 'TextInput') base['input-type'] = f.inputType || 'text';
  if (f.type === 'CalendarPicker') base.mode = f.calendarMode || 'single';
  if (isChoiceType(f.type)) {
    // Meta requires data-source `id` to be alphabets/underscores only — no digits.
    base['data-source'] = f.options.map((opt, i) => ({
      id: `${f.name}_${letterSuffix(i)}`,
      title: opt,
    }));
  }
  return base;
}

/**
 * Meta requires screen `id` to be alphabets/underscores only. Older drafts
 * (created before this rule was enforced at generation time) can still have
 * a legacy id with digits baked into their stored JSON — sanitize on every
 * serialize so a flow self-heals the moment it's saved again, instead of
 * requiring the screen to be recreated from scratch.
 */
function sanitizeScreenId(id: string, fallbackIndex: number): string {
  const cleaned = id.replace(/[^A-Za-z_]/g, '');
  return cleaned || `SCREEN_${letterSuffix(fallbackIndex)}`;
}

/**
 * Builder state → Meta Flow JSON. Every screen after the first declares a
 * `data` schema for all fields collected on earlier screens, and each
 * Footer's payload threads those forward (`${data.x}`) alongside its own
 * screen's answers (`${form.x}`) — that's how Meta actually carries values
 * across screens; `${form.x}` alone only ever sees the current screen.
 */
export function builderStateToFlowJson(state: BuilderState): object {
  const safeIdByOriginal = new Map<string, string>();
  state.screens.forEach((screen, idx) => {
    safeIdByOriginal.set(screen.id, sanitizeScreenId(screen.id, idx));
  });

  const screens = state.screens.map((screen, idx) => {
    const priorFields = state.screens.slice(0, idx).flatMap(dataFields);
    const ownDataFields = dataFields(screen);

    const dataSchema: Record<string, unknown> = {};
    priorFields.forEach((f) => {
      dataSchema[f.name] = { type: 'string', __example__: 'value' };
    });

    const children = screen.fields.map(fieldToJson);

    const payload: Record<string, string> = {};
    priorFields.forEach((f) => {
      payload[f.name] = `\${data.${f.name}}`;
    });
    ownDataFields.forEach((f) => {
      payload[f.name] = `\${form.${f.name}}`;
    });

    const isTerminal = !screen.nextScreenId;
    const nextId = screen.nextScreenId ? safeIdByOriginal.get(screen.nextScreenId) : undefined;
    children.push({
      type: 'Footer',
      label: screen.footerLabel || (isTerminal ? 'Submit' : 'Next'),
      'on-click-action': isTerminal
        ? { name: 'complete', payload }
        : { name: 'navigate', next: { type: 'screen', name: nextId }, payload },
    });

    return {
      id: safeIdByOriginal.get(screen.id),
      title: screen.title || 'Untitled screen',
      terminal: isTerminal,
      success: isTerminal,
      data: dataSchema,
      layout: { type: 'SingleColumnLayout', children },
    };
  });

  return { version: '7.1', screens };
}

/**
 * Meta Flow JSON → builder state, for editing a flow that was authored (or
 * previously saved) by this builder. Returns null when the JSON doesn't fit
 * the builder's model (unrecognized components, hand-written JSON, a Footer
 * action this builder doesn't produce) — callers should fall back to the raw
 * JSON editor in that case rather than silently dropping data.
 */
export function flowJsonToBuilderState(flowJson: unknown): BuilderState | null {
  if (!flowJson || typeof flowJson !== 'object') return null;
  const rawScreens = (flowJson as { screens?: unknown[] }).screens;
  if (!Array.isArray(rawScreens) || rawScreens.length === 0) return null;

  const knownTypes: BuilderFieldType[] = [
    'TextHeading',
    'TextSubheading',
    'TextBody',
    'TextCaption',
    'RichText',
    'Image',
    'ImageCarousel',
    'TextInput',
    'TextArea',
    'Dropdown',
    'RadioButtonsGroup',
    'CheckboxGroup',
    'ChipsSelector',
    'OptIn',
    'DatePicker',
    'CalendarPicker',
    'PhotoPicker',
    'DocumentPicker',
  ];

  const screens: BuilderScreen[] = [];

  for (const rawScreen of rawScreens) {
    const screen = rawScreen as Record<string, unknown>;
    const layout = screen.layout as Record<string, unknown> | undefined;
    if (!layout || layout.type !== 'SingleColumnLayout') return null;
    const children = layout.children;
    if (!Array.isArray(children)) return null;

    const fields: BuilderField[] = [];
    let footerLabel = 'Submit';
    let nextScreenId: string | null = null;

    for (const raw of children) {
      const child = raw as Record<string, unknown>;
      if (child.type === 'Footer') {
        footerLabel = typeof child.label === 'string' ? child.label : footerLabel;
        const action = child['on-click-action'] as Record<string, unknown> | undefined;
        if (action?.name === 'navigate') {
          const next = action.next as Record<string, unknown> | undefined;
          if (typeof next?.name !== 'string') return null;
          nextScreenId = next.name;
        } else if (action?.name !== 'complete') {
          return null;
        }
        continue;
      }
      if (!knownTypes.includes(child.type as BuilderFieldType)) return null;
      const type = child.type as BuilderFieldType;

      if (isDisplayType(type)) {
        if (type === 'RichText') {
          const lines = Array.isArray(child.text) ? (child.text as unknown[]).map(String) : [];
          fields.push({ id: newFieldId(), type, label: lines.join('\n'), name: '', required: false, options: [] });
          continue;
        }
        if (isMediaType(type)) {
          const images = Array.isArray(child.images) ? (child.images as Array<{ src?: string }>) : [];
          const src = type === 'Image' ? (typeof child.src === 'string' ? child.src : '') : images[0]?.src || '';
          fields.push({
            id: newFieldId(),
            type,
            label: typeof child['alt-text'] === 'string' ? (child['alt-text'] as string) : '',
            name: '',
            required: false,
            options: [],
            mediaSrc: src,
          });
          continue;
        }
        fields.push({
          id: newFieldId(),
          type,
          label: typeof child.text === 'string' ? child.text : '',
          name: '',
          required: false,
          options: [],
        });
        continue;
      }

      const dataSource = Array.isArray(child['data-source'])
        ? (child['data-source'] as Array<{ title?: string }>)
        : [];
      fields.push({
        id: newFieldId(),
        type,
        label: typeof child.label === 'string' ? child.label : '',
        name: typeof child.name === 'string' ? child.name : slugify(String(child.label ?? 'field')),
        required: Boolean(child.required),
        options: dataSource.map((o) => o.title || ''),
        inputType:
          type === 'TextInput' && typeof child['input-type'] === 'string'
            ? (child['input-type'] as TextInputType)
            : undefined,
        calendarMode:
          type === 'CalendarPicker' && typeof child.mode === 'string'
            ? (child.mode as CalendarMode)
            : undefined,
      });
    }

    if (typeof screen.id !== 'string') return null;
    screens.push({
      id: screen.id,
      title: typeof screen.title === 'string' ? screen.title : '',
      fields,
      footerLabel,
      nextScreenId,
    });
  }

  return { screens };
}

export function emptyScreen(title = 'Untitled screen'): BuilderScreen {
  return { id: newScreenId(), title, fields: [], footerLabel: 'Submit', nextScreenId: null };
}

export function emptyBuilderState(): BuilderState {
  return { screens: [emptyScreen()] };
}
