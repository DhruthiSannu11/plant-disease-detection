import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Plant Health AI | Leaf Disease Detection & Botanical Diagnostics',
  description:
    'Production-grade Plant Disease Detection platform powered by PyTorch, ONNX INT8 Quantization, Explainable AI (Grad-CAM), FastAPI, and GeoJSON Outbreak Surveillance.',
  keywords: [
    'plant disease',
    'crop diagnosis',
    'botanical guide',
    'agritech',
    'onnx runtime',
    'grad-cam',
    'leaf scanner',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen antialiased bg-forest-950 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
