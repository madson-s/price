# Especificação de Requisitos - Product Scanner

## 1. Visão Geral do Projeto

**Nome do Projeto:** Product Scanner  
**Versão:** 1.0.0  
**Data:** 2025  
**Tipo:** Aplicação Web Progressive (PWA)

### 1.1 Descrição

O Product Scanner é uma aplicação web moderna que permite aos usuários identificar produtos através de múltiplos métodos: escaneamento de códigos (QR Code e códigos de barras), upload/captura de imagens e interação via chat. A aplicação visa facilitar a identificação rápida de produtos para comparação de preços e obtenção de informações.

### 1.2 Objetivos

- Fornecer uma interface intuitiva e responsiva para escaneamento de produtos
- Suportar múltiplos formatos de códigos (QR Code e códigos de barras)
- Permitir captura direta de fotos através da câmera do dispositivo
- Oferecer uma alternativa de identificação via chat
- Garantir compatibilidade cross-platform (mobile e desktop)

---

## 2. Requisitos Funcionais

### RF01 - Scanner de Códigos

#### RF01.1 - Escaneamento de QR Code
- **Prioridade:** Alta
- **Descrição:** O sistema deve permitir o escaneamento de QR Codes através da câmera do dispositivo
- **Critérios de Aceitação:**
  - Solicitar permissão de câmera ao usuário
  - Detectar QR Codes em tempo real
  - Exibir o código detectado
  - Enviar o código para o backend para processamento
  - Exibir resultado do processamento

#### RF01.2 - Escaneamento de Código de Barras
- **Prioridade:** Alta
- **Descrição:** O sistema deve suportar múltiplos formatos de códigos de barras
- **Formatos Suportados:**
  - EAN-13 (European Article Number - 13 dígitos)
  - EAN-8 (European Article Number - 8 dígitos)
  - UPC-A (Universal Product Code - 12 dígitos)
  - UPC-E (Universal Product Code - 6 dígitos)
  - CODE-128 (Code 128)
  - CODE-39 (Code 39)
  - CODE-93 (Code 93)
  - ITF (Interleaved 2 of 5)
  - CODABAR
- **Critérios de Aceitação:**
  - Usuário pode selecionar entre modo QR Code ou Código de Barras
  - Sistema ajusta a área de detecção baseado no tipo selecionado
  - Detectar códigos em tempo real
  - Exibir o formato detectado junto com o código

#### RF01.3 - Seleção de Câmera
- **Prioridade:** Média
- **Descrição:** Permitir ao usuário trocar entre câmeras disponíveis
- **Critérios de Aceitação:**
  - Detectar automaticamente câmera traseira em dispositivos móveis
  - Botão para alternar entre câmeras (quando múltiplas disponíveis)
  - Manter preferência durante a sessão de escaneamento

#### RF01.4 - Feedback Visual
- **Prioridade:** Alta
- **Descrição:** Fornecer feedback visual durante o processo de escaneamento
- **Critérios de Aceitação:**
  - Exibir mensagem "Solicitando Permissão" durante pedido de acesso à câmera
  - Mostrar área de detecção responsiva
  - Exibir código detectado com formato identificado
  - Mostrar indicador de carregamento durante processamento

### RF02 - Upload e Captura de Imagens

#### RF02.1 - Upload de Arquivo
- **Prioridade:** Alta
- **Descrição:** Permitir upload de imagens do dispositivo
- **Critérios de Aceitação:**
  - Aceitar formatos de imagem comuns (JPEG, PNG, etc.)
  - Validar tipo de arquivo antes do upload
  - Exibir preview da imagem selecionada
  - Permitir cancelar e selecionar outra imagem

#### RF02.2 - Captura de Foto
- **Prioridade:** Alta
- **Descrição:** Permitir tirar foto diretamente pela câmera
- **Critérios de Aceitação:**
  - Solicitar permissão de câmera
  - Exibir preview em tempo real da câmera
  - Botão para capturar foto
  - Opção para trocar entre câmeras (quando disponível)
  - Converter foto capturada em arquivo JPEG
  - Permitir cancelar e tirar outra foto

#### RF02.3 - Processamento de Imagem
- **Prioridade:** Alta
- **Descrição:** Enviar imagem para backend para processamento
- **Critérios de Aceitação:**
  - Enviar imagem como FormData
  - Exibir indicador de carregamento durante upload
  - Exibir resultado do processamento
  - Mostrar mensagens de erro apropriadas

### RF03 - Chat de Interação

#### RF03.1 - Interface de Chat
- **Prioridade:** Média
- **Descrição:** Fornecer interface de chat para interação com IA
- **Critérios de Aceitação:**
  - Campo de entrada de texto
  - Botão para enviar mensagem
  - Histórico de mensagens (usuário e sistema)
  - Scroll automático para última mensagem

#### RF03.2 - Integração com Backend
- **Prioridade:** Média
- **Descrição:** Comunicar com API de chat
- **Critérios de Aceitação:**
  - Enviar mensagens para backend
  - Receber respostas do sistema
  - Exibir indicador de "digitando" durante processamento
  - Tratar erros de conexão

### RF04 - Navegação e Interface

#### RF04.1 - Abas de Navegação
- **Prioridade:** Alta
- **Descrição:** Sistema de abas para alternar entre funcionalidades
- **Critérios de Aceitação:**
  - Três abas: Scanner, Upload, Chat
  - Ícones representativos para cada aba
  - Transição suave entre abas
  - Manter estado de cada aba

#### RF04.2 - Design Responsivo
- **Prioridade:** Alta
- **Descrição:** Interface adaptável a diferentes tamanhos de tela
- **Critérios de Aceitação:**
  - Layout mobile-first
  - Adaptação para tablets e desktops
  - Elementos interativos acessíveis em touch e mouse
  - Textos legíveis em todas as resoluções

---

## 3. Requisitos Não-Funcionais

### RNF01 - Performance
- **RNF01.1:** O tempo de detecção de código não deve exceder 2 segundos
- **RNF01.2:** A interface deve responder em menos de 100ms a interações do usuário
- **RNF01.3:** O tempo de upload de imagem deve ser minimizado com compressão quando necessário

### RNF02 - Usabilidade
- **RNF02.1:** Interface intuitiva com no máximo 3 cliques para qualquer ação principal
- **RNF02.2:** Feedback visual para todas as ações do usuário
- **RNF02.3:** Mensagens de erro claras e em português
- **RNF02.4:** Suporte a gestos touch nativos em dispositivos móveis

### RNF03 - Compatibilidade
- **RNF03.1:** Suporte aos navegadores modernos (Chrome, Firefox, Safari, Edge)
- **RNF03.2:** Compatibilidade com iOS 13+ e Android 8+
- **RNF03.3:** Funcionamento em dispositivos com resolução mínima de 320px

### RNF04 - Segurança
- **RNF04.1:** Solicitação explícita de permissões de câmera
- **RNF04.2:** Comunicação com backend via HTTPS
- **RNF04.3:** Validação de tipos de arquivo no frontend e backend
- **RNF04.4:** Não armazenar dados sensíveis no localStorage

### RNF05 - Acessibilidade
- **RNF05.1:** Suporte a leitores de tela
- **RNF05.2:** Navegação por teclado
- **RNF05.3:** Contraste adequado (WCAG AA)
- **RNF05.4:** Textos alternativos em imagens e ícones

### RNF06 - Manutenibilidade
- **RNF06.1:** Código TypeScript com tipagem estrita
- **RNF06.2:** Componentes reutilizáveis e modulares
- **RNF06.3:** Documentação de funções complexas
- **RNF06.4:** Padrão de código consistente (ESLint)

---

## 4. Requisitos de Sistema

### 4.1 Frontend

#### Tecnologias Obrigatórias
- **Framework:** React 18+
- **Linguagem:** TypeScript 5+
- **Build Tool:** Vite
- **Estilização:** Tailwind CSS
- **Componentes UI:** shadcn/ui
- **Biblioteca de Ícones:** Lucide React
- **Scanner:** html5-qrcode

#### Dependências Principais
```json
{
  "react": "^18.3.1",
  "typescript": "^5.6.2",
  "tailwindcss": "^3.4.1",
  "html5-qrcode": "^2.3.8",
  "lucide-react": "^0.344.0"
}
```

### 4.2 Backend (Especificação de API)

#### Endpoints Requeridos

**POST /scan-code**
- Descrição: Processar código escaneado
- Request Body:
  ```json
  {
    "code": "string"
  }
  ```
- Response:
  ```json
  {
    "success": boolean,
    "message": "string",
    "data": {
      "product": "object"
    }
  }
  ```

**POST /upload-image**
- Descrição: Processar imagem de produto
- Content-Type: multipart/form-data
- Request Body: FormData com campo "image"
- Response:
  ```json
  {
    "success": boolean,
    "message": "string",
    "data": {
      "product": "object"
    }
  }
  ```

**POST /chat**
- Descrição: Processar mensagem de chat
- Request Body:
  ```json
  {
    "message": "string",
    "context": "object (opcional)"
  }
  ```
- Response:
  ```json
  {
    "success": boolean,
    "response": "string"
  }
  ```

### 4.3 Ambiente de Desenvolvimento

- **Node.js:** 18+ ou 20+
- **Gerenciador de Pacotes:** pnpm (recomendado)
- **Editor:** VS Code (recomendado)
- **Sistema Operacional:** Linux, macOS, Windows

---

## 5. Casos de Uso

### UC01 - Escanear QR Code

**Ator Principal:** Usuário  
**Pré-condições:** 
- Usuário possui dispositivo com câmera
- Navegador suporta getUserMedia API

**Fluxo Principal:**
1. Usuário acessa a aplicação
2. Usuário seleciona aba "Scanner"
3. Usuário seleciona "QR Code" como tipo de código
4. Usuário clica em "Iniciar Scanner"
5. Sistema solicita permissão de câmera
6. Usuário concede permissão
7. Sistema exibe preview da câmera com área de detecção
8. Usuário aponta câmera para QR Code
9. Sistema detecta e decodifica QR Code
10. Sistema para o scanner automaticamente
11. Sistema envia código para backend
12. Sistema exibe resultado

**Fluxos Alternativos:**
- 6a. Usuário nega permissão → Sistema exibe mensagem de erro
- 9a. QR Code não é detectado → Usuário continua tentando
- 11a. Erro de conexão → Sistema exibe mensagem de erro de conexão

### UC02 - Escanear Código de Barras

**Ator Principal:** Usuário  
**Pré-condições:** 
- Usuário possui dispositivo com câmera
- Produto possui código de barras legível

**Fluxo Principal:**
1. Usuário acessa a aplicação
2. Usuário seleciona aba "Scanner"
3. Usuário seleciona "Código de Barras" como tipo
4. Usuário clica em "Iniciar Scanner"
5. Sistema solicita permissão de câmera
6. Usuário concede permissão
7. Sistema exibe preview com área de detecção retangular
8. Usuário alinha código de barras na área
9. Sistema detecta e decodifica código
10. Sistema exibe código e formato detectado (ex: EAN-13)
11. Sistema envia para backend
12. Sistema exibe informações do produto

**Fluxos Alternativos:**
- 9a. Código não é detectado → Usuário ajusta ângulo/distância

### UC03 - Capturar Foto de Produto

**Ator Principal:** Usuário  
**Pré-condições:** 
- Usuário possui dispositivo com câmera

**Fluxo Principal:**
1. Usuário acessa aba "Upload"
2. Usuário clica em "Tirar Foto"
3. Sistema solicita permissão de câmera
4. Sistema exibe preview da câmera
5. Usuário posiciona produto no enquadramento
6. Usuário clica em "Capturar Foto"
7. Sistema captura frame e para câmera
8. Sistema exibe preview da foto capturada
9. Usuário clica em "Enviar"
10. Sistema envia imagem para backend
11. Sistema exibe resultado do processamento

**Fluxos Alternativos:**
- 5a. Usuário não gosta do enquadramento → Clica em trocar câmera
- 9a. Usuário quer tirar outra foto → Clica em cancelar e reinicia processo

### UC04 - Upload de Imagem

**Ator Principal:** Usuário  
**Pré-condições:** 
- Usuário possui imagem do produto no dispositivo

**Fluxo Principal:**
1. Usuário acessa aba "Upload"
2. Usuário clica em área de upload
3. Sistema abre seletor de arquivos
4. Usuário seleciona imagem
5. Sistema valida tipo de arquivo
6. Sistema exibe preview da imagem
7. Usuário clica em "Enviar"
8. Sistema faz upload da imagem
9. Sistema exibe resultado

**Fluxos Alternativos:**
- 5a. Arquivo inválido → Sistema exibe erro e permite nova seleção
- 8a. Erro no upload → Sistema exibe mensagem de erro

### UC05 - Interagir via Chat

**Ator Principal:** Usuário  
**Pré-condições:** Nenhuma

**Fluxo Principal:**
1. Usuário acessa aba "Chat"
2. Usuário digita pergunta sobre produto
3. Usuário clica em enviar ou pressiona Enter
4. Sistema exibe mensagem no histórico
5. Sistema envia mensagem para backend
6. Sistema exibe indicador de "digitando"
7. Sistema recebe resposta
8. Sistema exibe resposta no histórico
9. Usuário pode continuar conversação

**Fluxos Alternativos:**
- 5a. Erro de conexão → Sistema exibe mensagem de erro

---

## 6. Restrições e Premissas

### 6.1 Restrições
- Aplicação requer conexão com internet para comunicação com backend
- Funcionalidades de câmera requerem HTTPS (exceto localhost)
- Limitação de tamanho de imagem para upload (configurável no backend)
- Navegadores devem suportar Web APIs modernas (getUserMedia, Canvas, etc.)

### 6.2 Premissas
- Backend possui endpoints funcionais conforme especificação
- Usuários possuem dispositivos com câmera funcional
- Produtos possuem códigos legíveis e bem iluminados
- Internet móvel ou WiFi disponível para usuários

---

## 7. Priorização de Requisitos

### Prioridade Alta (MVP)
- RF01.1 - Escaneamento de QR Code
- RF01.2 - Escaneamento de Código de Barras
- RF02.1 - Upload de Arquivo
- RF04.1 - Abas de Navegação
- RF04.2 - Design Responsivo

### Prioridade Média
- RF01.3 - Seleção de Câmera
- RF02.2 - Captura de Foto
- RF03.1 - Interface de Chat
- RF03.2 - Integração com Backend

### Prioridade Baixa
- Melhorias de UI/UX
- Animações avançadas
- Suporte offline
- PWA completo

---

## 8. Glossário

- **QR Code:** Quick Response Code - código de barras bidimensional
- **EAN:** European Article Number - padrão europeu de código de barras
- **UPC:** Universal Product Code - padrão americano de código de barras
- **PWA:** Progressive Web App - aplicação web com características de app nativo
- **getUserMedia:** API do navegador para acesso a dispositivos de mídia
- **FormData:** Formato de dados para envio de arquivos via HTTP

---

## 9. Aprovação

| Nome | Função | Data | Assinatura |
|------|--------|------|------------|
|      | Product Owner | ___/___/___ | |
|      | Tech Lead | ___/___/___ | |
|      | QA Lead | ___/___/___ | |

---

**Última Atualização:** 29 de Outubro de 2025  
**Versão do Documento:** 1.0  
**Status:** Em Desenvolvimento

