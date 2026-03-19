export default function LoadingSpinner({ message = 'Chargement...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin mb-3" />
      <p className="text-sm text-neutral-500">{message}</p>
    </div>
  );
}
