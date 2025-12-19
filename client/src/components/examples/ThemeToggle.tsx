import ThemeToggle from '../ThemeToggle';

export default function ThemeToggleExample() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-4">
        <span>Toggle theme:</span>
        <ThemeToggle />
      </div>
    </div>
  );
}
