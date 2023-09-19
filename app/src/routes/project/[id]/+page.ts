import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
    try {
        const res = await fetch(`/api/projects/${params.id}`);
        return { project: res.json() }
    } catch (err) {
        console.error(err);
        throw err;
    }
};
