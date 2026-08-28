/**
 * ManyChat-style content-block picker/composer for SEND_MESSAGE. Renders the ordered block
 * list (edit/reorder/remove) plus an "+ Add content" grid gated by `sendAs`
 * (isContentAllowedForSendAs) — Private Reply only allows Text/Buttons, everything else is
 * grayed out; Dynamic/Data Collection are always grayed out ("coming soon", no send path yet).
 */
import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CreditCard,
  FileText,
  GalleryHorizontal,
  Image as ImageIcon,
  Lock,
  MousePointerClick,
  Music,
  Plus,
  Sparkles,
  Trash2,
  Type,
  Video,
  type LucideIcon,
} from 'lucide-react';
import {
  IG_CONTENT_BLOCK_TYPES,
  IG_QUICK_REPLY_MAX,
  IG_QUICK_REPLY_TITLE_MAX,
  isComingSoonBlockType,
  isContentAllowedForSendAs,
  type IgButtonsContentBlock,
  type IgCardContentBlock,
  type IgCardElement,
  type IgContentBlock,
  type IgContentBlockButton,
  type IgContentBlockType,
  type IgGalleryContentBlock,
  type IgMediaContentBlock,
  type IgSendAsMode,
  type IgTextContentBlock,
} from '../../types';
import { IgDmPreview } from '../IgDmPreview';
import { IG_CHIP } from '../../igTheme';
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import {
  MediaGalleryPickerModal,
  type MediaGalleryFilterType,
} from '../../../../components/media/MediaGalleryPickerModal';

type BlockMeta = { label: string; icon: LucideIcon; description: string };

const BLOCK_META: Record<IgContentBlockType, BlockMeta> = {
  text: { label: 'Text', icon: Type, description: 'A plain message' },
  buttons: { label: 'Buttons', icon: MousePointerClick, description: 'Text + quick-reply buttons' },
  image: { label: 'Image', icon: ImageIcon, description: 'Media Gallery or a direct URL' },
  pdf: { label: 'PDF / Document', icon: FileText, description: 'Media Gallery or a direct URL' },
  audio: { label: 'Audio', icon: Music, description: 'Direct URL (no gallery support yet)' },
  video: { label: 'Video', icon: Video, description: 'Media Gallery or a direct URL' },
  card: { label: 'Card', icon: CreditCard, description: 'One card with an optional link button' },
  gallery: { label: 'Gallery', icon: GalleryHorizontal, description: 'Horizontal scroll of cards' },
  dynamic: { label: 'Dynamic', icon: Sparkles, description: 'Coming soon' },
  data_collection: { label: 'Data Collection', icon: ClipboardList, description: 'Coming soon' },
};

const MEDIA_FILTER_BY_TYPE: Record<'image' | 'pdf' | 'video', MediaGalleryFilterType> = {
  image: 'image',
  video: 'video',
  pdf: 'pdf',
};

function newBlockId(): string {
  return `block_${Math.random().toString(36).slice(2, 9)}`;
}

function createDefaultBlock(type: IgContentBlockType): IgContentBlock {
  const id = newBlockId();
  switch (type) {
    case 'text':
      return { id, type, text: '' };
    case 'buttons':
      return {
        id,
        type,
        text: '',
        buttons: [
          { id: 'btn_a', title: 'Option A' },
          { id: 'btn_b', title: 'Option B' },
        ],
      };
    case 'image':
    case 'pdf':
    case 'audio':
    case 'video':
      return { id, type, url: '', caption: '' };
    case 'card':
      return { id, type, title: '', subtitle: '', buttonTitle: '', buttonUrl: '' };
    case 'gallery':
      return { id, type, cards: [{ title: '' }] };
    case 'dynamic':
    case 'data_collection':
      return { id, type };
  }
}

/** Primary text for consumers that only read `data.text` (canvas mini-card, phone preview strip). */
export function mirrorTextFromBlocks(blocks: IgContentBlock[]): string {
  const primary = blocks.find(
    (b): b is IgTextContentBlock | IgButtonsContentBlock => b.type === 'text' || b.type === 'buttons'
  );
  return primary?.text ?? '';
}

type Props = {
  blocks: IgContentBlock[];
  sendAs: IgSendAsMode;
  onChange: (blocks: IgContentBlock[]) => void;
};

export function SendMessageBlocks({ blocks, sendAs, onChange }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const updateAt = (index: number, next: IgContentBlock) => {
    const copy = [...blocks];
    copy[index] = next;
    onChange(copy);
  };
  const removeAt = (index: number) => onChange(blocks.filter((_, i) => i !== index));
  const moveAt = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const copy = [...blocks];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(copy);
  };
  const addBlock = (type: IgContentBlockType) => {
    onChange([...blocks, createDefaultBlock(type)]);
    setPickerOpen(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-swiss-ink">Content</p>
        <span className="text-xs text-slate-500">
          {blocks.length} block{blocks.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="space-y-2">
        {blocks.map((block, index) => (
          <BlockCard
            key={block.id}
            block={block}
            index={index}
            total={blocks.length}
            sendAs={sendAs}
            onChange={(next) => updateAt(index, next)}
            onRemove={() => removeAt(index)}
            onMoveUp={() => moveAt(index, -1)}
            onMoveDown={() => moveAt(index, 1)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => setPickerOpen((v) => !v)}
        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${IG_CHIP}`}
      >
        <Plus className="h-3.5 w-3.5" />
        Add content
      </button>

      {pickerOpen ? (
        <div className="rounded-xl border border-border-subtle bg-surface-muted/40 p-2">
          <div className="grid grid-cols-2 gap-1.5">
            {IG_CONTENT_BLOCK_TYPES.map((type) => {
              const meta = BLOCK_META[type];
              const Icon = meta.icon;
              const comingSoon = isComingSoonBlockType(type);
              const allowed = isContentAllowedForSendAs(sendAs, type);
              const disabled = comingSoon || !allowed;
              return (
                <button
                  key={type}
                  type="button"
                  disabled={disabled}
                  onClick={() => addBlock(type)}
                  className={`flex flex-col items-start gap-1 rounded-lg border px-2.5 py-2 text-left transition-colors ${
                    disabled
                      ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
                      : 'border-swiss-line bg-white hover:border-primary/40 hover:bg-surface-muted/60'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-[#833AB4]" />
                    <span className="text-xs font-semibold text-swiss-ink">{meta.label}</span>
                    {comingSoon ? (
                      <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                        Soon
                      </span>
                    ) : !allowed ? (
                      <Lock className="h-3 w-3 text-slate-400" />
                    ) : null}
                  </span>
                  <span className="text-[10px] leading-snug text-slate-400">{meta.description}</span>
                </button>
              );
            })}
          </div>
          {sendAs === 'private_reply' ? (
            <p className="mt-2 border-t border-swiss-line pt-2 text-[10px] leading-relaxed text-slate-400">
              Private Reply only supports Text and Buttons — Meta doesn&apos;t allow rich content on
              comment replies.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

type BlockCardProps = {
  block: IgContentBlock;
  index: number;
  total: number;
  sendAs: IgSendAsMode;
  onChange: (next: IgContentBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

function BlockCard({ block, index, total, sendAs, onChange, onRemove, onMoveUp, onMoveDown }: BlockCardProps) {
  const meta = BLOCK_META[block.type];
  const Icon = meta.icon;
  const disallowed = !isContentAllowedForSendAs(sendAs, block.type);

  return (
    <div
      className={`rounded-xl border p-3 ${
        disallowed ? 'border-amber-300 bg-amber-50/40' : 'border-swiss-line bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-swiss-ink">
          <Icon className="h-3.5 w-3.5 text-[#833AB4]" />
          {meta.label}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Move block up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30"
            aria-label="Move block down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            aria-label="Remove block"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {disallowed ? (
        <p className="mt-1.5 text-[10px] font-semibold text-amber-700">
          Not allowed for Private Reply — remove this block or switch Send as to 24-hour window.
        </p>
      ) : null}
      <div className="mt-2">
        <BlockBody block={block} onChange={onChange} />
      </div>
    </div>
  );
}

function BlockBody({
  block,
  onChange,
}: {
  block: IgContentBlock;
  onChange: (next: IgContentBlock) => void;
}) {
  switch (block.type) {
    case 'text':
      return <TextBlockEditor block={block} onChange={onChange} />;
    case 'buttons':
      return <ButtonsBlockEditor block={block} onChange={onChange} />;
    case 'image':
    case 'pdf':
    case 'audio':
    case 'video':
      return <MediaBlockEditor block={block} onChange={onChange} />;
    case 'card':
      return <CardBlockEditor block={block} onChange={onChange} />;
    case 'gallery':
      return <GalleryBlockEditor block={block} onChange={onChange} />;
    case 'dynamic':
    case 'data_collection':
      return (
        <p className="rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-500">
          Coming soon — no send path yet for this block type.
        </p>
      );
  }
}

function TextBlockEditor({
  block,
  onChange,
}: {
  block: IgTextContentBlock;
  onChange: (next: IgTextContentBlock) => void;
}) {
  return (
    <div className="space-y-2">
      <Textarea
        rows={3}
        className="min-h-0 w-full rounded-lg border border-swiss-line px-2 py-1.5 text-sm"
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Write your Instagram DM message…"
      />
      <IgDmPreview text={block.text} compact emptyHint="Add text to preview." />
    </div>
  );
}

function ButtonsBlockEditor({
  block,
  onChange,
}: {
  block: IgButtonsContentBlock;
  onChange: (next: IgButtonsContentBlock) => void;
}) {
  const setButtons = (buttons: IgContentBlockButton[]) =>
    onChange({ ...block, buttons: buttons.slice(0, IG_QUICK_REPLY_MAX) });

  return (
    <div className="space-y-2">
      <Textarea
        rows={2}
        className="min-h-0 w-full rounded-lg border border-swiss-line px-2 py-1.5 text-sm"
        value={block.text}
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        placeholder="Choose an option…"
      />
      <div className="space-y-1.5">
        {block.buttons.map((btn, idx) => (
          <div key={btn.id || idx} className="flex gap-2">
            <Input
              className="h-auto min-w-0 flex-1 rounded-lg border border-swiss-line px-2 py-1.5 text-sm"
              value={btn.title}
              maxLength={IG_QUICK_REPLY_TITLE_MAX}
              onChange={(e) => {
                const next = [...block.buttons];
                next[idx] = { ...next[idx], title: e.target.value };
                setButtons(next);
              }}
              placeholder="Button title"
            />
            <button
              type="button"
              onClick={() => setButtons(block.buttons.filter((_, i) => i !== idx))}
              className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Remove button"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
      {block.buttons.length < IG_QUICK_REPLY_MAX ? (
        <button
          type="button"
          onClick={() =>
            setButtons([...block.buttons, { id: `btn_${newBlockId()}`, title: '' }])
          }
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${IG_CHIP}`}
        >
          <Plus className="h-3 w-3" /> Add button
        </button>
      ) : null}
      <IgDmPreview
        text={block.text}
        quickReplies={block.buttons.map((b) => ({ title: b.title }))}
        compact
        emptyHint="Add text and buttons to preview."
      />
    </div>
  );
}

function MediaBlockEditor({
  block,
  onChange,
}: {
  block: IgMediaContentBlock;
  onChange: (next: IgMediaContentBlock) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const filterType = block.type === 'audio' ? undefined : MEDIA_FILTER_BY_TYPE[block.type];

  return (
    <div className="space-y-2">
      {filterType ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${IG_CHIP}`}
          >
            <Plus className="h-3.5 w-3.5" />
            {block.mediaId ? 'Change file' : 'Pick from Media Gallery'}
          </button>
          {block.mediaId ? (
            <button
              type="button"
              onClick={() => onChange({ ...block, mediaId: undefined })}
              className="text-[10px] font-semibold text-rose-500 hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>
      ) : null}
      <label className="block text-xs font-semibold text-swiss-muted">
        {filterType ? 'or paste a direct HTTPS URL' : 'Direct HTTPS URL'}
        <Input
          className="h-auto mt-1 w-full rounded-lg border border-swiss-line px-2 py-1.5 text-sm font-mono text-xs disabled:bg-slate-50 disabled:text-slate-400"
          value={block.mediaId ? '' : block.url ?? ''}
          disabled={Boolean(block.mediaId)}
          onChange={(e) => onChange({ ...block, url: e.target.value })}
          placeholder="https://…"
        />
      </label>
      {block.type === 'audio' ? (
        <p className="text-[10px] leading-relaxed text-slate-400">
          Media Gallery doesn&apos;t store audio yet — paste a direct link Meta can fetch.
        </p>
      ) : null}
      <label className="block text-xs font-semibold text-swiss-muted">
        Caption (optional)
        <Input
          className="h-auto mt-1 w-full rounded-lg border border-swiss-line px-2 py-1.5 text-sm"
          value={block.caption ?? ''}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder="Sent as a follow-up text message"
        />
      </label>
      {filterType ? (
        <MediaGalleryPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          filterType={filterType}
          onPick={(picked) => onChange({ ...block, mediaId: picked.id, url: undefined })}
        />
      ) : null}
    </div>
  );
}

function CardFieldsEditor({
  card,
  onChange,
}: {
  card: IgCardElement;
  onChange: (next: IgCardElement) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2">
      <Input
        className="h-auto w-full rounded-lg border border-swiss-line bg-white px-2 py-1.5 text-sm"
        value={card.title}
        onChange={(e) => onChange({ ...card, title: e.target.value })}
        placeholder="Title"
      />
      <Input
        className="h-auto w-full rounded-lg border border-swiss-line bg-white px-2 py-1.5 text-sm"
        value={card.subtitle ?? ''}
        onChange={(e) => onChange({ ...card, subtitle: e.target.value })}
        placeholder="Subtitle (optional)"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ${IG_CHIP}`}
        >
          <ImageIcon className="h-3 w-3" />
          {card.imageMediaId ? 'Change image' : 'Pick image'}
        </button>
        {card.imageMediaId ? (
          <button
            type="button"
            onClick={() => onChange({ ...card, imageMediaId: undefined })}
            className="text-[10px] font-semibold text-rose-500 hover:underline"
          >
            Clear
          </button>
        ) : null}
      </div>
      <Input
        className="h-auto w-full rounded-lg border border-swiss-line bg-white px-2 py-1.5 text-sm font-mono text-xs disabled:bg-slate-100 disabled:text-slate-400"
        value={card.imageMediaId ? '' : card.imageUrl ?? ''}
        disabled={Boolean(card.imageMediaId)}
        onChange={(e) => onChange({ ...card, imageUrl: e.target.value })}
        placeholder="or paste an image URL"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          className="h-auto rounded-lg border border-swiss-line bg-white px-2 py-1.5 text-sm"
          value={card.buttonTitle ?? ''}
          onChange={(e) => onChange({ ...card, buttonTitle: e.target.value })}
          placeholder="Button label"
        />
        <Input
          className="h-auto rounded-lg border border-swiss-line bg-white px-2 py-1.5 text-sm font-mono text-xs"
          value={card.buttonUrl ?? ''}
          onChange={(e) => onChange({ ...card, buttonUrl: e.target.value })}
          placeholder="https://…"
        />
      </div>
      <MediaGalleryPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        filterType="image"
        onPick={(picked) => onChange({ ...card, imageMediaId: picked.id, imageUrl: undefined })}
      />
    </div>
  );
}

function CardBlockEditor({
  block,
  onChange,
}: {
  block: IgCardContentBlock;
  onChange: (next: IgCardContentBlock) => void;
}) {
  return <CardFieldsEditor card={block} onChange={(next) => onChange({ ...block, ...next })} />;
}

function GalleryBlockEditor({
  block,
  onChange,
}: {
  block: IgGalleryContentBlock;
  onChange: (next: IgGalleryContentBlock) => void;
}) {
  const cards = block.cards.length > 0 ? block.cards : [{ title: '' }];
  const setCards = (next: IgCardElement[]) => onChange({ ...block, cards: next.slice(0, 10) });

  return (
    <div className="space-y-2">
      {cards.map((card, idx) => (
        <div key={idx} className="relative">
          <CardFieldsEditor
            card={card}
            onChange={(next) => {
              const copy = [...cards];
              copy[idx] = next;
              setCards(copy);
            }}
          />
          {cards.length > 1 ? (
            <button
              type="button"
              onClick={() => setCards(cards.filter((_, i) => i !== idx))}
              className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
              aria-label="Remove card"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ))}
      {cards.length < 10 ? (
        <button
          type="button"
          onClick={() => setCards([...cards, { title: '' }])}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${IG_CHIP}`}
        >
          <Plus className="h-3.5 w-3.5" /> Add card
        </button>
      ) : null}
    </div>
  );
}
