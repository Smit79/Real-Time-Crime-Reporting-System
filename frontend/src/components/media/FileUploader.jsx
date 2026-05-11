import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

import { formatFileSize } from '../../utils/formatters';

const FileUploader = ({ files = [], onFilesChange }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const next = [...files, ...acceptedFiles].slice(0, 5);
      onFilesChange?.(next);
    },
    [files, onFilesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 5,
    multiple: true,
  });

  const handleRemoveFile = (indexToRemove) => {
    const next = files.filter((_, index) => index !== indexToRemove);
    onFilesChange?.(next);
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className="cursor-pointer rounded-2xl border-2 border-dashed border-border bg-surface p-6 text-center transition hover:border-primary"
      >
        <input {...getInputProps()} aria-label="Upload files" />
        <p className="text-sm text-text-muted">
          {isDragActive ? 'Drop files here...' : 'Drag and drop evidence files or click to browse'}
        </p>
      </div>

      {files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
            >
              <span className="truncate">
                {file.name} - {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-danger transition hover:bg-danger/10"
                onClick={() => handleRemoveFile(index)}
                aria-label={`Remove ${file.name}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default FileUploader;
