import './globals.css';

export const metadata = { title: 'MOYÉ', description: 'Patrimoine culturel ivoirien' };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
