export default function PageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <span
          aria-label="Memuat..."
          className="h-10 w-10 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"
        />
        <p className="text-sm text-gray-500">Memuat...</p>
      </div>
    </div>
  );
}
