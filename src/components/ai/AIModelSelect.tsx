import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const AI_MODELS = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash', description: 'Rápido e equilibrado (padrão)' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Bom custo-benefício' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', description: 'Máxima qualidade, mais lento' },
  { value: 'google/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', description: 'Última geração, raciocínio avançado' },
  { value: 'openai/gpt-5', label: 'GPT-5', description: 'Alta precisão e nuance' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', description: 'Equilíbrio entre custo e qualidade' },
  { value: 'openai/gpt-5.2', label: 'GPT-5.2', description: 'Mais recente, raciocínio aprimorado' },
] as const;

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function AIModelSelect({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label>Modelo de IA</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {AI_MODELS.map(m => (
            <SelectItem key={m.value} value={m.value}>
              <div className="flex flex-col">
                <span>{m.label}</span>
                <span className="text-xs text-muted-foreground">{m.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
