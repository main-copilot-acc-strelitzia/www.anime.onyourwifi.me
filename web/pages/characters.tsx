export const dynamic = 'force-dynamic';

import Navbar from '@/components/Navbar';
import CharacterBrowser from '@/components/CharacterBrowser';

export default function CharactersPage() {
  return (
    <>
      <Navbar />
      <CharacterBrowser />
    </>
  );
}
