import type { LayoutServerData } from "./$types";

export const load: LayoutServerData = async ({ fetch, params }) => {
  try {
    const res = await fetch(`/api/projects/${params.id}`);
    return { project: res.json() };
  } catch (err) {
    console.error(err);
    throw err;
  }
};
