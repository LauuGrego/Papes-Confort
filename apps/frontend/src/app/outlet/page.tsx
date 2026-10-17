import { redirect } from 'next/navigation';

export default function OutletPage() {
  redirect('/catalogo?type=outlet');
}
