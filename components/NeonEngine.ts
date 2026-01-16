
interface Point {
  x: number;
  y: number;
}

export class NeonEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private hands: Point[][] = [];
  private frame: number = 0;
  private handsTouching: boolean = false;
  private flashIntensity: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  public updateHands(landmarks: any[]) {
    this.hands = landmarks.map(hand => 
      hand.map((lm: any) => ({
        x: (1 - lm.x) * this.canvas.width,
        y: lm.y * this.canvas.height
      }))
    );
    this.checkTouch();
  }

  private checkTouch() {
    if (this.hands.length === 2) {
      const h1 = this.hands[0][0]; // Wrist mão 1
      const h2 = this.hands[1][0]; // Wrist mão 2
      const dist = Math.sqrt(Math.pow(h1.x - h2.x, 2) + Math.pow(h1.y - h2.y, 2));
      
      const wasTouching = this.handsTouching;
      this.handsTouching = dist < 150;

      if (this.handsTouching && !wasTouching) {
        this.flashIntensity = 1.0;
      }
    } else {
      this.handsTouching = false;
    }
  }

  public start() {
    const loop = () => {
      this.draw();
      this.frame++;
      requestAnimationFrame(loop);
    };
    loop();
  }

  private draw() {
    // Fundo limpo com rastro suave
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.flashIntensity > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashIntensity * 0.2})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.flashIntensity -= 0.04;
    }

    this.hands.forEach((hand, hIdx) => {
      let color = '';
      if (this.handsTouching) {
        const syncHue = (this.frame * 3) % 360;
        color = `hsla(${syncHue}, 100%, 75%, 1)`;
      } else {
        color = hIdx === 0 ? 'hsla(200, 100%, 60%, 1)' : 'hsla(45, 100%, 60%, 1)';
      }

      this.ctx.save();
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = color;
      this.ctx.strokeStyle = color;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      // Estrutura simplificada: Conectar a palma e os dedos
      this.drawSkeleton(hand, color);
      
      this.ctx.restore();
    });
  }

  private drawSkeleton(hand: Point[], color: string) {
    // Definição das conexões dos dedos (Mediapipe Landmarks)
    const fingers = [
      [0, 1, 2, 3, 4],    // Polegar
      [0, 5, 6, 7, 8],    // Indicador
      [0, 9, 10, 11, 12], // Médio
      [0, 13, 14, 15, 16],// Anelar
      [0, 17, 18, 19, 20] // Mínimo
    ];

    const palm = [0, 5, 9, 13, 17, 0]; // Contorno da base da palma

    // Desenhar os dedos como traços simples e elegantes
    fingers.forEach(fingerPoints => {
      this.ctx.beginPath();
      this.ctx.lineWidth = 4;
      this.ctx.moveTo(hand[fingerPoints[0]].x, hand[fingerPoints[0]].y);
      for (let i = 1; i < fingerPoints.length; i++) {
        this.ctx.lineTo(hand[fingerPoints[i]].x, hand[fingerPoints[i]].y);
      }
      this.ctx.stroke();

      // Desenhar pontos brilhantes nas juntas
      fingerPoints.forEach(idx => {
        this.ctx.beginPath();
        this.ctx.arc(hand[idx].x, hand[idx].y, 2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
      });
    });

    // Desenhar a base da palma
    this.ctx.beginPath();
    this.ctx.lineWidth = 2;
    this.ctx.moveTo(hand[palm[0]].x, hand[palm[0]].y);
    for (let i = 1; i < palm.length; i++) {
      this.ctx.lineTo(hand[palm[i]].x, hand[palm[i]].y);
    }
    this.ctx.stroke();
  }
}
