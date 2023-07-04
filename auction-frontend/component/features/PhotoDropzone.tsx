'use client';
import { classNames } from "@/lib/utils/styles";
import { PhotoIcon } from "@heroicons/react/24/solid"
import { useDropzone } from "react-dropzone";

type PhotoDropzoneProps = {
  selectedFile: File | string | undefined;
  updateFile: (fieldName: string, value: File) => void;
  fieldName: string;
  fieldError: string | null | undefined
}

const PhotoDropzone = ({ updateFile, fieldName, selectedFile, fieldError }: PhotoDropzoneProps) => {
  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      updateFile(fieldName, file)
    })
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    maxFiles: 1
  })

  return (
    <>
      <div className="flex items-center justify-center w-full" {...getRootProps()}>
        <label htmlFor="dropzone-file" className={classNames(
          fieldError ? "bg-red-50 border border-red-500 text-red-900" : "border-gray-300 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600",
          "flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer dark:hover:bg-bray-800"
        )}>
          {
            selectedFile instanceof File && !fieldError ?
              (
                <img src={URL.createObjectURL(selectedFile)} className="block w-40 h-40 rounded" />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <PhotoIcon className="mx-auto h-12 w-12 mb-4 text-gray-300" aria-hidden="true" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF up to 5MB</p>
                </div>
              )
          }
          <input id="dropzone-file" type="file" name={fieldName} className="hidden" {...getInputProps()} />
        </label>
      </div>
      {fieldError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-500">{fieldError}</p>
      )}
    </>
  )
}

export default PhotoDropzone;
