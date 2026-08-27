export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-tempis-blue-darker bg-tempis-blue-dark px-4 py-3 text-center text-xs text-tempis-ice">
      <p>
        {year} · Made by Catalina
      </p>
    </footer>
  );
}
