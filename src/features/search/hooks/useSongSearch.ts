import { useEffect, useState } from 'react';

import type { Song } from '../../../domain/models';
import { getRepositories } from '../../../storage';
import type { SearchScope } from '../types';

export function useSongSearch() {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [results, setResults] = useState<readonly Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timeout = setTimeout(() => {
      if (!query.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      void getRepositories()
        .then(({ search }) => search.search(query, scope))
        .then((songs) => active && setResults(songs))
        .catch((reason: unknown) => {
          if (active)
            setError(
              reason instanceof Error ? reason.message : '검색에 실패했습니다.',
            );
        })
        .finally(() => active && setIsLoading(false));
    }, 250);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query, scope]);

  return { error, isLoading, query, results, scope, setQuery, setScope };
}
