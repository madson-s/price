import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scanner } from "@/components/Scanner";
import { ImageUpload } from "@/components/ImageUpload";
import { Chat } from "@/components/Chat";
import { Camera, Upload, MessageSquare } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("scanner");

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Product Scanner
          </h1>
          <p className="text-muted-foreground">
            Escaneie QR Codes, códigos de barras, imagens ou converse via chat
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 shadow-soft">
            <TabsTrigger value="scanner" className="gap-2">
              <Camera className="h-4 w-4" />
              <span className="hidden sm:inline">Scanner</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scanner" className="mt-6">
            <Scanner />
          </TabsContent>

          <TabsContent value="upload" className="mt-6">
            <ImageUpload />
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <Chat />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
