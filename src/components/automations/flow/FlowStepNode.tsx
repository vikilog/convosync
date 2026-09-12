import { Handle, Position, type NodeProps } from '@xyflow/react'
import { X } from 'lucide-react'

import { AddStepMenu } from '@/components/automations/flow/AddStepMenu'
import { sourcePorts, type SourcePort } from '@/lib/journeyNodeTypes'
import { STEP_VISUAL, type FlowStepNodeData } from '@/lib/flowStepTypes'

export type { FlowStepNodeData }

/** Invisible ports — edges attach here; the + overlay sits on the line, not a second handle. */
const handleClass = '!h-2 !w-2 !border-0 !bg-transparent !opacity-0'

function portLeft(ports: SourcePort[], i: number): string {
  return `${((i + 1) / (ports.length + 1)) * 100}%`
}

export function FlowStepNode({ id, data, selected }: NodeProps & { data: FlowStepNodeData }) {
  const visual = STEP_VISUAL[data.kind]
  const Icon = visual.icon
  const isTrigger = data.kind === 'trigger'
  const isEnd = data.kind === 'end'
  const isCondition = data.kind === 'condition'
  const ports = sourcePorts(data.kind, data.rawData)

  return (
    <div className="group relative">
      <div
        role="button"
        tabIndex={0}
        onClick={() => data.onEdit(id)}
        className={`bg-card w-56 cursor-pointer overflow-hidden rounded-xl border shadow-sm transition-colors ${
          selected ? 'border-primary ring-primary/20 ring-2' : ''
        }`}
      >
        {!isTrigger ? <Handle type="target" position={Position.Top} className={handleClass} /> : null}

        <div className="flex items-start gap-2.5 p-3">
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-md ${visual.iconBg} ${visual.iconText}`}
          >
            <Icon className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
              {data.kind}
            </p>
            <p className="truncate text-sm font-semibold">{data.label}</p>
            {data.detail ? <p className="text-muted-foreground truncate text-xs">{data.detail}</p> : null}
          </div>
          {!isTrigger ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                data.onDelete(id)
              }}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Delete step"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {isCondition ? (
          <div className="flex items-center justify-between border-t px-3 py-1.5 text-[10px] font-semibold tracking-wide uppercase">
            <span className="text-primary">Yes</span>
            <span className="text-destructive">No</span>
          </div>
        ) : null}

        {ports.length > 0 && !isCondition ? (
          <div className="flex flex-wrap gap-1 border-t px-3 py-1.5">
            {ports.map((p) => (
              <span key={p.id} className="bg-muted rounded px-1.5 py-0.5 text-[10px] font-medium">
                {p.label}
              </span>
            ))}
          </div>
        ) : null}

        {isEnd ? null : ports.length > 0 ? (
          ports.map((p, i) => (
            <Handle
              key={p.id}
              type="source"
              id={p.id}
              position={Position.Bottom}
              className={handleClass}
              style={{ left: portLeft(ports, i) }}
            />
          ))
        ) : (
          <Handle type="source" position={Position.Bottom} className={handleClass} />
        )}
      </div>

      {!isEnd ? (
        <div className="pointer-events-none absolute inset-x-0 top-full z-10 h-0">
          {ports.length > 0 ? (
            ports.map((p, i) => (
              <div
                key={p.id}
                className="nodrag nopan pointer-events-auto absolute top-1.5 -translate-x-1/2"
                style={{ left: portLeft(ports, i) }}
              >
                <AddStepMenu
                  channel={data.channel ?? 'whatsapp'}
                  label={`Add step on ${p.label}`}
                  onPick={(kind) => data.onAddStep(id, p.id, kind)}
                />
              </div>
            ))
          ) : (
            <div className="nodrag nopan pointer-events-auto absolute top-1.5 left-1/2 -translate-x-1/2">
              <AddStepMenu
                channel={data.channel ?? 'whatsapp'}
                label="Add step"
                onPick={(kind) => data.onAddStep(id, undefined, kind)}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
