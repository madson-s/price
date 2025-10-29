import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon, Camera, SwitchCamera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const URL_BACKEND_UPLOAD = "https://api.example.com/upload-image"; // Placeholder URL

export const ImageUpload = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Limpar stream da câmera ao desmontar
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Atribuir stream ao vídeo quando estiver disponível
  useEffect(() => {
    if (stream && videoRef.current && isCameraActive) {
      console.log("Atribuindo stream ao vídeo", {
        stream,
        videoRef: videoRef.current,
        tracks: stream.getTracks(),
        active: stream.active
      });
      
      videoRef.current.srcObject = stream;
      
      // Garantir que o vídeo comece a tocar
      videoRef.current.play()
        .then(() => {
          console.log("Vídeo iniciado com sucesso");
        })
        .catch(err => {
          console.error("Erro ao iniciar vídeo:", err);
          toast({
            title: "Erro ao iniciar vídeo",
            description: "Não foi possível iniciar a prévia da câmera",
            variant: "destructive",
          });
        });
    }
  }, [stream, isCameraActive, toast]);

  const startCamera = async (cameraIndex: number = 0) => {
    try {
      // Parar stream anterior se existir
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Ativar interface da câmera primeiro
      setIsCameraActive(true);
      
      // Pequeno delay para garantir que o DOM foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));

      // Obter lista de câmeras (isso solicita permissão)
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      
      if (cameras.length === 0) {
        throw new Error("Nenhuma câmera encontrada");
      }

      setAvailableCameras(cameras);

      // Selecionar câmera traseira por padrão (se disponível)
      let selectedIndex = cameraIndex;
      if (cameraIndex === 0 && cameras.length > 1) {
        const backCameraIndex = cameras.findIndex(camera => {
          const label = camera.label.toLowerCase();
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

      // Iniciar stream da câmera com constraints mais específicas
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: cameras[selectedIndex].deviceId ? 
            { exact: cameras[selectedIndex].deviceId } : 
            undefined,
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: cameraIndex === 0 ? { ideal: "environment" } : "user"
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log("Stream da câmera obtido:", {
        mediaStream,
        tracks: mediaStream.getTracks(),
        active: mediaStream.active,
        videoTracks: mediaStream.getVideoTracks()
      });
      
      setStream(mediaStream);

    } catch (err: any) {
      console.error("Erro ao acessar câmera:", err);
      setIsCameraActive(false);
      
      let errorMessage = "Erro ao acessar a câmera";
      
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMessage = "Permissão de câmera negada. Por favor, permita o acesso à câmera.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "Nenhuma câmera encontrada no dispositivo.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "A câmera está sendo usada por outro aplicativo.";
      }

      toast({
        title: "Erro ao acessar câmera",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    await startCamera(nextIndex);
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar canvas com as dimensões do vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter canvas para blob e criar arquivo
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setSelectedImage(file);
        setPreviewUrl(canvas.toDataURL('image/jpeg'));
        stopCamera();
        setResult(null);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione uma imagem",
          variant: "destructive",
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("image", selectedImage);

    try {
      const response = await fetch(URL_BACKEND_UPLOAD, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      setResult({
        success: response.ok,
        message: data.message || "Imagem processada com sucesso",
      });

      toast({
        title: response.ok ? "Sucesso!" : "Erro",
        description: data.message || "Imagem enviada",
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

  const resetUpload = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    stopCamera();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="image-upload"
      />
      <canvas ref={canvasRef} className="hidden" />

      {!selectedImage && !isCameraActive ? (
        <div className="space-y-3">
          <label htmlFor="image-upload">
            <Card className="p-8 border-2 border-dashed cursor-pointer hover:border-primary transition-colors shadow-soft">
              <div className="flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-4 bg-gradient-primary rounded-full">
                  <Upload className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Enviar Imagem</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique para selecionar uma imagem
                  </p>
                </div>
              </div>
            </Card>
          </label>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                ou
              </span>
            </div>
          </div>

          <Button
            onClick={() => startCamera()}
            className="w-full h-14 bg-gradient-accent hover:opacity-90 transition-opacity"
            size="lg"
          >
            <Camera className="mr-2 h-5 w-5" />
            Tirar Foto
          </Button>
        </div>
      ) : isCameraActive ? (
        <Card className="overflow-hidden shadow-medium">
          <div className="relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-auto min-h-[300px]"
            />
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
                onClick={stopCamera}
                variant="destructive"
                size="icon"
                className="rounded-full shadow-large"
                title="Fechar"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="p-4">
            <Button
              onClick={takePhoto}
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              size="lg"
            >
              <Camera className="mr-2 h-5 w-5" />
              Capturar Foto
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden shadow-medium animate-in fade-in-50 slide-in-from-bottom-5">
          <div className="relative">
            {previewUrl && (
              <div className="relative aspect-video bg-muted">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium truncate">{selectedImage.name}</span>
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

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={isLoading}
                className="flex-1 bg-gradient-accent hover:opacity-90 transition-opacity"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
              <Button
                onClick={resetUpload}
                variant="outline"
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
