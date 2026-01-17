import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"

/**
 * Exemplo de uso dos componentes shadcn/ui com a paleta de cores quentes.
 * 
 * Cores configuradas:
 * - Primary: Coral/Pêssego (#E8A87C)
 * - Secondary: Rosa dourado (#D4A574)
 * - Background: Creme claro (#FDF8F5)
 * - Accent: Rosa coral (#E27D60)
 * - Foreground: Marrom escuro
 */
export function ShadcnExample() {
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast({
      title: "Link salvo com sucesso!",
      description: "Seu novo link foi adicionado ao perfil.",
    })
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <Toaster />
      
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Exemplo shadcn/ui
          </h1>
          <p className="mt-2 text-muted-foreground">
            Componentes com paleta de cores quentes
          </p>
        </div>

        {/* Card Example */}
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Link</CardTitle>
            <CardDescription>
              Preencha as informações do link que deseja adicionar ao seu perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Link</Label>
                <Input
                  id="title"
                  placeholder="Ex: Meu Instagram"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://instagram.com/seu-perfil"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancelar</Button>
            <Button onClick={handleSubmit}>Salvar Link</Button>
          </CardFooter>
        </Card>

        {/* Button Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Variantes de Botões</CardTitle>
            <CardDescription>
              Todas as variantes disponíveis com as cores quentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </div>
          </CardContent>
        </Card>

        {/* Color Palette Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Paleta de Cores</CardTitle>
            <CardDescription>
              Visualização das cores configuradas no tema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-primary" />
                <p className="text-center text-sm font-medium">Primary</p>
                <p className="text-center text-xs text-muted-foreground">Coral</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-secondary" />
                <p className="text-center text-sm font-medium">Secondary</p>
                <p className="text-center text-xs text-muted-foreground">Rosa Dourado</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-accent" />
                <p className="text-center text-sm font-medium">Accent</p>
                <p className="text-center text-xs text-muted-foreground">Rosa Coral</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 rounded-lg bg-muted" />
                <p className="text-center text-sm font-medium">Muted</p>
                <p className="text-center text-xs text-muted-foreground">Creme</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ShadcnExample
