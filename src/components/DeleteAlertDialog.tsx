import React, { useEffect, useState } from 'react';
import CustomAlert from './CustomAlert';

export default function DeleteAlertDialog({
  title,
  message,
  itemName = 'Item',
  onDelete,
  onCancel,
  isOpen = false,
  error = null,
  isDeleting = false
}: {
  title: string;
  message: string;
  itemName?: string;
  onDelete?: () => Promise<void> | void;
  onCancel?: () => void;
  isOpen?: boolean;
  error?: string | null;
  isDeleting?: boolean;
}) {
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('success');
  const [internalDeleting, setInternalDeleting] = useState(false);

  // Use the external deleting state if provided
  const deleteInProgress = isDeleting || internalDeleting;

  useEffect(() => {
    if (!isOpen) {
      setAlertMessage('');
      setInternalDeleting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Show error message if provided from outside
    if (error) {
      setAlertMessage(`Error: ${error}`);
      setAlertType('error');
    }
  }, [error]);

  const handleConfirm = async () => {
    try {
      setInternalDeleting(true);
      if (onDelete) await onDelete();
      // If no error was thrown, show success message
      if (!error) {
        setAlertMessage(`${itemName} deleted successfully!`);
        setAlertType('success');
      }
    } catch (error) {
      setAlertMessage(`Failed to delete ${itemName}`);
      setAlertType('error');
      console.error("Delete error:", error);
    } finally {
      setInternalDeleting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full space-y-4 shadow-xl">
        {alertMessage ? (
          <div className="text-center">
            <CustomAlert
              message={alertMessage}
              type={alertType}
              onClose={() => {
                setAlertMessage('');
                handleCancel();
              }}
            />
          </div>
        ) : (
          <>
            <h2 className="font-bold text-gray-800 text-lg"> {title} </h2>
            <p className="text-gray-600">
             { `${message}, `}<span className="font-bold">"{itemName}"</span>{` ?` }
            </p>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={handleCancel}
                disabled={deleteInProgress}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={deleteInProgress}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                {deleteInProgress ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}