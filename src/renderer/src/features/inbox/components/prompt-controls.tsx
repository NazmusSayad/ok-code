import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select'
import { useAgentsQuery, useModelsQuery } from '../../../hooks/queries'
import {
  selectSessionAgent,
  selectSessionModel,
  setSessionModelVariant,
  useSessionSelection,
} from '../../../store/persist-store/actions'

interface PromptControlsProps {
  projectId: string
  sessionId: string
  activeModelKey: string | null
  onActiveModelKeyChange: (key: string | null) => void
}

export function PromptControls({
  projectId,
  sessionId,
  activeModelKey,
  onActiveModelKeyChange,
}: PromptControlsProps) {
  const { data: agents = [] } = useAgentsQuery()
  const { data: models = [] } = useModelsQuery()
  const selection = useSessionSelection(projectId, sessionId)

  const modelsMap = selection.models || {}

  return (
    <div className="bg-muted/20 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-4 py-2">
      {/* Agent */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-10 shrink-0 text-[10px] font-medium tracking-wider uppercase">
          Agent
        </span>
        <Select
          value={selection.agent || '__none__'}
          onValueChange={(val) => {
            const next = val === '__none__' ? undefined : val
            selectSessionAgent(projectId, sessionId, next)
          }}
          disabled={agents.length === 0}
        >
          <SelectTrigger size="sm" className="h-7 w-[130px] text-xs">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {agents
              .filter((a) => a.mode === 'primary' && !a.hidden)
              .map((a) => (
                <SelectItem key={a.name} value={a.name}>
                  {a.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-10 shrink-0 text-[10px] font-medium tracking-wider uppercase">
          Model
        </span>
        <Select
          value={activeModelKey || '__none__'}
          onValueChange={(val) => {
            if (val && val !== '__none__') {
              const [providerId, modelId] = val.split(':')
              selectSessionModel(projectId, sessionId, providerId, modelId)
              onActiveModelKeyChange(val)
            } else {
              onActiveModelKeyChange(null)
            }
          }}
          disabled={models.length === 0}
        >
          <SelectTrigger size="sm" className="h-7 w-[170px] text-xs">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">—</SelectItem>
            {models.map((m) => {
              const val = `${m.providerID}:${m.id}`
              return (
                <SelectItem key={val} value={val}>
                  {m.name}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Variant */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground w-10 shrink-0 text-[10px] font-medium tracking-wider uppercase">
          Variant
        </span>
        {(() => {
          const currentKey =
            activeModelKey || (Object.keys(modelsMap)[0] as string | undefined)
          const currentEntry = currentKey
            ? modelsMap[currentKey as `${string}:${string}`]
            : undefined
          const currentModelData = currentKey
            ? models.find((m) => `${m.providerID}:${m.id}` === currentKey)
            : undefined

          const variantOptions = currentModelData?.variants
            ? Object.keys(currentModelData.variants)
            : []
          const currentVariantValue = currentEntry?.variant ?? ''

          return (
            <Select
              value={currentVariantValue || '__none__'}
              onValueChange={(val) => {
                if (currentKey) {
                  const [providerId, modelId] = currentKey.split(':')
                  const next = val === '__none__' ? undefined : val
                  setSessionModelVariant(
                    projectId,
                    sessionId,
                    providerId,
                    modelId,
                    next
                  )
                }
              }}
              disabled={variantOptions.length === 0}
            >
              <SelectTrigger size="sm" className="h-7 w-[110px] text-xs">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {variantOptions.map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        })()}
      </div>
    </div>
  )
}
