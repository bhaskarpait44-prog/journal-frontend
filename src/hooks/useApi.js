import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';

export function useApi(path, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!path && !options.skip);
  const [error, setError] = useState(null);
  const pathRef = useRef(path);

  const fetchData = useCallback(async (overridePath) => {
    const target = overridePath || pathRef.current;
    if (!target) return;
    setLoading(true);
    setError(null);
    try {
      const result = await api.get(target);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    pathRef.current = path;
    if (!options.skip && path) {
      fetchData(path);
    }
  }, [path, options.skip, fetchData]);

  return { data, loading, error, refetch: () => fetchData(pathRef.current) };
}
