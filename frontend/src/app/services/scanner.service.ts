import * as Quagga from 'quagga';
import { Injectable } from '@angular/core';

/**
 * Servicio para manejar el escaneo de códigos de barras utilizando la cámara del dispositivo.
 * Incluye métodos para iniciar y detener el escaneo, así como para procesar los resultados.
 */
@Injectable({
  providedIn: 'root'
})
export class ScannerService {

  constructor() { }

  private audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

  // CONFIGURACIÓN DEL BEEP
  /**
   * Reproduce un sonido de "beep" cuando se detecta un código de barras.
   */
  playBeepSound() {
    const oscillator = this.createOscillator();
    const gain = this.createGain();

    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * Crea un oscilador para reproducir el sonido de "beep".
   * @returns El oscilador creado.
   */
  private createOscillator(): OscillatorNode {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
    return oscillator;
  }

  /**
   * Crea un nodo de ganancia para ajustar el volumen del sonido.
   * @returns El nodo de ganancia creado.
   */
  private createGain(): GainNode {
    const gain = this.audioContext.createGain();
    gain.gain.setValueAtTime(0.9, this.audioContext.currentTime);
    return gain;
  }

  // IMPLEMENTACIÓN DEL ESCANER POR CAMARA
  /**
   * Inicia el proceso de escaneo configurando el flujo de video y el análisis de Quagga.
   * @param video - Elemento de video HTML que muestra la transmisión de la cámara.
   * @param canvas - Elemento de canvas HTML sobre el cual se dibujan los cuadros de detección.
   * @param ctx - Contexto del canvas donde se dibujan los cuadros y líneas.
   * @param onDetectedCallback - Función de callback que se llama cuando se detecta un código de barras.
   */
  startScanning(
    video: HTMLVideoElement, 
    canvas: HTMLCanvasElement, 
    ctx: CanvasRenderingContext2D | null, 
    onDetectedCallback: (code: string) => void) 
    {

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

  /**
   * Detiene el escaneo, detiene el flujo de video y limpia el canvas.
   * @param video - Elemento de video HTML que muestra la transmisión de la cámara.
   * @param canvas - Elemento de canvas HTML sobre el cual se dibujan los cuadros de detección.
   */
  stopScanning(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this.stopVideoStream(video);
    this.stopQuagga();
    this.clearCanvas(canvas);
  }

  /**
   * Configura el flujo de video a partir de un stream de medios y reproduce el video.
   * @param stream - Stream de medios del video.
   * @param video - Elemento de video HTML que muestra la transmisión de la cámara.
   */
  private setupVideoStream(stream: MediaStream, video: HTMLVideoElement) {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
      setTimeout(() => this.updateCanvasDimensions(video), 100); // Espera un momento antes de actualizar el canvas
    };
  }

  /**
   * Actualiza las dimensiones y el estilo del canvas según el tamaño del video.
   * @param video - Elemento de video HTML que muestra la transmisión de la cámara.
   */
  private updateCanvasDimensions(video: HTMLVideoElement) {
    const canvas = document.getElementById('overlay') as HTMLCanvasElement;
    if (canvas) {
      canvas.width = 300; // Mantén el tamaño específico del canvas
      canvas.height = 300; // Mantén el tamaño específico del canvas
      canvas.style.width = `${video.videoWidth - 340}px`; // Ajusta el estilo si es necesario
      canvas.style.height = `${video.videoHeight - 280}px`; // Ajusta el estilo si es necesario
      // console.log('Canvas dimensions updated:', canvas.width, canvas.height);
    }
  }

  /**
   * Calcula el desplazamiento necesario para alinear el canvas con el video.
   * @param video - Elemento de video HTML que muestra la transmisión de la cámara.
   * @param canvas - Elemento de canvas HTML sobre el cual se dibujan los cuadros de detección.
   * @returns Un objeto con los desplazamientos en X y Y.
   */
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

  /**
   * Inicializa Quagga para el escaneo de códigos de barras con las configuraciones especificadas.
   * @param video - Elemento de video HTML que muestra la transmisión de la cámara.
   * @param canvas - Elemento de canvas HTML sobre el cual se dibujan los cuadros de detección.
   * @param ctx - Contexto del canvas donde se dibujan los cuadros y líneas.
   * @param onDetectedCallback - Función de callback que se llama cuando se detecta un código de barras.
   */
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

  /**
   * Configura los eventos de Quagga para el procesamiento y la detección de códigos de barras.
   * @param video - Elemento de video HTML que muestra la transmisión de la cámara.
   * @param canvas - Elemento de canvas HTML sobre el cual se dibujan los cuadros de detección.
   * @param ctx - Contexto del canvas donde se dibujan los cuadros y líneas.
   * @param onDetectedCallback - Función de callback que se llama cuando se detecta un código de barras.
   */
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

  /**
   * Procesa el resultado de Quagga y dibuja los cuadros de detección y líneas en el canvas.
   * @param result - Resultado del procesamiento de Quagga.
   * @param ctx - Contexto del canvas donde se dibujan los cuadros y líneas.
   * @param video - Elemento de video HTML que muestra la transmisión de la cámara.
   * @param canvas - Elemento de canvas HTML sobre el cual se dibujan los cuadros de detección.
   */
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

  /**
   * Dibuja una ruta ajustada en el canvas teniendo en cuenta el desplazamiento.
   * @param path - Array de coordenadas que forman la ruta.
   * @param offsetX - Desplazamiento en X.
   * @param offsetY - Desplazamiento en Y.
   * @param ctx - Contexto del canvas donde se dibujan los cuadros y líneas.
   * @param color - Color de la línea.
   * @param lineWidth - Ancho de la línea.
   */
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

  /**
   * Detiene el flujo de video asociado al elemento de video.
   * @param video - Elemento de video HTML que muestra la transmisión de la cámara.
   */
  private stopVideoStream(video: HTMLVideoElement) {
    if (video.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }
  }

   /**
   * Detiene Quagga y desactiva el evento de detección.
   */
  private stopQuagga() {
    Quagga.stop();
    Quagga.offDetected();
  }

  /**
   * Limpia el contenido del canvas.
   * @param canvas - Elemento de canvas HTML sobre el cual se dibujan los cuadros de detección.
   */
  private clearCanvas(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Maneja errores al acceder a la cámara.
   * @param error - Objeto de error.
   */
  private handleCameraError(error: any) {
    console.error('Error al acceder a la cámara:', error);
  }

  
}
