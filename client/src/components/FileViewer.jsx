import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, Loader2, AlertCircle, Search, Maximize, Minimize, ChevronUp, ChevronDown, RotateCw } from 'lucide-react';
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
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showThumbnails, setShowThumbnails] = useState(false);

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

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handlePageJump = (e) => {
    e.preventDefault();
    const pageNum = parseInt(pageInput);
    if (pageNum >= 1 && pageNum <= numPages) {
      setCurrentPage(pageNum);
      // Scroll to page
      const pageElement = document.getElementById(`pdf-page-${pageNum}`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      setPageInput(String(newPage));
      const pageElement = document.getElementById(`pdf-page-${newPage}`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      setPageInput(String(newPage));
      const pageElement = document.getElementById(`pdf-page-${newPage}`);
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleThumbnailClick = (pageNum) => {
    setCurrentPage(pageNum);
    setPageInput(String(pageNum));
    const pageElement = document.getElementById(`pdf-page-${pageNum}`);
    if (pageElement) {
      pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white rounded-lg shadow-2xl flex flex-col ${isFullscreen ? 'w-full h-full' : 'w-full h-full max-w-7xl max-h-[95vh]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {fileName}
            </h3>
            <p className="text-sm text-gray-500">
              {file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''} • {extension.toUpperCase()}
              {numPages && fileType === 'pdf' && ` • ${numPages} pages`}
            </p>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-2">
            {fileType === 'pdf' && (
              <>
                {/* Page Navigation */}
                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-gray-300">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage <= 1}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Previous Page"
                  >
                    <ChevronUp size={18} />
                  </button>
                  
                  <form onSubmit={handlePageJump} className="flex items-center gap-1">
                    <input
                      type="number"
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      className="w-12 text-center text-sm border border-gray-300 rounded px-1 py-0.5"
                      min="1"
                      max={numPages}
                    />
                    <span className="text-sm text-gray-600">/ {numPages}</span>
                  </form>
                  
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage >= numPages}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Next Page"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>

                <div className="w-px h-6 bg-gray-300" />

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 px-2 py-1 bg-white rounded-lg border border-gray-300">
                  <button
                    onClick={handleZoomOut}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut size={18} />
                  </button>
                  <span className="text-sm text-gray-600 min-w-[50px] text-center font-medium">
                    {Math.round(scale * 100)}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Zoom In"
                  >
                    <ZoomIn size={18} />
                  </button>
                </div>

                <div className="w-px h-6 bg-gray-300" />

                {/* Rotate */}
                <button
                  onClick={handleRotate}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Rotate 90°"
                >
                  <RotateCw size={20} />
                </button>

                {/* Thumbnails Toggle */}
                <button
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className={`px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    showThumbnails 
                      ? 'bg-teal-100 text-teal-700' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                  title="Toggle Thumbnails"
                >
                  Thumbnails
                </button>

                <div className="w-px h-6 bg-gray-300" />
              </>
            )}
            
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>

            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Download"
            >
              <Download size={20} />
            </button>
            
            {/* Close */}
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
                  <div className="flex h-full">
                    {/* Thumbnails Sidebar */}
                    {showThumbnails && numPages && (
                      <div className="w-48 border-r border-gray-200 bg-gray-50 overflow-y-auto flex-shrink-0">
                        <div className="p-2 space-y-2">
                          {Array.from(new Array(numPages), (el, index) => (
                            <div
                              key={`thumb_${index + 1}`}
                              onClick={() => handleThumbnailClick(index + 1)}
                              className={`cursor-pointer border-2 rounded transition-all ${
                                currentPage === index + 1
                                  ? 'border-teal-500 shadow-md'
                                  : 'border-gray-300 hover:border-teal-300'
                              }`}
                            >
                              <Page
                                pageNumber={index + 1}
                                scale={0.2}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                width={160}
                              />
                              <div className="text-center text-xs py-1 bg-white">
                                {index + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Main PDF Content */}
                    <div className="flex-1 overflow-y-auto">
                      <div className="flex flex-col items-center space-y-4 p-4">
                        {/* Render all pages vertically */}
                        {numPages && Array.from(new Array(numPages), (el, index) => (
                          <div 
                            key={`page_${index + 1}`} 
                            id={`pdf-page-${index + 1}`}
                            className="mb-6 relative"
                          >
                            <div className="shadow-lg inline-block bg-white">
                              <Page
                                pageNumber={index + 1}
                                scale={scale}
                                rotate={rotation}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="pdf-page"
                              />
                            </div>
                            {/* Page number badge */}
                            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-3 py-1 rounded-full font-medium">
                              Page {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Document>
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
