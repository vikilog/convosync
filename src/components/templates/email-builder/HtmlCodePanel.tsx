import React, { useEffect, useState } from 'react';
import { Code2, Info } from 'lucide-react';
import { useEmailBuilderStore } from './store';
import { blocksToEditableHtml } from './editableHtml';
export function HtmlCodePanel() {
  const blocks = useEmailBuilderStore((s) => s.blocks);
  const setHtmlSource = useEmailBuilderStore((s) => s.setHtmlSource);

  const [source, setSource] = useState('');
  const [wasMultiBlock, setWasMultiBlock] = useState(false);

  useEffect(() => {
    const multi = blocks.length > 1 || (blocks.length === 1 && blocks[0].type !== 'html');
    setWasMultiBlock(multi);
    setSource(blocksToEditableHtml(blocks));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- init on mount only

  return (
    <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-[#1e1e2e]">
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#181825]">
        <div className="flex items-center gap-2 text-white">
          <Code2 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">HTML source</span>
        </div>
        <span className="text-meta text-gray-400">Supports {'{{variables}}'} · inline styles recommended</span>
      </div>

      {wasMultiBlock ? (
        <div className="shrink-0 mx-4 mt-3 flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-100 text-xs">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            Your layout was converted to editable HTML. Saving in this mode stores one Custom HTML block.
            Switch back to <strong>Edit</strong> to use drag-and-drop blocks again (you can add more Custom
            HTML blocks from the left panel).
          </p>
        </div>
      ) : null}

      <textarea
        className="flex-1 min-h-0 w-full resize-none bg-[#1e1e2e] text-[#cdd6f4] font-mono text-sm leading-relaxed p-4 focus:outline-none"
        spellCheck={false}
        value={source}
        onChange={(e) => {
          setSource(e.target.value);
          setHtmlSource(e.target.value);
        }}
        placeholder={'<h2>Hello {{first_name}}</h2>\n<p>Your HTML here…</p>'}
      />
    </div>
  );
}
