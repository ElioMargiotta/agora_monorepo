import { useState, useEffect } from 'react';
import { fetchParadexFunding } from '@/lib/protocols/paradex';

export function useParadexFunding() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await fetchParadexFunding();
      setData(result);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Initial load only
  }, []);

  return { data, loading, error, lastUpdate, refetch: fetchData };
}