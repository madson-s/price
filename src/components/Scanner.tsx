import { useState, useEffect, useRef } from "react";
import { Html5Qrcode, CameraDevice, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, X, CheckCircle, AlertCircle, Loader2, SwitchCamera, Barcode, QrCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const URL_BACKEND_SCAN = "https://api.example.com/scan-code"; // Placeholder URL

type ScanMode = "qrcode" | "barcode";

export const Scanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [codeFormat, setCodeFormat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [availableCameras, setAvailableCameras] = useState<CameraDevice[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [scanMode, setScanMode] = useState<ScanMode>("qrcode");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      // Limpar recursos ao desmontar o componente
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(console.error);
        }
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error("Erro ao limpar scanner:", error);
        }
      }
    };
  }, []);

  const getSupportedFormats = (mode: ScanMode): Html5QrcodeSupportedFormats[] => {
    if (mode === "qrcode") {
      return [Html5QrcodeSupportedFormats.QR_CODE];
    } else {
      // Modo "barcode" - apenas formatos EAN
      return [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
      ];
    }
  };

  const startScanner = async (cameraIndex: number = 0) => {
    try {
      setIsRequestingPermission(true);
      
      // Obter lista de câmeras disponíveis (isso vai pedir permissão)
      const devices = await Html5Qrcode.getCameras();
      
      if (!devices || devices.length === 0) {
        throw new Error("Nenhuma câmera encontrada");
      }

      setAvailableCameras(devices);
      setIsRequestingPermission(false);
      setIsScanning(true);
      
      // Aguardar o próximo tick para garantir que o DOM foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const html5QrCode = new Html5Qrcode("scanner-container", {
        formatsToSupport: getSupportedFormats(scanMode),
        verbose: false,
      });
      scannerRef.current = html5QrCode;

      // Se não foi especificado um índice, procurar pela câmera traseira
      let selectedCameraIndex = cameraIndex;
      if (cameraIndex === 0 && devices.length > 1) {
        const backCameraIndex = devices.findIndex(device => {
          const label = device.label.toLowerCase();
          return label.includes('back') || 
                 label.includes('traseira') || 
                 label.includes('rear') ||
                 label.includes('environment') ||
                 label.includes('trás');
        });
        
        if (backCameraIndex !== -1) {
          selectedCameraIndex = backCameraIndex;
        }
      }
      
      setCurrentCameraIndex(selectedCameraIndex);
      const cameraId = devices[selectedCameraIndex].id;

      // Função dinâmica para calcular o qrbox baseado nas dimensões REAIS do vídeo
      const calculateQrBox = (viewfinderWidth: number, viewfinderHeight: number) => {
        console.log("Dimensões reais do viewfinder:", { viewfinderWidth, viewfinderHeight });
        
        if (scanMode === "barcode") {
          // Para código de barras EAN, usar faixa horizontal bem larga
          // Usar 90% da largura do vídeo e altura proporcional
          const width = Math.floor(viewfinderWidth * 0.9);
          const height = Math.floor(viewfinderHeight * 0.2); // 20% da altura do vídeo
          
          console.log("Barcode box calculado:", { width, height });
          return { width, height };
        } else {
          // Para QR code, usar formato quadrado (250x250 ou 70% do menor lado)
          const size = Math.min(
            Math.floor(viewfinderWidth * 0.7),
            Math.floor(viewfinderHeight * 0.7),
            250
          );
          
          console.log("QR code box calculado:", { width: size, height: size });
          return { width: size, height: size };
        }
      };

      console.log("Iniciando scanner com configurações:", {
        scanMode,
        fps: scanMode === "barcode" ? 20 : 10,
        usingDynamicQrBox: true
      });

      await html5QrCode.start(
        cameraId,
        {
          fps: scanMode === "barcode" ? 20 : 10, // FPS maior para barcode
          qrbox: calculateQrBox, // Função dinâmica!
          aspectRatio: scanMode === "barcode" ? 16/9 : 1.0,
          disableFlip: false, // Permitir flip horizontal
          videoConstraints: {
            facingMode: "environment",
            // Solicitar resolução FULL HD para barcode (melhor nitidez)
            width: { ideal: scanMode === "barcode" ? 1920 : 1280, min: 1280 },
            height: { ideal: scanMode === "barcode" ? 1080 : 720, min: 720 },
            // Frames por segundo para melhor qualidade
            frameRate: { ideal: scanMode === "barcode" ? 30 : 24 },
            // ⭐ FOCO AUTOMÁTICO CONTÍNUO - essencial para barcode!
            // Configurações avançadas para melhor qualidade de imagem
            advanced: [
              { focusMode: "continuous" },      // Autofoco contínuo
              { exposureMode: "continuous" },   // Exposição automática
              { whiteBalanceMode: "continuous" } // Balanço de branco automático
            ]
          } as any
        },
        async (decodedText, decodedResult) => {
          console.log("Código detectado:", decodedText, "Formato:", decodedResult);
          setScannedCode(decodedText);
          setCodeFormat(decodedResult.result.format?.formatName || "Desconhecido");
          await stopScanner();
          await sendCodeToBackend(decodedText);
        },
        (errorMessage) => {
          // Silent error handling for scanning attempts
        }
      );
      
      console.log("Scanner iniciado com sucesso");
    } catch (err: any) {
      console.error("Erro ao iniciar scanner:", err);
      setIsRequestingPermission(false);
      setIsScanning(false);
      
      let errorMessage = "Verifique as permissões da câmera";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMessage = "Nenhuma câmera encontrada no dispositivo.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMessage = "A câmera está sendo usada por outro aplicativo.";
      } else if (err.message && err.message.includes("Permission")) {
        errorMessage = "Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.";
      }

      toast({
        title: "Erro ao acessar câmera",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      try {
        scannerRef.current.clear();
      } catch (error) {
        console.error("Erro ao limpar scanner:", error);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    
    await stopScanner();
    const nextCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
    await startScanner(nextCameraIndex);
  };

  const sendCodeToBackend = async (code: string) => {
    setIsLoading(true);
    setResult(null);

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
    setScannedCode(null);
    setCodeFormat(null);
    setResult(null);
  };

  const handleModeChange = (newMode: string) => {
    setScanMode(newMode as ScanMode);
  };

  return (
    <div className="space-y-4">
      {!isScanning && !scannedCode && !isRequestingPermission && (
        <>
          <Card className="p-4 shadow-soft">
            <div className="space-y-3">
              <label className="text-sm font-medium">Tipo de Código</label>
              <Tabs value={scanMode} onValueChange={handleModeChange} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="qrcode" className="gap-2">
                    <QrCode className="h-4 w-4" />
                    <span className="hidden sm:inline">QR Code</span>
                  </TabsTrigger>
                  <TabsTrigger value="barcode" className="gap-2">
                    <Barcode className="h-4 w-4" />
                    <span className="hidden sm:inline">Código de Barras</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                {scanMode === "qrcode" && "Detecta apenas QR Codes"}
                {scanMode === "barcode" && "Detecta apenas códigos EAN-13 e EAN-8"}
              </p>
            </div>
          </Card>

          <Button
            onClick={() => startScanner()}
            className="w-full h-14 bg-gradient-primary hover:opacity-90 transition-opacity"
            size="lg"
          >
            <Camera className="mr-2 h-5 w-5" />
            Iniciar Scanner
          </Button>
        </>
      )}

      {isRequestingPermission && (
        <Card className="p-6 shadow-medium">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <h3 className="font-semibold text-lg">Solicitando Permissão</h3>
              <p className="text-sm text-muted-foreground">
                Por favor, permita o acesso à câmera no seu navegador
              </p>
            </div>
          </div>
        </Card>
      )}

      {isScanning && (
        <Card className="overflow-hidden shadow-medium">
          <div className="relative">
            <div id="scanner-container" className="w-full" />
            <div className="absolute top-4 right-4 flex gap-2">
              {availableCameras.length > 1 && (
                <Button
                  onClick={switchCamera}
                  variant="secondary"
                  size="icon"
                  className="rounded-full shadow-large"
                  title="Trocar Câmera"
                >
                  <SwitchCamera className="h-5 w-5" />
                </Button>
              )}
              <Button
                onClick={stopScanner}
                variant="destructive"
                size="icon"
                className="rounded-full shadow-large"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-xs whitespace-nowrap">
              {scanMode === "barcode" ? (
                <span>📊 Posicione o código EAN horizontalmente</span>
              ) : (
                <span>📱 Centralize o QR Code na área</span>
              )}
            </div>
          </div>
        </Card>
      )}

      {scannedCode && (
        <Card className="p-6 space-y-4 shadow-medium animate-in fade-in-50 slide-in-from-bottom-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Código Detectado</h3>
              {codeFormat && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
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
            Escanear Novamente
          </Button>
        </Card>
      )}
    </div>
  );
};
