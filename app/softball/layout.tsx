import { Press_Start_2P } from 'next/font/google';
import '../globals.css';

const pressStart2P = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-press-start-2p',
});

export const metadata = {
  title: 'S.O.F.T.B.A.L.L. RSVP',
  description: 'RSVP for upcoming softball games',
};

export default function SoftballLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${pressStart2P.className} min-h-screen`}>
      {children}
    </div>
  );
} 