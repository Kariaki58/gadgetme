"use client";

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, QrCode, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QRCodeCardProps {
  storeId: string;
  storeName: string;
}

export function QRCodeCard({ storeId, storeName }: QRCodeCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const catalogUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/store/${storeId}/catalog`
    : `/store/${storeId}/catalog`;

  const downloadQRCode = async () => {
    if (!qrRef.current) return;

    setIsDownloading(true);
    try {
      // Get the SVG element
      const svgElement = qrRef.current.querySelector('svg');
      if (!svgElement) {
        throw new Error('QR code SVG not found');
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Set background color to white
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '256');
      rect.setAttribute('height', '256');
      rect.setAttribute('fill', 'white');
      clonedSvg.insertBefore(rect, clonedSvg.firstChild);

      // Convert SVG to blob
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Create a canvas to convert SVG to PNG
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 512; // Higher resolution
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the QR code
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error('Failed to create image blob');
          }

          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${storeName}-catalog-qr.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
          URL.revokeObjectURL(url);

          toast({
            title: "QR Code Downloaded",
            description: "Your catalog QR code has been downloaded successfully.",
          });
          setIsDownloading(false);
        }, 'image/png');
      };

      img.onerror = () => {
        // Fallback: download as SVG
        const link = document.createElement('a');
        link.href = url;
        link.download = `${storeName}-catalog-qr.svg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "QR Code Downloaded",
          description: "Your catalog QR code has been downloaded as SVG.",
        });
        setIsDownloading(false);
      };

      img.src = url;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
        variant: "destructive",
      });
      setIsDownloading(false);
    }
  };

  return (
    <Card className="border-primary/10 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Store Catalog QR Code
            </CardTitle>
            <CardDescription className="mt-1">
              Share this QR code to let customers access your catalog
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg border-2 border-primary/10">
          <div ref={qrRef} className="flex items-center justify-center">
            <QRCodeSVG
              value={catalogUrl}
              size={256}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#6B22CC"
            />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Scan to view catalog
          </p>
          <p className="text-xs text-muted-foreground break-all">
            {catalogUrl}
          </p>
        </div>
        <Button
          className="w-full bg-primary hover:bg-primary/90"
          onClick={downloadQRCode}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

