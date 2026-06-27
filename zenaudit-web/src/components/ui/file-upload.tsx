"use client";

import { cn } from "@/lib/utils";
import React, { useRef, useState } from "react";
import { motion } from "motion/react";
import { IconUpload, IconFile } from "@tabler/icons-react";

interface FileUploadProps {
  onChange?: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  allowedExtensions?: string[];
  maxSizeBytes?: number;
  label?: string;
  sublabel?: string;
}

const DEFAULT_ALLOWED = [".pdf", ".xls", ".xlsx", ".xlsm", ".docx"];
const DEFAULT_MAX_SIZE = 50 * 1024 * 1024;

export const FileUpload = ({
  onChange,
  multiple = false,
  maxFiles = 5,
  accept = ".pdf,.xls,.xlsx,.xlsm,.docx",
  allowedExtensions = DEFAULT_ALLOWED,
  maxSizeBytes = DEFAULT_MAX_SIZE,
  label,
  sublabel,
}: FileUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isValidFile = (file: File) => {
    if (!allowedExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      alert(`Invalid file type: ${file.name}. Only ${allowedExtensions.join(", ")} files are accepted.`);
      return false;
    }
    if (file.size > maxSizeBytes) {
      alert(`${file.name} is too large. Maximum size is ${(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB.`);
      return false;
    }
    return true;
  };

  const processFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const incomingFiles = Array.from(incoming);
    const validFiles = incomingFiles.filter(isValidFile);
    if (validFiles.length === 0) return;

    if (multiple) {
      const next = [...files, ...validFiles].slice(0, maxFiles);
      setFiles(next);
      onChange?.(next);
    } else {
      setFiles([validFiles[0]]);
      onChange?.([validFiles[0]]);
    }
  };

  const handleClick = () => inputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const displayLabel = label || (multiple ? "Drop files here, or click to browse" : "Drop a file here, or click to browse");
  const displaySublabel =
    sublabel ||
    (multiple
      ? `PDF only — up to ${maxFiles} files, ${(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB each`
      : `PDF, Excel, or Word — up to ${(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB`);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed px-8 py-10 text-center transition-all duration-300 ease-out cursor-pointer",
          "bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.06]",
          isDragOver
            ? "border-accent/60 bg-accent/[0.08] scale-[1.02]"
            : "border-white/15 hover:border-white/30"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        <div
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300",
            "bg-white/[0.06] text-white/60 group-hover:bg-white/[0.10] group-hover:text-white"
          )}
        >
          {files.length > 0 ? <IconFile className="h-7 w-7" /> : <IconUpload className="h-7 w-7" />}
        </div>

        <div className="space-y-1">
          <p className="text-[15px] font-medium text-white/90">
            {files.length > 0
              ? multiple
                ? `${files.length} file${files.length === 1 ? "" : "s"} selected`
                : files[0].name
              : displayLabel}
          </p>
          <p className="text-[13px] font-normal text-white/40">
            {files.length > 0 && !multiple
              ? `${(files[0].size / (1024 * 1024)).toFixed(2)} MB`
              : displaySublabel}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
