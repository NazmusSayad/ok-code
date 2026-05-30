import {
  NativeSelect,
  NativeSelectOption,
} from '../../../components/ui/native-select'
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
  disabled?: boolean
  activeModelKey: string | null
  onActiveModelKeyChange: (key: string | null) => void
}

export function PromptControls({
  projectId,
  sessionId,
  disabled,
  activeModelKey,
  onActiveModelKeyChange,
}: PromptControlsProps) {
  const { data: agents = [] } = useAgentsQuery()
  const { data: models = [] } = useModelsQuery()
  const selection = useSessionSelection(projectId, sessionId)

  const modelsMap = selection.models || {}

  return (
    <div className="bg-muted/30 flex flex-wrap items-center gap-2 border-t px-3 py-2">
      {/* Agent */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
          Agent
        </span>
        <NativeSelect
          value={selection.agent || ''}
          onChange={(e) => {
            selectSessionAgent(
              projectId,
              sessionId,
              e.target.value || undefined
            )
          }}
          disabled={disabled || agents.length === 0}
          className="h-8 min-w-[120px] text-xs"
        >
          <NativeSelectOption value="">—</NativeSelectOption>
          {agents.map((a) => (
            <NativeSelectOption key={a.name} value={a.name}>
              {a.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {/* Model */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
          Model
        </span>
        <NativeSelect
          value={activeModelKey || ''}
          onChange={(e) => {
            const val = e.target.value
            if (val) {
              const [providerId, modelId] = val.split(':')
              selectSessionModel(projectId, sessionId, providerId, modelId)
              onActiveModelKeyChange(val)
            } else {
              onActiveModelKeyChange(null)
            }
          }}
          disabled={disabled || models.length === 0}
          className="h-8 min-w-[180px] text-xs"
        >
          <NativeSelectOption value="">—</NativeSelectOption>
          {models.map((m) => {
            const val = `${m.providerID}:${m.id}`
            return (
              <NativeSelectOption key={val} value={val}>
                {m.name}
              </NativeSelectOption>
            )
          })}
        </NativeSelect>
      </div>

      {/* Variant */}
      <div className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-[10px] tracking-wider uppercase">
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
            <NativeSelect
              value={currentVariantValue}
              onChange={(e) => {
                if (currentKey) {
                  const [providerId, modelId] = currentKey.split(':')
                  const val = e.target.value || undefined
                  setSessionModelVariant(
                    projectId,
                    sessionId,
                    providerId,
                    modelId,
                    val
                  )
                }
              }}
              disabled={disabled}
              className="h-8 min-w-[110px] text-xs"
            >
              <NativeSelectOption value="">—</NativeSelectOption>
              {variantOptions.map((v) => (
                <NativeSelectOption key={v} value={v}>
                  {v}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )
        })()}
      </div>
    </div>
  )
}
