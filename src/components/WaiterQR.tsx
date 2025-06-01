import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { FaDownload } from 'react-icons/fa';

interface WaiterQRProps {
  waiterId: string;
  waiterName: string;
}

const WaiterQR: React.FC<WaiterQRProps> = ({ waiterId, waiterName }) => {
  const qrValue = `${process.env.NEXT_PUBLIC_BASE_URL}/waiter/${waiterId}`;

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const svg = document.querySelector('svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const link = document.createElement('a');
          link.download = `qr-${waiterName}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow-lg">
      <QRCodeSVG value={qrValue} size={200} />
      <p className="mt-4 text-lg font-semibold">{waiterName}</p>
      <button
        onClick={handleDownload}
        className="mt-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        <FaDownload className="mr-2" />
        Descargar QR
      </button>
    </div>
  );
};

export default WaiterQR; 