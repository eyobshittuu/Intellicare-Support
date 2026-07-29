import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const FileViewer = ({ file, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [content, setContent] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const fileName = file.originalName || file.url || '';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  const fileType = getFileType(extension);

  useEffect(() => {
    loadFile();
  }, [file]);

  function getFileType(ext) {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(ext)) return 'word';
    if (['xls', 'xlsx'].includes(ext)) return 'excel';
    if (ext === 'csv') return 'csv';
    if (ext === 'txt') return 'text';
    return 'unknown';
  }

  async function loadFile() {
    setLoading(true);
    setError(null);

    try {
      if (fileType === 'image' || fileType === 'pdf') {
        // Images and PDFs can be loaded directly
        setContent(file.url);
        setLoading(false);
      } else if (fileType === 'word') {
        // Load and convert Word document
        await loadWordDocument();
      } else if (fileType === 'excel' || fileType === 'csv') {
        // Load and convert Excel/CSV
        await loadSpreadsheet();
      } else if (fileType === 'text') {
        // Load text file
        await loadTextFile();
      } else {
        setError('File type not supported for preview');
        setLoading(false);
      }
    } catch (err) {
      console.error('Error loading file:', err);
      setError('Failed to load file: ' + err.message);
      setLoading(false);
    }
  }

  async function loadWordDocument() {
    try {
      const response = await fetch(file.url);
      const arrayBuffer = await response.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setContent(result.value);
      setLoading(false);
    } catch (err) {
      throw new Error('Failed to load Word document');
    }
  }

  async function loadSpreadsheet() {
    try {
      const response = await fetch(file.url);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Convert all sheets to HTML
      const sheets = workbook.SheetNames.map(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        const html = XLSX.utils.sheet_to_html(sheet);
        return { name: sheetName, html };
      });
      
      setContent(sheets);
      setLoading(false);
    } catch (err) {
      throw new Error('Failed to load spreadsheet');
    }
  }

  async function loadTextFile() {
    try {
      const response = await fetch(file.url);
      const text = await response.text();
      setContent(text);
      setLoading(false);
    } catch (err) {
      throw new Error('Failed to load text file');
    }
  }

  const handleDownload = () => {
    window.open(file.url, '_blank');
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {fileName}
            </h3>
            <p className="text-sm text-gray-500">
              {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''} • {extension.toUpperCase()}
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2 ml-4">
            {fileType === 'pdf' && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={20} />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-2" />
              </>
            )}
            
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Download size={20} />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50 p-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-12 h-12 animate-spin text-teal-600 mb-4" />
              <p className="text-gray-600">Loading file...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                Download File Instead
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Image Viewer */}
              {fileType === 'image' && (
                <div className="flex items-center justify-center min-h-full">
                  <img
                    src={content}
                    alt={fileName}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    style={{ transform: `scale(${scale})` }}
                  />
                </div>
              )}

              {/* PDF Viewer */}
              {fileType === 'pdf' && (
                <div className="flex flex-col items-center">
                  <Document
                    file={content}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
                      </div>
                    }
                    error={
                      <div className="text-red-600 p-4">
                        Failed to load PDF. Please try downloading instead.
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      className="shadow-lg"
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                    />
                  </Document>
                  
                  {/* PDF Navigation */}
                  {numPages > 1 && (
                    <div className="flex items-center gap-4 mt-4 bg-white px-6 py-3 rounded-lg shadow">
                      <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <span className="text-sm font-medium">
                        Page {pageNumber} of {numPages}
                      </span>
                      <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Word Document Viewer */}
              {fileType === 'word' && (
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              )}

              {/* Excel/CSV Viewer */}
              {(fileType === 'excel' || fileType === 'csv') && (
                <div className="space-y-6">
                  {content.map((sheet, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        {sheet.name}
                      </h4>
                      <div 
                        className="overflow-auto"
                        dangerouslySetInnerHTML={{ __html: sheet.html }}
                        style={{
                          maxHeight: '600px'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Text File Viewer */}
              {fileType === 'text' && (
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
                  <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                    {content}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileViewer;
