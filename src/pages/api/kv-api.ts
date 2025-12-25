import type { APIContext } from "astro";

export const prerender = false;

export async function GET({ locals, request }: APIContext): Promise<Response> {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return new Response(JSON.stringify({ error: "Key is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check if runtime is available (for Cloudflare Workers)
  if (!locals.runtime?.env?.blog) {
    return new Response(
      JSON.stringify({
        error:
          "KV namespace not available. Make sure you're running in Cloudflare environment.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const blog = locals.runtime.env.blog as KVNamespace;
  const value = await blog.get(key);

  return new Response(
    JSON.stringify({
      value: value,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}

export async function POST({ locals, request }: APIContext): Promise<Response> {
  // Check if runtime is available (for Cloudflare Workers)
  if (!locals.runtime?.env?.blog) {
    return new Response(
      JSON.stringify({
        error:
          "KV namespace not available. Make sure you're running in Cloudflare environment.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const blog = locals.runtime.env.blog as KVNamespace;

  try {
    const { key, value } = await request.json();

    if (!key || !value) {
      return new Response(
        JSON.stringify({ error: "Both key and value are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    await blog.put(key, value);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
