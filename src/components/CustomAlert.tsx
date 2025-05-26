interface CustomAlertProps {
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: () => void;
}

const styles = {
  success: 'bg-green-100 border border-green-400 text-green-700',
  error: 'bg-red-100 border border-red-400 text-red-700',
  warning: 'bg-yellow-50 border border-yellow-400 text-yellow-700',
};

export default function CustomAlert({ message, type, onClose }: CustomAlertProps) {
  return (
    <div className={`rounded p-4 my-2 ${styles[type]}`}>
      <div className="flex justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 font-bold">
          Close
        </button>
      </div>
    </div>
  );
}