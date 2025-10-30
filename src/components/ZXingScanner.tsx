import { useState, useEffect, useRef } from "react";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, X, CheckCircle, AlertCircle, Loader2, SwitchCamera, Flashlight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const URL_BACKEND_SCAN = "https://api.example.com/scan-code"; // Placeholder URL

export const ZXingScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [codeFormat, setCodeFormat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [torchEnabled, setTorchEnabled] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async (cameraIndex: number = 0) => {
    try {
      setIsScanning(true);

      // Configurar hints para detecção otimizada de códigos de barras pequenos
      const hints = new Map();
      const formats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ];
      hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
      hints.set(DecodeHintType.TRY_HARDER, true); // 🎯 Modo "try harder" para códigos pequenos
      hints.set(DecodeHintType.ASSUME_GS1, false);

      const codeReader = new BrowserMultiFormatReader(hints);
      codeReaderRef.current = codeReader;

      // Listar câmeras disponíveis
      const videoInputDevices = await codeReader.listVideoInputDevices();
      setAvailableCameras(videoInputDevices);

      if (videoInputDevices.length === 0) {
        throw new Error("Nenhuma câmera encontrada");
      }

      // Selecionar câmera traseira por padrão
      let selectedIndex = cameraIndex;
      if (cameraIndex === 0 && videoInputDevices.length > 1) {
        const backCameraIndex = videoInputDevices.findIndex(device => {
          const label = device.label.toLowerCase();
          return label.includes('back') || 
                 label.includes('traseira') || 
                 label.includes('rear') ||
                 label.includes('environment');
        });
        
        if (backCameraIndex !== -1) {
          selectedIndex = backCameraIndex;
        }
      }

      setCurrentCameraIndex(selectedIndex);
      const selectedDeviceId = videoInputDevices[selectedIndex].deviceId;

      console.log("📸 Iniciando ZXing Scanner com:", {
        camera: videoInputDevices[selectedIndex].label,
        formats,
        tryHarder: true
      });

      // Obter stream com alta resolução
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: selectedDeviceId },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30 },
          facingMode: "environment",
          advanced: [
            { focusMode: "continuous" },
            { exposureMode: "continuous" },
            { whiteBalanceMode: "continuous" }
          ]
        } as any
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Aguardar foco estabilizar
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Tentar ativar torch automaticamente
      try {
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        console.log("📸 Capacidades da câmera (ZXing):", capabilities);
        
        if (capabilities.torch) {
          await track.applyConstraints({ 
            advanced: [{ torch: true }] as any
          });
          setTorchEnabled(true);
          console.log("🔦 Torch ativada (ZXing)");
        }
      } catch (error) {
        console.warn("Torch não disponível:", error);
      }

      // Iniciar detecção contínua
      console.log("🔍 Iniciando detecção contínua com ZXing...");
      
      codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current!,
        async (result, error) => {
          if (result) {
            console.log("✅ Código detectado (ZXing):", result.getText(), "Formato:", result.getBarcodeFormat());
            setScannedCode(result.getText());
            setCodeFormat(BarcodeFormat[result.getBarcodeFormat()]);
            await stopScanner();
            await sendCodeToBackend(result.getText());
          }
          // Silenciosamente ignorar erros de leitura contínua
        }
      );

      console.log("✅ ZXing Scanner pronto");
    } catch (err: any) {
      console.error("Erro ao iniciar ZXing scanner:", err);
      setIsScanning(false);
      
      let errorMessage = "Erro ao acessar câmera";
      if (err.name === "NotAllowedError") {
        errorMessage = "Permissão de câmera negada";
      } else if (err.name === "NotFoundError") {
        errorMessage = "Nenhuma câmera encontrada";
      }

      toast({
        title: "Erro ao iniciar scanner",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopScanner = async () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setTorchEnabled(false);
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    
    await stopScanner();
    const nextCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
    await startScanner(nextCameraIndex);
  };

  const toggleTorch = async () => {
    try {
      if (streamRef.current) {
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities() as any;
          if (capabilities.torch) {
            await track.applyConstraints({
              advanced: [{ torch: !torchEnabled }] as any
            });
            setTorchEnabled(!torchEnabled);
          } else {
            toast({
              title: "Lanterna não disponível",
              description: "Este dispositivo não suporta lanterna",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Erro ao alternar torch:", error);
    }
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

  return (
    <div className="space-y-4">
      {!isScanning && !scannedCode && (
        <>
          <Card className="p-4 shadow-soft bg-primary/5">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Scanner ZXing (Otimizado)
              </h3>
              <p className="text-xs text-muted-foreground">
                Usa biblioteca ZXing com modo <strong>TRY_HARDER</strong> ativado - especializado em detectar códigos de barras muito pequenos, danificados ou com baixa qualidade.
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>✓ Alta resolução (1920x1080)</li>
                <li>✓ Modo "Try Harder" ativo</li>
                <li>✓ Foco automático contínuo</li>
                <li>✓ Lanterna automática</li>
                <li>✓ Suporte: EAN-13, EAN-8, UPC-A, UPC-E</li>
              </ul>
            </div>
          </Card>

          <Button
            onClick={() => startScanner()}
            className="w-full h-14 bg-gradient-accent hover:opacity-90 transition-opacity"
            size="lg"
          >
            <Camera className="mr-2 h-5 w-5" />
            Iniciar Scanner ZXing
          </Button>
        </>
      )}

      {isScanning && (
        <Card className="overflow-hidden shadow-medium">
          <div className="relative bg-black">
            <video
              ref={videoRef}
              className="w-full h-auto"
              playsInline
              muted
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                onClick={toggleTorch}
                variant={torchEnabled ? "default" : "secondary"}
                size="icon"
                className="rounded-full shadow-large"
                title={torchEnabled ? "Desativar Lanterna" : "Ativar Lanterna"}
              >
                <Flashlight className={`h-5 w-5 ${torchEnabled ? 'fill-current' : ''}`} />
              </Button>
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
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-xs">
              <span>⚡ ZXing TRY_HARDER ativo - Detecta códigos muito pequenos</span>
            </div>
          </div>
        </Card>
      )}

      {scannedCode && (
        <Card className="p-6 space-y-4 shadow-medium animate-in fade-in-50 slide-in-from-bottom-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Código Detectado (ZXing)</h3>
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
            Escanear Novamente
          </Button>
        </Card>
      )}
    </div>
  );
};

