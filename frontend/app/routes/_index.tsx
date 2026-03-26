import { redirect } from 'react-router';
import type { Route } from './+types/_index';

export function loader({}: Route.LoaderArgs) {
  return redirect('/en');
}

export default function Index() {
  return null;
}
