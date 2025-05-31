import React from 'react';
import QRCode from 'qrcode.react';
import { FaDownload } from 'react-icons/fa';

interface WaiterQRProps {
  waiterId: string;
  waiterName: string;
}

const WaiterQR: React.FC<WaiterQRProps> = ({ waiterId, waiterName }) => {
  const qrValue = `${window.location.origin}/waiter/${waiterId}`;

  const handleDownload = () => {
    const canvas = document.getElementById('waiter-qr') as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qr-${waiterName.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-gray-800">
      <div className="flex flex-col items-center">
        <div className="bg-white p-4 rounded-lg mb-4">
          <QRCode
            id="waiter-qr"
            value={qrValue}
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>
        <p className="text-white text-center mb-4">
          Escanea este código QR para valorar a {waiterName}
        </p>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
        >
          <FaDownload />
          <span>Descargar QR</span>
        </button>
      </div>
    </div>
  );
};

export default WaiterQR; 