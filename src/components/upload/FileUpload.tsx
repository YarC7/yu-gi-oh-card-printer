import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string[];
  className?: string;
}

export function FileUpload({ 
  onFileSelect, 
  accept = ['.ydk', '.json'],
  className 
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.ydk'],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
        isDragActive
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
        className
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <div className="rounded-full bg-muted p-4">
          <Upload className="h-8 w-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">
            {isDragActive ? 'Thả file ở đây...' : 'Kéo thả file hoặc click để chọn'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Hỗ trợ file .ydk (EDOPro/YGOPRO) và .json
          </p>
        </div>
        {acceptedFiles.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-primary">
            <FileText className="h-4 w-4" />
            <span>{acceptedFiles[0].name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
