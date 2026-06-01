import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

export default function QRPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url,    setUrl]    = useState('');
  const [copied, setCopied] = useState(false);
  const [size,   setSize]   = useState(280);

  useEffect(() => {
    setUrl(`${window.location.origin}/ponto`);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !url) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: size, margin: 2,
      color: { dark: '#f0f0f5', light: '#18181f' },
    });
  }, [url, size]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const a    = document.createElement('a');
    a.download = 'ponto-qrcode.png';
    a.href     = canvasRef.current.toDataURL('image/png');
    a.click();
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const img = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html>
      <head>
        <title>QR Code — Ponto Eletrônico</title>
        <style>
          body { margin:0; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; font-family:system-ui; }
          .logo { font-size:28px; font-weight:800; letter-spacing:4px; margin-bottom:8px; color:#111; }
          .sub  { font-size:14px; color:#666; margin-bottom:32px; }
          img   { width:320px; height:320px; }
          .url  { margin-top:24px; font-size:12px; color:#888; font-family:monospace; }
          .inst { margin-top:28px; font-size:15px; color:#333; text-align:center; max-width:300px; line-height:1.6; }
        </style>
      </head>
      <body>
        <div class="logo">PONTO</div>
        <div class="sub">Sistema de Ponto Eletrônico</div>
        <img src="${img}" />
        <div class="url">${url}</div>
        <div class="inst">Aponte a câmera do celular para este QR Code para registrar seu ponto.</div>
        <script>window.onload=()=>{window.print();window.close();}<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const card: React.CSSProperties = {
    background: 'var(--bg1)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)', padding: 20,
  };

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 2 }}>
          ACESSO RÁPIDO
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>QR Code</h1>
        <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 4 }}>
          Imprima e cole na academia. Funcionários escaneiam para acessar o ponto.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
        {/* QR preview */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: 20 }}>
            <canvas ref={canvasRef} style={{ display: 'block', borderRadius: 8 }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent)', letterSpacing: 2 }}>
              PONTO.APP
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              Escaneie para registrar ponto
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* URL */}
          <div style={card}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 1.5, marginBottom: 10 }}>
              URL DE DESTINO
            </div>
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 'var(--r)', padding: '10px 14px',
              fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--accent)',
              wordBreak: 'break-all', marginBottom: 12,
            }}>
              {url}
            </div>
            <button onClick={handleCopy} style={{
              width: '100%', padding: '10px',
              background: copied ? 'var(--green-l)' : 'var(--bg2)',
              border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
              borderRadius: 'var(--r-sm)',
              color: copied ? 'var(--green)' : 'var(--text2)',
              fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
              transition: 'all 0.2s',
            }}>
              {copied ? '✓ COPIADO!' : '⎘ COPIAR LINK'}
            </button>
          </div>

          {/* Size */}
          <div style={card}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 1.5, marginBottom: 12 }}>
              TAMANHO
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[200, 280, 360].map(s => (
                <button key={s} onClick={() => setSize(s)} style={{
                  flex: 1, padding: '9px 0', borderRadius: 'var(--r-sm)',
                  border: `1px solid ${s === size ? 'var(--accent)' : 'var(--border)'}`,
                  background: s === size ? 'var(--accent-l)' : 'var(--bg2)',
                  color: s === size ? 'var(--accent)' : 'var(--text3)',
                  fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600,
                }}>
                  {s}px
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={card}>
            <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text3)', letterSpacing: 1.5, marginBottom: 12 }}>
              AÇÕES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={handleDownload} style={{
                padding: '12px', borderRadius: 'var(--r)',
                background: 'var(--accent)', border: 'none', color: '#fff',
                fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, letterSpacing: 1,
              }}>
                ↓ BAIXAR PNG
              </button>
              <button onClick={handlePrint} style={{
                padding: '12px', borderRadius: 'var(--r)',
                background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--text2)',
                fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, letterSpacing: 1,
              }}>
                ⎙ IMPRIMIR
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div style={{
            background: 'var(--accent-l)', border: '1px solid rgba(255,107,0,0.2)',
            borderRadius: 'var(--r-lg)', padding: 18,
            fontSize: 13, color: 'var(--text2)', lineHeight: 1.7,
          }}>
            <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 10, fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 1 }}>
              COMO USAR
            </div>
            <ol style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <li>Baixe ou imprima o QR Code</li>
              <li>Cole em local visível na academia</li>
              <li>Funcionário aponta a câmera e acessa o link</li>
              <li>Faz login e registra o ponto</li>
              <li>Pode salvar como app na tela inicial</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
