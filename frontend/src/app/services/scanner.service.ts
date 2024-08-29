import * as Quagga from 'quagga';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScannerService {

  constructor() { }

  private audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  playBeepSound() {
    const oscillator = this.createOscillator();
    const gain = this.createGain();

    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  startScanning(video: HTMLVideoElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D | null, onDetectedCallback: (code: string) => void) {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then((stream) => {
          this.setupVideoStream(stream, video);
          this.initializeQuagga(video, canvas, ctx, onDetectedCallback);
        })
        .catch(this.handleCameraError);
    } else {
      console.error('El navegador no admite la API de getUserMedia');
    }
  }

  stopScanning(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.stopVideoStream(video);
    this.stopQuagga();
    this.clearCanvas(canvas);
  }

  private setupVideoStream(stream: MediaStream, video: HTMLVideoElement) {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      setTimeout(() => this.updateCanvasDimensions(video), 100); // Espera un momento antes de actualizar el canvas
    };
  }

  private updateCanvasDimensions(video: HTMLVideoElement) {
    const canvas = document.getElementById('overlay') as HTMLCanvasElement;
    if (canvas) {
      canvas.width = 300; // Mantén el tamaño específico del canvas
      canvas.height = 300; // Mantén el tamaño específico del canvas
      canvas.style.width = `${video.videoWidth - 340}px`; // Ajusta el estilo si es necesario
      canvas.style.height = `${video.videoHeight - 280}px`; // Ajusta el estilo si es necesario
      console.log('Canvas dimensions updated:', canvas.width, canvas.height);
    }
  }

  private calculateOffset(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calcula el desplazamiento en X y Y
    const offsetX = (videoWidth - canvasWidth) / 2;
    const offsetY = (videoHeight - canvasHeight) / 2;

    return { offsetX, offsetY };
  }


  private initializeQuagga(
    video: HTMLVideoElement, 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D | null, 
    onDetectedCallback: (code: string) => void) 
    {

    this.updateCanvasDimensions(video);

    // Verifica el contexto del canvas
    if (!ctx) {
      console.error('El contexto del canvas no está disponible');
      return;
    }

    Quagga.init({
      inputStream: {
        name: 'Live',
        type: 'LiveStream',
        target: video,
        constraints: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'environment',
        },
        singleChannel: true
      },
      decoder: {
        readers: ['code_128_reader', 'ean_reader', 'ean_8_reader']
      },
      locator: {
        halfSample: true,
        patchSize: 'large',
      },
      locate: true,
      multiple: false,
      frequency: 3,
    }, (err: any) => {
      if (err) {
        console.error('Error al inicializar Quagga:', err);
        return;
      }
      Quagga.start();
    });

    this.setupQuaggaEvents(video, canvas, ctx, onDetectedCallback); 
  }

  private setupQuaggaEvents(
    video: HTMLVideoElement, 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D | null, 
    onDetectedCallback: (code: string) => void) 
    {

    Quagga.onProcessed((result: any) => {
      if (ctx) {
        this.processQuaggaResult(result, ctx, video, canvas);
      } else {
        console.error('El contexto del canvas no está disponible en onProcessed');
      }
    });

    Quagga.onDetected((result: { codeResult: { code: string } }) => {
      this.playBeepSound();
      onDetectedCallback(result.codeResult.code.trim());
    });
  }


  private processQuaggaResult(
    result: any, 
    ctx: CanvasRenderingContext2D | null, 
    video: HTMLVideoElement, 
    canvas: HTMLCanvasElement) 
    {

    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // console.log('Quagga result:', result); 

    const { offsetX, offsetY } = this.calculateOffset(video, canvas);

    if (result && result.boxes) {
      result.boxes.filter((box: any) => box !== result.box)
        .forEach((box: any) => {
          this.drawAdjustedPath(box, offsetX, offsetY, ctx, 'green', 5);
        });
    }

    if (result && result.box) {
      this.drawAdjustedPath(result.box, offsetX, offsetY, ctx, 'green', 5);
    }

    if (result && result.codeResult && result.codeResult.code) {
      this.drawAdjustedPath(result.line, offsetX, offsetY, ctx, 'red', 8);
    }
  }

  private drawAdjustedPath(
    path: any[], 
    offsetX: number, 
    offsetY: number, 
    ctx: CanvasRenderingContext2D, 
    color: string, 
    lineWidth: number) 
    {
      
    ctx.beginPath();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;

    // Ajusta las coordenadas con el desplazamiento
    ctx.moveTo(path[0][0] - offsetX, path[0][1] - offsetY);

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i][0] - offsetX, path[i][1] - offsetY);
    }

    ctx.closePath();
    ctx.stroke();
  }

  private stopVideoStream(video: HTMLVideoElement) {
    if (video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
  }

  private stopQuagga() {
    Quagga.stop();
    Quagga.offDetected();
  }

  private clearCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  private handleCameraError(error: any) {
    console.error('Error al acceder a la cámara:', error);
  }

  private createOscillator(): OscillatorNode {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    return oscillator;
  }

  private createGain(): GainNode {
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.9, this.audioContext.currentTime);
    return gain;
  }
}
