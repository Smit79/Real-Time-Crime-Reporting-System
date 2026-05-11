import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const usePagination = (defaultPage = 1, defaultLimit = 10) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') || defaultPage);
  const limit = Number(searchParams.get('limit') || defaultLimit);

  const setPage = (nextPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(nextPage));
    setSearchParams(params, { replace: false });
  };

  const setLimit = (nextLimit) => {
    const params = new URLSearchParams(searchParams);
    params.set('limit', String(nextLimit));
    params.set('page', '1');
    setSearchParams(params, { replace: false });
  };

  return useMemo(
    () => ({ page, limit, setPage, setLimit }),
    [limit, page]
  );
};

export default usePagination;
