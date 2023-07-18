'use client'
import { createAuthorizedAxios } from '@/lib/api/axiosInstance';
import { classNames } from '@/lib/utils/styles';
import { ApiRequestParams, ApiResponseList } from 'auction-shared/api';
import { Item } from 'auction-shared/models';
import Link from 'next/link';
import { useState } from 'react';
import useServices from '@/lib/hooks/useServices';
import { setLoading, showToast } from '@/store/actions/appActions';
import PhotoDropzone from './PhotoDropzone';
import { useRouter } from 'next/navigation'
import { AxiosResponse } from 'axios';
import { useSession } from 'next-auth/react';
import { useAppDispatch } from '@/lib/hooks/useRedux';

interface Field {
  name: keyof Item;
  value: string | undefined | File;
  error: string | null;
  validationFn: (value: any) => string | null;
}

const initialFieldValues = {
  name: '',
  startingPrice: '',
  expirationTime: '',
  about: '',
  photo: undefined,
} as const;

const validateItemNameField = (value: string): string | null => {
  if (!value.trim()) {
    return 'Item name cannot be empty.';
  }

  return null;
};

const validateAboutField = (value: string): string | null => {
  if (!value.trim()) {
    return 'About cannot be empty.';
  }

  return null;
};

const validateStartingPriceField = (price: string): string | null => {
  const parsedPrice = parseInt(price, 10);

  if (!price.trim()) {
    return 'Start price cannot be empty.';
  }

  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return 'Start price must be a number greater than 0.';
  }

  return null;
};

const validateExpirationTimeField = (window: string): string | null => {
  const expirationTimeRegex = /^\d+h$/;

  if (!window.trim()) {
    return 'Time window cannot be empty.';
  }

  if (!expirationTimeRegex.test(window)) {
    return 'Time window must follow the format of Xh, e.g., 1h.';
  }

  return null;
};

const validatePhotoField = (photo: File | undefined): string | null => {
  if (!photo) {
    return 'Photo cannot be empty.'
  }

  if (photo.size > 5 * 1024 * 1024) {
    return 'Photo must be less than 5MB.';
  }

  return null;
};

const initialFields: Field[] = [
  {
    name: 'name',
    value: initialFieldValues.name,
    error: null,
    validationFn: validateItemNameField,
  },
  {
    name: 'startingPrice',
    value: initialFieldValues.startingPrice,
    error: null,
    validationFn: validateStartingPriceField,
  },
  {
    name: 'expirationTime',
    value: initialFieldValues.expirationTime,
    error: null,
    validationFn: validateExpirationTimeField,
  },
  {
    name: 'about',
    value: initialFieldValues.about,
    error: null,
    validationFn: validateAboutField,
  },
  {
    name: 'photo',
    value: initialFieldValues.photo,
    error: null,
    validationFn: validatePhotoField,
  },
];

export default function ItemCreation() {
  const [fields, setFields] = useState<Field[]>([...initialFields]);
  const { dataService } = useServices();
  const { data: session } = useSession();

  const dispatch = useAppDispatch();

  const updateFields = (name: string, value: string | File) => {
    const updatedFields = fields.map((field) => {
      if (field.name === name) {
        const error = field.validationFn(value);
        return { ...field, value, error };
      }
      return field;
    });

    setFields(updatedFields);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    const files = (event.target as unknown as HTMLInputElement).files;
    if (files) {
      updateFields(name, files[0]);
    } else {
      updateFields(name, value);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let hasErrors = false;

    // Perform validation for each field
    fields.forEach((field) => {
      const { value, validationFn } = field;
      const error = validationFn(value);
      field.error = error; // Update the error for the field
      if (error) {
        hasErrors = true; // Set hasErrors flag if any field has an error
      }
    });

    // Update the state to trigger re-rendering with the updated errors
    setFields([...fields]);

    // Check if there are any field errors
    if (hasErrors) {
      return;
    }

    try {
      dispatch(setLoading(true))
      const photoUrl = await dataService.uploadPhoto(getFieldValue('photo') as File);

      const item: ApiRequestParams['create-item'] = fields.reduce((obj, field) => {
        if (field.name === 'photo') {
          obj[field.name] = photoUrl
        } else {
          obj[field.name] = field.value;
        }
        return obj;
      }, {} as any);

      const authorizedAxios = createAuthorizedAxios(session!);

      await authorizedAxios.post<
        ApiResponseList['create-item'],
        AxiosResponse<ApiResponseList['create-item']>,
        ApiRequestParams['create-item']
      >('/create-item', item)

      dispatch(showToast({
        type: 'success',
        message: 'You Have Created An Item'
      }))

      // Reset form fields and errors
      setFields(initialFields);
      location.href = '/'; // force home page refresh
    } catch (error) {
      dispatch(showToast({
        type: 'error',
        message: 'Oops Something Wrong...'
      }))
    }

    dispatch(setLoading(false))
  };

  const getFieldValue = (name: keyof typeof initialFieldValues) => {
    const field = fields.find((field) => field.name === name);
    return field?.value;
  };

  const getFieldError = (name: keyof typeof initialFieldValues) => {
    const field = fields.find((field) => field.name === name);
    return field?.error;
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-12">
        <div className="border-b border-gray-900/10 pb-12">

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="item-name" className="block text-sm font-medium leading-6 text-gray-900">
                Name
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="name"
                  id="item-name"
                  value={getFieldValue("name") as string}
                  onChange={handleInputChange}
                  className={classNames(
                    getFieldError("name") ? 'bg-red-50 border border-red-500 text-red-900' : 'border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600',
                    "block w-full rounded-md py-1.5 text-gray-900 shadow-sm placeholder:text-gray-400 sm:text-sm sm:leading-6"
                  )}
                  data-cy="input-item-name"
                />
              </div>
              {getFieldError("name") && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{getFieldError("name")}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label htmlFor="start-price" className="block text-sm font-medium leading-6 text-gray-900">
                Start Price
              </label>
              <div className="mt-2">
                <input
                  type="number"
                  name="startingPrice"
                  id="start-price"
                  value={getFieldValue("startingPrice") as string}
                  onChange={handleInputChange}
                  className={classNames(
                    getFieldError("startingPrice") ? 'bg-red-50 border border-red-500 text-red-900' : 'border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600',
                    "block w-full rounded-md py-1.5 text-gray-900 shadow-sm placeholder:text-gray-400 sm:text-sm sm:leading-6"
                  )}
                  data-cy="input-starting-price"
                />
              </div>
              {getFieldError("startingPrice") && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{getFieldError("startingPrice")}</p>
              )}
            </div>

            <div className="col-span-full">
              <label htmlFor="time-window" className="block text-sm font-medium leading-6 text-gray-900">
                Time Window
              </label>
              <div className="mt-2">
                <input
                  id="time-window"
                  name="expirationTime"
                  type="text"
                  value={getFieldValue("expirationTime") as string}
                  onChange={handleInputChange}
                  placeholder="e.g., 1h"
                  className={classNames(
                    getFieldError("expirationTime") ? 'bg-red-50 border border-red-500 text-red-900' : 'border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600',
                    "block w-full rounded-md py-1.5 text-gray-900 shadow-sm placeholder:text-gray-400 sm:text-sm sm:leading-6"
                  )}
                  data-cy="input-time-window"
                />
              </div>
              {getFieldError("expirationTime") && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{getFieldError("expirationTime")}</p>
              )}
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="col-span-full">
              <label htmlFor="about" className="block text-sm font-medium leading-6 text-gray-900">
                About
              </label>
              <div className="mt-2">
                <textarea
                  id="about"
                  name="about"
                  value={getFieldValue("about") as string}
                  onChange={handleInputChange}
                  rows={3}
                  className={classNames(
                    getFieldError("about") ? 'bg-red-50 border border-red-500 text-red-900' : 'border-0 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600',
                    "block w-full rounded-md py-1.5 text-gray-900 shadow-sm placeholder:text-gray-400 sm:text-sm sm:leading-6"
                  )}
                  data-cy="input-about"
                />
              </div>
              {getFieldError("about") && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-500">{getFieldError("about")}</p>
              )}
              <p className="mt-3 text-sm leading-6 text-gray-600">Write a few sentences about this item</p>
            </div>

            <div className="col-span-full">
              <label htmlFor="cover-photo" className="block text-sm font-medium leading-6 text-gray-900 mb-2">
                Cover photo
              </label>
              <PhotoDropzone
                fieldName="photo"
                selectedFile={getFieldValue('photo')}
                updateFile={updateFields}
                fieldError={getFieldError('photo')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <Link href="/" type="button" className="text-sm font-semibold leading-6 text-gray-900">
          Cancel
        </Link>
        <button
          type="submit"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          data-cy="submit-button"
        >
          Save
        </button>
      </div>
    </form>
  )
}