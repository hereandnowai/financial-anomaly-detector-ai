
import React, { useCallback, useState } from 'react';
import { BRANDING_CONFIG } from '../constants';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { brand } = BRANDING_CONFIG;

  const handleDrag = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full p-6 bg-white rounded-lg shadow-xl border-2 border-dashed border-gray-300 transition-all duration-300 ease-in-out hover:shadow-2xl">
      <form id="form-file-upload" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
        <input 
          ref={inputRef} 
          type="file" 
          id="input-file-upload" 
          className="hidden" 
          accept=".csv" 
          onChange={handleChange}
          disabled={isLoading}
        />
        <label 
          id="label-file-upload" 
          htmlFor="input-file-upload" 
          className={`flex flex-col items-center justify-center p-8 rounded-lg cursor-pointer
            ${dragActive ? `bg-[${brand.colors.primary}] bg-opacity-20` : `bg-gray-50`}
            ${isLoading ? 'cursor-not-allowed opacity-70' : `hover:bg-[${brand.colors.primary}] hover:bg-opacity-10`}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <svg className={`w-16 h-16 mb-3 ${dragActive ? `text-[${brand.colors.primary}]` : `text-[${brand.colors.secondary}]`}`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
          <p className={`mb-2 text-sm font-semibold ${dragActive ? `text-[${brand.colors.primary}]` : `text-[${brand.colors.secondary}]`}`}>
            <span className="font-bold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">CSV files only (MAX. 5MB)</p>
        </label>
      </form>
      <button 
        type="button"
        onClick={onButtonClick} 
        disabled={isLoading}
        className={`mt-4 w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 ease-in-out
          ${isLoading ? `bg-gray-400 cursor-not-allowed` : `bg-[${brand.colors.secondary}] hover:bg-opacity-80 focus:ring-4 focus:ring-[${brand.colors.primary}] focus:ring-opacity-50`}
        `}
        style={{backgroundColor: isLoading ? '' : brand.colors.secondary}}
      >
        {isLoading ? 'Processing...' : 'Select CSV File'}
      </button>
      <div className="mt-4 text-sm text-gray-600">
        <p className="font-semibold">Expected CSV Format:</p>
        <ul className="list-disc list-inside ml-4">
          <li><strong>transaction_id:</strong> Unique transaction number</li>
          <li><strong>date:</strong> Date of transaction (YYYY-MM-DD)</li>
          <li><strong>amount:</strong> Transaction amount (numeric)</li>
          <li><strong>category:</strong> Type (e.g., Travel, Salary)</li>
          <li><strong>account:</strong> Account/department name</li>
          <li><strong>vendor:</strong> Vendor or recipient</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;
