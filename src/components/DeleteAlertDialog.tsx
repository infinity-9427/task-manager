import React, { useEffect, useState } from 'react';
import CustomAlert from './CustomAlert';

export default function DeleteAlertDialog({
  itemName = 'Item',
  onDelete,
  onCancel,
  isOpen = false
}: {
  itemName?: string;
  onDelete?: () => Promise<void> | void;
  onCancel?: () => void;
  isOpen?: boolean;
}) {
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('success');
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setAlertMessage('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      if (onDelete) await onDelete();
      setAlertMessage(`${itemName} deleted successfully!`);
      setAlertType('success');
    } catch (error) {
      setAlertMessage(`Failed to delete ${itemName}`);
      setAlertType('error');
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
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
            <h2 className="font-bold text-gray-800 text-lg">Delete Confirmation</h2>
            <p className="text-gray-600">
              Are you sure you want to delete {itemName}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                {isDeleting ? (
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