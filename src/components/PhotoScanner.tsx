import { useState, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, X, CheckCircle, AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const URL_BACKEND_SCAN = "https://api.example.com/scan-code"; // Placeholder URL

export const PhotoScanner = () => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [codeFormat, setCodeFormat] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Mostrar preview da imagem capturada
    const reader = new FileReader();
    reader.onload = (e) => {
      setCapturedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Processar imagem
    await processImage(file);
  };

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setScannedCode(null);
    setCodeFormat(null);
    setResult(null);

    try {
      // Configurar html5-qrcode para processar arquivo
      const html5QrCode = new Html5Qrcode("reader", {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
        verbose: false,
      });

      console.log("📸 Processando imagem capturada...");
      console.log("📷 Tamanho do arquivo:", (file.size / 1024).toFixed(2), "KB");

      // Processar arquivo de imagem
      const decodedText = await html5QrCode.scanFile(file, true);
      
      console.log("✅ Código detectado na foto:", decodedText);
      
      setScannedCode(decodedText);
      
      // Tentar detectar o formato pelo padrão
      const format = detectFormat(decodedText);
      setCodeFormat(format);

      toast({
        title: "Código detectado!",
        description: `Formato: ${format}`,
      });

      // Enviar para backend
      await sendCodeToBackend(decodedText);
      
      // Limpar o html5QrCode
      html5QrCode.clear();
    } catch (err: any) {
      console.error("❌ Erro ao processar imagem:", err);
      
      let errorMessage = "Não foi possível detectar código de barras na imagem";
      
      if (err.message?.includes("QR code parse error")) {
        errorMessage = "Nenhum código de barras encontrado na imagem. Tente tirar outra foto com melhor iluminação e foco.";
      }

      toast({
        title: "Erro ao processar",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      // Resetar input para permitir nova captura
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const detectFormat = (code: string): string => {
    const length = code.length;
    
    if (length === 13) return "EAN-13";
    if (length === 8) return "EAN-8";
    if (length === 12) return "UPC-A";
    if (length === 6 || length === 7) return "UPC-E";
    
    return "Desconhecido";
  };

  const sendCodeToBackend = async (code: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(URL_BACKEND_SCAN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      
      setResult({
        success: response.ok,
        message: data.message || "Código processado com sucesso",
      });

      toast({
        title: response.ok ? "Sucesso!" : "Erro",
        description: data.message || "Código processado",
        variant: response.ok ? "default" : "destructive",
      });
    } catch (error) {
      setResult({
        success: false,
        message: "Erro ao conectar com o servidor",
      });
      
      toast({
        title: "Erro de conexão",
        description: "Não foi possível conectar ao servidor",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setScannedCode(null);
    setCodeFormat(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerCapture = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Hidden file input with camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        className="hidden"
      />

      {/* Elemento necessário para html5-qrcode (invisível) */}
      <div id="reader" className="hidden"></div>

      {!capturedImage && !scannedCode && (
        <>
          <Card className="p-4 shadow-soft bg-primary/5">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="text-2xl">📸</span>
                Scanner por Foto (Câmera Nativa)
              </h3>
              <p className="text-xs text-muted-foreground">
                Usa a <strong>câmera nativa</strong> do dispositivo com controles nativos de foco. Ideal para códigos de barras muito pequenos!
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>✓ Foco manual (tap-to-focus)</li>
                <li>✓ Alta resolução nativa (8MP+)</li>
                <li>✓ Processamento de imagem estática</li>
                <li>✓ Controles nativos do celular</li>
                <li>✓ Suporte: EAN-13, EAN-8, UPC-A, UPC-E</li>
              </ul>
              <div className="mt-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  <strong>💡 Dica:</strong> Toque na tela para focar no código de barras antes de tirar a foto. Isso garante máxima nitidez!
                </p>
              </div>
            </div>
          </Card>

          <Button
            onClick={triggerCapture}
            className="w-full h-14 bg-gradient-accent hover:opacity-90 transition-opacity"
            size="lg"
            disabled={isProcessing}
          >
            <Camera className="mr-2 h-5 w-5" />
            Tirar Foto do Código
          </Button>
        </>
      )}

      {capturedImage && !scannedCode && (
        <Card className="overflow-hidden shadow-medium">
          <div className="relative">
            <img
              src={capturedImage}
              alt="Imagem capturada"
              className="w-full h-auto"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center text-white space-y-3">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto" />
                  <p className="text-sm font-medium">Processando imagem...</p>
                  <p className="text-xs text-gray-300">Detectando código de barras</p>
                </div>
              </div>
            )}
          </div>
          <div className="p-4 flex gap-2">
            <Button
              onClick={resetScanner}
              variant="outline"
              className="flex-1"
              disabled={isProcessing}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button
              onClick={triggerCapture}
              variant="secondary"
              className="flex-1"
              disabled={isProcessing}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Nova Foto
            </Button>
          </div>
        </Card>
      )}

      {scannedCode && (
        <Card className="p-6 space-y-4 shadow-medium animate-in fade-in-50 slide-in-from-bottom-5">
          {capturedImage && (
            <div className="relative rounded-lg overflow-hidden border border-border">
              <img
                src={capturedImage}
                alt="Imagem capturada"
                className="w-full h-auto max-h-64 object-contain bg-muted"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Código Detectado</h3>
              {codeFormat && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400">
                  {codeFormat}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground break-all bg-muted p-3 rounded-lg font-mono">
              {scannedCode}
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {result && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg ${
                result.success
                  ? "bg-success/10 text-success-foreground"
                  : "bg-destructive/10 text-destructive-foreground"
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-sm">{result.message}</p>
            </div>
          )}

          <Button
            onClick={resetScanner}
            variant="outline"
            className="w-full"
          >
            Tirar Nova Foto
          </Button>
        </Card>
      )}
    </div>
  );
};

