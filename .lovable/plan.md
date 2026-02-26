

## Revisao UX Design - Alinhar com Bitrix24

### Analise do Bitrix24 UI

O Bitrix24 UI usa:
- **Fundo claro** (branco/cinza claro `#f5f7f8`), nao dark
- **Sidebar com gradiente azul** (de `#2FC6F6` para `#1B87C8`) com icones brancos
- **Header com gradiente azul** similar ao sidebar
- **Cards brancos** com bordas sutis `#e5e7eb`
- **Botoes** com estilo pill/rounded, cores azul primario
- **Tipografia** limpa, sans-serif, dark text em fundo claro
- **Badges** coloridos com fundo suave
- **Radius** mais arredondado (8-12px)

### Mudancas Necessarias

#### 1. Reescrever CSS Variables (`src/index.css`)
Trocar todo o tema dark Omie para tema light Bitrix24:
- Background: branco/cinza claro
- Foreground: texto escuro (#1a1a2e)
- Primary: azul Bitrix (#2FC6F6 / #428BCA)
- Cards: branco com bordas suaves
- Sidebar: gradiente azul Bitrix
- Remover gradientes Omie (gradient-omie, gradient-primary cyan)
- Substituir por gradientes Bitrix (azul linear-gradient)
- Atualizar cores dos modulos para paleta Bitrix

#### 2. Atualizar Sidebar (`src/components/layout/AppSidebar.tsx`)
- Sidebar com fundo gradiente azul (#2988ef → #1b6ec2)
- Texto e icones brancos
- Item ativo com fundo branco/translucido
- Hover com fundo branco/translucido mais sutil
- Remover cores de modulo por icone na sidebar

#### 3. Atualizar Layout (`src/components/layout/DashboardLayout.tsx`)
- Header com fundo branco e borda inferior cinza
- Remover backdrop-blur excessivo
- Fundo da area principal cinza claro (#f5f7f8)

#### 4. Atualizar Logo (`src/components/layout/OmieLogo.tsx`)
- Adaptar para fundo azul da sidebar (icones brancos)
- Manter texto "Conector" mas em branco

#### 5. Atualizar StatsCard (`src/components/ui/stats-card.tsx`)
- Cards brancos com borda suave
- Icones em circulos coloridos pequenos
- Remover efeitos glow/neon

#### 6. Atualizar ModuleCard (`src/components/ui/module-card.tsx`)
- Cards brancos com borda suave
- Hover com sombra sutil (nao glow)
- Icone colorido a esquerda, layout horizontal

#### 7. Atualizar Button styles (`src/components/ui/button.tsx`)
- Botao primary com azul solido (#428BCA)
- Remover gradient-primary/shadow-glow de todos os usos
- Bordas mais arredondadas

#### 8. Remover dados ficticios remanescentes
- `CRM.tsx` ainda tem arrays hardcoded (contatos, empresas, oportunidades)
- Substituir por empty states como foi feito nas outras paginas

#### 9. Atualizar todas as paginas
Remover referencias a classes Omie (`text-gradient-omie`, `gradient-primary`, `shadow-glow`, `bg-module-*`) em:
- Dashboard.tsx
- CRM.tsx
- Financas.tsx
- Vendas.tsx
- Estoque.tsx
- Compras.tsx
- Contratos.tsx
- Contador.tsx
- ConfigOmie.tsx
- Logs.tsx
- Simulator.tsx
- Robots.tsx

#### 10. Limpar `src/App.css`
- Remover CSS legado do Vite template

### Arquivos a modificar (13+)
1. `src/index.css` - Tema completo
2. `tailwind.config.ts` - Cores dos modulos
3. `src/components/layout/AppSidebar.tsx` - Sidebar azul
4. `src/components/layout/DashboardLayout.tsx` - Layout claro
5. `src/components/layout/OmieLogo.tsx` - Logo para fundo azul
6. `src/components/ui/stats-card.tsx` - Cards claros
7. `src/components/ui/module-card.tsx` - Cards claros
8. `src/components/ui/button.tsx` - Estilos Bitrix
9. `src/pages/Dashboard.tsx` - Remover classes Omie
10. `src/pages/CRM.tsx` - Remover dados ficticios + classes
11. `src/pages/Financas.tsx` - Classes
12. Todas as outras paginas - Classes Omie
13. `src/App.css` - Limpar

