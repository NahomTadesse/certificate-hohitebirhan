"use client";

import {
  Maximize,
  RotateCcw,
  RotateCw,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "react-modal";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  title?: string;
  zIndex?: number;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title = "Document Preview",
  zIndex = 50,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const errorRef = useRef<HTMLParagraphElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);

  // Set app element for accessibility
  useEffect(() => {
    Modal.setAppElement("body"); // or "#__next"
  }, []);

  // Reset state on close
  useEffect(() => {
    if (!isOpen) {
      setZoomLevel(1);
      setRotation(0);
      setIsFullscreen(false);
      if (document.fullscreenElement) document.exitFullscreen();
      if (errorRef.current) errorRef.current.style.display = "none";
    }
  }, [isOpen]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.2, 0.5));
  const handleRotateLeft = () => setRotation((prev) => prev - 90);
  const handleRotateRight = () => setRotation((prev) => prev + 90);

  const handleFullscreen = useCallback(() => {
    if (!modalRef.current) return;
    if (!isFullscreen) {
      modalRef.current.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  }, [isFullscreen]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      // overlayClassName="fixed inset-0 bg-gray-700 bg-opacity-30 z-20 flex items-center justify-center z-[1000]"
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/10 backdrop-blur-md p-4 transition-opacity duration-300 "
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
      style={{ overlay: { zIndex } }}
    >
      <div ref={modalRef} className="flex flex-col h-full">
        {/* Header */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-gray-400">
          <h3 className="text-xl font-semibold text-gray-600 truncate max-w-[70%]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded hover:text-gray-900 transition text-gray-300"
            aria-label="Close"
          >
            <X className="h-6 w-6 text-gray-700" />
          </button>
        </header>

        {/* Image Viewer */}
        <main className="flex-1 p-4  flex items-center justify-center">
          {imageUrl ? (
            <div className="relative max-w-full max-h-full overflow-hidden">
              <Image
                src={imageUrl}
                alt={title}
                width={800}
                height={600}
                className="select-none rounded-md pointer-events-none"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  maxHeight: "75vh",
                  maxWidth: "100%",
                  transition: "transform 0.3s ease",
                }}
                onError={() => {
                  if (errorRef.current)
                    errorRef.current.style.display = "block";
                }}
                onLoadingComplete={() => {
                  if (errorRef.current) errorRef.current.style.display = "none";
                }}
              />
              <p
                ref={errorRef}
                className="absolute bottom-2 left-0 right-0 text-center text-sm text-red-400 hidden"
              >
                Failed to load image.
              </p>
            </div>
          ) : (
            <p className="text-gray-400 italic">No image to preview</p>
          )}
        </main>

        {/* Toolbar */}
        <nav className="flex flex-wrap justify-center items-center gap-4 px-6 py-4  border-t border-gray-500">
          {[ZoomIn, ZoomOut, RotateCcw, RotateCw, Maximize].map(
            (Icon, index) => {
              const handlers = [
                handleZoomIn,
                handleZoomOut,
                handleRotateLeft,
                handleRotateRight,
                handleFullscreen,
              ];
              const labels = [
                "Zoom In",
                "Zoom Out",
                "Rotate Left",
                "Rotate Right",
                "Fullscreen",
              ];
              return (
                <button
                  key={index}
                  onClick={handlers[index]}
                  className="p-3 bg-gray-700 rounded-md text-white hover:bg-primary transition"
                  title={labels[index]}
                  aria-label={labels[index]}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            }
          )}
        </nav>
      </div>
    </Modal>
  );
};

export default ImagePreviewModal;
