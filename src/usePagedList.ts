import {useCallback, useEffect, useRef, useState} from "react";
import {PageResult} from "./Types";

// Keeps the pages loaded so far for an infinite scroll.
// When `resetKey` changes (new search text / filter) it starts again from page 0.
export function usePagedList<T>(fetchPage: (page: number) => Promise<PageResult<T>>, resetKey: string) {
    const [items, setItems] = useState<T[]>([]);
    const [page, setPage] = useState(0);
    const [last, setLast] = useState(false);
    // only the newest request may write the state (typing fast fires several searches)
    const latestRequest = useRef(0);

    const load = useCallback(async (pageToLoad: number, replace: boolean) => {
        const requestId = ++latestRequest.current;
        const result = await fetchPage(pageToLoad);
        if (requestId !== latestRequest.current) return;
        setItems(prev => replace ? result.items : [...prev, ...result.items]);
        setPage(result.page);
        setLast(result.last);
    }, [fetchPage]);

    useEffect(() => {
        void load(0, true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [resetKey]);

    const loadMore = useCallback(async () => {
        if (!last) await load(page + 1, false);
    }, [last, page, load]);

    const reload = useCallback(() => load(0, true), [load]);

    return {items, last, loadMore, reload};
}
