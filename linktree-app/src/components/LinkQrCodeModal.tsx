import React, { useMemo, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import toast from 'react-hot-toast';

interface LinkQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: {
    id: string;
    title: string;
    cover_image_url?: string | null;
  };
}

const DEFAULT_FG_COLOR = '#111827';
const DEFAULT_BG_COLOR = '#ffffff';
const QR_SIZE = 320;

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/+$/, '');

const getRedirectUrl = (linkId: string): string => {
  const envUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;
  const baseUrl = envUrl && envUrl.trim() !== '' ? envUrl : window.location.origin;
  return `${normalizeBaseUrl(baseUrl)}/r/${linkId}`;
};

const sanitizeFilename = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const LinkQrCodeModal: React.FC<LinkQrCodeModalProps> = ({ isOpen, onClose, link }) => {
  const [fgColor, setFgColor] = useState(DEFAULT_FG_COLOR);
  const [bgColor, setBgColor] = useState(DEFAULT_BG_COLOR);
  const [transparentBg, setTransparentBg] = useState(false);

  const qrValue = useMemo(() => getRedirectUrl(link.id), [link.id]);
  const qrBgColor = transparentBg ? 'rgba(0,0,0,0)' : bgColor;
  const logoSrc = link.cover_image_url ?? null;
  const hasLogo = Boolean(logoSrc);
  const canvasId = `qr-canvas-${link.id}`;

  const handleDownload = () => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) {
      toast.error('Nao foi possivel gerar o QR Code.');
      return;
    }

    const pngUrl = canvas.toDataURL('image/png');
    const anchor = document.createElement('a');
    const filenameBase = sanitizeFilename(link.title || 'link');
    anchor.href = pngUrl;
    anchor.download = `${filenameBase}-qrcode.png`;
    anchor.click();
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(qrValue);
      toast.success('URL do QR copiada!');
    } catch {
      toast.error('Nao foi possivel copiar a URL.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">QR Code do Link</h3>
            <p className="text-sm text-gray-500">{link.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Fechar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Cor da forma</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="h-11 w-16 cursor-pointer rounded border border-gray-300 bg-white"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-meuhub-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Cor do fundo</label>
              <div className="mb-2 flex items-center gap-3">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={transparentBg}
                  className="h-11 w-16 cursor-pointer rounded border border-gray-300 bg-white disabled:cursor-not-allowed disabled:opacity-50"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  disabled={transparentBg}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-meuhub-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={transparentBg}
                  onChange={(e) => setTransparentBg(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-meuhub-primary focus:ring-meuhub-primary"
                />
                Fundo transparente
              </label>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {hasLogo ? 'A logo do link sera usada no centro do QR.' : 'Este link nao tem imagem de capa. O QR sera gerado sem logo.'}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleDownload}
                className="w-full rounded-lg bg-meuhub-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-meuhub-accent"
              >
                Baixar QR Code (PNG)
              </button>
              <button
                type="button"
                onClick={handleCopyUrl}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Copiar URL do QR
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-4">
            <div
              className="rounded-xl p-3"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #f3f4f6 25%, transparent 25%), linear-gradient(-45deg, #f3f4f6 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f3f4f6 75%), linear-gradient(-45deg, transparent 75%, #f3f4f6 75%)',
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
              }}
            >
              <QRCodeCanvas
                id={canvasId}
                value={qrValue}
                size={QR_SIZE}
                level="H"
                fgColor={fgColor}
                bgColor={qrBgColor}
                includeMargin
                imageSettings={
                  logoSrc
                    ? {
                        src: logoSrc,
                        height: 56,
                        width: 56,
                        excavate: true,
                        crossOrigin: 'anonymous',
                      }
                    : undefined
                }
              />
            </div>
            <p className="mt-3 max-w-[320px] break-all text-center font-mono text-xs text-gray-500">{qrValue}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkQrCodeModal;
