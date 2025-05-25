import React, { useState } from 'react';
import CustomAlert from './CustomAlert';

export default function DeleteAlertDialog({
  itemName = 'Item',
  onDelete,
}: {
  itemName?: string;
  onDelete?: () => Promise<void> | void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'warning'>('success');

  const handleConfirm = async () => {
    setConfirmOpen(false);
    if (onDelete) await onDelete();
    setAlertMessage(`${itemName} deleted successfully!`);
    setAlertType('success');
  };

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {alertMessage && (
        <CustomAlert
          message={alertMessage}
          type={alertType}
          onClose={() => setAlertMessage('')}
        />
      )}

      <button
        onClick={() => setConfirmOpen(true)}
        className="bg-pink-600 hover:bg-pink-700 focus:ring-4 focus:ring-pink-300 text-white font-bold py-2 px-4 rounded transition-all sm:w-auto w-full"
      >
        Delete {itemName}
      </button>

      {confirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded p-6 max-w-sm w-full space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">Are you sure?</h2>
            <p className="text-gray-600">
              This will permanently delete {itemName}.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-black py-1 px-3 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}