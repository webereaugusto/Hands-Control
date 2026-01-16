
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { NeonEngine } from './components/NeonEngine';
import { OverlayUI } from './components/OverlayUI';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [handDetected, setHandDetected] = useState(false);
  const [interactionTime, setInteractionTime] = useState(0);
  const [smigolImage, setSmigolImage] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<NeonEngine | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new NeonEngine(canvasRef.current);
      engineRef.current.start();
    }
  }, []);

  useEffect(() => {
    if (handDetected && isCameraActive && !smigolImage && !isTransforming) {
      timerRef.current = window.setInterval(() => {
        setInteractionTime(prev => {
          if (prev >= 10) {
            if (timerRef.current !== null) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            applySmigolFilter();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [handDetected, isCameraActive, smigolImage, isTransforming]);

  const applySmigolFilter = async () => {
    if (!videoRef.current) return;
    setIsTransforming(true);

    try {
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = videoRef.current.videoWidth;
      captureCanvas.height = videoRef.current.videoHeight;
      const ctx = captureCanvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const base64Image = captureCanvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // O modelo correto para edição/geração de imagem é o gemini-2.5-flash-image
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: 'Transform the face in this photo into the Gollum (Smigol) character from Lord of the Rings. Give him giant bulging eyes, a tiny nose, thin hair, and a wide creepy smile with a few teeth. Keep the background similar but make the person look exactly like the viral TikTok Smigol filter. Output the image only.',
            },
          ],
        },
      });

      // Itera sobre as partes para encontrar a imagem gerada
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            const base64EncodeString = part.inlineData.data;
            setSmigolImage(`data:image/png;base64,${base64EncodeString}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Erro na transformação Smigol:", error);
      // Fallback: permite tentar de novo após falha
      setInteractionTime(0);
    } finally {
      setIsTransforming(false);
    }
  };

  const onResults = useCallback((results: any) => {
    setIsLoading(false);
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandDetected(true);
      engineRef.current?.updateHands(results.multiHandLandmarks);
    } else {
      setHandDetected(false);
      engineRef.current?.updateHands([]);
    }
  }, []);

  const handleCameraStart = () => {
    setIsCameraActive(true);
    if (videoRef.current) {
      // @ts-ignore
      const hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      hands.onResults(onResults);
      // @ts-ignore
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) await hands.send({ image: videoRef.current });
        },
        width: 1280,
        height: 720,
      });
      camera.start();
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full" />
      <video ref={videoRef} className="hidden" playsInline muted />

      <OverlayUI 
        isCameraActive={isCameraActive} 
        isLoading={(isLoading && isCameraActive) || isTransforming}
        handDetected={handDetected}
        onStart={handleCameraStart}
        interactionTime={interactionTime}
        isTransforming={isTransforming}
      />

      {smigolImage && (
        <div 
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-500"
          onClick={() => setSmigolImage(null)}
        >
          <div className="relative max-w-2xl w-full aspect-video rounded-3xl overflow-hidden border-4 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.5)]">
            <img src={smigolImage} alt="Smigol" className="w-full h-full object-cover" />
            <div className="absolute bottom-6 inset-x-0 text-center">
              <span className="bg-amber-500 text-black px-6 py-2 rounded-full font-black text-lg uppercase tracking-tighter animate-bounce shadow-xl">MEU PRECIOSO!</span>
            </div>
            <button 
              className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/80 transition-colors w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl"
              onClick={(e) => { e.stopPropagation(); setSmigolImage(null); setInteractionTime(0); }}
            >✕</button>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 z-20 text-white/20 text-xs tracking-widest uppercase pointer-events-none font-mono">
        Gollum AI Protocol • Lock: {Math.floor(interactionTime)}/10s
      </div>
    </div>
  );
};

export default App;
