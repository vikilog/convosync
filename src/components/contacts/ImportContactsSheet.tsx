import { useRef, useState } from 'react'
import { Download, Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { parseContactCsv, type ContactCsvRow } from '@/lib/parseContactCsv'
import { realContactsService, type ContactImportResult } from '@/services/realContacts.service'

const TEMPLATE_CSV = `name,phone,email,tags
Alice Sharma,+919876543210,alice@example.com,Hot;Lead
Bob Khan,+919811122233,,Student
`

const IMPORT_SOURCES = ['WhatsApp', 'Instagram', 'Email', 'Messenger', 'Website', 'Manual'] as const
const IMPORT_CHUNK = 400

export function ImportContactsSheet({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const importContacts = realContactsService.useImport()
  const [preview, setPreview] = useState<ContactCsvRow[]>([])
  const [parseSkipped, setParseSkipped] = useState<number[]>([])
  const [fileName, setFileName] = useState('')
  const [source, setSource] = useState<string>('WhatsApp')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState('')
  const [result, setResult] = useState<ContactImportResult | null>(null)

  const reset = () => {
    setPreview([])
    setParseSkipped([])
    setFileName('')
    setSource('WhatsApp')
    setError('')
    setProgress('')
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const close = () => {
    if (importContacts.isPending) return
    reset()
    onOpenChange(false)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setResult(null)
    setProgress('')
    setFileName(file.name)
    try {
      const text = await file.text()
      const parsed = parseContactCsv(text)
      if (parsed.rows.length === 0) {
        setPreview([])
        setParseSkipped(parsed.skipped)
        setError('No valid rows found. Need name + phone columns.')
        return
      }
      setPreview(parsed.rows)
      setParseSkipped(parsed.skipped)
    } catch (err) {
      setPreview([])
      setError(err instanceof Error ? err.message : 'Could not parse CSV')
    }
  }

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'contacts-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const runImport = async () => {
    if (preview.length === 0) return
    const sourceValue = source.trim() || 'WhatsApp'
    setError('')
    try {
      const withSource = preview.map((row) => ({ ...row, source: row.source || sourceValue }))
      const agg: ContactImportResult = { created: 0, updated: 0, skipped: 0, errors: [] }
      const totalChunks = Math.ceil(withSource.length / IMPORT_CHUNK)
      for (let c = 0; c < totalChunks; c++) {
        const start = c * IMPORT_CHUNK
        const chunk = withSource.slice(start, start + IMPORT_CHUNK)
        setProgress(`Importing ${Math.min(start + chunk.length, withSource.length)} / ${withSource.length}…`)
        const res = await importContacts.mutateAsync(chunk)
        agg.created += res.created
        agg.updated += res.updated
        agg.skipped += res.skipped
        agg.errors.push(...(res.errors ?? []))
      }
      setResult(agg)
      setProgress('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setProgress('')
    }
  }

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Import contacts</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <p className="text-muted-foreground text-xs">
            CSV with <span className="font-medium">name</span> and <span className="font-medium">phone</span>. Optional:
            email, source, tags (semicolon or pipe).
          </p>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download />
            Download template
          </Button>
          <div className="space-y-1.5">
            <Label>Source for imported rows</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMPORT_SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={importContacts.isPending}>
            <Upload />
            {fileName || 'Choose CSV'}
          </Button>
          {parseSkipped.length > 0 ? (
            <p className="text-muted-foreground text-xs">Skipped {parseSkipped.length} invalid row(s).</p>
          ) : null}
          {preview.length > 0 && !result ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.slice(0, 8).map((row) => (
                    <TableRow key={`${row.phone}-${row.name}`}>
                      <TableCell className="text-sm">{row.name}</TableCell>
                      <TableCell className="font-mono text-xs">{row.phone}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{row.email || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {preview.length > 8 ? (
                <p className="text-muted-foreground px-3 py-2 text-xs">+{preview.length - 8} more rows</p>
              ) : null}
            </div>
          ) : null}
          {progress ? <p className="text-xs font-medium">{progress}</p> : null}
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
          {result ? (
            <div className="rounded-lg border p-3 text-sm">
              <p>
                Created {result.created} · Updated {result.updated} · Skipped {result.skipped}
              </p>
              {result.errors.length > 0 ? (
                <p className="text-destructive mt-1 text-xs">{result.errors.length} row error(s)</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={close} disabled={importContacts.isPending}>
            {result ? 'Done' : 'Cancel'}
          </Button>
          {!result ? (
            <Button disabled={preview.length === 0 || importContacts.isPending} onClick={() => void runImport()}>
              {importContacts.isPending ? <Loader2 className="animate-spin" /> : null}
              Import {preview.length ? `(${preview.length})` : ''}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
