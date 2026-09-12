import { useRef, useState } from 'react'
import { Download, Loader2, Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { downloadCsv, parseDataTableCsv } from '@/lib/dataTableCsv'
import { ApiError } from '@/lib/httpClient'
import {
  realDataTablesService,
  type DataTableColumn,
} from '@/services/realDataTables.service'

export function ImportDataTableSheet({
  open,
  onOpenChange,
  tableId,
  tableName,
  columns,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tableId: string
  tableName: string
  columns: DataTableColumn[]
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const importRows = realDataTablesService.useImportRows(tableId)
  const [preview, setPreview] = useState<Record<string, unknown>[]>([])
  const [matched, setMatched] = useState<DataTableColumn[]>([])
  const [skipped, setSkipped] = useState<number[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [created, setCreated] = useState<number | null>(null)

  const reset = () => {
    setPreview([])
    setMatched([])
    setSkipped([])
    setFileName('')
    setError('')
    setCreated(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const close = () => {
    if (importRows.isPending) return
    reset()
    onOpenChange(false)
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setCreated(null)
    setFileName(file.name)
    try {
      const parsed = parseDataTableCsv(await file.text(), columns)
      setPreview(parsed.rows)
      setMatched(parsed.matchedColumns)
      setSkipped(parsed.skipped)
      if (parsed.rows.length === 0) setError('No valid rows found.')
    } catch (err) {
      setPreview([])
      setMatched([])
      setError(err instanceof Error ? err.message : 'Could not parse CSV')
    }
  }

  const downloadTemplate = () => {
    const header = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',')
    downloadCsv(`${tableName.replace(/\s+/g, '-').toLowerCase() || 'table'}-template.csv`, header)
  }

  const runImport = async () => {
    if (preview.length === 0) return
    setError('')
    try {
      const res = await importRows.mutateAsync(preview)
      setCreated(res.created)
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'Import failed')
    }
  }

  const previewCols = matched.slice(0, 4)

  return (
    <Sheet open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Import CSV</SheetTitle>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4">
          <p className="text-muted-foreground text-xs">
            Headers must match column names. Extra columns are ignored.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={downloadTemplate}>
              <Download />
              Template
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
              <Upload />
              Choose file
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => void onFile(e.target.files?.[0])}
            />
          </div>
          {fileName ? <p className="text-muted-foreground truncate text-xs">{fileName}</p> : null}

          {preview.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm">
                {preview.length} row{preview.length === 1 ? '' : 's'} ready
                {skipped.length > 0 ? ` · ${skipped.length} skipped` : ''}
              </p>
              <div className="overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewCols.map((c) => (
                        <TableHead key={c.id}>{c.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 5).map((row, i) => (
                      <TableRow key={i}>
                        {previewCols.map((c) => (
                          <TableCell key={c.id} className="max-w-[140px] truncate text-xs">
                            {row[c.key] == null ? '' : String(row[c.key])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}

          {created != null ? (
            <p className="text-sm">Imported {created} row{created === 1 ? '' : 's'}.</p>
          ) : null}
          {error ? <p className="text-destructive text-xs">{error}</p> : null}
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={close} disabled={importRows.isPending}>
            {created != null ? 'Done' : 'Cancel'}
          </Button>
          {created == null ? (
            <Button disabled={preview.length === 0 || importRows.isPending} onClick={() => void runImport()}>
              {importRows.isPending ? <Loader2 className="animate-spin" /> : <Upload />}
              Import {preview.length || ''}
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
